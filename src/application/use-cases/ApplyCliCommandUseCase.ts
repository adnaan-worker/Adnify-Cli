import { ASSISTANT_MODES, isAssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'

export interface ApplyCliCommandCommand {
  sessionId: string
  commandLine: string
  bootstrap: BootstrapSnapshot
}

export interface ApplyCliCommandResult {
  session: ConversationSession
  statusLine: string
  shouldExit?: boolean
}

/**
 * 处理本地命令。
 * 这类命令不走模型，而是直接在应用层完成，会让 CLI 首屏体验更轻更快。
 */
export class ApplyCliCommandUseCase {
  constructor(
    private readonly sessionRepository: SessionRepositoryPort,
    private readonly idGenerator: IdGeneratorPort,
    private readonly clock: ClockPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: ApplyCliCommandCommand): Promise<ApplyCliCommandResult> {
    const session = await this.sessionRepository.findById(command.sessionId)
    if (!session) {
      throw new Error(`Session not found: ${command.sessionId}`)
    }

    const now = this.clock.now()
    const raw = command.commandLine.trim().replace(/^:/, '')
    const [verb = '', ...args] = raw.split(/\s+/)

    switch (verb) {
      case 'help': {
        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          [
            '本地命令列表：',
            ...command.bootstrap.localCommands.map((item) => `- ${item}`),
          ].join('\n'),
        )
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '已输出本地命令帮助。',
        }
      }
      case 'mode': {
        const nextMode = args[0]
        if (!nextMode || !isAssistantMode(nextMode)) {
          session.addSystemMessage(
            this.idGenerator.next(),
            now,
            `模式无效。可选模式：${ASSISTANT_MODES.join(', ')}`,
          )
          await this.sessionRepository.save(session)
          return {
            session,
            statusLine: '模式切换失败，请检查命令参数。',
          }
        }

        session.switchMode(nextMode, now)
        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          `会话模式已切换为 ${nextMode}。`,
        )
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: `当前模式：${nextMode}`,
        }
      }
      case 'workspace': {
        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          command.bootstrap.workspace.toSummaryText(),
        )
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '已输出工作区摘要。',
        }
      }
      case 'tools': {
        const toolsText = [
          '当前规划的工具目录：',
          ...command.bootstrap.toolCatalog.map(
            (tool) => `- ${tool.name} [${tool.category}]：${tool.description}`,
          ),
        ].join('\n')

        session.addSystemMessage(this.idGenerator.next(), now, toolsText)
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '已输出工具目录。',
        }
      }
      case 'clear': {
        session.clearConversation(now)
        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          '会话已清空，但工作区上下文和当前模式仍然保留。',
        )
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '会话已清空。',
        }
      }
      case 'exit': {
        this.logger.info('User requested CLI exit', { sessionId: command.sessionId })
        return {
          session,
          statusLine: '正在退出 Adnify-Cli...',
          shouldExit: true,
        }
      }
      default: {
        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          `未知命令：:${verb || '<empty>'}。输入 :help 查看可用命令。`,
        )
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '命令无法识别。',
        }
      }
    }
  }
}
