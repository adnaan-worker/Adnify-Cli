import type { ToolDescriptorProps } from '../../domain/tooling/entities/ToolDescriptor'

/**
 * 工具注册端口：把「目录里的工具描述」与「本进程可执行的原生工具」对齐。
 * 扩展实现可接入更多内置或插件工具，而不必改 Prompt 加载逻辑。
 */
export interface ToolRegistryPort {
  resolveExecutableCatalog(catalog: ToolDescriptorProps[]): ToolDescriptorProps[]
}
