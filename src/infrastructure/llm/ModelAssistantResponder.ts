import type { AssistantPromptSet } from '../../application/dto/AssistantPromptSet'
import type { AppI18n } from '../../application/i18n/AppI18n'
import type {
  AssistantReply,
  AssistantResponderCommand,
  AssistantResponderPort,
  AssistantStreamChunk,
} from '../../application/ports/AssistantResponderPort'
import type { CliConfigPort } from '../../application/ports/CliConfigPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ModelGatewayPort, ModelMessage } from '../../application/ports/ModelGatewayPort'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

export class ModelAssistantResponder implements AssistantResponderPort {
  constructor(
    private gateway: ModelGatewayPort,
    private config: ModelConfig,
    private readonly cliConfig: CliConfigPort,
    private readonly logger: LoggerPort,
    private readonly i18n: AppI18n,
  ) {}

  updateGateway(gateway: ModelGatewayPort, config: ModelConfig): void {
    this.gateway = gateway
    this.config = config
  }

  async generateReply(command: AssistantResponderCommand): Promise<AssistantReply> {
    const chunks: string[] = []
    for await (const chunk of this.streamReply(command)) {
      chunks.push(chunk.delta)
    }
    return { content: chunks.join('') }
  }

  async *streamReply(command: AssistantResponderCommand): AsyncIterable<AssistantStreamChunk> {
    const messages = this.buildMessages(command)

    this.logger.debug('Sending request to model gateway', {
      model: this.config.model,
      provider: this.config.provider,
      messageCount: messages.length,
      mode: command.session.mode,
    })

    try {
      for await (const chunk of this.gateway.streamChat({
        messages,
        model: this.config.model,
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
      })) {
        yield {
          delta: chunk.delta,
          done: chunk.finishReason === 'stop' || chunk.finishReason === 'length',
        }
      }
    } catch (error) {
      this.logger.error('Model gateway error', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  private buildMessages(command: AssistantResponderCommand): ModelMessage[] {
    const systemPrompt = this.buildSystemPrompt(
      command.session,
      command.workspace,
      command.toolCatalog,
      this.cliConfig.getAssistantPromptSet(),
    )

    const messages: ModelMessage[] = [{ role: 'system', content: systemPrompt }]

    for (const message of command.session.getMessages()) {
      if (message.role === 'system') {
        continue
      }

      messages.push({ role: message.role, content: message.content })
    }

    if (!messages.some((message) => message.role === 'user' && message.content === command.prompt)) {
      messages.push({ role: 'user', content: command.prompt })
    }

    return messages
  }

  private buildSystemPrompt(
    session: ConversationSession,
    workspace: WorkspaceContext,
    toolCatalog: AssistantResponderCommand['toolCatalog'],
    promptSet: AssistantPromptSet,
  ): string {
    const modePrompt = promptSet.modes[session.mode]
    const toolBlock =
      toolCatalog
        .map((tool) => `- ${tool.name} [${tool.category}] (${tool.riskLevel}): ${tool.description}`)
        .join('\n') || this.i18n.t('modelPrompt.noTools')

    const workspaceBlock = [
      this.i18n.t('modelPrompt.currentMode', { mode: session.mode }),
      this.i18n.t('modelPrompt.workspaceRoot', { value: workspace.rootPath }),
      this.i18n.t('modelPrompt.packageManager', { value: workspace.packageManager }),
      this.i18n.t('modelPrompt.gitRepository', {
        value: this.i18n.t(workspace.isGitRepository ? 'common.yes' : 'common.no'),
      }),
      this.i18n.t('modelPrompt.topLevelEntries', {
        value: workspace.topLevelEntries.join(', ') || this.i18n.t('workspace.none'),
      }),
    ].join('\n')

    return [
      promptSet.core.trim(),
      '',
      this.i18n.t('modelPrompt.respondIn', {
        language: this.i18n.t('modelPrompt.language.self'),
      }),
      '',
      '## Mode Instructions',
      modePrompt.trim(),
      '',
      '## Runtime Workspace Context',
      workspaceBlock,
      '',
      '## Available Tool Definitions',
      toolBlock,
    ].join('\n')
  }
}
