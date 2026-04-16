import type {
  StorageSettingsSnapshot,
  StorageSettingsUpdateResult,
} from '../dto/StorageSettingsSnapshot'

export interface StorageSettingsPort {
  inspect(): Promise<StorageSettingsSnapshot>
  setDataDirectory(path: string): Promise<StorageSettingsUpdateResult>
  resetDataDirectory(): Promise<StorageSettingsUpdateResult>
}
