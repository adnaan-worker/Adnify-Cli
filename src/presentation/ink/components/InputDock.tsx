import { Box, Text } from 'ink'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import { adnifyTheme } from '../theme'
import type { CommandSuggestionItem } from './CommandSuggestionList'
import { ActivityPulse } from './ActivityPulse'
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
    return '正在处理当前任务，请稍候…'
  }

  return '输入任务、需求或命令，按 Enter 发送；输入 / 或 : 可快速查看命令'
}

export function InputDock(props: InputDockProps) {
  return (
    <Panel title="Prompt" accent={props.busy ? 'brand' : 'muted'}>
      <Box gap={1}>
        <ActivityPulse
          active={props.busy}
          color={props.busy ? adnifyTheme.brandStrong : adnifyTheme.textDim}
          idleFrame="·"
        />
        <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.textMuted}>
          {props.busy ? 'responding' : 'ready'}
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text color={adnifyTheme.textPrimary}>
          <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.success}>{props.busy ? '...' : '>'} </Text>
          {props.value ? props.value : <Text color={adnifyTheme.textDim}>{placeholderText(props.busy)}</Text>}
        </Text>
      </Box>

      {props.isSuggestionOpen ? (
        <Box flexDirection="column" marginTop={1}>
          <CommandSuggestionList
            items={props.commandSuggestions}
            selectedIndex={props.selectedSuggestionIndex}
          />
          <Text color={adnifyTheme.textDim}>Up/Down 选择 · Tab 补全 · Enter 执行</Text>
        </Box>
      ) : (
        <Text color={adnifyTheme.textDim}>Enter 发送 · `/` 命令面板</Text>
      )}
    </Panel>
  )
}
