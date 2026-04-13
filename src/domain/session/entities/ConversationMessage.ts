import type { MessageRole } from '../value-objects/MessageRole'

export interface ConversationMessageProps {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
}

export interface ConversationMessageSnapshot {
  id: string
  role: MessageRole
  content: string
  createdAt: string
}

/**
 * 会话消息实体。
 */
export class ConversationMessage {
  constructor(private readonly props: ConversationMessageProps) {}

  static rehydrate(snapshot: ConversationMessageSnapshot): ConversationMessage {
    return new ConversationMessage({
      id: snapshot.id,
      role: snapshot.role,
      content: snapshot.content,
      createdAt: new Date(snapshot.createdAt),
    })
  }

  get id(): string {
    return this.props.id
  }

  get role(): MessageRole {
    return this.props.role
  }

  get content(): string {
    return this.props.content
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  toSnapshot(): ConversationMessageSnapshot {
    return {
      id: this.props.id,
      role: this.props.role,
      content: this.props.content,
      createdAt: this.props.createdAt.toISOString(),
    }
  }
}

