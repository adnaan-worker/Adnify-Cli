import { Box, Text } from 'ink'

export interface FooterHelpProps {
  statusLine: string
}

export function FooterHelp(props: FooterHelpProps) {
  return (
    <Box flexDirection="column">
      <Text dimColor>Enter 发送 | Ctrl+C 退出 | Esc 清空当前输入</Text>
      <Text color="gray">状态：{props.statusLine}</Text>
    </Box>
  )
}

