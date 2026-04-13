import { ApplyCliCommandUseCase } from '../../application/use-cases/ApplyCliCommandUseCase'
import { BootstrapCliUseCase } from '../../application/use-cases/BootstrapCliUseCase'
import { CreateSessionUseCase } from '../../application/use-cases/CreateSessionUseCase'
import { SubmitPromptUseCase } from '../../application/use-cases/SubmitPromptUseCase'
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

/**
 * 统一装配运行时依赖。
 * 当前先使用轻量级内存实现，后续可以切到持久化仓储和真实模型适配器。
 */
export function createRuntime(): AdnifyCliRuntime {
  const logger = new ConsoleLogger()
  const sessionRepository = new InMemorySessionRepository()
  const idGenerator = new CryptoIdGenerator()
  const clock = new SystemClock()
  const workspaceContextService = new LocalWorkspaceContextService()
  const assistantResponder = new StubAssistantResponder(logger)

  return {
    useCases: {
      bootstrapCli: new BootstrapCliUseCase(workspaceContextService, logger),
      createSession: new CreateSessionUseCase(sessionRepository, idGenerator, clock, logger),
      submitPrompt: new SubmitPromptUseCase(
        sessionRepository,
        workspaceContextService,
        assistantResponder,
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

