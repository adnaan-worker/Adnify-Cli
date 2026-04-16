import { Box, Text } from 'ink'
import type { AppI18n } from '../../../application/i18n/AppI18n'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import { memo } from 'react'
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
  configInitPrompt?: string
  commandSuggestions: CommandSuggestionItem[]
  selectedSuggestionIndex: number
  isSuggestionOpen: boolean
  i18n: AppI18n
}

export const InputDock = memo(function InputDock(props: InputDockProps) {
  const isConfigActive = Boolean(props.configInitPrompt)
  const configPromptLines = props.configInitPrompt?.split('\n') ?? []

  return (
    <Panel
      title={
        isConfigActive
          ? props.i18n.t('input.panelSetup')
          : props.isSuggestionOpen
            ? props.i18n.t('input.panelCommands')
            : props.i18n.t('input.panelConsole')
      }
      accent={props.busy ? 'brand' : 'muted'}
    >
      <Box width="100%" justifyContent="space-between" alignItems="center">
        <Box gap={1} alignItems="center">
          <ActivityPulse
            active={props.busy}
            animated={props.busy}
            color={props.busy ? adnifyTheme.brandStrong : adnifyTheme.textDim}
            idleFrame="·  "
          />
          <Text color={adnifyTheme.textDim}>
            {isConfigActive
              ? props.i18n.t('input.labelSetup')
              : props.isSuggestionOpen
                ? '/'
                : props.i18n.t('input.labelInput')}
          </Text>
        </Box>

        <Text color={adnifyTheme.textDim}>
          {isConfigActive
            ? props.i18n.t('input.labelSetupMode')
            : props.isSuggestionOpen
              ? props.i18n.t('input.labelPalette')
              : props.mode}
        </Text>
      </Box>

      {isConfigActive ? (
        <Box
          flexDirection="column"
          marginTop={1}
          borderStyle="round"
          borderColor={adnifyTheme.borderMuted}
          paddingX={1}
        >
          {configPromptLines.map((line, index) => (
            <Text
              key={`config-prompt-${index}`}
              color={
                line.startsWith('  ')
                  ? adnifyTheme.info
                  : line.toLowerCase().includes('error')
                    ? adnifyTheme.danger
                    : adnifyTheme.textSecondary
              }
            >
              {line || ' '}
            </Text>
          ))}
        </Box>
      ) : null}

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
      ) : isConfigActive ? (
        <Text color={adnifyTheme.textDim}>{props.i18n.t('input.hintConfigInit')}</Text>
      ) : !props.busy ? (
        <Text color={adnifyTheme.textDim}>{props.i18n.t('input.hintDefault')}</Text>
      ) : null}
    </Panel>
  )
})
