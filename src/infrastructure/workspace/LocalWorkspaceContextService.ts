import { access, readdir } from 'node:fs/promises'
import path from 'node:path'
import type { WorkspaceContextPort } from '../../application/ports/WorkspaceContextPort'
import { WorkspaceContext, type PackageManagerName } from '../../domain/workspace/entities/WorkspaceContext'

/**
 * 本地工作区探测器。
 * 负责把 Node 文件系统能力转换成领域可理解的工作区实体。
 */
export class LocalWorkspaceContextService implements WorkspaceContextPort {
  async inspect(rootPath: string): Promise<WorkspaceContext> {
    const entries = await readdir(rootPath, { withFileTypes: true })
    const topLevelEntries = entries
      .slice(0, 12)
      .map((entry) => entry.name)

    return new WorkspaceContext({
      rootPath,
      isGitRepository: await this.pathExists(path.join(rootPath, '.git')),
      packageManager: await this.detectPackageManager(rootPath),
      topLevelEntries,
    })
  }

  private async detectPackageManager(rootPath: string): Promise<PackageManagerName> {
    if (await this.pathExists(path.join(rootPath, 'bun.lockb'))) {
      return 'bun'
    }

    if (await this.pathExists(path.join(rootPath, 'bun.lock'))) {
      return 'bun'
    }

    if (await this.pathExists(path.join(rootPath, 'pnpm-lock.yaml'))) {
      return 'pnpm'
    }

    if (await this.pathExists(path.join(rootPath, 'yarn.lock'))) {
      return 'yarn'
    }

    if (await this.pathExists(path.join(rootPath, 'package-lock.json'))) {
      return 'npm'
    }

    return 'unknown'
  }

  private async pathExists(targetPath: string): Promise<boolean> {
    try {
      await access(targetPath)
      return true
    } catch {
      return false
    }
  }
}

