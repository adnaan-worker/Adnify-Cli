import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { MessageRole } from '../../domain/session/value-objects/MessageRole'
import type { ToolDescriptorProps } from '../../domain/tooling/entities/ToolDescriptor'

export interface ModelMessage {
  role: MessageRole
  content: string
}

export interface ModelAgenticContext {
  mode: AssistantMode
  workspacePath: string
  toolCatalog: ToolDescriptorProps[]
}

export interface ModelRequest {
  messages: ModelMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
  /**
   * When present, native tool execution may be enabled for non-chat modes.
   * Chat mode keeps text-only generation; agent/plan use this for tool loops.
   */
  agentic?: ModelAgenticContext
}

export interface ModelStreamChunk {
  delta: string
  finishReason?: 'stop' | 'length' | 'error'
}

/**
 * 模型网关端口。
 * 负责与底层 LLM API 通信，只关心"消息进、文本出"，不关心业务编排。
 */
export interface ModelGatewayPort {
  streamChat(request: ModelRequest): AsyncIterable<ModelStreamChunk>
}
