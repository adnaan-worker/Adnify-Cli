import type { AppStorageSnapshot } from './AppStorageSnapshot'
import type { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { AssistantMode } from '../../domain/assistant/value-objects/AssistantMode'
import type { ModelConfig, ProvidersMap } from '../../domain/assistant/value-objects/ModelConfig'
import type { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import type { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

/**
 * CLI 启动快照。
 * 应用层把启动时需要给表现层的数据集中到这里，避免 UI 自己拼业务对象。
 */
export interface BootstrapSnapshot {
  profile: AssistantProfile
  workspace: WorkspaceContext
  modelConfig: ModelConfig
  providers: ProvidersMap
  supportedModes: AssistantMode[]
  toolCatalog: ToolDescriptor[]
  localCommands: string[]
  storage: AppStorageSnapshot
}
