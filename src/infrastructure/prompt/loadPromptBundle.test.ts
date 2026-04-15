import { describe, expect, test } from 'bun:test'
import { loadPromptBundle } from './loadPromptBundle'

describe('loadPromptBundle', () => {
  test('should load profile, prompt set, tools, and commands from markdown assets', async () => {
    const bundle = await loadPromptBundle()

    expect(bundle.profile.name).toBe('Adnify-Cli')
    expect(bundle.profile.defaultMode).toBe('agent')
    expect(bundle.promptSet.core).toContain('You are Adnify')
    expect(bundle.promptSet.modes.agent).toContain('agent mode')
    expect(bundle.toolCatalog).toHaveLength(4)
    expect(bundle.toolCatalog[0]?.name).toBe('Workspace Read')
    expect(bundle.localCommands).toContain(':help')
    expect(bundle.localCommands).toContain(':config init')
  })
})
