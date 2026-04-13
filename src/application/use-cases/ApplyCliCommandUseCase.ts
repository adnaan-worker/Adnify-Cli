import { ASSISTANT_MODES, isAssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'

export interface ModelSwitcher {
  switchModel: (providerName: string, modelName?: string) => { model: string; baseUrl: string } | null
}

export interface ApplyCliCommandCommand {
  sessionId: string
  commandLine: string
  bootstrap: BootstrapSnapshot
  modelSwitcher?: ModelSwitcher
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
      case 'model': {
        const mc = command.bootstrap.modelConfig
        const providers = command.bootstrap.providers

        if (!args[0]) {
          const providerList = Object.entries(providers).map(([name, p]) =>
            `- ${name}: ${p.models.join(', ')} (${p.baseUrl})`,
          )
          session.addSystemMessage(
            this.idGenerator.next(),
            now,
            [
              `当前模型：${mc.model} (${mc.baseUrl})`,
              '',
              providerList.length > 0
                ? ['可用 Provider：', ...providerList].join('\n')
                : '未配置其他 Provider。在 ~/.adnify-cli/config.json 的 providers 中添加。',
              '',
              '用法：:model <provider> [model]',
              '示例：:model jucodex gpt-5.1-codex',
            ].join('\n'),
          )
          await this.sessionRepository.save(session)
          return { session, statusLine: `当前模型：${mc.model}` }
        }

        const providerName = args[0]
        const modelName = args[1]

        if (!command.modelSwitcher) {
          session.addSystemMessage(this.idGenerator.next(), now, '模型切换功能未就绪。')
          await this.sessionRepository.save(session)
          return { session, statusLine: '模型切换失败。' }
        }

        const result = command.modelSwitcher.switchModel(providerName, modelName)
        if (!result) {
          const available = Object.keys(providers).join(', ') || '无'
          session.addSystemMessage(
            this.idGenerator.next(),
            now,
            `Provider "${providerName}" 不存在或未配置模型。\n可用 Provider：${available}`,
          )
          await this.sessionRepository.save(session)
          return { session, statusLine: `切换失败：未找到 ${providerName}` }
        }

        session.addSystemMessage(
          this.idGenerator.next(),
          now,
          `已切换到 ${result.model} (${result.baseUrl})`,
        )
        await this.sessionRepository.save(session)
        return { session, statusLine: `当前模型：${result.model}` }
      }
      case 'config': {
        const mc = command.bootstrap.modelConfig
        const masked = mc.apiKey
          ? mc.apiKey.slice(0, 6) + '...' + mc.apiKey.slice(-4)
          : '未配置'
        const configText = [
          '当前模型配置：',
          `- Provider：${mc.provider}`,
          `- API Key：${masked}`,
          `- Base URL：${mc.baseUrl}`,
          `- Model：${mc.model}`,
          `- Max Tokens：${mc.maxTokens}`,
          `- Temperature：${mc.temperature}`,
          `- Timeout：${mc.timeoutMs}ms`,
          '',
          '配置方式：',
          '1. 创建 ~/.adnify-cli/config.json',
          '2. 或设置环境变量：ADNIFY_API_KEY, ADNIFY_BASE_URL, ADNIFY_MODEL',
        ].join('\n')

        session.addSystemMessage(this.idGenerator.next(), now, configText)
        await this.sessionRepository.save(session)
        return {
          session,
          statusLine: '已输出模型配置。',
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
