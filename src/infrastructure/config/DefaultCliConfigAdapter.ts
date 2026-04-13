import type { CliConfigPort } from '../../application/ports/CliConfigPort'
import {
  createDefaultAssistantProfile,
  createDefaultLocalCommands,
  createDefaultToolCatalog,
} from './defaultConfig'
import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

/**
 * 默认 CLI 配置适配器。
 * 当前从硬编码工厂函数获取配置，后续可替换为文件或环境变量加载。
 */
export class DefaultCliConfigAdapter implements CliConfigPort {
  getAssistantProfile(): AssistantProfile {
    return createDefaultAssistantProfile()
  }

  getToolCatalog(): ToolDescriptor[] {
    return createDefaultToolCatalog()
  }

  getLocalCommands(): string[] {
    return createDefaultLocalCommands()
  }
}
