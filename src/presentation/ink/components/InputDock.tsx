import { Box, Text } from 'ink'
import type { AppI18n } from '../../../application/i18n/AppI18n'
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
  i18n: AppI18n
}

export function InputDock(props: InputDockProps) {
  return (
    <Panel
      title={props.isSuggestionOpen ? props.i18n.t('input.panelCommands') : props.i18n.t('input.panelConsole')}
      accent={props.busy ? 'brand' : 'muted'}
    >
      <Box width="100%" justifyContent="space-between" alignItems="center">
        <Box gap={1} alignItems="center">
          <ActivityPulse
            active={props.busy}
            color={props.busy ? adnifyTheme.brandStrong : adnifyTheme.textDim}
            idleFrame="*"
          />
          <Text color={adnifyTheme.textDim}>
            {props.isSuggestionOpen ? '/' : props.i18n.t('input.labelInput')}
          </Text>
        </Box>

        <Text color={adnifyTheme.textDim}>
          {props.isSuggestionOpen ? props.i18n.t('input.labelPalette') : props.mode}
        </Text>
      </Box>

      <Box marginTop={1} gap={1}>
        <Text color={props.busy ? adnifyTheme.brand : adnifyTheme.success}>{'>'}</Text>
        {props.value ? (
          <Text color={adnifyTheme.textPrimary}>{props.value}</Text>
        ) : props.busy ? (
          <Text color={adnifyTheme.textDim}>{' '}</Text>
        ) : (
          <Text color={adnifyTheme.textDim}>{props.i18n.t('input.placeholder')}</Text>
        )}
      </Box>

      {props.isSuggestionOpen ? (
        <Box flexDirection="column" marginTop={1}>
          <CommandSuggestionList
            items={props.commandSuggestions}
            selectedIndex={props.selectedSuggestionIndex}
          />
          <Text color={adnifyTheme.textDim}>{props.i18n.t('input.hintSuggestions')}</Text>
        </Box>
      ) : !props.busy ? (
        <Text color={adnifyTheme.textDim}>{props.i18n.t('input.hintDefault')}</Text>
      ) : null}
    </Panel>
  )
}
