import type { ToolRegistryPort } from '../../application/ports/ToolRegistryPort'
import type { ToolDescriptorProps } from '../../domain/tooling/entities/ToolDescriptor'

/** 与 `prompts/tools/*.md` 及 `buildNativeCliToolSet` 实现保持一致的 id 集合。 */
const NATIVE_EXECUTABLE_IDS = new Set([
  'workspace-read',
  'file-ops',
  'shell-runner',
  'search-index',
])

export class PromptBundleNativeToolRegistry implements ToolRegistryPort {
  resolveExecutableCatalog(catalog: ToolDescriptorProps[]): ToolDescriptorProps[] {
    return catalog.filter((entry) => NATIVE_EXECUTABLE_IDS.has(entry.id))
  }
}
