import { ASSISTANT_MODES, isAssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { AppI18n } from '../i18n/AppI18n'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import {
  createCliCommandInputContent,
  createCliCommandOutputContent,
} from '../support/CliTranscriptMarkup'
import { formatWorkspaceSummary } from '../support/formatWorkspaceSummary'

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
    private readonly i18n: AppI18n,
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
          [
            this.i18n.t('cli.help.title'),
            ...command.bootstrap.localCommands.map((item) => `- ${item}`),
          ].join('\n'),
          { title: this.i18n.t('transcript.commands'), tone: 'info' },
        )
        return persist(this.i18n.t('cli.help.status'))
      }

      case 'mode': {
        addCommandInput()
        const nextMode = args[0]

        if (!nextMode || !isAssistantMode(nextMode)) {
          addCommandOutput(
            this.i18n.t('cli.mode.invalidOutput', {
              modes: ASSISTANT_MODES.join(', '),
            }),
            {
              title: this.i18n.t('transcript.mode'),
              tone: 'warning',
            },
          )
          return persist(this.i18n.t('cli.mode.invalidStatus'))
        }

        session.switchMode(nextMode, now)
        addCommandOutput(this.i18n.t('cli.mode.changedOutput', { mode: nextMode }), {
          title: this.i18n.t('transcript.mode'),
          tone: 'success',
        })
        return persist(this.i18n.t('cli.mode.changedStatus', { mode: nextMode }))
      }

      case 'workspace': {
        addCommandInput()
        addCommandOutput(formatWorkspaceSummary(command.bootstrap.workspace, this.i18n), {
          title: this.i18n.t('transcript.workspace'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.workspace.status'))
      }

      case 'tools': {
        addCommandInput()
        const toolsText = [
          this.i18n.t('cli.tools.title'),
          ...command.bootstrap.toolCatalog.map((tool) => formatToolLine(tool, this.i18n)),
        ].join('\n')

        addCommandOutput(toolsText, {
          title: this.i18n.t('transcript.tools'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.tools.status'))
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
              this.i18n.t('cli.model.current', {
                model: modelConfig.model,
                baseUrl: modelConfig.baseUrl,
              }),
              '',
              providerList.length > 0
                ? [this.i18n.t('cli.model.providersTitle'), ...providerList].join('\n')
                : this.i18n.t('cli.model.noProviders'),
              '',
              this.i18n.t('cli.model.usage'),
              this.i18n.t('cli.model.example'),
            ].join('\n'),
            { title: this.i18n.t('transcript.model'), tone: 'info' },
          )
          return persist(
            this.i18n.t('cli.model.switchedStatus', {
              model: modelConfig.model,
            }),
          )
        }

        const providerName = args[0]
        const modelName = args[1]

        if (!command.modelSwitcher) {
          addCommandOutput(this.i18n.t('cli.model.unavailable'), {
            title: this.i18n.t('transcript.model'),
            tone: 'warning',
          })
          return persist(this.i18n.t('cli.model.unavailableStatus'))
        }

        const result = command.modelSwitcher.switchModel(providerName, modelName)
        if (!result) {
          addCommandOutput(
            this.i18n.t('cli.model.providerMissing', {
              provider: providerName,
              available: Object.keys(providers).join(', ') || this.i18n.t('workspace.none'),
            }),
            {
              title: this.i18n.t('transcript.model'),
              tone: 'warning',
            },
          )
          return persist(
            this.i18n.t('cli.model.providerMissingStatus', {
              provider: providerName,
            }),
          )
        }

        addCommandOutput(
          this.i18n.t('cli.model.switchedOutput', {
            model: result.model,
            baseUrl: result.baseUrl,
          }),
          {
            title: this.i18n.t('transcript.model'),
            tone: 'success',
          },
        )
        return persist(this.i18n.t('cli.model.switchedStatus', { model: result.model }))
      }

      case 'config': {
        addCommandInput()
        const modelConfig = command.bootstrap.modelConfig
        const maskedKey = modelConfig.apiKey
          ? `${modelConfig.apiKey.slice(0, 6)}...${modelConfig.apiKey.slice(-4)}`
          : this.i18n.t('cli.config.unset')

        const configText = [
          this.i18n.t('cli.config.title'),
          this.i18n.t('cli.config.provider', { value: modelConfig.provider }),
          this.i18n.t('cli.config.apiKey', { value: maskedKey }),
          this.i18n.t('cli.config.baseUrl', { value: modelConfig.baseUrl }),
          this.i18n.t('cli.config.model', { value: modelConfig.model }),
          this.i18n.t('cli.config.maxTokens', { value: modelConfig.maxTokens }),
          this.i18n.t('cli.config.temperature', { value: modelConfig.temperature }),
          this.i18n.t('cli.config.timeout', { value: modelConfig.timeoutMs }),
          '',
          this.i18n.t('cli.config.howTo'),
          this.i18n.t('cli.config.howToFile'),
          this.i18n.t('cli.config.howToEnv'),
        ].join('\n')

        addCommandOutput(configText, {
          title: this.i18n.t('transcript.config'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.config.status'))
      }

      case 'clear': {
        session.clearConversation(now)
        addCommandInput()
        addCommandOutput(this.i18n.t('cli.clear.output'), {
          title: this.i18n.t('transcript.conversation'),
          tone: 'success',
        })
        return persist(this.i18n.t('cli.clear.status'))
      }

      case 'exit': {
        addCommandInput()
        addCommandOutput(this.i18n.t('cli.exit.output'), {
          title: this.i18n.t('transcript.session'),
          tone: 'info',
        })

        this.logger.info('User requested CLI exit', { sessionId: command.sessionId })
        return persist(this.i18n.t('cli.exit.status'), { shouldExit: true })
      }

      default: {
        addCommandInput()
        addCommandOutput(
          this.i18n.t('cli.unknown.output', {
            command: verb || '<empty>',
          }),
          {
            title: this.i18n.t('transcript.command'),
            tone: 'warning',
          },
        )
        return persist(this.i18n.t('cli.unknown.status'))
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

function formatToolLine(tool: ToolDescriptor, i18n: AppI18n): string {
  return `- ${localizeToolName(tool, i18n)} [${tool.category}]: ${localizeToolDescription(tool, i18n)}`
}

function localizeToolName(tool: ToolDescriptor, i18n: AppI18n): string {
  return i18n.maybeT(`tool.${tool.id}.name`) ?? tool.name
}

function localizeToolDescription(tool: ToolDescriptor, i18n: AppI18n): string {
  return i18n.maybeT(`tool.${tool.id}.description`) ?? tool.description
}
