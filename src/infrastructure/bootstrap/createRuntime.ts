import type { AdnifyCliRuntime } from '../../application/dto/AdnifyCliRuntime'
import {
  createAppI18n,
  resolveAppLocaleFromEnv,
} from '../../application/i18n/AppI18n'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import { ApplyCliCommandUseCase } from '../../application/use-cases/ApplyCliCommandUseCase'
import { BootstrapCliUseCase } from '../../application/use-cases/BootstrapCliUseCase'
import { CreateSessionUseCase } from '../../application/use-cases/CreateSessionUseCase'
import { ListSessionsUseCase } from '../../application/use-cases/ListSessionsUseCase'
import { ResolveStartupSessionUseCase } from '../../application/use-cases/ResolveStartupSessionUseCase'
import { SubmitPromptUseCase } from '../../application/use-cases/SubmitPromptUseCase'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { DefaultCliConfigAdapter } from '../config/DefaultCliConfigAdapter'
import { AiSdkGateway } from '../llm/AiSdkGateway'
import { ModelAssistantResponder } from '../llm/ModelAssistantResponder'
import { StubAssistantResponder } from '../llm/StubAssistantResponder'
import { ConsoleLogger } from '../logging/ConsoleLogger'
import { FileSessionRepository } from '../persistence/FileSessionRepository'
import { loadPromptBundle } from '../prompt/loadPromptBundle'
import { FileStorageSettingsAdapter } from '../storage/FileStorageSettingsAdapter'
import { resolveAppStorage } from '../storage/resolveAppStorage'
import { CryptoIdGenerator } from '../system/CryptoIdGenerator'
import { SystemClock } from '../system/SystemClock'
import { LocalWorkspaceContextService } from '../workspace/LocalWorkspaceContextService'

export type { AdnifyCliRuntime }

export async function createRuntime(): Promise<AdnifyCliRuntime> {
  const logger = new ConsoleLogger()
  const i18n = createAppI18n(resolveAppLocaleFromEnv())
  const config = new DefaultCliConfigAdapter()
  const storage = await resolveAppStorage()
  const storageSettings = new FileStorageSettingsAdapter()
  config.setStorage(storage)
  const sessionRepository = new FileSessionRepository(storage)
  const idGenerator = new CryptoIdGenerator()
  const clock = new SystemClock()
  const workspaceContextService = new LocalWorkspaceContextService()

  const promptBundle = await loadPromptBundle()
  config.setPromptBundle(promptBundle)

  const { loadModelConfig, loadProviders } = await import('../config/loadLocalConfig')
  const modelConfig = await loadModelConfig()
  const providers = await loadProviders()
  config.setModelConfig(modelConfig)
  config.setProviders(providers)

  const { responder, gateway } = createResponderStack(modelConfig, config, logger, i18n)

  const submitPrompt = new SubmitPromptUseCase(
    sessionRepository,
    workspaceContextService,
    responder,
    config,
    idGenerator,
    clock,
    logger,
    i18n,
  )
  const createSession = new CreateSessionUseCase(
    sessionRepository,
    idGenerator,
    clock,
    logger,
    i18n,
  )
  const resolveStartupSession = new ResolveStartupSessionUseCase(
    sessionRepository,
    createSession,
    logger,
  )

  const switchModel = (providerName: string, modelName?: string): ModelConfig | null => {
    const newConfig = config.switchModel(providerName, modelName)
    if (!newConfig) {
      return null
    }

    if (gateway && responder instanceof ModelAssistantResponder) {
      gateway.updateConfig(newConfig)
      responder.updateGateway(gateway, newConfig)
      logger.info('Model switched via AI SDK', {
        model: newConfig.model,
        provider: newConfig.provider,
      })
    } else {
      const newStack = createResponderStack(newConfig, config, logger, i18n)
      submitPrompt.updateResponder(newStack.responder)
      logger.info('Model switched (new responder)', {
        model: newConfig.model,
        provider: newConfig.provider,
      })
    }

    return newConfig
  }

  return {
    i18n,
    useCases: {
      bootstrapCli: new BootstrapCliUseCase(workspaceContextService, config, logger, i18n),
      createSession,
      listSessions: new ListSessionsUseCase(sessionRepository),
      resolveStartupSession,
      submitPrompt,
      applyCliCommand: new ApplyCliCommandUseCase(
        sessionRepository,
        storageSettings,
        idGenerator,
        clock,
        logger,
        i18n,
      ),
    },
    switchModel,
  }
}

function createResponderStack(
  modelConfig: ModelConfig,
  config: DefaultCliConfigAdapter,
  logger: LoggerPort,
  i18n: ReturnType<typeof createAppI18n>,
) {
  if (!modelConfig.apiKey) {
    logger.info('No API key configured, using stub responder')
    return { responder: new StubAssistantResponder(logger, i18n), gateway: null }
  }

  logger.info('Using AI SDK gateway', {
    provider: modelConfig.provider,
    model: modelConfig.model,
    baseUrl: modelConfig.baseUrl,
  })

  const gateway = new AiSdkGateway(modelConfig, logger)
  const responder = new ModelAssistantResponder(gateway, modelConfig, config, logger, i18n)
  return { responder, gateway }
}
