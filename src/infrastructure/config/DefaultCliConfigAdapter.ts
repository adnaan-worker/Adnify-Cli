import type { AssistantPromptSet } from '../../application/dto/AssistantPromptSet'
import type { AppStorageSnapshot } from '../../application/dto/AppStorageSnapshot'
import type { CliConfigPort } from '../../application/ports/CliConfigPort'
import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig, ProvidersMap } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { PromptBundle } from '../prompt/PromptBundle'

export class DefaultCliConfigAdapter implements CliConfigPort {
  private modelConfig: ModelConfig | null = null
  private providers: ProvidersMap = {}
  private promptBundle: PromptBundle | null = null
  private storage: AppStorageSnapshot | null = null

  setPromptBundle(bundle: PromptBundle): void {
    this.promptBundle = bundle
  }

  setModelConfig(config: ModelConfig): void {
    this.modelConfig = config
  }

  setProviders(providers: ProvidersMap): void {
    this.providers = providers
  }

  setStorage(storage: AppStorageSnapshot): void {
    this.storage = storage
  }

  getAssistantProfile(): AssistantProfile {
    return this.getPromptBundle().profile
  }

  getAssistantPromptSet(): AssistantPromptSet {
    return this.getPromptBundle().promptSet
  }

  getModelConfig(): ModelConfig {
    if (!this.modelConfig) {
      throw new Error('ModelConfig not loaded yet. Call setModelConfig() during bootstrap.')
    }

    return this.modelConfig
  }

  getProviders(): ProvidersMap {
    return this.providers
  }

  switchModel(providerName: string, modelName?: string): ModelConfig | null {
    const provider = this.providers[providerName]
    if (!provider) {
      return null
    }

    const model = modelName ?? provider.models[0]
    if (!model) {
      return null
    }

    const newConfig: ModelConfig = {
      provider: provider.provider,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
      model,
      maxTokens: this.modelConfig?.maxTokens ?? 4096,
      temperature: this.modelConfig?.temperature ?? 0.7,
      timeoutMs: this.modelConfig?.timeoutMs ?? 60_000,
    }

    this.modelConfig = newConfig
    return newConfig
  }

  getToolCatalog(): ToolDescriptor[] {
    return this.getPromptBundle().toolCatalog
  }

  getLocalCommands(): string[] {
    return this.getPromptBundle().localCommands
  }

  getStorage(): AppStorageSnapshot {
    if (!this.storage) {
      throw new Error('AppStorage not loaded yet. Call setStorage() during bootstrap.')
    }

    return this.storage
  }

  private getPromptBundle(): PromptBundle {
    if (!this.promptBundle) {
      throw new Error('PromptBundle not loaded yet. Call setPromptBundle() during bootstrap.')
    }

    return this.promptBundle
  }
}
