import type {
  ModelGatewayPort,
  ModelRequest,
  ModelStreamChunk,
} from '../../application/ports/ModelGatewayPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

interface OpenAiStreamChoice {
  delta?: { content?: string }
  finish_reason?: string | null
}

interface OpenAiStreamPayload {
  choices?: OpenAiStreamChoice[]
}

/**
 * OpenAI-compatible 流式网关。
 * 通过标准 fetch + SSE 解析实现，兼容 OpenAI / Anthropic / Ollama / LM Studio 等。
 */
export class OpenAiCompatibleGateway implements ModelGatewayPort {
  constructor(
    private readonly config: ModelConfig,
    private readonly logger: LoggerPort,
  ) {}

  async *streamChat(request: ModelRequest): AsyncIterable<ModelStreamChunk> {
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/chat/completions`

    const body = JSON.stringify({
      model: request.model || this.config.model,
      messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: request.temperature ?? this.config.temperature,
      max_tokens: request.maxTokens ?? this.config.maxTokens,
      stream: true,
    })

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body,
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'unknown error')
        throw new Error(`Model API error ${response.status}: ${errorText}`)
      }

      if (!response.body) {
        throw new Error('Model API returned empty response body')
      }

      yield* this.parseSSEStream(response.body)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(`Model API timeout after ${this.config.timeoutMs}ms`)
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  private async *parseSSEStream(body: ReadableStream<Uint8Array>): AsyncIterable<ModelStreamChunk> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()

          if (!trimmed || trimmed.startsWith(':')) continue

          if (!trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            yield { delta: '', finishReason: 'stop' }
            return
          }

          try {
            const parsed = JSON.parse(data) as OpenAiStreamPayload
            const choice = parsed.choices?.[0]
            if (!choice) continue

            const delta = choice.delta?.content ?? ''
            const finishReason = this.mapFinishReason(choice.finish_reason)

            if (delta || finishReason) {
              yield { delta, finishReason }
            }
          } catch (parseError) {
            this.logger.warn('Failed to parse SSE chunk', { data, error: String(parseError) })
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }

  private mapFinishReason(reason: string | null | undefined): ModelStreamChunk['finishReason'] {
    if (!reason) return undefined
    if (reason === 'stop') return 'stop'
    if (reason === 'length') return 'length'
    return 'error'
  }
}
