import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export interface CliConfigPort {
  getAssistantProfile(): AssistantProfile
  getModelConfig(): ModelConfig
  getToolCatalog(): ToolDescriptor[]
  getLocalCommands(): string[]
}
