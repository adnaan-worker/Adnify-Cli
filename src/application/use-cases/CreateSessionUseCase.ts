import { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'

export interface CreateSessionCommand {
  workspacePath: string
  mode: AssistantMode
  title?: string
  welcomeMessage?: string
}

/**
 * 创建会话。
 * 这里是会话聚合根的唯一入口，方便后续加入持久化规则和事件。
 */
export class CreateSessionUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: CreateSessionCommand): Promise<ConversationSession> {
    const now = this.clock.now()
    const session = ConversationSession.create({
      id: this.idGenerator.next(),
      title: command.title ?? 'Adnify-Cli Session',
      mode: command.mode,
      workspacePath: command.workspacePath,
      createdAt: now,
    })

    if (command.welcomeMessage) {
      session.addAssistantMessage(this.idGenerator.next(), now, command.welcomeMessage)
    }

    await this.sessionRepository.save(session)
    this.logger.info('Created new session', {
      sessionId: session.id,
      mode: session.mode,
    })

    return session
  }
}

