export type AppStorageSource = 'default' | 'env' | 'settings'

export interface AppStorageSnapshot {
  dataRoot: string
  configPath: string
  sessionsDir: string
  source: AppStorageSource
  isCustom: boolean
}
