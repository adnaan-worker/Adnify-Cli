import { describe, expect, test } from 'bun:test'
import { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import { PromptBundleNativeToolRegistry } from './PromptBundleNativeToolRegistry'

describe('PromptBundleNativeToolRegistry', () => {
  test('filters catalog to ids with native implementations', () => {
    const registry = new PromptBundleNativeToolRegistry()
    const out = registry.resolveExecutableCatalog([
      new ToolDescriptor({
        id: 'workspace-read',
        name: 'W',
        description: 'd',
        category: 'c',
        riskLevel: 'safe',
      }).toPlainObject(),
      new ToolDescriptor({
        id: 'unknown-tool',
        name: 'U',
        description: 'd',
        category: 'c',
        riskLevel: 'safe',
      }).toPlainObject(),
    ])

    expect(out).toHaveLength(1)
    expect(out[0]?.id).toBe('workspace-read')
  })
})
