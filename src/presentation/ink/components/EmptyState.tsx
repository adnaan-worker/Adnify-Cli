import { Box, Text } from 'ink'
import type { SessionListItem } from '../../../application/dto/SessionListItem'
import type { AppI18n } from '../../../application/i18n/AppI18n'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import type { PackageManagerName } from '../../../domain/workspace/entities/WorkspaceContext'
import { memo } from 'react'
import { adnifyTheme } from '../theme'
import { Panel } from './Panel'
import { Wordmark } from './Wordmark'

export interface EmptyStateProps {
  assistantName: string
  author: string
  tagline: string
  description: string
  workspaceName: string
  packageManager: PackageManagerName
  isGitRepository: boolean
  mode: AssistantMode
  modelLabel: string
  busy?: boolean
  commands: string[]
  currentSessionId: string
  recentSessions: SessionListItem[]
  i18n: AppI18n
}

function ModeBadge(props: { mode: AssistantMode; busy?: boolean }) {
  const color =
    props.mode === 'agent'
      ? adnifyTheme.brandStrong
      : props.mode === 'plan'
        ? adnifyTheme.warm
        : adnifyTheme.success

  return (
    <Text inverse color={color}>
      {' '}
      {props.mode.toUpperCase()}
      {props.busy ? ' LIVE' : ''}
      {' '}
    </Text>
  )
}

function MetaPill(props: { label: string; value: string; color?: string }) {
  return (
    <Text backgroundColor={adnifyTheme.backgroundHint}>
      {' '}
      <Text color={adnifyTheme.textDim}>{props.label}</Text>
      <Text color={props.color ?? adnifyTheme.textSecondary}>{props.value}</Text>
      {' '}
    </Text>
  )
}

function QuickCommandItem(props: { command: string }) {
  return (
    <Box gap={1}>
      <Text color={adnifyTheme.brandStrong}>{'>'}</Text>
      <Text color={adnifyTheme.textPrimary}>{props.command}</Text>
    </Box>
  )
}

function RecentSessionItem(props: {
  session: SessionListItem
  isCurrent: boolean
}) {
  const shortId = props.session.id.slice(0, 8)
  const color = props.isCurrent ? adnifyTheme.brand : adnifyTheme.textSecondary

  return (
    <Box gap={1}>
      <Text color={props.isCurrent ? adnifyTheme.brandStrong : adnifyTheme.textDim}>
        {props.isCurrent ? '*' : '-'}
      </Text>
      <Text color={color} wrap="truncate-end">
        [{shortId}] {props.session.title}
      </Text>
    </Box>
  )
}

export const EmptyState = memo(function EmptyState(props: EmptyStateProps) {
  const gitLabel = props.i18n.t(
    props.isGitRepository ? 'header.meta.gitTracked' : 'header.meta.gitDetached',
  )
  const gitColor = props.isGitRepository ? adnifyTheme.success : adnifyTheme.warm

  return (
    <Panel accent="brand">
      <Box width="100%" justifyContent="space-between" alignItems="flex-start">
        <Box flexDirection="column" flexGrow={1} marginRight={3}>
          <Wordmark
            appName={props.assistantName}
            author={props.author}
            tagline={props.tagline}
            busy={props.busy}
            i18n={props.i18n}
          />

          <Box flexDirection="column" marginTop={1}>
            <Text color={adnifyTheme.textMuted}>{props.description}</Text>
            <Text color={adnifyTheme.textDim}>{props.i18n.t('empty.hint')}</Text>
          </Box>

          <Box gap={1} marginTop={1}>
            <MetaPill label={props.i18n.t('header.meta.workspace')} value={props.workspaceName} />
            <MetaPill
              label={props.i18n.t('header.meta.package')}
              value={props.packageManager}
              color={adnifyTheme.brandSoft}
            />
            <MetaPill label={props.i18n.t('header.meta.git')} value={gitLabel} color={gitColor} />
          </Box>
        </Box>

        <Box width={34} flexDirection="column" flexShrink={0}>
          <Box alignItems="center" justifyContent="space-between">
            <Text color={adnifyTheme.textDim}>{props.i18n.t('empty.panelSession')}</Text>
            <ModeBadge mode={props.mode} busy={props.busy} />
          </Box>

          <Box
            flexDirection="column"
            marginTop={1}
            borderStyle="round"
            borderColor={adnifyTheme.borderMuted}
            paddingX={1}
          >
            <Text color={adnifyTheme.brandSoft}>{props.i18n.t('empty.panelQuickStart')}</Text>
            <Text color={adnifyTheme.textDim} wrap="truncate-end">
              {props.modelLabel}
            </Text>

            <Box flexDirection="column" marginTop={1}>
              {props.commands.slice(0, 4).map((command) => (
                <QuickCommandItem key={command} command={command} />
              ))}
            </Box>

            {props.recentSessions.length > 0 ? (
              <Box flexDirection="column" marginTop={1}>
                <Text color={adnifyTheme.textDim}>{props.i18n.t('empty.recentSessions')}</Text>
                {props.recentSessions.slice(0, 3).map((session) => (
                  <RecentSessionItem
                    key={session.id}
                    session={session}
                    isCurrent={session.id === props.currentSessionId}
                  />
                ))}
              </Box>
            ) : null}
          </Box>
        </Box>
      </Box>
    </Panel>
  )
})
