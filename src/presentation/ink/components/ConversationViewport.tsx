import { Box, Text } from 'ink'
import type { AppI18n } from '../../../application/i18n/AppI18n'
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
  i18n: AppI18n
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

function AssistantMessageBlock(props: { content: string; i18n: AppI18n }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.brand}>adnify</Text>
        <Text color={adnifyTheme.textDim}>{props.i18n.t('conversation.response')}</Text>
      </Box>
      <BodyText content={props.content} color={adnifyTheme.textPrimary} indent={2} />
    </Box>
  )
}

function SystemNotice(props: { content: string; i18n: AppI18n }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.textDim}>*</Text>
        <Text color={adnifyTheme.textSecondary}>{props.i18n.t('conversation.notice')}</Text>
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
  i18n: AppI18n
}) {
  const accentColor = resolveToneColor(props.tone)

  return (
    <Box marginTop={1}>
      <Text color={accentColor}>{'|'}</Text>
      <Box flexDirection="column" marginLeft={1}>
        <Box gap={1}>
          <Text color={accentColor}>{props.title ?? props.i18n.t('conversation.output')}</Text>
          <Text color={adnifyTheme.textDim}>{props.i18n.t('conversation.localCommand')}</Text>
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
  i18n: AppI18n
}) {
  const accentColor = resolveToneColor(props.tone)

  return (
    <Box marginTop={1}>
      <Text color={accentColor}>{'~'}</Text>
      <Box flexDirection="column" marginLeft={1}>
        <Text color={accentColor}>{props.title ?? props.i18n.t('conversation.notice')}</Text>
        <BodyText content={props.content} color={adnifyTheme.textMuted} />
      </Box>
    </Box>
  )
}

function renderStructuredMessage(
  markup: CliTranscriptPayload,
  fallbackMessage: ConversationMessage,
  i18n: AppI18n,
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
          i18n={i18n}
        />
      )
    case 'notice':
      return (
        <NoticeBlock content={markup.content} title={markup.title} tone={markup.tone} i18n={i18n} />
      )
    default:
      return <SystemNotice content={fallbackMessage.content} i18n={i18n} />
  }
}

function MessageBlock(props: { message: ConversationMessage; i18n: AppI18n }) {
  const structured = parseCliTranscriptMarkup(props.message.content)

  if (structured) {
    return renderStructuredMessage(structured, props.message, props.i18n)
  }

  switch (props.message.role) {
    case 'assistant':
      return <AssistantMessageBlock content={props.message.content} i18n={props.i18n} />
    case 'user':
      return <PromptMessage content={props.message.content} />
    case 'system':
    default:
      return <SystemNotice content={props.message.content} i18n={props.i18n} />
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

function StreamingBlock(props: { text: string; i18n: AppI18n }) {
  return (
    <Box flexDirection="column" marginTop={1}>
      <Box gap={1}>
        <Text color={adnifyTheme.brand}>adnify</Text>
        <ActivityPulse active color={adnifyTheme.brandStrong} idleFrame="*" />
        <Text color={adnifyTheme.textDim}>{props.i18n.t('conversation.thinking')}</Text>
      </Box>
      <BodyText content={props.text} color={adnifyTheme.textPrimary} indent={2} />
    </Box>
  )
}

export function ConversationViewport(props: ConversationViewportProps) {
  const showConfigWizard = Boolean(props.configInitPrompt)

  return (
    <Panel
      title={props.i18n.t('conversation.panelSession')}
      subtitle={showConfigWizard ? props.i18n.t('conversation.panelConfiguration') : undefined}
      accent={showConfigWizard ? 'warm' : 'muted'}
    >
      {showConfigWizard ? <ConfigWizard prompt={props.configInitPrompt ?? ''} /> : null}

      {!showConfigWizard && props.messages.length > 0
        ? props.messages.map((message) => (
            <MessageBlock key={message.id} message={message} i18n={props.i18n} />
          ))
        : null}

      {props.streamingText ? <StreamingBlock text={props.streamingText} i18n={props.i18n} /> : null}
    </Panel>
  )
}
