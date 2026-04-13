import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

export interface AssistantReply {
  content: string
}

export interface AssistantStreamChunk {
  delta: string
  done: boolean
}

export interface AssistantResponderCommand {
  prompt: string
  session: ConversationSession
  workspace: WorkspaceContext
  toolCatalog: ToolDescriptor[]
}

/**
 * 助手响应端口。
 * 支持同步和流式两种模式，流式为 CLI 交互体验的主路径。
 */
export interface AssistantResponderPort {
  generateReply(command: AssistantResponderCommand): Promise<AssistantReply>
  streamReply(command: AssistantResponderCommand): AsyncIterable<AssistantStreamChunk>
}

