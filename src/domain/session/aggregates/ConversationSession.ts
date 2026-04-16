import type { AssistantMode } from '../../assistant/value-objects/AssistantMode'
import { ConversationMessage, type ConversationMessageSnapshot } from '../entities/ConversationMessage'

export interface ConversationSessionProps {
  id: string
  title: string
  mode: AssistantMode
  workspacePath: string
  createdAt: Date
  updatedAt: Date
  messages: ConversationMessage[]
}

export interface ConversationSessionSnapshot {
  id: string
  title: string
  mode: AssistantMode
  workspacePath: string
  createdAt: string
  updatedAt: string
  messages: ConversationMessageSnapshot[]
}

export interface CreateConversationSessionParams {
  id: string
  title: string
  mode: AssistantMode
  workspacePath: string
  createdAt: Date
}

/**
 * 会话聚合根。
 * 所有消息追加、模式切换、清空历史等行为都通过它收口。
 */
export class ConversationSession {
  private constructor(private props: ConversationSessionProps) {}

  static create(params: CreateConversationSessionParams): ConversationSession {
    return new ConversationSession({
      id: params.id,
      title: params.title,
      mode: params.mode,
      workspacePath: params.workspacePath,
      createdAt: params.createdAt,
      updatedAt: params.createdAt,
      messages: [],
    })
  }

  static rehydrate(snapshot: ConversationSessionSnapshot): ConversationSession {
    return new ConversationSession({
      id: snapshot.id,
      title: snapshot.title,
      mode: snapshot.mode,
      workspacePath: snapshot.workspacePath,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
      messages: snapshot.messages.map((message) => ConversationMessage.rehydrate(message)),
    })
  }

  get id(): string {
    return this.props.id
  }

  get title(): string {
    return this.props.title
  }

  get mode(): AssistantMode {
    return this.props.mode
  }

  get workspacePath(): string {
    return this.props.workspacePath
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  getMessages(): ConversationMessage[] {
    return [...this.props.messages]
  }

  getRecentMessages(limit = 12): ConversationMessage[] {
    return this.props.messages.slice(-limit)
  }

  addSystemMessage(id: string, createdAt: Date, content: string): void {
    this.appendMessage(
      new ConversationMessage({
        id,
        role: 'system',
        content,
        createdAt,
      }),
    )
  }

  addUserMessage(id: string, createdAt: Date, content: string): void {
    this.appendMessage(
      new ConversationMessage({
        id,
        role: 'user',
        content,
        createdAt,
      }),
    )
  }

  addAssistantMessage(id: string, createdAt: Date, content: string): void {
    this.appendMessage(
      new ConversationMessage({
        id,
        role: 'assistant',
        content,
        createdAt,
      }),
    )
  }

  switchMode(nextMode: AssistantMode, changedAt: Date): void {
    this.props.mode = nextMode
    this.props.updatedAt = changedAt
  }

  renameTitle(nextTitle: string, changedAt: Date): void {
    const normalized = nextTitle.trim()
    if (!normalized || normalized === this.props.title) {
      return
    }

    this.props.title = normalized
    this.props.updatedAt = changedAt
  }

  clearConversation(clearedAt: Date): void {
    this.props.messages = []
    this.props.updatedAt = clearedAt
  }

  toSnapshot(): ConversationSessionSnapshot {
    return {
      id: this.props.id,
      title: this.props.title,
      mode: this.props.mode,
      workspacePath: this.props.workspacePath,
      createdAt: this.props.createdAt.toISOString(),
      updatedAt: this.props.updatedAt.toISOString(),
      messages: this.props.messages.map((message) => message.toSnapshot()),
    }
  }

  clone(): ConversationSession {
    return ConversationSession.rehydrate(this.toSnapshot())
  }

  private appendMessage(message: ConversationMessage): void {
    if (!message.content.trim()) {
      return
    }

    this.props.messages.push(message)
    this.props.updatedAt = message.createdAt
  }
}
