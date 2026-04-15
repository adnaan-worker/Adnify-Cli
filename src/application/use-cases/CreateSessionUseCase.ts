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
 * 启动提示不直接写入会话流，避免和初始化向导、空状态内容重复。
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

    await this.sessionRepository.save(session)
    this.logger.info('Created new session', {
      sessionId: session.id,
      mode: session.mode,
      hasWelcomeMessage: Boolean(command.welcomeMessage),
    })

    return session
  }
}
