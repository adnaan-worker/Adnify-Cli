import type { ConversationSession } from '../../domain/session/aggregates/ConversationSession'

export interface SessionRepositoryPort {
  save(session: ConversationSession): Promise<void>
  findById(sessionId: string): Promise<ConversationSession | null>
}

