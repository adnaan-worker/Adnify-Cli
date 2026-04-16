import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { AssistantPromptSet } from '../dto/AssistantPromptSet'
import type { AppStorageSnapshot } from '../dto/AppStorageSnapshot'
import type { ModelConfig, ProvidersMap } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export interface CliConfigPort {
  getAssistantProfile(): AssistantProfile
  getAssistantPromptSet(): AssistantPromptSet
  getModelConfig(): ModelConfig
  getProviders(): ProvidersMap
  switchModel(providerName: string, modelName?: string): ModelConfig | null
  getToolCatalog(): ToolDescriptor[]
  getLocalCommands(): string[]
  getStorage(): AppStorageSnapshot
}
