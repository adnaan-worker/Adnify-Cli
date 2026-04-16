import { homedir } from 'node:os'
import { posix, win32 } from 'node:path'
import type { AppStorageSnapshot, AppStorageSource } from '../../application/dto/AppStorageSnapshot'
import { readStorageSettingsFile, type StorageSettingsFile } from './storageSettingsFile'

interface PlatformDirectories {
  settingsRoot: string
  defaultDataRoot: string
}

const WINDOWS_APP_NAME = 'Adnify-Cli'
const POSIX_APP_NAME = 'adnify-cli'
const STORAGE_SETTINGS_FILE = 'settings.json'
const CONFIG_FILE = 'config.json'
const SESSIONS_DIR = 'sessions'

export interface ResolveAppStorageOptions {
  env?: Record<string, string | undefined>
  platform?: NodeJS.Platform
}

export interface ResolvedAppStorage extends AppStorageSnapshot {
  settingsRoot: string
  settingsPath: string
}

export async function resolveAppStorage(
  options: ResolveAppStorageOptions = {},
): Promise<ResolvedAppStorage> {
  const env = options.env ?? process.env
  const platform = options.platform ?? process.platform
  const directories = resolvePlatformDirectories(env, platform)
  const pathModule = platform === 'win32' ? win32 : posix
  const settingsPath = pathModule.join(directories.settingsRoot, STORAGE_SETTINGS_FILE)

  const envOverride = normalizeStoragePath(env.ADNIFY_HOME, platform)
  if (envOverride) {
    return buildStorageSnapshot(directories.settingsRoot, settingsPath, envOverride, 'env', platform)
  }

  const settings = await readStorageSettings(settingsPath)
  const settingsOverride = normalizeStoragePath(settings.dataDirectory, platform)
  if (settingsOverride) {
    return buildStorageSnapshot(
      directories.settingsRoot,
      settingsPath,
      settingsOverride,
      'settings',
      platform,
    )
  }

  return buildStorageSnapshot(
    directories.settingsRoot,
    settingsPath,
    directories.defaultDataRoot,
    'default',
    platform,
  )
}

function buildStorageSnapshot(
  settingsRoot: string,
  settingsPath: string,
  dataRoot: string,
  source: AppStorageSource,
  platform: NodeJS.Platform,
): ResolvedAppStorage {
  const pathModule = platform === 'win32' ? win32 : posix

  return {
    settingsRoot,
    settingsPath,
    dataRoot,
    configPath: pathModule.join(dataRoot, CONFIG_FILE),
    sessionsDir: pathModule.join(dataRoot, SESSIONS_DIR),
    source,
    isCustom: source !== 'default',
  }
}

function resolvePlatformDirectories(
  env: Record<string, string | undefined>,
  platform: NodeJS.Platform,
): PlatformDirectories {
  const home = homedir()
  const pathModule = platform === 'win32' ? win32 : posix

  if (platform === 'win32') {
    const settingsBase = env.APPDATA || pathModule.join(home, 'AppData', 'Roaming')
    const dataBase = env.LOCALAPPDATA || settingsBase

    return {
      settingsRoot: pathModule.join(settingsBase, WINDOWS_APP_NAME),
      defaultDataRoot: pathModule.join(dataBase, WINDOWS_APP_NAME),
    }
  }

  if (platform === 'darwin') {
    const supportRoot = pathModule.join(home, 'Library', 'Application Support')
    return {
      settingsRoot: pathModule.join(supportRoot, WINDOWS_APP_NAME),
      defaultDataRoot: pathModule.join(supportRoot, WINDOWS_APP_NAME),
    }
  }

  const settingsBase = env.XDG_CONFIG_HOME || pathModule.join(home, '.config')
  const dataBase = env.XDG_DATA_HOME || pathModule.join(home, '.local', 'share')

  return {
    settingsRoot: pathModule.join(settingsBase, POSIX_APP_NAME),
    defaultDataRoot: pathModule.join(dataBase, POSIX_APP_NAME),
  }
}

export function normalizeStoragePath(
  input?: string,
  platform: NodeJS.Platform = process.platform,
): string | null {
  if (!input?.trim()) {
    return null
  }

  const pathModule = platform === 'win32' ? win32 : posix
  return pathModule.resolve(input.trim())
}

async function readStorageSettings(path: string): Promise<StorageSettingsFile> {
  return readStorageSettingsFile(path)
}
