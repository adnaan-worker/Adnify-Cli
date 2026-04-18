import { describe, expect, test } from 'bun:test'
import { parseToolCallMarkup } from './ToolCallMarkup'

describe('ToolCallMarkup', () => {
  test('should parse tool call markup', () => {
    expect(
      parseToolCallMarkup(
        '<adnify_tool_call name="search-index">{"query":"useCliController"}</adnify_tool_call>',
      ),
    ).toEqual({
      name: 'search-index',
      input: '{"query":"useCliController"}',
    })
  })

  test('should return null for normal assistant text', () => {
    expect(parseToolCallMarkup('Here is the answer.')).toBeNull()
  })
})
