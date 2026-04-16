import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import type { CreateSessionUseCase } from './CreateSessionUseCase'

export interface ResolveStartupSessionCommand {
  workspacePath: string
  mode: AssistantMode
}

export interface ResolveStartupSessionResult {
  session: ConversationSession
  restored: boolean
}

export class ResolveStartupSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly createSession: CreateSessionUseCase,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: ResolveStartupSessionCommand): Promise<ResolveStartupSessionResult> {
    const [existingSession] = await this.sessionRepository.listByWorkspace(command.workspacePath, 1)

    if (existingSession) {
      this.logger.info('Restored recent session on startup', {
        sessionId: existingSession.id,
        workspacePath: command.workspacePath,
      })

      return {
        session: existingSession,
        restored: true,
      }
    }

    return {
      session: await this.createSession.execute({
        workspacePath: command.workspacePath,
        mode: command.mode,
      }),
      restored: false,
    }
  }
}
