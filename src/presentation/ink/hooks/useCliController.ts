import { useCallback, useEffect, useRef, useState } from 'react'
import type { Key } from 'ink'
import type { BootstrapSnapshot } from '../../../application/dto/BootstrapSnapshot'
import type { ConversationSession } from '../../../domain/session/aggregates/ConversationSession'
import type { AdnifyCliRuntime } from '../../../application/dto/AdnifyCliRuntime'
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
  handleInput: (input: string, key: Key) => void
}

/**
 * Ink 表现层状态桥。
 * 这里只负责"把用户输入翻译成用例调用"，不直接承载领域规则。
 */
export function useCliController(params: UseCliControllerParams): CliControllerState {
  const [bootstrap, setBootstrap] = useState<BootstrapSnapshot | null>(null)
  const [session, setSession] = useState<ConversationSession | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [statusLine, setStatusLine] = useState('正在初始化...')
  const [streamingText, setStreamingText] = useState('')
  const [isBooting, setIsBooting] = useState(true)
  const [isBusy, setIsBusy] = useState(false)
  const busyRef = useRef(false)
  const configInit = useConfigInit()

  useEffect(() => {
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

        if (!mounted) return

        setBootstrap(bootSnapshot)
        setSession(createdSession)

        if (!bootSnapshot.modelConfig?.apiKey) {
          configInit.start()
          setStatusLine('未检测到模型配置，请完成初始化。')
        } else {
          setStatusLine('启动完成，可以开始交互。')
        }
      } catch (error) {
        if (!mounted) return
        const message = error instanceof Error ? error.message : '未知错误'
        setStatusLine(`启动失败：${message}`)
      } finally {
        if (mounted) setIsBooting(false)
      }
    }

    void run()
    return () => { mounted = false }
  }, [params.cwd, params.runtime.useCases.bootstrapCli, params.runtime.useCases.createSession])

  const handleSubmit = useCallback(async () => {
    if (!session || !bootstrap || busyRef.current) return

    const nextInput = inputValue.trim()

    if (configInit.isActive) {
      busyRef.current = true
      setIsBusy(true)
      setInputValue('')
      try {
        const result = await configInit.handleInput(nextInput)
        if (result) {
          setBootstrap((prev) => prev ? { ...prev, modelConfig: result.config } : prev)
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

    if (!nextInput) return

    busyRef.current = true
    setIsBusy(true)
    setInputValue('')

    try {
      if (nextInput === ':config init') {
        configInit.start()
        setStatusLine('开始配置引导...')
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
                setBootstrap((prev) => prev ? { ...prev, modelConfig: newConfig } : prev)
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
      setStatusLine('正在生成响应...')

      const result = await params.runtime.useCases.submitPrompt.executeStreaming(
        { sessionId: session.id, prompt: nextInput },
        {
          onChunk: (delta) => {
            setStreamingText((prev) => prev + delta)
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
  }, [session, bootstrap, inputValue, params, configInit])

  const handleInput = useCallback((input: string, key: Key) => {
    if (key.ctrl && input === 'c') {
      params.onExit()
      return
    }

    if (key.escape) {
      setInputValue('')
      return
    }

    if (key.return) {
      void handleSubmit()
      return
    }

    if (key.backspace || key.delete) {
      setInputValue((previous) => previous.slice(0, -1))
      return
    }

    if (!key.ctrl && !key.meta) {
      setInputValue((previous) => previous + input)
    }
  }, [handleSubmit, params])

  return {
    bootstrap,
    session,
    inputValue,
    statusLine,
    streamingText,
    isBooting,
    isBusy,
    configInitPrompt: configInit.isActive
      ? configInit.promptText + (configInit.errorText ? `\n⚠ ${configInit.errorText}` : '')
      : '',
    handleInput,
  }
}
