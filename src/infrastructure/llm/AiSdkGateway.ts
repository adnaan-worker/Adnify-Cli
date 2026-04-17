import { streamText, type LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import type {
  ModelGatewayPort,
  ModelRequest,
  ModelStreamChunk,
} from '../../application/ports/ModelGatewayPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ModelConfig, ModelProvider } from '../../domain/assistant/value-objects/ModelConfig'

function createLanguageModel(config: ModelConfig): LanguageModel {
  const providerFactories: Record<ModelProvider, () => LanguageModel> = {
    'openai-compatible': () =>
      createOpenAICompatible({
        name: 'custom',
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      }).chatModel(config.model),
    'openai-responses': () =>
      createOpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl }).responses(config.model),
    anthropic: () =>
      createAnthropic({ apiKey: config.apiKey, baseURL: config.baseUrl })(config.model),
    google: () =>
      createGoogleGenerativeAI({ apiKey: config.apiKey, baseURL: config.baseUrl })(config.model),
  }

  return providerFactories[config.provider]()
}

/**
 * 基于 Vercel AI SDK 的模型网关。
 * 统一支持 OpenAI / Anthropic / Google / OpenAI-compatible 多种 provider。
 */
export class AiSdkGateway implements ModelGatewayPort {
  private model: LanguageModel

  constructor(
    private config: ModelConfig,
    private readonly logger: LoggerPort,
  ) {
    this.model = createLanguageModel(config)
  }

  updateConfig(config: ModelConfig): void {
    this.config = config
    this.model = createLanguageModel(config)
  }

  async *streamChat(request: ModelRequest): AsyncIterable<ModelStreamChunk> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new Error('timeout')), this.config.timeoutMs)
    const forwardAbort = () => controller.abort(request.abortSignal?.reason ?? new Error('aborted'))

    request.abortSignal?.addEventListener('abort', forwardAbort)

    try {
      const result = streamText({
        model: this.model,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? this.config.temperature,
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        abortSignal: controller.signal,
      })

      for await (const chunk of (await result).textStream) {
        yield { delta: chunk }
      }

      yield { delta: '', finishReason: 'stop' }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (request.abortSignal?.aborted) {
          throw new Error('Request aborted')
        }
        throw new Error(`Model API timeout after ${this.config.timeoutMs}ms`)
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error('AI SDK stream error', { error: message, provider: this.config.provider })
      throw error
    } finally {
      clearTimeout(timeout)
      request.abortSignal?.removeEventListener('abort', forwardAbort)
    }
  }
}
