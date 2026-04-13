import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'

export function createDefaultAssistantProfile(): AssistantProfile {
  return new AssistantProfile({
    id: 'adnify-cli',
    name: 'Adnify-Cli',
    author: 'adnaan',
    tagline: '面向终端的 DDD 风格 AI 编程助手',
    description: '一个以 CLI 为核心、强调架构清晰与可演进性的 AI 编程助手。',
    defaultMode: 'agent',
  })
}

export function createDefaultToolCatalog(): ToolDescriptor[] {
  return [
    new ToolDescriptor({
      id: 'workspace-read',
      name: 'Workspace Read',
      description: '读取工作区基础信息，为后续上下文组装提供底座。',
      category: 'workspace',
      riskLevel: 'safe',
    }),
    new ToolDescriptor({
      id: 'file-ops',
      name: 'File Ops',
      description: '未来用于文件读取、编辑、生成和重构。',
      category: 'filesystem',
      riskLevel: 'careful',
    }),
    new ToolDescriptor({
      id: 'shell-runner',
      name: 'Shell Runner',
      description: '未来用于执行终端命令，并受权限边界控制。',
      category: 'terminal',
      riskLevel: 'dangerous',
    }),
    new ToolDescriptor({
      id: 'search-index',
      name: 'Search Index',
      description: '未来用于代码搜索、符号检索与上下文召回。',
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
    ':config',
    ':clear',
    ':exit',
  ]
}

