import { useCallback, useRef, useState } from 'react'
import type { ModelConfig } from '../../../domain/assistant/value-objects/ModelConfig'
import { PROVIDER_PRESETS, type ProviderPreset } from '../../../infrastructure/config/providerPresets'
import { writeModelConfig } from '../../../infrastructure/config/writeLocalConfig'

type InitStep =
  | 'idle'
  | 'select-provider'
  | 'select-model'
  | 'enter-apikey'
  | 'enter-baseurl'
  | 'confirm'
  | 'done'

export interface ConfigInitState {
  isActive: boolean
  promptText: string
  errorText: string
  start: () => void
  handleInput: (input: string) => Promise<ConfigInitResult | null>
}

export interface ConfigInitResult {
  config: ModelConfig
  message: string
}

/**
 * 交互式模型配置向导。
 * 流程：选择 Provider -> 选择模型 -> 输入 Key -> 必要时输入 Base URL -> 确认保存。
 */
export function useConfigInit(): ConfigInitState {
  const [step, setStep] = useState<InitStep>('idle')
  const [errorText, setErrorText] = useState('')
  const chosen = useRef<{
    preset: ProviderPreset | null
    model: string
    apiKey: string
    baseUrl: string
    isCustom: boolean
  }>({
    preset: null,
    model: '',
    apiKey: '',
    baseUrl: '',
    isCustom: false,
  })

  const buildPromptText = useCallback((): string => {
    switch (step) {
      case 'select-provider': {
        const lines = ['请选择 AI Provider：']
        PROVIDER_PRESETS.forEach((preset, index) => {
          lines.push(`  ${index + 1}. ${preset.label} (${preset.models.slice(0, 3).join(' / ')})`)
        })
        lines.push(`  ${PROVIDER_PRESETS.length + 1}. 自定义 OpenAI 兼容端点`)
        lines.push('')
        lines.push('输入序号继续')
        return lines.join('\n')
      }

      case 'select-model': {
        const preset = chosen.current.preset
        if (!preset) {
          return '请输入模型名称'
        }

        const lines = [`已选择 ${preset.label}，请选择模型：`]
        preset.models.forEach((model, index) => {
          const isDefault = model === preset.defaultModel ? ' (默认)' : ''
          lines.push(`  ${index + 1}. ${model}${isDefault}`)
        })
        lines.push('')
        lines.push('输入序号，或直接回车使用默认模型')
        return lines.join('\n')
      }

      case 'enter-apikey':
        return '请输入 API Key'

      case 'enter-baseurl':
        return '请输入 Base URL，例如 https://api.example.com/v1'

      case 'confirm': {
        const current = chosen.current
        const masked = current.apiKey.length > 10
          ? current.apiKey.slice(0, 6) + '...' + current.apiKey.slice(-4)
          : current.apiKey || '(空)'

        return [
          '确认配置：',
          `  Base URL：${current.baseUrl}`,
          `  Model：${current.model}`,
          `  API Key：${masked}`,
          '',
          '输入 y 确认保存，输入 n 取消',
        ].join('\n')
      }

      default:
        return ''
    }
  }, [step])

  const start = useCallback(() => {
    chosen.current = {
      preset: null,
      model: '',
      apiKey: '',
      baseUrl: '',
      isCustom: false,
    }
    setErrorText('')
    setStep('select-provider')
  }, [])

  const handleInput = useCallback(async (input: string): Promise<ConfigInitResult | null> => {
    const trimmed = input.trim()
    setErrorText('')

    switch (step) {
      case 'select-provider': {
        const index = Number.parseInt(trimmed, 10) - 1
        const maxIndex = PROVIDER_PRESETS.length

        if (Number.isNaN(index) || index < 0 || index > maxIndex) {
          setErrorText(`请输入 1-${maxIndex + 1} 之间的序号`)
          return null
        }

        if (index === maxIndex) {
          chosen.current.isCustom = true
          chosen.current.preset = null
          setStep('enter-baseurl')
          return null
        }

        const preset = PROVIDER_PRESETS[index]!
        chosen.current.preset = preset
        chosen.current.baseUrl = preset.baseUrl
        chosen.current.isCustom = false
        setStep('select-model')
        return null
      }

      case 'select-model': {
        const preset = chosen.current.preset
        if (!preset) {
          setStep('idle')
          return null
        }

        if (!trimmed) {
          chosen.current.model = preset.defaultModel
        } else {
          const index = Number.parseInt(trimmed, 10) - 1
          if (Number.isNaN(index) || index < 0 || index >= preset.models.length) {
            setErrorText(`请输入 1-${preset.models.length} 之间的序号，或直接回车`)
            return null
          }
          chosen.current.model = preset.models[index]!
        }

        setStep('enter-apikey')
        return null
      }

      case 'enter-baseurl': {
        if (!trimmed) {
          setErrorText('Base URL 不能为空')
          return null
        }

        chosen.current.baseUrl = trimmed
        chosen.current.model = ''
        setStep('enter-apikey')
        return null
      }

      case 'enter-apikey': {
        if (!trimmed) {
          setErrorText('API Key 不能为空')
          return null
        }

        chosen.current.apiKey = trimmed

        if (chosen.current.isCustom && !chosen.current.model) {
          chosen.current.model = 'gpt-4o-mini'
        }

        setStep('confirm')
        return null
      }

      case 'confirm': {
        const lower = trimmed.toLowerCase()
        if (lower === 'n') {
          setStep('idle')
          return null
        }

        if (lower !== 'y') {
          setErrorText('请输入 y 或 n')
          return null
        }

        const current = chosen.current
        const config: ModelConfig = {
          provider: current.preset?.provider ?? 'openai-compatible',
          apiKey: current.apiKey,
          baseUrl: current.baseUrl,
          model: current.model,
          maxTokens: 4096,
          temperature: 0.7,
          timeoutMs: 60_000,
        }

        await writeModelConfig(config)
        setStep('done')

        return {
          config,
          message: [
            '配置已保存到 ~/.adnify-cli/config.json',
            `当前模型：${config.model} (${config.baseUrl})`,
            '现在可以直接开始对话，或使用 :model 继续切换模型。',
          ].join('\n'),
        }
      }

      default:
        return null
    }
  }, [step])

  return {
    isActive: step !== 'idle' && step !== 'done',
    promptText: buildPromptText(),
    errorText,
    start,
    handleInput,
  }
}
