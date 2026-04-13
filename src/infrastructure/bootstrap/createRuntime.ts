import type { AdnifyCliRuntime } from '../../application/dto/AdnifyCliRuntime'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import { ApplyCliCommandUseCase } from '../../application/use-cases/ApplyCliCommandUseCase'
import { BootstrapCliUseCase } from '../../application/use-cases/BootstrapCliUseCase'
import { CreateSessionUseCase } from '../../application/use-cases/CreateSessionUseCase'
import { SubmitPromptUseCase } from '../../application/use-cases/SubmitPromptUseCase'
import { DefaultCliConfigAdapter } from '../config/DefaultCliConfigAdapter'
import { AiSdkGateway } from '../llm/AiSdkGateway'
import { ModelAssistantResponder } from '../llm/ModelAssistantResponder'
import { StubAssistantResponder } from '../llm/StubAssistantResponder'
import { ConsoleLogger } from '../logging/ConsoleLogger'
import { InMemorySessionRepository } from '../persistence/InMemorySessionRepository'
import { CryptoIdGenerator } from '../system/CryptoIdGenerator'
import { SystemClock } from '../system/SystemClock'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { LocalWorkspaceContextService } from '../workspace/LocalWorkspaceContextService'

export type { AdnifyCliRuntime }

/**
 * 统一装配运行时依赖。
 * 使用 Vercel AI SDK 支持 OpenAI / Anthropic / Google / OpenAI-compatible。
 */
export async function createRuntime(): Promise<AdnifyCliRuntime> {
  const logger = new ConsoleLogger()
  const config = new DefaultCliConfigAdapter()
  const sessionRepository = new InMemorySessionRepository()
  const idGenerator = new CryptoIdGenerator()
  const clock = new SystemClock()
  const workspaceContextService = new LocalWorkspaceContextService()

  const { loadModelConfig, loadProviders } = await import('../config/loadLocalConfig')
  const modelConfig = await loadModelConfig()
  const providers = await loadProviders()
  config.setModelConfig(modelConfig)
  config.setProviders(providers)

  const { responder, gateway } = createResponderStack(modelConfig, logger)

  const submitPrompt = new SubmitPromptUseCase(
    sessionRepository,
    workspaceContextService,
    responder,
    config,
    idGenerator,
    clock,
    logger,
  )

  const switchModel = (providerName: string, modelName?: string): ModelConfig | null => {
    const newConfig = config.switchModel(providerName, modelName)
    if (!newConfig) return null

    if (gateway && responder instanceof ModelAssistantResponder) {
      gateway.updateConfig(newConfig)
      responder.updateGateway(gateway, newConfig)
      logger.info('Model switched via AI SDK', { model: newConfig.model, provider: newConfig.provider })
    } else {
      const newStack = createResponderStack(newConfig, logger)
      submitPrompt.updateResponder(newStack.responder)
      logger.info('Model switched (new responder)', { model: newConfig.model, provider: newConfig.provider })
    }

    return newConfig
  }

  return {
    useCases: {
      bootstrapCli: new BootstrapCliUseCase(workspaceContextService, config, logger),
      createSession: new CreateSessionUseCase(sessionRepository, idGenerator, clock, logger),
      submitPrompt,
      applyCliCommand: new ApplyCliCommandUseCase(sessionRepository, idGenerator, clock, logger),
    },
    switchModel,
  }
}

function createResponderStack(modelConfig: ModelConfig, logger: LoggerPort) {
  if (!modelConfig.apiKey) {
    logger.info('No API key configured — using stub responder')
    return { responder: new StubAssistantResponder(logger), gateway: null }
  }

  logger.info('Using AI SDK gateway', {
    provider: modelConfig.provider,
    model: modelConfig.model,
    baseUrl: modelConfig.baseUrl,
  })

  const gateway = new AiSdkGateway(modelConfig, logger)
  const responder = new ModelAssistantResponder(gateway, modelConfig, logger)
  return { responder, gateway }
}
