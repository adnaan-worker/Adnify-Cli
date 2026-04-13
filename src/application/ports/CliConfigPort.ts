import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export interface CliConfigPort {
  getAssistantProfile(): AssistantProfile
  getToolCatalog(): ToolDescriptor[]
  getLocalCommands(): string[]
}
