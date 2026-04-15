import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { AppI18n } from '../i18n/AppI18n'
import type { AssistantResponderPort } from '../ports/AssistantResponderPort'
import type { CliConfigPort } from '../ports/CliConfigPort'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import type { WorkspaceContextPort } from '../ports/WorkspaceContextPort'

export interface SubmitPromptCommand {
  sessionId: string
  prompt: string
}

export interface SubmitPromptResult {
  session: ConversationSession
  statusLine: string
}

export interface StreamingCallbacks {
  onChunk: (delta: string) => void
  onDone: (fullContent: string) => void
  onError: (error: Error) => void
}

/**
 * 提交用户输入并获得助手回复。
 * 同时支持同步与流式两种路径，其中流式路径是 CLI 的主交互链路。
 */
export class SubmitPromptUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly workspaceContextPort: WorkspaceContextPort,
    private assistantResponder: AssistantResponderPort,
    private readonly config: CliConfigPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly logger: LoggerPort,
    private readonly i18n: AppI18n,
  ) {}

  updateResponder(responder: AssistantResponderPort): void {
    this.assistantResponder = responder
  }

  async execute(command: SubmitPromptCommand): Promise<SubmitPromptResult> {
    const session = await this.getSession(command.sessionId)
    const prompt = command.prompt.trim()

    if (!prompt) {
      return { session, statusLine: this.i18n.t('status.inputIgnored') }
    }

    const now = this.clock.now()
    session.addUserMessage(this.idGenerator.next(), now, prompt)

    const workspace = await this.workspaceContextPort.inspect(session.workspacePath)
    const reply = await this.assistantResponder.generateReply({
      prompt,
      session,
      workspace,
      toolCatalog: this.config.getToolCatalog(),
    })

    session.addAssistantMessage(this.idGenerator.next(), this.clock.now(), reply.content)
    await this.sessionRepository.save(session)

    this.logger.info('Prompt submitted', {
      sessionId: session.id,
      mode: session.mode,
      promptLength: prompt.length,
    })

    return { session, statusLine: this.i18n.t('status.responseCompleted') }
  }

  /**
   * 流式提交。
   * 先记录用户消息，再通过回调逐步输出助手响应，完成后写回会话。
   */
  async executeStreaming(
    command: SubmitPromptCommand,
    callbacks: StreamingCallbacks,
  ): Promise<SubmitPromptResult> {
    const session = await this.getSession(command.sessionId)
    const prompt = command.prompt.trim()

    if (!prompt) {
      return { session, statusLine: this.i18n.t('status.inputIgnored') }
    }

    const now = this.clock.now()
    session.addUserMessage(this.idGenerator.next(), now, prompt)

    const workspace = await this.workspaceContextPort.inspect(session.workspacePath)
    const chunks: string[] = []

    try {
      for await (const chunk of this.assistantResponder.streamReply({
        prompt,
        session,
        workspace,
        toolCatalog: this.config.getToolCatalog(),
      })) {
        if (chunk.delta) {
          chunks.push(chunk.delta)
          callbacks.onChunk(chunk.delta)
        }
      }

      const fullContent = chunks.join('')
      session.addAssistantMessage(this.idGenerator.next(), this.clock.now(), fullContent)
      await this.sessionRepository.save(session)

      callbacks.onDone(fullContent)

      this.logger.info('Streaming prompt completed', {
        sessionId: session.id,
        mode: session.mode,
        promptLength: prompt.length,
        replyLength: fullContent.length,
      })

      return { session, statusLine: this.i18n.t('status.responseCompleted') }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      callbacks.onError(err)

      const partial = chunks.join('')
      if (partial) {
        session.addAssistantMessage(
          this.idGenerator.next(),
          this.clock.now(),
          `${partial}\n\n[${
            this.i18n.locale === 'en' ? 'Response interrupted' : '响应中断'
          }]`,
        )
        await this.sessionRepository.save(session)
      }

      this.logger.error('Streaming prompt failed', {
        sessionId: session.id,
        error: err.message,
      })

      return {
        session,
        statusLine: this.i18n.t('status.responseFailed', { message: err.message }),
      }
    }
  }

  private async getSession(sessionId: string): Promise<ConversationSession> {
    const session = await this.sessionRepository.findById(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    return session
  }
}
