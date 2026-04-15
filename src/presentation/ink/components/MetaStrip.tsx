import { Box, Text } from 'ink'
import type { ModelProvider } from '../../../domain/assistant/value-objects/ModelConfig'
import type { PackageManagerName } from '../../../domain/workspace/entities/WorkspaceContext'
import { adnifyTheme } from '../theme'

export interface MetaStripProps {
  packageManager: PackageManagerName
  isGitRepository: boolean
  provider: ModelProvider
  providerCount: number
  commandCount: number
}

function Item(props: { label: string; value: string; color?: string }) {
  return (
    <Text>
      <Text color={adnifyTheme.textDim}>{props.label}</Text>
      <Text color={props.color ?? adnifyTheme.textSecondary}>{props.value}</Text>
    </Text>
  )
}

export function MetaStrip(props: MetaStripProps) {
  return (
    <Box width="100%" marginTop={1} paddingX={1} gap={3}>
      <Item label="pkg " value={props.packageManager} color={adnifyTheme.brandSoft} />
      <Item
        label="git "
        value={props.isGitRepository ? 'tracked' : 'detached'}
        color={props.isGitRepository ? adnifyTheme.success : adnifyTheme.warm}
      />
      <Item label="provider " value={props.provider} />
      <Item label="providers " value={String(props.providerCount)} />
      <Item label="commands " value={String(props.commandCount)} />
    </Box>
  )
}
