import { Box, Text } from 'ink'
import type { AppI18n } from '../../../application/i18n/AppI18n'
import { adnifyTheme } from '../theme'
import { MascotGlyph } from './MascotGlyph'

export interface WordmarkProps {
  appName: string
  author: string
  tagline: string
  busy?: boolean
  i18n: AppI18n
}

export function Wordmark(props: WordmarkProps) {
  return (
    <Box gap={1} alignItems="flex-start">
      <MascotGlyph active={props.busy} />
      <Box flexDirection="column">
        <Box gap={1}>
          <Text color={adnifyTheme.brandSoft} bold>
            {props.appName}
          </Text>
          <Text color={adnifyTheme.textDim}>
            {props.i18n.t('common.by')} {props.author}
          </Text>
        </Box>
        <Text color={adnifyTheme.textSecondary}>{props.tagline}</Text>
      </Box>
    </Box>
  )
}
