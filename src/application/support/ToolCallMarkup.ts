export const ADNIFY_TOOL_CALL_TAG = 'adnify_tool_call'

export interface ToolCallMarkup {
  name: string
  input: string
}

export function parseToolCallMarkup(content: string): ToolCallMarkup | null {
  const normalized = content.trim()
  const pattern = new RegExp(
    `^<${ADNIFY_TOOL_CALL_TAG}\\s+name="([^"]+)">([\\s\\S]*)<\\/${ADNIFY_TOOL_CALL_TAG}>$`,
  )
  const matched = pattern.exec(normalized)

  if (!matched) {
    return null
  }

  const [, name, input] = matched
  if (!name) {
    return null
  }

  return {
    name,
    input: decodeXmlEntities((input ?? '').trim()),
  }
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}
