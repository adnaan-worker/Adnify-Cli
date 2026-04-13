import type {
  AssistantReply,
  AssistantResponderCommand,
  AssistantResponderPort,
  AssistantStreamChunk,
} from '../../application/ports/AssistantResponderPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ModelGatewayPort, ModelMessage } from '../../application/ports/ModelGatewayPort'
import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

/**
 * 真实模型助手响应器。
 * 将会话历史和工作区上下文组装为 model messages，通过 ModelGatewayPort 调用 LLM。
 */
export class ModelAssistantResponder implements AssistantResponderPort {
  constructor(
    private gateway: ModelGatewayPort,
    private config: ModelConfig,
    private readonly logger: LoggerPort,
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
    const messages = this.buildMessages(command.session, command.workspace, command.prompt)

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

  private buildMessages(
    session: ConversationSession,
    workspace: WorkspaceContext,
    currentPrompt: string,
  ): ModelMessage[] {
    const systemPrompt = [
      `你是 Adnify-Cli，一个面向终端的 AI 编程助手。`,
      `当前模式：${session.mode}`,
      `工作区根目录：${workspace.rootPath}`,
      `包管理器：${workspace.packageManager}`,
      `Git 仓库：${workspace.isGitRepository ? '是' : '否'}`,
      `顶层条目：${workspace.topLevelEntries.join(', ')}`,
    ].join('\n')

    const messages: ModelMessage[] = [{ role: 'system', content: systemPrompt }]

    for (const msg of session.getMessages()) {
      if (msg.role === 'system') continue
      messages.push({ role: msg.role, content: msg.content })
    }

    if (!messages.some((m) => m.role === 'user' && m.content === currentPrompt)) {
      messages.push({ role: 'user', content: currentPrompt })
    }

    return messages
  }
}
