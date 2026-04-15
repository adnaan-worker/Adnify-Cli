import { Box, Text } from 'ink'
import { memo } from 'react'
import { adnifyTheme } from '../theme'

export interface CommandSuggestionItem {
  command: string
  description: string
}

export interface CommandSuggestionListProps {
  items: CommandSuggestionItem[]
  selectedIndex: number
}

const MAX_VISIBLE_COMMANDS = 4

export const CommandSuggestionList = memo(function CommandSuggestionList(
  props: CommandSuggestionListProps,
) {
  if (props.items.length === 0) {
    return null
  }

  const startIndex = Math.max(
    0,
    Math.min(props.selectedIndex - (MAX_VISIBLE_COMMANDS - 1), props.items.length - MAX_VISIBLE_COMMANDS),
  )
  const visibleItems = props.items.slice(startIndex, startIndex + MAX_VISIBLE_COMMANDS)
  const hiddenCount = Math.max(0, props.items.length - visibleItems.length)

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      borderStyle="round"
      borderColor={adnifyTheme.borderMuted}
      paddingX={1}
    >
      {visibleItems.map((item, index) => {
        const selected = startIndex + index === props.selectedIndex

        return (
          <Box key={item.command} gap={1}>
            <Text color={selected ? adnifyTheme.brandStrong : adnifyTheme.textDim}>
              {selected ? '>' : '-'}
            </Text>
            <Text
              color={selected ? adnifyTheme.brand : adnifyTheme.textSecondary}
              backgroundColor={selected ? adnifyTheme.backgroundHint : undefined}
            >
              {' '}
              {item.command}
              {' '}
            </Text>
            <Text color={selected ? adnifyTheme.textPrimary : adnifyTheme.textMuted}>
              {item.description}
            </Text>
          </Box>
        )
      })}
      {hiddenCount > 0 ? <Text color={adnifyTheme.textDim}>... +{hiddenCount}</Text> : null}
    </Box>
  )
})
