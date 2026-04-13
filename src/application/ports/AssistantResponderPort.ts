import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

export interface AssistantReply {
  content: string
}

export interface AssistantResponderCommand {
  prompt: string
  session: ConversationSession
  workspace: WorkspaceContext
  toolCatalog: ToolDescriptor[]
}

/**
 * 助手响应端口。
 * 后续可以替换为 OpenAI、Anthropic、本地模型或自建网关。
 */
export interface AssistantResponderPort {
  generateReply(command: AssistantResponderCommand): Promise<AssistantReply>
}

