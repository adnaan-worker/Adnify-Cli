import type { AppStorageSnapshot } from './AppStorageSnapshot'

export interface StorageSettingsSnapshot {
  effectiveStorage: AppStorageSnapshot
  settingsPath: string
  configuredDataRoot: string | null
}

export interface StorageSettingsUpdateResult extends StorageSettingsSnapshot {
  migratedConfig: boolean
  migratedSessions: boolean
  requiresRestart: boolean
}
