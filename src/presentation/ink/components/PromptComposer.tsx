import { Box, Text } from 'ink'

export interface PromptComposerProps {
  value: string
  busy: boolean
}

export function PromptComposer(props: PromptComposerProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
      <Text bold>{props.busy ? 'Adnify-Cli 正在思考...' : 'Input'}</Text>
      <Text>
        {'> '}
        {props.value || <Text dimColor>输入问题，或使用 :help 查看命令</Text>}
      </Text>
    </Box>
  )
}

