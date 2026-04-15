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
}
