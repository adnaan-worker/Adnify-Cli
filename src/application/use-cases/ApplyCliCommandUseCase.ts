import { ASSISTANT_MODES, isAssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import {
  createCliCommandInputContent,
  createCliCommandOutputContent,
} from '../support/CliTranscriptMarkup'

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
    const normalizedCommand = normalizeCommandLine(command.commandLine)
    const [verb = '', ...args] = normalizedCommand.split(/\s+/).filter(Boolean)

    const addCommandInput = (): void => {
      session.addUserMessage(
        this.idGenerator.next(),
        now,
        createCliCommandInputContent(toDisplayCommand(normalizedCommand)),
      )
    }

    const addCommandOutput = (
      content: string,
      options: { title?: string; tone?: 'default' | 'info' | 'success' | 'warning' | 'danger' } = {},
    ): void => {
      session.addSystemMessage(
        this.idGenerator.next(),
        now,
        createCliCommandOutputContent(content, options),
      )
    }

    const persist = async (
      statusLine: string,
      options: { shouldExit?: boolean } = {},
    ): Promise<ApplyCliCommandResult> => {
      await this.sessionRepository.save(session)
      return {
        session,
        statusLine,
        shouldExit: options.shouldExit,
      }
    }

    switch (verb) {
      case 'help': {
        addCommandInput()
        addCommandOutput(
          ['本地命令列表：', ...command.bootstrap.localCommands.map((item) => `- ${item}`)].join('\n'),
          { title: 'commands', tone: 'info' },
        )
        return persist('已输出本地命令帮助。')
      }

      case 'mode': {
        addCommandInput()
        const nextMode = args[0]

        if (!nextMode || !isAssistantMode(nextMode)) {
          addCommandOutput(`模式无效。可选模式：${ASSISTANT_MODES.join(', ')}`, {
            title: 'mode',
            tone: 'warning',
          })
          return persist('模式切换失败，请检查命令参数。')
        }

        session.switchMode(nextMode, now)
        addCommandOutput(`会话模式已切换为 ${nextMode}。`, {
          title: 'mode',
          tone: 'success',
        })
        return persist(`当前模式：${nextMode}`)
      }

      case 'workspace': {
        addCommandInput()
        addCommandOutput(command.bootstrap.workspace.toSummaryText(), {
          title: 'workspace',
          tone: 'info',
        })
        return persist('已输出工作区摘要。')
      }

      case 'tools': {
        addCommandInput()
        const toolsText = [
          '当前规划的工具目录：',
          ...command.bootstrap.toolCatalog.map(
            (tool) => `- ${tool.name} [${tool.category}]：${tool.description}`,
          ),
        ].join('\n')

        addCommandOutput(toolsText, {
          title: 'tools',
          tone: 'info',
        })
        return persist('已输出工具目录。')
      }

      case 'model': {
        addCommandInput()
        const modelConfig = command.bootstrap.modelConfig
        const providers = command.bootstrap.providers

        if (!args[0]) {
          const providerList = Object.entries(providers).map(
            ([name, provider]) => `- ${name}: ${provider.models.join(', ')} (${provider.baseUrl})`,
          )

          addCommandOutput(
            [
              `当前模型：${modelConfig.model} (${modelConfig.baseUrl})`,
              '',
              providerList.length > 0
                ? ['可用 Provider：', ...providerList].join('\n')
                : '尚未配置额外 Provider，可在 ~/.adnify-cli/config.json 的 providers 字段中添加。',
              '',
              '用法：/model <provider> [model]',
              '示例：/model openai gpt-5',
            ].join('\n'),
            { title: 'model', tone: 'info' },
          )
          return persist(`当前模型：${modelConfig.model}`)
        }

        const providerName = args[0]
        const modelName = args[1]

        if (!command.modelSwitcher) {
          addCommandOutput('模型切换能力尚未就绪。', {
            title: 'model',
            tone: 'warning',
          })
          return persist('模型切换失败。')
        }

        const result = command.modelSwitcher.switchModel(providerName, modelName)
        if (!result) {
          const available = Object.keys(providers).join(', ') || '无'
          addCommandOutput(
            `Provider "${providerName}" 不存在或未配置模型。\n可用 Provider：${available}`,
            {
              title: 'model',
              tone: 'warning',
            },
          )
          return persist(`切换失败：未找到 ${providerName}`)
        }

        addCommandOutput(`已切换到 ${result.model} (${result.baseUrl})`, {
          title: 'model',
          tone: 'success',
        })
        return persist(`当前模型：${result.model}`)
      }

      case 'config': {
        addCommandInput()
        const modelConfig = command.bootstrap.modelConfig
        const maskedKey = modelConfig.apiKey
          ? `${modelConfig.apiKey.slice(0, 6)}...${modelConfig.apiKey.slice(-4)}`
          : '未配置'

        const configText = [
          '当前模型配置：',
          `- Provider：${modelConfig.provider}`,
          `- API Key：${maskedKey}`,
          `- Base URL：${modelConfig.baseUrl}`,
          `- Model：${modelConfig.model}`,
          `- Max Tokens：${modelConfig.maxTokens}`,
          `- Temperature：${modelConfig.temperature}`,
          `- Timeout：${modelConfig.timeoutMs}ms`,
          '',
          '配置方式：',
          '1. 创建 ~/.adnify-cli/config.json',
          '2. 或设置环境变量：ADNIFY_API_KEY、ADNIFY_BASE_URL、ADNIFY_MODEL、ADNIFY_PROVIDER',
        ].join('\n')

        addCommandOutput(configText, {
          title: 'config',
          tone: 'info',
        })
        return persist('已输出模型配置。')
      }

      case 'clear': {
        session.clearConversation(now)
        addCommandInput()
        addCommandOutput('会话已清空，但工作区上下文和当前模式仍然保留。', {
          title: 'conversation',
          tone: 'success',
        })
        return persist('会话已清空。')
      }

      case 'exit': {
        addCommandInput()
        addCommandOutput('正在退出 Adnify-Cli...', {
          title: 'session',
          tone: 'info',
        })

        this.logger.info('User requested CLI exit', { sessionId: command.sessionId })
        return persist('正在退出 Adnify-Cli...', { shouldExit: true })
      }

      default: {
        addCommandInput()
        addCommandOutput(`未知命令：${verb || '<empty>'}。输入 /help 查看可用命令。`, {
          title: 'command',
          tone: 'warning',
        })
        return persist('命令无法识别。')
      }
    }
  }
}

function normalizeCommandLine(commandLine: string): string {
  return commandLine.trim().replace(/^[:/]/, '').trim()
}

function toDisplayCommand(commandLine: string): string {
  return commandLine ? `/${commandLine}` : '/'
}
