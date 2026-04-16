import type { SessionListItem } from '../dto/SessionListItem'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'

export interface ListSessionsCommand {
  workspacePath: string
  limit?: number
}

export class ListSessionsUseCase {
  constructor(private readonly sessionRepository: SessionRepositoryPort) {}

  async execute(command: ListSessionsCommand): Promise<SessionListItem[]> {
    const sessions = await this.sessionRepository.listByWorkspace(
      command.workspacePath,
      command.limit,
    )

    return sessions.map((session) => ({
      id: session.id,
      title: session.title,
      mode: session.mode,
      updatedAt: session.updatedAt.toISOString(),
      messageCount: session.getMessages().length,
      workspacePath: session.workspacePath,
    }))
  }
}
