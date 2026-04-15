import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export function createDefaultAssistantProfile(): AssistantProfile {
  return new AssistantProfile({
    id: 'adnify-cli',
    name: 'Adnify-Cli',
    author: 'adnaan',
    tagline: 'Command your codebase with calm precision.',
    description: '一个以 CLI 为核心、强调结构清晰、性能稳定与持续演进的 AI 编程搭档。',
    defaultMode: 'agent',
  })
}

export function createDefaultToolCatalog(): ToolDescriptor[] {
  return [
    new ToolDescriptor({
      id: 'workspace-read',
      name: 'Workspace Read',
      description: '读取工作区基础信息，为上下文组装与状态展示提供底座。',
      category: 'workspace',
      riskLevel: 'safe',
    }),
    new ToolDescriptor({
      id: 'file-ops',
      name: 'File Ops',
      description: '用于文件读取、编辑、生成和重构等本地代码操作。',
      category: 'filesystem',
      riskLevel: 'careful',
    }),
    new ToolDescriptor({
      id: 'shell-runner',
      name: 'Shell Runner',
      description: '用于执行终端命令，并受权限边界与风险级别控制。',
      category: 'terminal',
      riskLevel: 'dangerous',
    }),
    new ToolDescriptor({
      id: 'search-index',
      name: 'Search Index',
      description: '用于代码搜索、符号检索与上下文召回。',
      category: 'retrieval',
      riskLevel: 'safe',
    }),
  ]
}

export function createDefaultLocalCommands(): string[] {
  return [
    ':help',
    ':mode chat',
    ':mode agent',
    ':mode plan',
    ':workspace',
    ':tools',
    ':model [provider] [model]',
    ':config',
    ':config init',
    ':clear',
    ':exit',
  ]
}
