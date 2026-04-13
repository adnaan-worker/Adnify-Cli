import type {
  ConversationSession,
  ConversationSessionSnapshot,
} from '../../domain/session/aggregates/ConversationSession'

export interface SessionRepositoryPort {
  save(session: ConversationSession): Promise<void>
  findById(sessionId: string): Promise<ConversationSession | null>
  findSnapshotById(sessionId: string): Promise<ConversationSessionSnapshot | null>
}

