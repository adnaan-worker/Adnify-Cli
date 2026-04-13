import { Box, Newline, Text, useApp, useInput } from 'ink'
import type { AdnifyCliRuntime } from '../../application/dto/AdnifyCliRuntime'
import { ConversationPane } from './components/ConversationPane'
import { FooterHelp } from './components/FooterHelp'
import { Header } from './components/Header'
import { PromptComposer } from './components/PromptComposer'
import { useCliController } from './hooks/useCliController'

export interface AppProps {
  runtime: AdnifyCliRuntime
  cwd: string
}

export function App(props: AppProps) {
  const { exit } = useApp()
  const controller = useCliController({
    runtime: props.runtime,
    cwd: props.cwd,
    onExit: exit,
  })

  useInput(controller.handleInput)

  if (controller.isBooting) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">Adnify-Cli</Text>
        <Text dimColor>正在装配运行时与工作区上下文...</Text>
      </Box>
    )
  }

  if (!controller.bootstrap || !controller.session) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">启动失败</Text>
        <Newline />
        <Text>{controller.statusLine}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header
        profile={controller.bootstrap.profile}
        workspace={controller.bootstrap.workspace}
        currentMode={controller.session.mode}
      />
      <ConversationPane
        messages={controller.session.getRecentMessages(14)}
        streamingText={controller.streamingText}
      />
      <PromptComposer value={controller.inputValue} busy={controller.isBusy} />
      <FooterHelp statusLine={controller.statusLine} />
    </Box>
  )
}
