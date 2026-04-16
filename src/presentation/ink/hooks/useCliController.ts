import type { Key } from 'ink'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BootstrapSnapshot } from '../../../application/dto/BootstrapSnapshot'
import type { SessionListItem } from '../../../application/dto/SessionListItem'
import type { AdnifyCliRuntime } from '../../../application/dto/AdnifyCliRuntime'
import type { ConversationSession } from '../../../domain/session/aggregates/ConversationSession'
import type { CommandSuggestionItem } from '../components/CommandSuggestionList'
import { useConfigInit } from './useConfigInit'

export interface UseCliControllerParams {
  runtime: AdnifyCliRuntime
  cwd: string
  onExit: () => void
}

export interface CliControllerState {
  bootstrap: BootstrapSnapshot | null
  session: ConversationSession | null
  inputValue: string
  statusLine: string
  streamingText: string
  isBooting: boolean
  isBusy: boolean
  configInitPrompt: string
  commandSuggestions: CommandSuggestionItem[]
  selectedSuggestionIndex: number
  isSuggestionOpen: boolean
  recentSessions: SessionListItem[]
  handleInput: (input: string, key: Key) => void
}

const COMMAND_DESCRIPTION_KEYS: Record<string, string> = {
  ':help': 'command.desc.help',
  ':mode chat': 'command.desc.mode.chat',
  ':mode agent': 'command.desc.mode.agent',
  ':mode plan': 'command.desc.mode.plan',
  ':workspace': 'command.desc.workspace',
  ':tools': 'command.desc.tools',
  ':model [provider] [model]': 'command.desc.model',
  ':config': 'command.desc.config',
  ':config init': 'command.desc.configInit',
  ':session': 'command.desc.session',
  ':sessions': 'command.desc.sessions',
  ':resume [index|id]': 'command.desc.resume',
  ':storage': 'command.desc.storage',
  ':storage set [path]': 'command.desc.storage',
  ':storage reset': 'command.desc.storage',
  ':clear': 'command.desc.clear',
  ':exit': 'command.desc.exit',
}

/**
 * Ink 展示层状态桥。
 * 这里负责把用户输入翻译成用例调用，不直接承载领域规则。
 */
