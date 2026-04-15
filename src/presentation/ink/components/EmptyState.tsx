import { Box, Text } from 'ink'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import type { PackageManagerName } from '../../../domain/workspace/entities/WorkspaceContext'
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

export function EmptyState(props: EmptyStateProps) {
  const gitLabel = props.isGitRepository ? 'tracked' : 'detached'
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
          />

          <Box flexDirection="column" marginTop={1}>
            <Text color={adnifyTheme.textMuted}>{props.description}</Text>
            <Text color={adnifyTheme.textDim}>
              Start with a goal, a file, or `/` for the command panel.
            </Text>
          </Box>

          <Box gap={1} marginTop={1}>
            <MetaPill label="workspace " value={props.workspaceName} />
            <MetaPill
              label="pkg "
              value={props.packageManager}
              color={adnifyTheme.brandSoft}
            />
            <MetaPill label="git " value={gitLabel} color={gitColor} />
          </Box>
        </Box>

        <Box width={34} flexDirection="column" flexShrink={0}>
          <Box alignItems="center" justifyContent="space-between">
            <Text color={adnifyTheme.textDim}>session</Text>
            <ModeBadge mode={props.mode} busy={props.busy} />
          </Box>

          <Box
            flexDirection="column"
            marginTop={1}
            borderStyle="round"
            borderColor={adnifyTheme.borderMuted}
            paddingX={1}
          >
            <Text color={adnifyTheme.brandSoft}>Quick start</Text>
            <Text color={adnifyTheme.textDim} wrap="truncate-end">
              {props.modelLabel}
            </Text>

            <Box flexDirection="column" marginTop={1}>
              {props.commands.slice(0, 4).map((command) => (
                <QuickCommandItem key={command} command={command} />
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
    </Panel>
  )
}
