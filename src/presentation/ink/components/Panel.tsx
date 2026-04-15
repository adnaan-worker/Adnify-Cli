import { Box, Text } from 'ink'
import type { PropsWithChildren } from 'react'
import { adnifyTheme } from '../theme'

export interface PanelProps extends PropsWithChildren {
  title?: string
  subtitle?: string
  accent?: 'brand' | 'warm' | 'muted'
}

function resolveBorderColor(accent: PanelProps['accent']): string {
  switch (accent) {
    case 'brand':
      return adnifyTheme.borderActive
    case 'warm':
      return adnifyTheme.borderWarm
    default:
      return adnifyTheme.border
  }
}

function resolveTitleColor(accent: PanelProps['accent']): string {
  switch (accent) {
    case 'warm':
      return adnifyTheme.warm
    case 'brand':
      return adnifyTheme.brand
    default:
      return adnifyTheme.textSecondary
  }
}

export function Panel(props: PanelProps) {
  const borderColor = resolveBorderColor(props.accent)

  return (
    <Box
      width="100%"
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      paddingY={0}
    >
      {props.title || props.subtitle ? (
        <Box marginBottom={1} justifyContent="space-between">
          <Box flexGrow={1}>
            <Text color={resolveTitleColor(props.accent)} bold>
              {props.title ?? ''}
            </Text>
          </Box>
          {props.subtitle ? <Text color={adnifyTheme.textDim}>{props.subtitle}</Text> : null}
        </Box>
      ) : null}
      {props.children}
    </Box>
  )
}
