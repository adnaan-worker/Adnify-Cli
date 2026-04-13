import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig, ProvidersMap } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export interface CliConfigPort {
  getAssistantProfile(): AssistantProfile
  getModelConfig(): ModelConfig
  getProviders(): ProvidersMap
  switchModel(providerName: string, modelName?: string): ModelConfig | null
  getToolCatalog(): ToolDescriptor[]
  getLocalCommands(): string[]
}
