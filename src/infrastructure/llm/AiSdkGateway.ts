import { stepCountIs, streamText, type LanguageModel } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { nativeToolKeyFromCatalogId } from '../../application/tooling/nativeToolKey'
import type {
  ModelGatewayPort,
  ModelRequest,
  ModelStreamChunk,
} from '../../application/ports/ModelGatewayPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ModelConfig, ModelProvider } from '../../domain/assistant/value-objects/ModelConfig'
import { buildNativeCliToolSet } from './buildNativeCliToolSet'

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

function mapStreamFinishReason(
  reason: 'stop' | 'length' | 'content-filter' | 'tool-calls' | 'error' | 'other',
): ModelStreamChunk['finishReason'] {
  if (reason === 'length') {
    return 'length'
  }

  if (reason === 'error') {
    return 'error'
  }

  return 'stop'
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
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
      const agentic = request.agentic
      const enableNativeTools =
        Boolean(agentic) && agentic!.mode !== 'chat' && agentic!.toolCatalog.length > 0

      const tools = enableNativeTools
        ? buildNativeCliToolSet({
            workspacePath: agentic!.workspacePath,
            toolCatalog: agentic!.toolCatalog,
            logger: this.logger,
          })
        : undefined

      const hasTools = Boolean(tools && Object.keys(tools).length > 0)
      const useToolLoop = Boolean(enableNativeTools && hasTools && tools)

      const planActiveKeys = ['workspace-read', 'search-index']
        .map(nativeToolKeyFromCatalogId)
        .filter((key) => tools && key in tools)

      const planActiveTools =
        agentic?.mode === 'plan' && planActiveKeys.length > 0 ? planActiveKeys : undefined

      const streamResult = streamText({
        model: this.model,
        messages: request.messages.map((m) => ({ role: m.role, content: m.content })),
        temperature: request.temperature ?? this.config.temperature,
        maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
        abortSignal: controller.signal,
        tools: useToolLoop ? tools : undefined,
        toolChoice: useToolLoop ? 'auto' : undefined,
        activeTools:
          useToolLoop && agentic?.mode === 'plan'
            ? planActiveTools
            : useToolLoop && agentic?.mode === 'agent'
              ? (Object.keys(tools!) as Array<keyof typeof tools & string>)
              : undefined,
        stopWhen: useToolLoop ? stepCountIs(16) : undefined,
      })

      const result = await streamResult

      if (useToolLoop) {
        for await (const part of result.fullStream) {
          switch (part.type) {
            case 'text-delta':
              yield { delta: part.text }
              break
            case 'tool-call': {
              const payload = safeJson(part.input)
              yield { delta: `\n> ${part.toolName}(${payload})\n` }
              break
            }
            case 'tool-result':
              yield { delta: `\n---\n${part.toolName} result:\n${safeJson(part.output)}\n---\n` }
              break
            case 'tool-error':
              yield {
                delta: `\n---\nTool error (${part.toolName}): ${part.error instanceof Error ? part.error.message : String(part.error)}\n---\n`,
              }
              break
            case 'error':
              throw part.error
            case 'finish':
              yield { delta: '', finishReason: mapStreamFinishReason(part.finishReason) }
              break
            default:
              break
          }
        }
      } else {
        for await (const chunk of result.textStream) {
          yield { delta: chunk }
        }

        yield { delta: '', finishReason: 'stop' }
      }
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
