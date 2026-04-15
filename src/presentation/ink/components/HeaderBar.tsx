import { Box, Text } from 'ink'
import type { PackageManagerName } from '../../../domain/workspace/entities/WorkspaceContext'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import { adnifyTheme } from '../theme'
import { ActivityPulse } from './ActivityPulse'
import { Panel } from './Panel'
import { Wordmark } from './Wordmark'

export interface HeaderBarProps {
  appName: string
  author: string
  tagline: string
  workspaceName: string
  packageManager?: PackageManagerName
  isGitRepository?: boolean
  mode: AssistantMode
  modelLabel: string
  busy?: boolean
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

export function HeaderBar(props: HeaderBarProps) {
  const gitLabel = props.isGitRepository ? 'git tracked' : 'git detached'
  const gitColor = props.isGitRepository ? adnifyTheme.success : adnifyTheme.warm

  return (
    <Panel accent={props.busy ? 'brand' : 'muted'}>
      <Box width="100%" justifyContent="space-between">
        <Box flexDirection="column" flexGrow={1}>
          <Wordmark
            appName={props.appName}
            author={props.author}
            tagline={props.tagline}
            busy={props.busy}
          />
        </Box>

        <Box flexDirection="column" alignItems="flex-end" marginLeft={3}>
          <ModeBadge mode={props.mode} busy={props.busy} />
          <Box flexDirection="column" alignItems="flex-end" marginTop={1}>
            <Text color={adnifyTheme.textDim}>model</Text>
            <Text color={adnifyTheme.textSecondary}>{props.modelLabel}</Text>
          </Box>
        </Box>
      </Box>

      <Box width="100%" justifyContent="space-between" marginTop={1}>
        <Box gap={1}>
          <ActivityPulse active={props.busy} color={adnifyTheme.brandStrong} idleFrame="·" />
          <Text color={adnifyTheme.textDim}>workspace</Text>
          <Text color={adnifyTheme.textSecondary}>{props.workspaceName}</Text>
        </Box>

        <Box gap={2}>
          {props.packageManager ? (
            <Text color={adnifyTheme.brandSoft}>{props.packageManager}</Text>
          ) : null}
          {props.isGitRepository !== undefined ? (
            <Text color={gitColor}>{gitLabel}</Text>
          ) : null}
        </Box>
      </Box>
    </Panel>
  )
}
