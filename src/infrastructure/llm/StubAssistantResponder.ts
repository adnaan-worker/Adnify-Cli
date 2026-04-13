import type {
  AssistantReply,
  AssistantResponderCommand,
  AssistantResponderPort,
} from '../../application/ports/AssistantResponderPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'

/**
 * AI 响应桩。
 * 作用是先把交互链路打通，后续替换为真实模型实现时，应用层和领域层无需重写。
 */
export class StubAssistantResponder implements AssistantResponderPort {
  constructor(private readonly logger: LoggerPort) {}

  async generateReply(command: AssistantResponderCommand): Promise<AssistantReply> {
    this.logger.debug('Generating stub assistant reply', {
      mode: command.session.mode,
      workspace: command.workspace.rootPath,
    })

    const prompt = command.prompt.toLowerCase()
    const suggestions: string[] = []

    if (prompt.includes('ddd') || prompt.includes('架构')) {
      suggestions.push('建议先稳定领域边界，再逐步接入工具系统和模型网关。')
    }

    if (prompt.includes('readme') || prompt.includes('文档')) {
      suggestions.push('README 应持续与目录和用例保持同步，避免文档漂移。')
    }

    if (prompt.includes('工具') || prompt.includes('tool')) {
      suggestions.push('工具系统建议采用“目录 + 权限 + 执行器 + 结果模型”四段式设计。')
    }

    if (suggestions.length === 0) {
      suggestions.push('当前是初版脚手架阶段，建议优先补齐模型网关、工具注册中心和配置系统。')
    }

    return {
      content: [
        `已收到你的输入：${command.prompt}`,
        `当前模式：${command.session.mode}`,
        `工作区包管理器：${command.workspace.packageManager}`,
        `已规划工具数：${command.toolCatalog.length}`,
        '',
        '初步建议：',
        ...suggestions.map((item) => `- ${item}`),
      ].join('\n'),
    }
  }
}

