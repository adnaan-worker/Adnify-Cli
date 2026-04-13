import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

export interface WorkspaceContextPort {
  inspect(rootPath: string): Promise<WorkspaceContext>
}

