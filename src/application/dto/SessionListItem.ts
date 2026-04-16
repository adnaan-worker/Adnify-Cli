import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'

export interface SessionListItem {
  id: string
  title: string
  mode: AssistantMode
  updatedAt: string
  messageCount: number
  workspacePath: string
}
