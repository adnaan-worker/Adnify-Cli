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
      borderColor={adnifyTheme.border}
      paddingX={1}
    >
      {props.items.map((item, index) => {
        const selected = index === props.selectedIndex

        return (
          <Box key={item.command} gap={2}>
            <Text color={selected ? adnifyTheme.brandStrong : adnifyTheme.textDim}>
              {selected ? '>' : ' '}
            </Text>
            <Text color={selected ? adnifyTheme.brand : adnifyTheme.textPrimary}>{item.command}</Text>
            <Text color={adnifyTheme.textMuted}>{item.description}</Text>
          </Box>
        )
      })}
    </Box>
  )
}
