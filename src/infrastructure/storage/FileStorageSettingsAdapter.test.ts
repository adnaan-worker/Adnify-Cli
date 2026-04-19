import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { join as posixJoin } from 'node:path/posix'
import { join as win32Join } from 'node:path/win32'
import { FileStorageSettingsAdapter } from './FileStorageSettingsAdapter'
import { normalizeStoragePath, resolveAppStorage } from './resolveAppStorage'

function storageJoin(platform: NodeJS.Platform, ...parts: string[]): string {
  return platform === 'win32' ? win32Join(...parts) : posixJoin(...parts)
}

function toHostFsPath(pathValue: string): string {
  if (process.platform === 'win32') {
    return pathValue
  }

  return pathValue.replace(/\\/g, '/')
}

describe('FileStorageSettingsAdapter', () => {
  test('should save a custom data directory and migrate config and sessions', async () => {
    const tempParent = join(process.cwd(), '.tmp')
    await mkdir(tempParent, { recursive: true })
    const root = await mkdtemp(join(tempParent, 'adnify-storage-'))
    const roamingRoot = join(root, 'roaming')
    const localRoot = join(root, 'local')

    const resolveOpts = {
      env: {
        APPDATA: roamingRoot,
        LOCALAPPDATA: localRoot,
      },
      platform: 'win32' as const,
    }

    const initialStorage = await resolveAppStorage(resolveOpts)
    const currentDataRoot = initialStorage.dataRoot
    const fixtureRoot = toHostFsPath(currentDataRoot)

    await mkdir(posixJoin(fixtureRoot, 'sessions'), { recursive: true })
    await writeFile(posixJoin(fixtureRoot, 'config.json'), '{"model":{"model":"gpt-5"}}\n', 'utf8')
    await writeFile(
      posixJoin(fixtureRoot, 'sessions', 'session-1.json'),
      '{"id":"session-1"}\n',
      'utf8',
    )

    const adapter = new FileStorageSettingsAdapter(resolveOpts)

    const customDataPath = join(root, 'custom-data')
    const result = await adapter.setDataDirectory(customDataPath)
    const expectedDataRoot = normalizeStoragePath(customDataPath, 'win32')
    if (expectedDataRoot == null) {
      throw new Error('normalizeStoragePath returned null')
    }

    const expectedPersisted =
      process.platform === 'win32' ? expectedDataRoot : toHostFsPath(expectedDataRoot)

    expect(result.configuredDataRoot).toBe(expectedPersisted)
    expect(result.migratedConfig).toBe(true)
    expect(result.migratedSessions).toBe(true)

    const settingsRaw = await readFile(
      storageJoin('win32', roamingRoot, 'Adnify-Cli', 'settings.json'),
      'utf8',
    )
    expect(JSON.parse(settingsRaw)).toEqual({
      dataDirectory: expectedPersisted,
    })

    const copiedConfig = await readFile(posixJoin(expectedPersisted, 'config.json'), 'utf8')
    expect(copiedConfig).toContain('"gpt-5"')

    const copiedSession = await readFile(
      posixJoin(expectedPersisted, 'sessions', 'session-1.json'),
      'utf8',
    )
    expect(copiedSession).toContain('"session-1"')
  })
})
