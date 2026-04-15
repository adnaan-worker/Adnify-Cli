import { Box, Text } from 'ink'
import { adnifyTheme } from '../theme'
import { MascotGlyph } from './MascotGlyph'

export interface WordmarkProps {
  appName: string
  author: string
  tagline: string
  busy?: boolean
}

export function Wordmark(props: WordmarkProps) {
  return (
    <Box gap={1} alignItems="center">
      <MascotGlyph active={props.busy} />
      <Box flexDirection="column">
        <Box gap={1}>
          <Text color={adnifyTheme.brandSoft} bold>
            {props.appName}
          </Text>
          <Text color={adnifyTheme.textDim}>by {props.author}</Text>
        </Box>
        <Text color={adnifyTheme.textSecondary}>{props.tagline}</Text>
      </Box>
    </Box>
  )
}
