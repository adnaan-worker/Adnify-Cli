import { Box, Newline, Text, useApp, useInput } from 'ink'
import type { AdnifyCliRuntime } from '../../application/dto/AdnifyCliRuntime'
import { adnifyTheme } from './theme'
import { ActivityPulse } from './components/ActivityPulse'
import { ConversationViewport } from './components/ConversationViewport'
import { EmptyState } from './components/EmptyState'
import { HeaderBar } from './components/HeaderBar'
import { InputDock } from './components/InputDock'
import { Panel } from './components/Panel'
import { StatusDock } from './components/StatusDock'
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
  const { i18n } = props.runtime

  useInput(controller.handleInput)

  if (controller.isBooting) {
    return (
      <Box width="100%" flexDirection="column" paddingX={1} paddingY={1}>
        <HeaderBar
          appName="Adnify-Cli"
          author="adnaan"
          tagline={i18n.t('assistant.tagline')}
          workspaceName={i18n.t('app.boot.workspaceName')}
          packageManager="bun"
          mode="agent"
          modelLabel={i18n.t('app.boot.modelLabel')}
          busy
          i18n={i18n}
        />
        <Box width="100%" marginTop={1}>
          <Panel
            title={i18n.t('app.boot.panelTitle')}
            subtitle={i18n.t('app.boot.panelSubtitle')}
            accent="brand"
          >
            <Box flexDirection="column" marginTop={1}>
              <Box gap={1}>
                <ActivityPulse active color={adnifyTheme.brandStrong} idleFrame="*" />
                <Text color={adnifyTheme.brand}>{i18n.t('app.boot.heading')}</Text>
              </Box>
              <Text color={adnifyTheme.textMuted}>{i18n.t('app.boot.description')}</Text>
            </Box>
          </Panel>
        </Box>
      </Box>
    )
  }

  if (!controller.bootstrap || !controller.session) {
    return (
      <Box width="100%" flexDirection="column" paddingX={1} paddingY={1}>
        <Text color={adnifyTheme.danger}>{i18n.t('app.boot.failed')}</Text>
        <Newline />
        <Text color={adnifyTheme.textPrimary}>{controller.statusLine}</Text>
      </Box>
    )
  }

  const workspace = controller.bootstrap.workspace
  const profile = controller.bootstrap.profile
  const modelConfig = controller.bootstrap.modelConfig
  const modelLabel = `${modelConfig.provider} / ${modelConfig.model}`
  const messages = controller.session.getRecentMessages(14)
  const showEmptyState =
    messages.length === 0 && !controller.streamingText && !controller.configInitPrompt

  return (
    <Box width="100%" flexDirection="column" paddingX={1} paddingY={1}>
      {showEmptyState ? (
        <EmptyState
          assistantName={profile.name}
          author={profile.author}
          tagline={i18n.t('assistant.tagline')}
          description={i18n.t('assistant.description')}
          workspaceName={workspace.rootPath.split(/[\\/]/).filter(Boolean).pop() ?? workspace.rootPath}
          packageManager={workspace.packageManager}
          isGitRepository={workspace.isGitRepository}
          mode={controller.session.mode}
          modelLabel={modelLabel}
          busy={controller.isBusy}
          commands={controller.bootstrap.localCommands}
          i18n={i18n}
        />
      ) : (
        <>
          <HeaderBar
            appName={profile.name}
            author={profile.author}
            tagline={i18n.t('assistant.tagline')}
            workspaceName={workspace.rootPath.split(/[\\/]/).filter(Boolean).pop() ?? workspace.rootPath}
            packageManager={workspace.packageManager}
            isGitRepository={workspace.isGitRepository}
            mode={controller.session.mode}
            modelLabel={modelLabel}
            busy={controller.isBusy}
            i18n={i18n}
          />

          <Box width="100%" marginTop={1} flexDirection="column">
            <ConversationViewport
              messages={messages}
              streamingText={controller.streamingText}
              configInitPrompt={controller.configInitPrompt}
              i18n={i18n}
            />
          </Box>
        </>
      )}

      <Box width="100%" marginTop={1}>
        <InputDock
          value={controller.inputValue}
          busy={controller.isBusy}
          mode={controller.session.mode}
          modelLabel={modelLabel}
          commandSuggestions={controller.commandSuggestions}
          selectedSuggestionIndex={controller.selectedSuggestionIndex}
          isSuggestionOpen={controller.isSuggestionOpen}
          i18n={i18n}
        />
      </Box>

      <StatusDock
        statusLine={controller.statusLine}
        isBusy={controller.isBusy}
        isConfigured={Boolean(modelConfig.apiKey)}
        i18n={i18n}
      />
    </Box>
  )
}
