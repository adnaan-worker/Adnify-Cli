import { Box, Text } from 'ink'
import type { PackageManagerName } from '../../../domain/workspace/entities/WorkspaceContext'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
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

export function EmptyState(props: EmptyStateProps) {
  const gitLabel = props.isGitRepository ? 'git tracked' : 'git detached'
  const gitColor = props.isGitRepository ? adnifyTheme.success : adnifyTheme.warm

  return (
    <Panel accent="brand">
      <Box width="100%" justifyContent="space-between">
        <Box flexDirection="column" flexGrow={1}>
          <Wordmark
            appName={props.assistantName}
            author={props.author}
            tagline={props.tagline}
            busy={props.busy}
          />
          <Text color={adnifyTheme.textMuted} wrap="truncate-end">
            {props.description}
          </Text>
        </Box>

        <Box flexDirection="column" alignItems="flex-end" marginLeft={4}>
          <ModeBadge mode={props.mode} busy={props.busy} />
          <Box flexDirection="column" alignItems="flex-end" marginTop={1}>
            <Text color={adnifyTheme.textDim}>model</Text>
            <Text color={adnifyTheme.textSecondary}>{props.modelLabel}</Text>
          </Box>
        </Box>
      </Box>

      <Box width="100%" justifyContent="space-between" marginTop={1}>
        <Box gap={1}>
          <Text color={adnifyTheme.textDim}>workspace</Text>
          <Text color={adnifyTheme.textSecondary}>{props.workspaceName}</Text>
        </Box>
        <Box gap={2}>
          <Text color={adnifyTheme.brandSoft}>{props.packageManager}</Text>
          <Text color={gitColor}>{gitLabel}</Text>
        </Box>
      </Box>

      <Box width="100%" justifyContent="flex-end" marginTop={1}>
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={adnifyTheme.borderMuted}
          paddingX={1}
          width={30}
        >
          <Text color={adnifyTheme.brandSoft}>Quick start</Text>
          <Text color={adnifyTheme.textDim}>可以这样开始：</Text>
          <Box marginTop={1} flexDirection="column">
            {props.commands.slice(0, 4).map((command) => (
              <Box key={command} gap={1}>
                <Text color={adnifyTheme.brand}>›</Text>
                <Text color={adnifyTheme.success}>{command}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Panel>
  )
}
