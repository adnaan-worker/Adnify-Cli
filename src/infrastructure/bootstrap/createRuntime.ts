import type { AssistantResponderPort } from '../../application/ports/AssistantResponderPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import { ApplyCliCommandUseCase } from '../../application/use-cases/ApplyCliCommandUseCase'
import { BootstrapCliUseCase } from '../../application/use-cases/BootstrapCliUseCase'
import { CreateSessionUseCase } from '../../application/use-cases/CreateSessionUseCase'
import { SubmitPromptUseCase } from '../../application/use-cases/SubmitPromptUseCase'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { DefaultCliConfigAdapter } from '../config/DefaultCliConfigAdapter'
import { ModelAssistantResponder } from '../llm/ModelAssistantResponder'
import { OpenAiCompatibleGateway } from '../llm/OpenAiCompatibleGateway'
import { StubAssistantResponder } from '../llm/StubAssistantResponder'
import { ConsoleLogger } from '../logging/ConsoleLogger'
import { InMemorySessionRepository } from '../persistence/InMemorySessionRepository'
import { CryptoIdGenerator } from '../system/CryptoIdGenerator'
import { SystemClock } from '../system/SystemClock'
import { LocalWorkspaceContextService } from '../workspace/LocalWorkspaceContextService'

export interface AdnifyCliRuntime {
  useCases: {
    bootstrapCli: BootstrapCliUseCase
    createSession: CreateSessionUseCase
    submitPrompt: SubmitPromptUseCase
    applyCliCommand: ApplyCliCommandUseCase
  }
}

function createResponder(modelConfig: ModelConfig, logger: LoggerPort): AssistantResponderPort {
  if (!modelConfig.apiKey) {
    logger.info('No API key configured — using stub responder')
    return new StubAssistantResponder(logger)
  }

  logger.info('Using model gateway', { model: modelConfig.model, baseUrl: modelConfig.baseUrl })
  const gateway = new OpenAiCompatibleGateway(modelConfig, logger)
  return new ModelAssistantResponder(gateway, modelConfig, logger)
}

/**
 * 统一装配运行时依赖。
 * 根据配置自动选择桩或真实模型适配器。
 */
export async function createRuntime(): Promise<AdnifyCliRuntime> {
  const logger = new ConsoleLogger()
  const config = new DefaultCliConfigAdapter()
  const sessionRepository = new InMemorySessionRepository()
  const idGenerator = new CryptoIdGenerator()
  const clock = new SystemClock()
  const workspaceContextService = new LocalWorkspaceContextService()

  const { loadModelConfig } = await import('../config/loadLocalConfig')
  const modelConfig = await loadModelConfig()
  config.setModelConfig(modelConfig)

  const assistantResponder = createResponder(modelConfig, logger)

  return {
    useCases: {
      bootstrapCli: new BootstrapCliUseCase(workspaceContextService, config, logger),
      createSession: new CreateSessionUseCase(sessionRepository, idGenerator, clock, logger),
      submitPrompt: new SubmitPromptUseCase(
        sessionRepository,
        workspaceContextService,
        assistantResponder,
        config,
        idGenerator,
        clock,
        logger,
      ),
      applyCliCommand: new ApplyCliCommandUseCase(
        sessionRepository,
        idGenerator,
        clock,
        logger,
      ),
    },
  }
}
