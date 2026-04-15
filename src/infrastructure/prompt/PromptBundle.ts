import type { AssistantPromptSet } from '../../application/dto/AssistantPromptSet'
import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export interface PromptBundle {
  profile: AssistantProfile
  promptSet: AssistantPromptSet
  toolCatalog: ToolDescriptor[]
  localCommands: string[]
}
