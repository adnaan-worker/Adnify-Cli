import { copyFile, cp, mkdir, stat } from 'node:fs/promises'
import { join as posixJoin } from 'node:path/posix'
import { join as win32Join } from 'node:path/win32'
import type {
  StorageSettingsSnapshot,
  StorageSettingsUpdateResult,
} from '../../application/dto/StorageSettingsSnapshot'
import type { StorageSettingsPort } from '../../application/ports/StorageSettingsPort'
import {
  normalizeStoragePath,
  resolveAppStorage,
  type ResolveAppStorageOptions,
} from './resolveAppStorage'
import { readStorageSettingsFile, writeStorageSettingsFile } from './storageSettingsFile'

const CONFIG_FILE = 'config.json'
const SESSIONS_DIR = 'sessions'

function storageJoin(platform: NodeJS.Platform, ...parts: string[]): string {
  return platform === 'win32' ? win32Join(...parts) : posixJoin(...parts)
}

/**
 * 在非 Windows 主机上跑「platform: win32」单测时，settings 里可能出现反斜杠路径；
 * Node 文件 API 需要转成 POSIX 才能命中真实目录。
 */
function toHostFilesystemPath(pathValue: string): string {
  if (process.platform === 'win32') {
    return pathValue
  }

  return pathValue.replace(/\\/g, '/')
}

function joinForFilesystem(...parts: string[]): string {
  return process.platform === 'win32' ? win32Join(...parts) : posixJoin(...parts)
}

export class FileStorageSettingsAdapter implements StorageSettingsPort {
  constructor(private readonly options: ResolveAppStorageOptions = {}) {}

  async inspect(): Promise<StorageSettingsSnapshot> {
    const storage = await resolveAppStorage(this.options)
    const settings = await readStorageSettingsFile(storage.settingsPath)
    const rawConfigured = settings.dataDirectory?.trim()
    const hostSafeConfigured = rawConfigured ? toHostFilesystemPath(rawConfigured) : undefined

    return {
      effectiveStorage: storage,
      settingsPath: storage.settingsPath,
      /** 始终按本机 OS 解析路径；`options.platform` 只用于 `resolveAppStorage` 布局模拟，不能参与 normalize。 */
      configuredDataRoot: normalizeStoragePath(hostSafeConfigured, process.platform) ?? null,
    }
  }

  async setDataDirectory(path: string): Promise<StorageSettingsUpdateResult> {
    const current = await resolveAppStorage(this.options)
    const nextDataRoot = normalizeStoragePath(path.trim(), process.platform)

    if (!nextDataRoot) {
      throw new Error('Storage path is required')
    }

    /** 在 macOS/Linux 上必须把反斜杠规范成 POSIX，否则 resolve 会把路径接到 cwd 下，污染仓库目录。 */
    const persistedDataDirectory = toHostFilesystemPath(nextDataRoot)

    await writeStorageSettingsFile(current.settingsPath, {
      dataDirectory: persistedDataDirectory,
    })

    const migration = await migrateStorageContents(
      current.dataRoot,
      persistedDataDirectory,
      this.options.platform,
    )
    const snapshot = await this.inspect()

    return {
      ...snapshot,
      ...migration,
      requiresRestart: true,
    }
  }

  async resetDataDirectory(): Promise<StorageSettingsUpdateResult> {
    const current = await resolveAppStorage(this.options)

    await writeStorageSettingsFile(current.settingsPath, {})

    const snapshot = await this.inspect()

    return {
      ...snapshot,
      migratedConfig: false,
      migratedSessions: false,
      requiresRestart: true,
    }
  }
}

async function migrateStorageContents(
  currentDataRoot: string,
  nextDataRoot: string,
  platform: NodeJS.Platform = process.platform,
): Promise<Pick<StorageSettingsUpdateResult, 'migratedConfig' | 'migratedSessions'>> {
  if (samePath(currentDataRoot, nextDataRoot, platform)) {
    return {
      migratedConfig: false,
      migratedSessions: false,
    }
  }

  const srcRoot = toHostFilesystemPath(currentDataRoot)
  const dstRoot = toHostFilesystemPath(nextDataRoot)

  await mkdir(dstRoot, { recursive: true })

  const sourceConfigPath = joinForFilesystem(srcRoot, CONFIG_FILE)
  const targetConfigPath = joinForFilesystem(dstRoot, CONFIG_FILE)
  const sourceSessionsPath = joinForFilesystem(srcRoot, SESSIONS_DIR)
  const targetSessionsPath = joinForFilesystem(dstRoot, SESSIONS_DIR)

  const configCanCopy = await pathExists(sourceConfigPath)
  const configAlreadyExists = await pathExists(targetConfigPath)
  let migratedConfig = false

  if (configCanCopy && !configAlreadyExists) {
    await copyFile(sourceConfigPath, targetConfigPath)
    migratedConfig = true
  }

  const sessionsCanCopy = await pathExists(sourceSessionsPath)
  const sessionsAlreadyExist = await pathExists(targetSessionsPath)
  let migratedSessions = false

  if (sessionsCanCopy && !sessionsAlreadyExist) {
    await cp(sourceSessionsPath, targetSessionsPath, { recursive: true })
    migratedSessions = true
  }

  return {
    migratedConfig,
    migratedSessions,
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function samePath(
  left: string,
  right: string,
  platform: NodeJS.Platform = process.platform,
): boolean {
  const normalizedLeft = normalizeStoragePath(left, platform)
  const normalizedRight = normalizeStoragePath(right, platform)

  if (!normalizedLeft || !normalizedRight) {
    return false
  }

  if (platform === 'win32') {
    return normalizedLeft.toLowerCase() === normalizedRight.toLowerCase()
  }

  return normalizedLeft === normalizedRight
}
