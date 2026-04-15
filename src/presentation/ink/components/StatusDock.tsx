import { Box, Text } from 'ink'
import { adnifyTheme } from '../theme'
import { ActivityPulse } from './ActivityPulse'

export interface StatusDockProps {
  statusLine: string
  isBusy: boolean
  isConfigured: boolean
}

export function StatusDock(props: StatusDockProps) {
  if (!props.isBusy && props.isConfigured && props.statusLine === '运行时已就绪，可以开始交互。') {
    return null
  }

  const readinessLabel = props.isConfigured ? 'configured' : 'setup required'
  const readinessColor = props.isConfigured ? adnifyTheme.success : adnifyTheme.warm

  return (
    <Box width="100%" marginTop={1} justifyContent="space-between" paddingX={1}>
      <Box gap={1}>
        <ActivityPulse
          active={props.isBusy}
          color={props.isBusy ? adnifyTheme.brandStrong : adnifyTheme.textDim}
          idleFrame="·"
        />
        <Text color={props.isBusy ? adnifyTheme.textPrimary : adnifyTheme.textMuted}>{props.statusLine}</Text>
      </Box>
      <Text color={readinessColor}>system {readinessLabel}</Text>
    </Box>
  )
}
