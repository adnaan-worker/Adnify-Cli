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

const MAX_VISIBLE_COMMANDS = 5

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
  const activeItem = props.items[props.selectedIndex] ?? props.items[0]
  const rangeStart = startIndex + 1
  const rangeEnd = startIndex + visibleItems.length

  return (
    <Box
      marginTop={1}
      borderStyle="round"
      borderColor={adnifyTheme.borderMuted}
      paddingX={1}
      paddingY={0}
      gap={1}
    >
      <Box flexDirection="column" width="50%">
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color={adnifyTheme.textDim}>commands</Text>
          <Text color={adnifyTheme.textDim}>
            {rangeStart}-{rangeEnd}/{props.items.length}
          </Text>
        </Box>

        {visibleItems.map((item, index) => {
          const selected = startIndex + index === props.selectedIndex
          const rowLabel = `${selected ? '>' : ' '} ${item.command}`

          return (
            <Box
              key={item.command}
              gap={1}
              paddingX={1}
              justifyContent="space-between"
            >
              <Text
                color={selected ? adnifyTheme.textPrimary : adnifyTheme.textSecondary}
                backgroundColor={selected ? adnifyTheme.backgroundHint : undefined}
              >
                {rowLabel}
              </Text>
              <Text color={selected ? adnifyTheme.brand : adnifyTheme.textDim}>
                {String(startIndex + index + 1).padStart(2, '0')}
              </Text>
            </Box>
          )
        })}

        {hiddenCount > 0 ? (
          <Text color={adnifyTheme.textDim}>+{hiddenCount} more</Text>
        ) : (
          <Text color={adnifyTheme.textDim}> </Text>
        )}
      </Box>

      <Box flexDirection="column" width="50%">
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={adnifyTheme.border}
          paddingX={1}
          minHeight={7}
        >
          <Text color={adnifyTheme.textDim}>preview</Text>
          <Text color={adnifyTheme.brand} bold>
            {activeItem.command}
          </Text>
          <Text color={adnifyTheme.textSecondary}>{activeItem.description}</Text>
        </Box>
      </Box>
    </Box>
  )
})
