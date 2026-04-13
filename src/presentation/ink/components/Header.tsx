import path from 'node:path'
import { Box, Text } from 'ink'
import type { AssistantProfile } from '../../../domain/assistant/entities/AssistantProfile'
import type { AssistantMode } from '../../../domain/assistant/value-objects/AssistantMode'
import type { WorkspaceContext } from '../../../domain/workspace/entities/WorkspaceContext'

export interface HeaderProps {
  profile: AssistantProfile
  workspace: WorkspaceContext
  currentMode: AssistantMode
}

export function Header(props: HeaderProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        {props.profile.name}
      </Text>
      <Text>
        作者 {props.profile.author} | 当前模式 {props.currentMode} | 包管理 {props.workspace.packageManager}
      </Text>
      <Text dimColor>
        工作区 {path.basename(props.workspace.rootPath)} | Git {props.workspace.isGitRepository ? '已启用' : '未检测'}
      </Text>
    </Box>
  )
}

