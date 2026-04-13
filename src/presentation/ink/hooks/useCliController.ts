import { useEffect, useState } from 'react'
import type { Key } from 'ink'
import type { BootstrapSnapshot } from '../../../application/dto/BootstrapSnapshot'
import type { ConversationSession } from '../../../domain/session/aggregates/ConversationSession'
import type { AdnifyCliRuntime } from '../../../infrastructure/bootstrap/createRuntime'

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
  isBooting: boolean
  isBusy: boolean
  handleInput: (input: string, key: Key) => void
}

/**
 * Ink 表现层状态桥。
 * 这里只负责“把用户输入翻译成用例调用”，不直接承载领域规则。
 */
export function useCliController(params: UseCliControllerParams): CliControllerState {
  const [bootstrap, setBootstrap] = useState<BootstrapSnapshot | null>(null)
  const [session, setSession] = useState<ConversationSession | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [statusLine, setStatusLine] = useState('正在初始化...')
  const [isBooting, setIsBooting] = useState(true)
  const [isBusy, setIsBusy] = useState(false)

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

        if (!mounted) {
          return
        }

        setBootstrap(bootSnapshot)
        setSession(createdSession)
        setStatusLine('启动完成，可以开始交互。')
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
  }, [params.cwd, params.runtime.useCases.bootstrapCli, params.runtime.useCases.createSession])

  const handleSubmit = async () => {
    if (!session || !bootstrap || isBusy) {
      return
    }

    const nextInput = inputValue.trim()
    if (!nextInput) {
      return
    }

    setIsBusy(true)
    setInputValue('')

    try {
      if (nextInput.startsWith(':')) {
        const result = await params.runtime.useCases.applyCliCommand.execute({
          sessionId: session.id,
          commandLine: nextInput,
          bootstrap,
        })

        setSession(result.session)
        setStatusLine(result.statusLine)

        if (result.shouldExit) {
          params.onExit()
        }

        return
      }

      const result = await params.runtime.useCases.submitPrompt.execute({
        sessionId: session.id,
        prompt: nextInput,
      })

      setSession(result.session)
      setStatusLine(result.statusLine)
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误'
      setStatusLine(`执行失败：${message}`)
    } finally {
      setIsBusy(false)
    }
  }

  const handleInput = (input: string, key: Key) => {
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
  }

  return {
    bootstrap,
    session,
    inputValue,
    statusLine,
    isBooting,
    isBusy,
    handleInput,
  }
}

