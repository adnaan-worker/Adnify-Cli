import { Box, Text } from 'ink'
import {
  parseCliTranscriptMarkup,
  type CliTranscriptPayload,
  type CliTranscriptTone,
} from '../../../application/support/CliTranscriptMarkup'
import type { ConversationMessage } from '../../../domain/session/entities/ConversationMessage'
import { adnifyTheme } from '../theme'
import { ActivityPulse } from './ActivityPulse'
import { Panel } from './Panel'

export interface ConversationViewportProps {
  messages: ConversationMessage[]
  streamingText?: string
  configInitPrompt?: string
}

function resolveToneColor(tone: CliTranscriptTone): string {
  switch (tone) {
    case 'info':
      return adnifyTheme.info
    case 'success':
      return adnifyTheme.success
    case 'warning':
      return adnifyTheme.warm
    case 'danger':
      return adnifyTheme.danger
    default:
      return adnifyTheme.borderActive
  }
}

function splitContent(content: string): string[] {
  const lines = content.split('\n')
  return lines.length > 0 ? lines : ['']
}

function BodyText(props: { content: string; color: string; indent?: number }) {
  const lines = splitContent(props.content)

  return (
    <Box flexDirection="column" marginLeft={props.indent ?? 0}>
      {lines.map((line, index) => (
        <Text key={`${index}-${line}`} color={props.color}>
          {line || ' '}
        </Text>
      ))}
    </Box>
  )
}

function PromptMessage(props: { content: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.user}>{'>'}</Text>
        <Text color={adnifyTheme.textPrimary}>{props.content}</Text>
      </Box>
    </Box>
  )
}

function AssistantMessageBlock(props: { content: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.brand}>adnify</Text>
        <Text color={adnifyTheme.textDim}>response</Text>
      </Box>
      <BodyText content={props.content} color={adnifyTheme.textPrimary} indent={2} />
    </Box>
  )
}

function SystemNotice(props: { content: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.textDim}>·</Text>
        <Text color={adnifyTheme.textSecondary}>notice</Text>
      </Box>
      <BodyText content={props.content} color={adnifyTheme.textMuted} indent={2} />
    </Box>
  )
}

function CommandInputRow(props: { content: string }) {
  return (
    <Box marginTop={1} gap={1}>
      <Text color={adnifyTheme.brandStrong}>/</Text>
      <Text color={adnifyTheme.brandSoft}>{props.content.replace(/^\//, '')}</Text>
    </Box>
  )
}

function CommandOutputBlock(props: {
  content: string
  title?: string
  tone: CliTranscriptTone
}) {
  const accentColor = resolveToneColor(props.tone)

  return (
    <Box marginTop={1}>
      <Text color={accentColor}>│</Text>
      <Box flexDirection="column" marginLeft={1}>
        <Box gap={1}>
          <Text color={accentColor}>{props.title ?? 'output'}</Text>
          <Text color={adnifyTheme.textDim}>local command</Text>
        </Box>
        <BodyText content={props.content} color={adnifyTheme.textSecondary} />
      </Box>
    </Box>
  )
}

function NoticeBlock(props: {
  content: string
  title?: string
  tone: CliTranscriptTone
}) {
  const accentColor = resolveToneColor(props.tone)

  return (
    <Box marginTop={1}>
      <Text color={accentColor}>•</Text>
      <Box flexDirection="column" marginLeft={1}>
        <Text color={accentColor}>{props.title ?? 'notice'}</Text>
        <BodyText content={props.content} color={adnifyTheme.textMuted} />
      </Box>
    </Box>
  )
}

function renderStructuredMessage(
  markup: CliTranscriptPayload,
  fallbackMessage: ConversationMessage,
) {
  switch (markup.kind) {
    case 'command-input':
      return <CommandInputRow content={markup.content} />
    case 'command-output':
      return (
        <CommandOutputBlock
          content={markup.content}
          title={markup.title}
          tone={markup.tone}
        />
      )
    case 'notice':
      return <NoticeBlock content={markup.content} title={markup.title} tone={markup.tone} />
    default:
      return <SystemNotice content={fallbackMessage.content} />
  }
}

function MessageBlock(props: { message: ConversationMessage }) {
  const structured = parseCliTranscriptMarkup(props.message.content)

  if (structured) {
    return renderStructuredMessage(structured, props.message)
  }

  switch (props.message.role) {
    case 'assistant':
      return <AssistantMessageBlock content={props.message.content} />
    case 'user':
      return <PromptMessage content={props.message.content} />
    case 'system':
    default:
      return <SystemNotice content={props.message.content} />
  }
}

function ConfigWizard(props: { prompt: string }) {
  const lines = props.prompt.split('\n')

  return (
    <Box flexDirection="column">
      {lines.map((line, index) => (
        <Text
          key={`${index}-${line}`}
          color={line.startsWith('  ') ? adnifyTheme.info : adnifyTheme.textSecondary}
        >
          {line}
        </Text>
      ))}
    </Box>
  )
}

function StreamingBlock(props: { text: string }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.brand}>adnify</Text>
        <ActivityPulse active color={adnifyTheme.brandStrong} idleFrame="*" />
        <Text color={adnifyTheme.textDim}>thinking</Text>
      </Box>
      <BodyText content={props.text} color={adnifyTheme.textPrimary} indent={2} />
    </Box>
  )
}

export function ConversationViewport(props: ConversationViewportProps) {
  const showConfigWizard = Boolean(props.configInitPrompt)

  return (
    <Panel
      title="Session"
      subtitle={showConfigWizard ? 'configuration' : undefined}
      accent={showConfigWizard ? 'warm' : 'muted'}
    >
      {showConfigWizard ? <ConfigWizard prompt={props.configInitPrompt ?? ''} /> : null}

      {!showConfigWizard && props.messages.length > 0
        ? props.messages.map((message) => <MessageBlock key={message.id} message={message} />)
        : null}

      {props.streamingText ? <StreamingBlock text={props.streamingText} /> : null}
    </Panel>
  )
}
