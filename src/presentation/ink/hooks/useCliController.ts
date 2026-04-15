import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Key } from 'ink'
import type { BootstrapSnapshot } from '../../../application/dto/BootstrapSnapshot'
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
  handleInput: (input: string, key: Key) => void
}

const COMMAND_DESCRIPTIONS: Record<string, string> = {
  ':help': '查看本地命令列表',
  ':mode chat': '切换到对话模式',
  ':mode agent': '切换到代理执行模式',
  ':mode plan': '切换到规划模式',
  ':workspace': '查看当前工作区摘要',
  ':tools': '查看工具目录规划',
  ':model [provider] [model]': '查看或切换当前模型',
  ':config': '查看当前模型配置',
  ':config init': '启动模型配置向导',
  ':clear': '清空当前会话消息',
  ':exit': '退出 Adnify-Cli',
}

/**
 * Ink 展示层状态桥。
 * 这里只负责把用户输入翻译成用例调用，不直接承载领域规则。
 */
export function useCliController(params: UseCliControllerParams): CliControllerState {
  const [bootstrap, setBootstrap] = useState<BootstrapSnapshot | null>(null)
  const [session, setSession] = useState<ConversationSession | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [statusLine, setStatusLine] = useState('正在初始化…')
  const [streamingText, setStreamingText] = useState('')
  const [isBooting, setIsBooting] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0)

  const busyRef = useRef(false)
  const bootKeyRef = useRef<string | null>(null)
  const configInit = useConfigInit()

  useEffect(() => {
    const bootKey = `${params.cwd}`
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

        const createdSession = await params.runtime.useCases.createSession.execute({
          workspacePath: bootSnapshot.workspace.rootPath,
          mode: bootSnapshot.profile.defaultMode,
          welcomeMessage: bootSnapshot.welcomeMessage,
        })

        if (!mounted) {
          return
        }

        setBootstrap(bootSnapshot)
        setSession(createdSession)

        if (!bootSnapshot.modelConfig.apiKey) {
          configInit.start()
          setStatusLine('尚未检测到模型配置，请先完成初始化。')
        } else {
          setStatusLine('运行时已就绪，可以开始交互。')
        }
      } catch (error) {
        if (!mounted) {
          return
        }

        const message = error instanceof Error ? error.message : '未知错误'
        setStatusLine(`启动失败：${message}`)
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
  }, [configInit.start, params.cwd, params.runtime])

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
        description: COMMAND_DESCRIPTIONS[command] ?? '执行本地命令',
      }))
      .filter((item) => item.command.toLowerCase().startsWith(keyword))
  }, [bootstrap, inputValue])

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
        const message = error instanceof Error ? error.message : '未知错误'
        setStatusLine(`配置失败：${message}`)
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
        setStatusLine('正在进入模型配置向导…')
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

        if (result.shouldExit) {
          params.onExit()
        }
        return
      }

      setStreamingText('')
      setStatusLine('正在生成响应…')

      const result = await params.runtime.useCases.submitPrompt.executeStreaming(
        { sessionId: session.id, prompt: nextInput },
        {
          onChunk: (delta) => {
            setStreamingText((previous) => previous + delta)
          },
          onDone: () => {
            setStreamingText('')
          },
          onError: (error) => {
            setStreamingText('')
            setStatusLine(`响应失败：${error.message}`)
          },
        },
      )

      setSession(result.session)
      setStatusLine(result.statusLine)
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setStatusLine(`执行失败：${message}`)
      setStreamingText('')
    } finally {
      busyRef.current = false
      setIsBusy(false)
    }
  }, [
    bootstrap,
    commandSuggestions,
    configInit,
    inputValue,
    isSuggestionOpen,
    params,
    selectedSuggestionIndex,
    session,
  ])

  const handleInput = useCallback((input: string, key: Key) => {
    if (key.ctrl && input === 'c') {
      params.onExit()
      return
    }

    if (key.escape) {
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
  }, [applySelectedSuggestion, commandSuggestions.length, handleSubmit, isSuggestionOpen, params])

  return {
    bootstrap,
    session,
    inputValue,
    statusLine,
    streamingText,
    isBooting,
    isBusy,
    configInitPrompt: configInit.isActive
      ? configInit.promptText + (configInit.errorText ? `\n错误：${configInit.errorText}` : '')
      : '',
    commandSuggestions,
    selectedSuggestionIndex,
    isSuggestionOpen,
    handleInput,
  }
}
