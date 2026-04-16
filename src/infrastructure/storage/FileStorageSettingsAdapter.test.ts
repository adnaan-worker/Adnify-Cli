import { describe, expect, test } from 'bun:test'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { FileStorageSettingsAdapter } from './FileStorageSettingsAdapter'

describe('FileStorageSettingsAdapter', () => {
  test('should save a custom data directory and migrate config and sessions', async () => {
    const tempParent = join(process.cwd(), '.tmp')
    await mkdir(tempParent, { recursive: true })
    const root = await mkdtemp(join(tempParent, 'adnify-storage-'))
    const roamingRoot = join(root, 'roaming')
    const localRoot = join(root, 'local')
    const currentDataRoot = join(localRoot, 'Adnify-Cli')

    await mkdir(join(currentDataRoot, 'sessions'), { recursive: true })
    await writeFile(join(currentDataRoot, 'config.json'), '{"model":{"model":"gpt-5"}}\n', 'utf8')
    await writeFile(join(currentDataRoot, 'sessions', 'session-1.json'), '{"id":"session-1"}\n', 'utf8')

    const adapter = new FileStorageSettingsAdapter({
      env: {
        APPDATA: roamingRoot,
        LOCALAPPDATA: localRoot,
      },
      platform: 'win32',
    })

    const result = await adapter.setDataDirectory(join(root, 'custom-data'))

    expect(result.configuredDataRoot).toBe(join(root, 'custom-data'))
    expect(result.migratedConfig).toBe(true)
    expect(result.migratedSessions).toBe(true)

    const settingsRaw = await readFile(join(roamingRoot, 'Adnify-Cli', 'settings.json'), 'utf8')
    expect(JSON.parse(settingsRaw)).toEqual({
      dataDirectory: join(root, 'custom-data'),
    })

    const copiedConfig = await readFile(join(root, 'custom-data', 'config.json'), 'utf8')
    expect(copiedConfig).toContain('"gpt-5"')

    const copiedSession = await readFile(
      join(root, 'custom-data', 'sessions', 'session-1.json'),
      'utf8',
    )
    expect(copiedSession).toContain('"session-1"')
  })
})
