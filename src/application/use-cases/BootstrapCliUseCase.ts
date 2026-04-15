import { ASSISTANT_MODES } from '../../domain/assistant/value-objects/AssistantMode'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { CliConfigPort } from '../ports/CliConfigPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { WorkspaceContextPort } from '../ports/WorkspaceContextPort'

export interface BootstrapCliCommand {
  cwd: string
}

/**
 * 负责生成 CLI 启动时需要的一次性快照。
 */
export class BootstrapCliUseCase {
  constructor(
    private readonly workspaceContextPort: WorkspaceContextPort,
    private readonly config: CliConfigPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: BootstrapCliCommand): Promise<BootstrapSnapshot> {
    this.logger.info('Bootstrapping Adnify-Cli runtime', { cwd: command.cwd })

    const profile = this.config.getAssistantProfile()
    const workspace = await this.workspaceContextPort.inspect(command.cwd)
    const toolCatalog = this.config.getToolCatalog()
    const localCommands = this.config.getLocalCommands()
    const modelConfig = this.config.getModelConfig()
    const providers = this.config.getProviders()

    return {
      profile,
      workspace,
      modelConfig,
      providers,
      toolCatalog,
      localCommands,
      supportedModes: [...ASSISTANT_MODES],
      welcomeMessage: [
        `${profile.name} 已完成初始启动。`,
        `当前工作区：${workspace.rootPath}`,
        `默认模式：${profile.defaultMode}`,
        modelConfig.apiKey
          ? `当前模型：${modelConfig.model} (${modelConfig.baseUrl})`
          : '尚未检测到 API Key，可输入 :config 查看配置说明。',
        '输入 :help 查看本地命令，直接输入自然语言即可开始对话。',
      ].join('\n'),
    }
  }
}
