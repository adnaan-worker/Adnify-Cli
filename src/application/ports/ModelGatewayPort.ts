import type { MessageRole } from '../../domain/session/value-objects/MessageRole'

export interface ModelMessage {
  role: MessageRole
  content: string
}

export interface ModelRequest {
  messages: ModelMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  abortSignal?: AbortSignal
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
