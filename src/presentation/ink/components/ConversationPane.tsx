import { Box, Text } from 'ink'
import type { ConversationMessage } from '../../../domain/session/entities/ConversationMessage'

export interface ConversationPaneProps {
  messages: ConversationMessage[]
}

function getRoleColor(role: ConversationMessage['role']): string {
  switch (role) {
    case 'assistant':
      return 'green'
    case 'user':
      return 'cyan'
    case 'system':
      return 'yellow'
    default:
      return 'white'
  }
}

function getRoleLabel(role: ConversationMessage['role']): string {
  switch (role) {
    case 'assistant':
      return 'ASSISTANT'
    case 'user':
      return 'USER'
    case 'system':
      return 'SYSTEM'
    default:
      return 'UNKNOWN'
  }
}

export function ConversationPane(props: ConversationPaneProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1} marginBottom={1}>
      <Text bold>Conversation</Text>
      {props.messages.length === 0 ? (
        <Text dimColor>还没有消息，试试输入一个问题或者执行 :help。</Text>
      ) : (
        props.messages.map((message) => (
          <Box key={message.id} flexDirection="column" marginTop={1}>
            <Text color={getRoleColor(message.role)}>
              [{getRoleLabel(message.role)}] {message.createdAt.toLocaleTimeString()}
            </Text>
            <Text>{message.content}</Text>
          </Box>
        ))
      )}
    </Box>
  )
}

