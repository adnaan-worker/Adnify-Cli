import type { CliConfigPort } from '../../application/ports/CliConfigPort'
import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import {
  createDefaultAssistantProfile,
  createDefaultLocalCommands,
  createDefaultToolCatalog,
} from './defaultConfig'

/**
 * 默认 CLI 配置适配器。
 * 静态配置从工厂函数获取，模型配置在启动时从文件/环境变量加载后注入。
 */
export class DefaultCliConfigAdapter implements CliConfigPort {
  private modelConfig: ModelConfig | null = null

  setModelConfig(config: ModelConfig): void {
    this.modelConfig = config
  }

  getAssistantProfile(): AssistantProfile {
    return createDefaultAssistantProfile()
  }

  getModelConfig(): ModelConfig {
    if (!this.modelConfig) {
      throw new Error('ModelConfig not loaded yet. Call setModelConfig() during bootstrap.')
    }
    return this.modelConfig
  }

  getToolCatalog(): ToolDescriptor[] {
    return createDefaultToolCatalog()
  }

  getLocalCommands(): string[] {
    return createDefaultLocalCommands()
  }
}
