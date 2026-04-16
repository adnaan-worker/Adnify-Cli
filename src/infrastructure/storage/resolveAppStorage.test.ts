import { describe, expect, test } from 'bun:test'
import { resolveAppStorage } from './resolveAppStorage'

describe('resolveAppStorage', () => {
  test('should prefer ADNIFY_HOME when provided', async () => {
    const storage = await resolveAppStorage({
      platform: 'win32',
      env: {
        ADNIFY_HOME: 'D:\\AdnifyData',
        APPDATA: 'C:\\Users\\dev\\AppData\\Roaming',
        LOCALAPPDATA: 'C:\\Users\\dev\\AppData\\Local',
      },
    })

    expect(storage.dataRoot).toBe('D:\\AdnifyData')
    expect(storage.configPath).toBe('D:\\AdnifyData\\config.json')
    expect(storage.sessionsDir).toBe('D:\\AdnifyData\\sessions')
    expect(storage.source).toBe('env')
    expect(storage.isCustom).toBe(true)
  })

  test('should use XDG data directories on linux by default', async () => {
    const storage = await resolveAppStorage({
      platform: 'linux',
      env: {
        HOME: '/home/dev',
        XDG_CONFIG_HOME: '/home/dev/.config',
        XDG_DATA_HOME: '/mnt/data/dev-share',
      },
    })

    expect(storage.dataRoot).toBe('/mnt/data/dev-share/adnify-cli')
    expect(storage.configPath).toBe('/mnt/data/dev-share/adnify-cli/config.json')
    expect(storage.sessionsDir).toBe('/mnt/data/dev-share/adnify-cli/sessions')
    expect(storage.source).toBe('default')
    expect(storage.isCustom).toBe(false)
  })
})
