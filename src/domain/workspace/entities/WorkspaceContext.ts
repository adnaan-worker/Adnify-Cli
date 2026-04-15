export type PackageManagerName = 'bun' | 'npm' | 'pnpm' | 'yarn' | 'unknown'

export interface WorkspaceContextProps {
  rootPath: string
  isGitRepository: boolean
  packageManager: PackageManagerName
  topLevelEntries: string[]
}

/**
 * 工作区实体。
 * 它只表达当前工作区的结构信息，不承担任何 IO 细节。
 */
export class WorkspaceContext {
  constructor(private readonly props: WorkspaceContextProps) {}

  get rootPath(): string {
    return this.props.rootPath
  }

  get isGitRepository(): boolean {
    return this.props.isGitRepository
  }

  get packageManager(): PackageManagerName {
    return this.props.packageManager
  }

  get topLevelEntries(): string[] {
    return [...this.props.topLevelEntries]
  }

  toSummaryText(): string {
    return [
      '工作区摘要：',
      `- 根目录：${this.props.rootPath}`,
      `- Git 仓库：${this.props.isGitRepository ? '是' : '否'}`,
      `- 包管理器：${this.props.packageManager}`,
      `- 顶层条目：${this.props.topLevelEntries.join(', ') || '无'}`,
    ].join('\n')
  }
}
