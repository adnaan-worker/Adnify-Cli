import type {
  StorageSettingsSnapshot,
  StorageSettingsUpdateResult,
} from '../dto/StorageSettingsSnapshot'
import { ASSISTANT_MODES, isAssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { AppI18n } from '../i18n/AppI18n'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import type { StorageSettingsPort } from '../ports/StorageSettingsPort'
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
    private readonly storageSettings: StorageSettingsPort,
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
    const rawArgs = normalizedCommand.slice(verb.length).trim()

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
        const configPath = (await this.storageSettings.inspect()).effectiveStorage.configPath

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
                : this.i18n
                    .t('cli.model.noProviders')
                    .replace('~/.adnify-cli/config.json', configPath),
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
        const storage = (await this.storageSettings.inspect()).effectiveStorage
        const maskedKey = modelConfig.apiKey
          ? `${modelConfig.apiKey.slice(0, 6)}...${modelConfig.apiKey.slice(-4)}`
          : this.i18n.t('cli.config.unset')
        const howToFile = this.i18n
          .t('cli.config.howToFile')
          .replace('~/.adnify-cli/config.json', storage.configPath)
        const howToEnv = `${this.i18n.t('cli.config.howToEnv')}, ADNIFY_HOME`

        const configText = [
          this.i18n.t('cli.config.title'),
          this.i18n.t('cli.config.provider', { value: modelConfig.provider }),
          this.i18n.t('cli.config.apiKey', { value: maskedKey }),
          this.i18n.t('cli.config.baseUrl', { value: modelConfig.baseUrl }),
          this.i18n.t('cli.config.model', { value: modelConfig.model }),
          this.i18n.t('cli.config.maxTokens', { value: modelConfig.maxTokens }),
          this.i18n.t('cli.config.temperature', { value: modelConfig.temperature }),
          this.i18n.t('cli.config.timeout', { value: modelConfig.timeoutMs }),
          this.i18n.t('cli.config.dataRoot', { value: storage.dataRoot }),
          this.i18n.t('cli.config.configFile', { value: storage.configPath }),
          this.i18n.t('cli.config.sessionsDir', { value: storage.sessionsDir }),
          '',
          this.i18n.t('cli.config.howTo'),
          howToFile,
          howToEnv,
        ].join('\n')

        addCommandOutput(configText, {
          title: this.i18n.t('transcript.config'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.config.status'))
      }

      case 'session': {
        addCommandInput()
        addCommandOutput(formatCurrentSession(session, this.i18n), {
          title: this.i18n.t('transcript.session'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.session.status'))
      }

      case 'storage': {
        addCommandInput()
        const subcommand = args[0]?.toLowerCase()

        if (subcommand === 'set') {
          const nextPath = rawArgs.replace(/^set\s+/i, '').trim()

          if (!nextPath) {
            addCommandOutput(
              [this.i18n.t('cli.storage.setMissingPath'), this.i18n.t('cli.storage.usage')].join(
                '\n',
              ),
              {
                title: this.i18n.t('transcript.config'),
                tone: 'warning',
              },
            )
            return persist(this.i18n.t('cli.storage.invalidStatus'))
          }

          const result = await this.storageSettings.setDataDirectory(nextPath)
          addCommandOutput(formatStorageUpdate(result, this.i18n, 'set'), {
            title: this.i18n.t('transcript.config'),
            tone: 'success',
          })
          return persist(this.i18n.t('cli.storage.updatedStatus'))
        }

        if (subcommand === 'reset') {
          const result = await this.storageSettings.resetDataDirectory()
          addCommandOutput(formatStorageUpdate(result, this.i18n, 'reset'), {
            title: this.i18n.t('transcript.config'),
            tone: 'success',
          })
          return persist(this.i18n.t('cli.storage.resetStatus'))
        }

        const snapshot = await this.storageSettings.inspect()
        addCommandOutput(formatStorageSnapshot(snapshot, this.i18n), {
          title: this.i18n.t('transcript.config'),
          tone: 'info',
        })
        return persist(this.i18n.t('cli.storage.status'))
      }

      case 'sessions': {
        addCommandInput()
        const sessions = await this.sessionRepository.listByWorkspace(session.workspacePath, 8)
        const lines =
          sessions.length > 0
            ? sessions.map((item, index) => formatSessionLine(item, index, session.id, this.i18n))
            : [this.i18n.t('cli.sessions.empty')]

        addCommandOutput(
          [this.i18n.t('cli.sessions.title'), ...lines, '', this.i18n.t('cli.sessions.hint')].join(
            '\n',
          ),
          {
            title: this.i18n.t('transcript.session'),
            tone: 'info',
          },
        )

        return persist(this.i18n.t('cli.sessions.status'))
      }

      case 'resume': {
        const sessions = await this.sessionRepository.listByWorkspace(session.workspacePath, 12)
        const target = resolveResumeTarget(args.join(' '), session.id, sessions)

        if (!target) {
          addCommandInput()
          addCommandOutput(this.i18n.t('cli.resume.notFound'), {
            title: this.i18n.t('transcript.session'),
            tone: 'warning',
          })
          return persist(this.i18n.t('cli.resume.failedStatus'))
        }

        this.logger.info('Resumed session from local history', {
          previousSessionId: session.id,
          nextSessionId: target.id,
        })

        return {
          session: target,
          statusLine: this.i18n.t('cli.resume.status', {
            id: formatShortSessionId(target.id),
          }),
        }
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

function formatShortSessionId(sessionId: string): string {
  return sessionId.slice(0, 8)
}

function formatSessionLine(
  session: ConversationSession,
  index: number,
  currentSessionId: string,
  i18n: AppI18n,
): string {
  const marker = session.id === currentSessionId ? i18n.t('cli.sessions.current') : session.mode
  const updatedAt = session.updatedAt.toISOString().replace('T', ' ').slice(0, 16)

  return `${index + 1}. [${formatShortSessionId(session.id)}] ${session.title} (${marker}) - ${updatedAt}`
}

function resolveResumeTarget(
  rawQuery: string,
  currentSessionId: string,
  sessions: ConversationSession[],
): ConversationSession | null {
  const query = rawQuery.trim()

  if (!query) {
    return sessions.find((item) => item.id !== currentSessionId) ?? null
  }

  const byIndex = Number.parseInt(query, 10)
  if (!Number.isNaN(byIndex) && byIndex >= 1 && byIndex <= sessions.length) {
    return sessions[byIndex - 1] ?? null
  }

  return sessions.find((item) => item.id.startsWith(query)) ?? null
}

function formatStorageSnapshot(snapshot: StorageSettingsSnapshot, i18n: AppI18n): string {
  const lines = [
    i18n.t('cli.storage.title'),
    i18n.t('cli.storage.source', { value: localizeStorageSource(snapshot.effectiveStorage.source, i18n) }),
    i18n.t('cli.storage.currentRoot', { value: snapshot.effectiveStorage.dataRoot }),
    i18n.t('cli.storage.configPath', { value: snapshot.effectiveStorage.configPath }),
    i18n.t('cli.storage.sessionsPath', { value: snapshot.effectiveStorage.sessionsDir }),
    i18n.t('cli.storage.settingsPath', { value: snapshot.settingsPath }),
    i18n.t('cli.storage.customRoot', {
      value: snapshot.configuredDataRoot ?? i18n.t('cli.storage.customRootUnset'),
    }),
    '',
    i18n.t('cli.storage.usage'),
  ]

  if (snapshot.effectiveStorage.source === 'env') {
    lines.push('', i18n.t('cli.storage.envOverride'))
  }

  return lines.join('\n')
}

function formatCurrentSession(session: ConversationSession, i18n: AppI18n): string {
  return [
    i18n.t('cli.session.title'),
    i18n.t('cli.session.id', { value: session.id }),
    i18n.t('cli.session.shortId', { value: formatShortSessionId(session.id) }),
    i18n.t('cli.session.name', { value: session.title }),
    i18n.t('cli.session.mode', { value: session.mode }),
    i18n.t('cli.session.workspace', { value: session.workspacePath }),
    i18n.t('cli.session.messageCount', { value: session.getMessages().length }),
    i18n.t('cli.session.updatedAt', { value: session.updatedAt.toISOString() }),
  ].join('\n')
}

function formatStorageUpdate(
  result: StorageSettingsUpdateResult,
  i18n: AppI18n,
  action: 'set' | 'reset',
): string {
  const lines = [
    action === 'set' ? i18n.t('cli.storage.updated') : i18n.t('cli.storage.reset'),
    i18n.t('cli.storage.currentRoot', { value: result.effectiveStorage.dataRoot }),
    i18n.t('cli.storage.configPath', { value: result.effectiveStorage.configPath }),
    i18n.t('cli.storage.sessionsPath', { value: result.effectiveStorage.sessionsDir }),
    i18n.t('cli.storage.settingsPath', { value: result.settingsPath }),
    i18n.t('cli.storage.customRoot', {
      value: result.configuredDataRoot ?? i18n.t('cli.storage.customRootUnset'),
    }),
  ]

  if (result.migratedConfig) {
    lines.push(i18n.t('cli.storage.configMigrated'))
  }

  if (result.migratedSessions) {
    lines.push(i18n.t('cli.storage.sessionsMigrated'))
  }

  if (!result.migratedConfig && !result.migratedSessions && action === 'set') {
    lines.push(i18n.t('cli.storage.migrationSkipped'))
  }

  if (result.effectiveStorage.source === 'env') {
    lines.push(i18n.t('cli.storage.envOverride'))
  }

  if (result.requiresRestart) {
    lines.push(i18n.t('cli.storage.restartHint'))
  }

  return lines.join('\n')
}

function localizeStorageSource(source: 'default' | 'env' | 'settings', i18n: AppI18n): string {
  switch (source) {
    case 'env':
      return i18n.t('cli.storage.sourceEnv')
    case 'settings':
      return i18n.t('cli.storage.sourceSettings')
    case 'default':
    default:
      return i18n.t('cli.storage.sourceDefault')
  }
}
