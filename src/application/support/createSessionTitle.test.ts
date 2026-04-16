import { describe, expect, test } from 'bun:test'
import { createSessionTitle } from './createSessionTitle'

describe('createSessionTitle', () => {
  test('should collapse multiline prompt into a compact title', () => {
    expect(createSessionTitle('  Fix login bug  \n\nin auth middleware ')).toBe(
      'Fix login bug in auth middleware',
    )
  })

  test('should truncate long prompt into a readable title', () => {
    expect(
      createSessionTitle(
        'Implement a complete workspace-aware persistent session management system with restore support',
      ),
    ).toBe('Implement a complete workspace-aware persistent...')
  })
})