export function useCliController(params: UseCliControllerParams): CliControllerState {
  const { i18n } = params.runtime
  const [bootstrap, setBootstrap] = useState<BootstrapSnapshot | null>(null)
  const [session, setSession] = useState<ConversationSession | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [statusLine, setStatusLine] = useState(i18n.t('status.initializing'))
  const [streamingText, setStreamingText] = useState('')
  const [isBooting, setIsBooting] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)
  const [recentSessions, setRecentSessions] = useState<SessionListItem[]>([])

  const busyRef = useRef(false)
  const bootKeyRef = useRef<string | null>(null)
  const streamingBufferRef = useRef('')
  const streamingFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const configInit = useConfigInit(i18n)

  const flushStreamingBuffer = useCallback(() => {
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current)
      streamingFlushTimerRef.current = null
    }

    if (!streamingBufferRef.current) {
      return
    }

    const nextChunk = streamingBufferRef.current
    streamingBufferRef.current = ''
    setStreamingText((previous) => previous + nextChunk)
  }, [])

  const queueStreamingChunk = useCallback((delta: string) => {
    streamingBufferRef.current += delta

    if (streamingFlushTimerRef.current) {
      return
    }

    streamingFlushTimerRef.current = setTimeout(() => {
      streamingFlushTimerRef.current = null
      if (!streamingBufferRef.current) {
        return
      }

      const nextChunk = streamingBufferRef.current
      streamingBufferRef.current = ''
      setStreamingText((previous) => previous + nextChunk)
    }, 32)
  }, [])

  const resetStreamingState = useCallback(() => {
    if (streamingFlushTimerRef.current) {
      clearTimeout(streamingFlushTimerRef.current)
      streamingFlushTimerRef.current = null
    }

    streamingBufferRef.current = ''
    setStreamingText('')
  }, [])

  useEffect(() => {
    return () => {
      if (streamingFlushTimerRef.current) {
        clearTimeout(streamingFlushTimerRef.current)
      }
    }
  }, [])

  const refreshRecentSessions = useCallback(
    async (workspacePath: string) => {
      const sessions = await params.runtime.useCases.listSessions.execute({
        workspacePath,
        limit: 5,
      })
      setRecentSessions(sessions)
    },
    [params.runtime.useCases.listSessions],
  )

  useEffect(() => {
    const bootKey = params.cwd
    if (bootKeyRef.current === bootKey) {
      return
    }

    bootKeyRef.current = bootKey

    let mounted = true

    const run = async () => {
      try {
        const bootSnapshot = await params.runtime.useCases.bootstrapCli.execute({
          cwd: params.cwd,
        })

        const startupSession = await params.runtime.useCases.resolveStartupSession.execute({
          workspacePath: bootSnapshot.workspace.rootPath,
          mode: bootSnapshot.profile.defaultMode,
        })

        if (!mounted) {
          return
        }

        setBootstrap(bootSnapshot)
        setSession(startupSession.session)
        await refreshRecentSessions(bootSnapshot.workspace.rootPath)

        if (!bootSnapshot.modelConfig.apiKey) {
          setStatusLine(
            startupSession.restored
              ? i18n.t('status.sessionRestoredSetupRequired', {
                  id: startupSession.session.id.slice(0, 8),
                })
              : i18n.t('status.notConfigured'),
          )
        } else {
          setStatusLine(
            startupSession.restored
              ? i18n.t('status.sessionRestored', {
                  id: startupSession.session.id.slice(0, 8),
                })
              : i18n.t('status.runtimeReady'),
          )
        }
      } catch (error) {
        if (!mounted) {
          return
        }

        const message = error instanceof Error ? error.message : 'Unknown error'
        setStatusLine(`${i18n.t('app.boot.failed')}: ${message}`)
      } finally {
        if (mounted) {
          setIsBooting(false)
        }
      }
    }

    void run()

    return () => {
      mounted = false
    }
  }, [configInit.start, i18n, params.cwd, params.runtime, refreshRecentSessions])

  const commandSuggestions = useMemo<CommandSuggestionItem[]>(() => {
    if (!bootstrap) {
      return []
    }

    const trimmed = inputValue.trimStart()
    const isCommandTrigger = trimmed.startsWith(':') || trimmed.startsWith('/')

    if (!isCommandTrigger) {
      return []
    }

    const normalized = trimmed.startsWith('/') ? `:${trimmed.slice(1)}` : trimmed
    const keyword = normalized.toLowerCase()

    return bootstrap.localCommands
      .map((command) => ({
        command,
        description:
          i18n.maybeT(COMMAND_DESCRIPTION_KEYS[command] ?? '') ?? i18n.t('command.desc.default'),
      }))
      .filter((item) => item.command.toLowerCase().startsWith(keyword))
  }, [bootstrap, i18n, inputValue])

  const isSuggestionOpen = commandSuggestions.length > 0 && !configInit.isActive

  useEffect(() => {
    if (selectedSuggestionIndex >= commandSuggestions.length) {
      setSelectedSuggestionIndex(0)
    }
  }, [commandSuggestions.length, selectedSuggestionIndex])

  const applySelectedSuggestion = useCallback(() => {
    const next = commandSuggestions[selectedSuggestionIndex]
    if (!next) {
      return false
    }

    setInputValue(`${next.command} `)
    setSelectedSuggestionIndex(0)
    return true
  }, [commandSuggestions, selectedSuggestionIndex])

  const handleSubmit = useCallback(async () => {
    if (!session || !bootstrap || busyRef.current) {
      return
    }

    let nextInput = inputValue.trim()

    if ((nextInput.startsWith(':') || nextInput.startsWith('/')) && isSuggestionOpen) {
      const selected = commandSuggestions[selectedSuggestionIndex]
      if (selected) {
        const normalizedTyped = nextInput.startsWith('/') ? `:${nextInput.slice(1)}` : nextInput
        if (selected.command.startsWith(normalizedTyped)) {
          nextInput = selected.command
        }
      }
    }

    if (nextInput.startsWith('/')) {
      nextInput = `:${nextInput.slice(1)}`
    }

    if (configInit.isActive) {
      busyRef.current = true
      setIsBusy(true)
      setInputValue('')

      try {
        const result = await configInit.handleInput(nextInput)
        if (result) {
          setBootstrap((previous) => (previous ? { ...previous, modelConfig: result.config } : previous))
          setStatusLine(result.message)
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        setStatusLine(i18n.t('status.configFailed', { message }))
      } finally {
        busyRef.current = false
        setIsBusy(false)
      }

      return
    }

    if (!nextInput) {
      return
    }

    busyRef.current = true
    setIsBusy(true)
    setInputValue('')
    setSelectedSuggestionIndex(0)

    try {
      if (nextInput === ':config init') {
        configInit.start()
        setStatusLine(i18n.t('status.enteringConfigInit'))
        return
      }

      if (nextInput.startsWith(':')) {
        const result = await params.runtime.useCases.applyCliCommand.execute({
          sessionId: session.id,
          commandLine: nextInput,
          bootstrap,
          modelSwitcher: {
            switchModel: (providerName, modelName) => {
              const newConfig = params.runtime.switchModel(providerName, modelName)
              if (newConfig) {
                setBootstrap((previous) => (previous ? { ...previous, modelConfig: newConfig } : previous))
              }
              return newConfig ? { model: newConfig.model, baseUrl: newConfig.baseUrl } : null
            },
          },
        })

        setSession(result.session)
        setStatusLine(result.statusLine)
        await refreshRecentSessions(bootstrap.workspace.rootPath)

        if (result.shouldExit) {
          params.onExit()
        }
        return
      }

      resetStreamingState()

      const result = await params.runtime.useCases.submitPrompt.executeStreaming(
        { sessionId: session.id, prompt: nextInput },
        {
          onChunk: (delta) => {
            queueStreamingChunk(delta)
          },
          onDone: () => {
            flushStreamingBuffer()
          },
          onError: (error) => {
            flushStreamingBuffer()
            setStatusLine(i18n.t('status.responseFailed', { message: error.message }))
          },
        },
      )

      setSession(result.session)
      resetStreamingState()
      setStatusLine(result.statusLine)
      await refreshRecentSessions(bootstrap.workspace.rootPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      setStatusLine(i18n.t('status.executionFailed', { message }))
      resetStreamingState()
    } finally {
      busyRef.current = false
      setIsBusy(false)
    }
  }, [
    bootstrap,
    commandSuggestions,
    configInit,
    flushStreamingBuffer,
    i18n,
    inputValue,
    isSuggestionOpen,
    params,
    queueStreamingChunk,
    resetStreamingState,
    selectedSuggestionIndex,
    session,
  ])

  const handleInput = useCallback((input: string, key: Key) => {
    if (key.ctrl && input === 'c') {
      params.onExit()
      return
    }

    if (key.escape) {
      if (configInit.isActive && !inputValue) {
        configInit.stop()
        setStatusLine(i18n.t('status.configInitCancelled'))
        return
      }

      setInputValue('')
      setSelectedSuggestionIndex(0)
      return
    }

    if (isSuggestionOpen && key.upArrow) {
      setSelectedSuggestionIndex((previous) =>
        previous === 0 ? commandSuggestions.length - 1 : previous - 1,
      )
      return
    }

    if (isSuggestionOpen && key.downArrow) {
      setSelectedSuggestionIndex((previous) =>
        previous >= commandSuggestions.length - 1 ? 0 : previous + 1,
      )
      return
    }

    if (isSuggestionOpen && key.tab) {
      if (applySelectedSuggestion()) {
        return
      }
    }

    if (key.return) {
      void handleSubmit()
      return
    }

    if (key.backspace || key.delete) {
      setInputValue((previous) => previous.slice(0, -1))
      setSelectedSuggestionIndex(0)
      return
    }

    if (!key.ctrl && !key.meta) {
      setInputValue((previous) => previous + input)
      setSelectedSuggestionIndex(0)
    }
  }, [
    applySelectedSuggestion,
    commandSuggestions.length,
    configInit,
    handleSubmit,
    i18n,
    inputValue,
    isSuggestionOpen,
    params,
  ])

  return {
    bootstrap,
    session,
    inputValue,
    statusLine,
    streamingText,
    isBooting,
    isBusy,
    configInitPrompt: configInit.isActive
      ? configInit.promptText +
        (configInit.errorText
          ? `\n${i18n.t('conversation.configError', { message: configInit.errorText })}`
          : '')
      : '',
    commandSuggestions,
    selectedSuggestionIndex,
    isSuggestionOpen,
    recentSessions,
    handleInput,
  }
}
