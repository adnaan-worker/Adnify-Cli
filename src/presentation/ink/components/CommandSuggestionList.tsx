import { Box, Text } from 'ink'
import { adnifyTheme } from '../theme'

export interface CommandSuggestionItem {
  command: string
  description: string
}

export interface CommandSuggestionListProps {
  items: CommandSuggestionItem[]
  selectedIndex: number
}

export function CommandSuggestionList(props: CommandSuggestionListProps) {
  if (props.items.length === 0) {
    return null
  }

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      borderStyle="round"
      borderColor={adnifyTheme.borderMuted}
      paddingX={1}
    >
      {props.items.map((item, index) => {
        const selected = index === props.selectedIndex

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
    </Box>
  )
}
