import { describe, expect, test } from 'bun:test'
import {
  createCliCommandInputContent,
  createCliCommandOutputContent,
  createCliNoticeContent,
  parseCliTranscriptMarkup,
} from './CliTranscriptMarkup'

describe('CliTranscriptMarkup', () => {
  test('should round-trip command input markup', () => {
    const markup = createCliCommandInputContent('/model openai gpt-5')
    const parsed = parseCliTranscriptMarkup(markup)

    expect(parsed).toEqual({
      kind: 'command-input',
      content: '/model openai gpt-5',
    })
  })

  test('should preserve tone, title, and escaped content for command output', () => {
    const markup = createCliCommandOutputContent('line <one>\nline & two', {
      title: 'model',
      tone: 'warning',
    })
    const parsed = parseCliTranscriptMarkup(markup)

    expect(parsed).toEqual({
      kind: 'command-output',
      title: 'model',
      tone: 'warning',
      content: 'line <one>\nline & two',
    })
  })

  test('should parse notice markup', () => {
    const markup = createCliNoticeContent('ready', {
      title: 'status',
      tone: 'success',
    })
    const parsed = parseCliTranscriptMarkup(markup)

    expect(parsed).toEqual({
      kind: 'notice',
      title: 'status',
      tone: 'success',
      content: 'ready',
    })
  })
})
