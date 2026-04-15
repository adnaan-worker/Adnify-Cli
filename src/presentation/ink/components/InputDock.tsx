import { Box, Text } from 'ink'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import { adnifyTheme } from '../theme'
import { ActivityPulse } from './ActivityPulse'
import type { CommandSuggestionItem } from './CommandSuggestionList'
import { CommandSuggestionList } from './CommandSuggestionList'
import { Panel } from './Panel'

export interface InputDockProps {
  value: string
  busy: boolean
  mode: AssistantMode
  modelLabel: string
  commandSuggestions: CommandSuggestionItem[]
  selectedSuggestionIndex: number
  isSuggestionOpen: boolean
}

function placeholderText(busy: boolean): string {
  if (busy) {
    return 'Working on the current task...'
  }

  return 'Describe the task, or type / to open commands.'
}

export function InputDock(props: InputDockProps) {
  return (
    <Panel title="Console" accent={props.busy ? 'brand' : 'muted'}>
      <Box width="100%" justifyContent="space-between" alignItems="center">
        <Box gap={1}>
          <ActivityPulse
            active={props.busy}
            color={props.busy ? adnifyTheme.brandStrong : adnifyTheme.textDim}
            idleFrame="*"
          />
          <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.textMuted}>
            {props.busy ? 'responding' : 'ready'}
          </Text>
        </Box>

        <Text color={adnifyTheme.textDim}>
          {props.isSuggestionOpen ? 'command palette' : `mode ${props.mode}`}
        </Text>
      </Box>

      <Box marginTop={1}>
        <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.success}>{props.busy ? '...' : '>'}</Text>
        <Text> </Text>
        {props.value ? (
          <Text color={adnifyTheme.textPrimary}>{props.value}</Text>
        ) : (
          <Text color={adnifyTheme.textDim}>{placeholderText(props.busy)}</Text>
        )}
      </Box>

      {props.isSuggestionOpen ? (
        <Box flexDirection="column" marginTop={1}>
          <CommandSuggestionList
            items={props.commandSuggestions}
            selectedIndex={props.selectedSuggestionIndex}
          />
          <Text color={adnifyTheme.textDim}>Up/Down select  Tab complete  Enter run</Text>
        </Box>
      ) : (
        <Text color={adnifyTheme.textDim} wrap="truncate-end">
          Enter to send. Model: {props.modelLabel}
        </Text>
      )}
    </Panel>
  )
}
