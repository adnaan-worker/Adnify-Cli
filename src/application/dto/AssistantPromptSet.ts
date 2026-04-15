import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'

export interface AssistantPromptSet {
  core: string
  modes: Record<AssistantMode, string>
}
