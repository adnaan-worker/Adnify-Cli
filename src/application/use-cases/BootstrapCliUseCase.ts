import { ASSISTANT_MODES } from '../../domain/assistant/value-objects/AssistantMode'
import type { BootstrapSnapshot } from '../dto/BootstrapSnapshot'
import type { LoggerPort } from '../ports/LoggerPort'
import type { WorkspaceContextPort } from '../ports/WorkspaceContextPort'
import {
  createDefaultAssistantProfile,
  createDefaultLocalCommands,
  createDefaultToolCatalog,
} from '../../infrastructure/config/defaultConfig'

export interface BootstrapCliCommand {
  cwd: string
}

/**
 * 负责生成 CLI 启动时需要的一次性快照。
 */
export class BootstrapCliUseCase {
  constructor(
    private readonly workspaceContextPort: WorkspaceContextPort,
    private readonly logger: LoggerPort,
  ) {}

  async execute(command: BootstrapCliCommand): Promise<BootstrapSnapshot> {
    this.logger.info('Bootstrapping Adnify-Cli runtime', { cwd: command.cwd })

    const profile = createDefaultAssistantProfile()
    const workspace = await this.workspaceContextPort.inspect(command.cwd)
    const toolCatalog = createDefaultToolCatalog()
    const localCommands = createDefaultLocalCommands()

    return {
      profile,
      workspace,
      toolCatalog,
      localCommands,
      supportedModes: [...ASSISTANT_MODES],
      welcomeMessage: [
        `${profile.name} 已完成初步启动。`,
        `当前工作区：${workspace.rootPath}`,
        `默认模式：${profile.defaultMode}`,
        '输入 :help 查看本地命令，直接输入自然语言则会进入助手对话。',
      ].join('\n'),
    }
  }
}

