export const CLI_COMMAND_INPUT_TAG = 'adnify-command'
export const CLI_COMMAND_OUTPUT_TAG = 'adnify-command-output'
export const CLI_NOTICE_TAG = 'adnify-notice'

export type CliTranscriptTone = 'default' | 'info' | 'success' | 'warning' | 'danger'

export type CliTranscriptPayload =
  | {
      kind: 'command-input'
      content: string
    }
  | {
      kind: 'command-output'
      content: string
      title?: string
      tone: CliTranscriptTone
    }
  | {
      kind: 'notice'
      content: string
      title?: string
      tone: CliTranscriptTone
    }

interface CliTranscriptAttributes {
  title?: string
  tone?: CliTranscriptTone
}

const tagMatchers = [
  { tag: CLI_COMMAND_INPUT_TAG, kind: 'command-input' as const },
  { tag: CLI_COMMAND_OUTPUT_TAG, kind: 'command-output' as const },
  { tag: CLI_NOTICE_TAG, kind: 'notice' as const },
]

export function createCliCommandInputContent(commandLine: string): string {
  return wrapMarkup(CLI_COMMAND_INPUT_TAG, commandLine.trim())
}

export function createCliCommandOutputContent(
  content: string,
  attributes: CliTranscriptAttributes = {},
): string {
  return wrapMarkup(CLI_COMMAND_OUTPUT_TAG, content, attributes)
}

export function createCliNoticeContent(
  content: string,
  attributes: CliTranscriptAttributes = {},
): string {
  return wrapMarkup(CLI_NOTICE_TAG, content, attributes)
}

export function parseCliTranscriptMarkup(content: string): CliTranscriptPayload | null {
  const normalized = content.trim()

  for (const matcher of tagMatchers) {
    const parsed = matchMarkup(normalized, matcher.tag)
    if (!parsed) {
      continue
    }

    if (matcher.kind === 'command-input') {
      return {
        kind: 'command-input',
        content: decodeXmlEntities(parsed.body).trim(),
      }
    }

    const tone = parseTone(parsed.attributes.tone)

    return {
      kind: matcher.kind,
      content: decodeXmlEntities(parsed.body),
      title: parsed.attributes.title ? decodeXmlEntities(parsed.attributes.title) : undefined,
      tone,
    }
  }

  return null
}

function wrapMarkup(tag: string, content: string, attributes: CliTranscriptAttributes = {}): string {
  const serializedAttributes = serializeAttributes(attributes)
  const openTag = serializedAttributes ? `<${tag} ${serializedAttributes}>` : `<${tag}>`

  return `${openTag}${encodeXmlEntities(content)}</${tag}>`
}

function serializeAttributes(attributes: CliTranscriptAttributes): string {
  return Object.entries(attributes)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}="${encodeXmlEntities(String(value))}"`)
    .join(' ')
}

function matchMarkup(
  content: string,
  tag: string,
): { body: string; attributes: Record<string, string> } | null {
  const pattern = new RegExp(`^<${tag}([^>]*)>([\\s\\S]*)<\\/${tag}>$`)
  const matched = pattern.exec(content)

  if (!matched) {
    return null
  }

  return {
    attributes: parseAttributes(matched[1] ?? ''),
    body: matched[2] ?? '',
  }
}

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const pattern = /([a-zA-Z0-9_-]+)="([^"]*)"/g

  let matched: RegExpExecArray | null = pattern.exec(source)
  while (matched) {
    const [, key, value] = matched
    if (key && value !== undefined) {
      attributes[key] = value
    }
    matched = pattern.exec(source)
  }

  return attributes
}

function parseTone(value: string | undefined): CliTranscriptTone {
  switch (value) {
    case 'info':
    case 'success':
    case 'warning':
    case 'danger':
      return value
    default:
      return 'default'
  }
}

function encodeXmlEntities(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function decodeXmlEntities(value: string): string {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&')
}
