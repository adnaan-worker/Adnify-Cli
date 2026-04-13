import type { SessionRepositoryPort } from '../../application/ports/SessionRepositoryPort'
import {
  ConversationSession,
  type ConversationSessionSnapshot,
} from '../../domain/session/aggregates/ConversationSession'

/**
 * 内存版会话仓储。
 * 初版先保证边界干净，后续再替换为文件、SQLite 或远端存储。
 */
export class InMemorySessionRepository implements SessionRepositoryPort {
  private readonly store = new Map<string, ConversationSessionSnapshot>()

  async save(session: ConversationSession): Promise<void> {
    this.store.set(session.id, session.toSnapshot())
  }

  async findById(sessionId: string): Promise<ConversationSession | null> {
    const snapshot = this.store.get(sessionId)
    return snapshot ? ConversationSession.rehydrate(snapshot) : null
  }
}

