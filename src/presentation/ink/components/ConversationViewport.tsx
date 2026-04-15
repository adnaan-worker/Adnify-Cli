import { Box, Text } from 'ink'
import type { ConversationMessage } from '../../../domain/session/entities/ConversationMessage'
import { adnifyTheme } from '../theme'
import { ActivityPulse } from './ActivityPulse'
import { Panel } from './Panel'

export interface ConversationViewportProps {
  messages: ConversationMessage[]
  streamingText?: string
  configInitPrompt?: string
}

function roleStyle(role: ConversationMessage['role']) {
  switch (role) {
    case 'assistant':
      return { label: 'AI', color: adnifyTheme.brand }
    case 'user':
      return { label: 'YOU', color: adnifyTheme.user }
    case 'system':
      return { label: 'SYS', color: adnifyTheme.warm }
    default:
      return { label: 'LOG', color: adnifyTheme.textSecondary }
  }
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function MessageBlock(props: { message: ConversationMessage }) {
  const style = roleStyle(props.message.role)

  return (
    <Box marginTop={1}>
      <Text color={adnifyTheme.borderMuted}>| </Text>
      <Box flexDirection="column">
        <Box gap={1}>
          <Text color={style.color}>{style.label}</Text>
          <Text color={adnifyTheme.textDim}>{formatTime(props.message.createdAt)}</Text>
        </Box>
        <Text color={adnifyTheme.textPrimary}>{props.message.content}</Text>
      </Box>
    </Box>
  )
}

function ConfigWizard(props: { prompt: string }) {
  const lines = props.prompt.split('\n')

  return (
    <Box flexDirection="column" marginTop={1}>
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
        <Text color={adnifyTheme.brand}>AI</Text>
        <ActivityPulse active color={adnifyTheme.brandStrong} idleFrame="·" />
        <Text color={adnifyTheme.textDim}>streaming response</Text>
      </Box>
      <Text color={adnifyTheme.textPrimary}>{props.text}</Text>
    </Box>
  )
}

export function ConversationViewport(props: ConversationViewportProps) {
  const showConfigWizard = Boolean(props.configInitPrompt)

  return (
    <Panel
      title="Session"
      subtitle={showConfigWizard ? 'configuration mode' : `${props.messages.length} messages`}
      accent={showConfigWizard ? 'warm' : 'muted'}
    >
      <Text color={adnifyTheme.textDim}>Adaptive stream, clean context, focused workflow.</Text>

      {showConfigWizard ? <ConfigWizard prompt={props.configInitPrompt ?? ''} /> : null}

      {!showConfigWizard && props.messages.length > 0
        ? props.messages.map((message) => <MessageBlock key={message.id} message={message} />)
        : null}

      {props.streamingText ? <StreamingBlock text={props.streamingText} /> : null}
    </Panel>
  )
}
