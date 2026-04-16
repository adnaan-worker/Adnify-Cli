import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

export interface ModelConfigStorePort {
  save(config: ModelConfig): Promise<void>
}
