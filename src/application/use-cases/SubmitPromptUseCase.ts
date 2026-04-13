import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
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

/**
 * 提交用户输入并获得助手回复。
 * 当前先通过桩响应器打通流程，后续可无缝替换为真实模型网关。
 */
export class SubmitPromptUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly workspaceContextPort: WorkspaceContextPort,
    private readonly assistantResponder: AssistantResponderPort,
    private readonly config: CliConfigPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: SubmitPromptCommand): Promise<SubmitPromptResult> {
    const session = await this.sessionRepository.findById(command.sessionId)
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`)
    }

    const prompt = command.prompt.trim()
    if (!prompt) {
      return {
        session,
        statusLine: '输入为空，已忽略。',
      }
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

    return {
      session,
      statusLine: '已完成一轮响应。',
    }
  }
}

