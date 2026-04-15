import { Box, Text } from 'ink'
import type { AppI18n } from '../../../application/i18n/AppI18n'
import { adnifyTheme } from '../theme'

export interface StatusDockProps {
  statusLine: string
  isBusy: boolean
  isConfigured: boolean
  i18n: AppI18n
}

export function StatusDock(props: StatusDockProps) {
  if (props.isBusy) {
    return null
  }

  const noiseStatusLines = new Set([
    props.i18n.t('status.runtimeReady'),
    props.i18n.t('status.responseCompleted'),
  ])

  if (props.isConfigured && noiseStatusLines.has(props.statusLine)) {
    return null
  }

  const readinessLabel = props.isConfigured
    ? props.i18n.t('status.configured')
    : props.i18n.t('status.setupRequired')
  const readinessColor = props.isConfigured ? adnifyTheme.success : adnifyTheme.warm

  return (
    <Box width="100%" marginTop={1} justifyContent="space-between" paddingX={1}>
      <Text color={adnifyTheme.textMuted}>{props.statusLine}</Text>
      <Text color={readinessColor}>
        {props.i18n.t('status.system')} {readinessLabel}
      </Text>
    </Box>
  )
}
