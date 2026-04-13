import { useCallback, useRef, useState } from 'react'
import type { ModelConfig } from '../../../domain/assistant/value-objects/ModelConfig'
import { PROVIDER_PRESETS, type ProviderPreset } from '../../../infrastructure/config/providerPresets'
import { writeModelConfig } from '../../../infrastructure/config/writeLocalConfig'

type InitStep = 'idle' | 'select-provider' | 'select-model' | 'enter-apikey' | 'enter-baseurl' | 'confirm' | 'done'

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
 * 交互式配置引导状态机。
 * 步骤：选厂商 → 选模型 → 输入 API Key → (自定义时输入 baseUrl) → 确认写入。
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
  }>({ preset: null, model: '', apiKey: '', baseUrl: '', isCustom: false })

  const buildPromptText = useCallback((): string => {
    switch (step) {
      case 'select-provider': {
        const lines = ['请选择 AI 模型厂商：']
        PROVIDER_PRESETS.forEach((p, i) => {
          lines.push(`  ${i + 1}. ${p.label}（${p.models.slice(0, 3).join(' / ')}）`)
        })
        lines.push(`  ${PROVIDER_PRESETS.length + 1}. 自定义 OpenAI 兼容端点`)
        lines.push('')
        lines.push('输入序号')
        return lines.join('\n')
      }
      case 'select-model': {
        const preset = chosen.current.preset
        if (!preset) return '输入模型名称'
        const lines = [`已选择 ${preset.label}，请选择模型：`]
        preset.models.forEach((m, i) => {
          const isDefault = m === preset.defaultModel ? ' (默认)' : ''
          lines.push(`  ${i + 1}. ${m}${isDefault}`)
        })
        lines.push('')
        lines.push('输入序号，或直接回车使用默认')
        return lines.join('\n')
      }
      case 'enter-apikey':
        return '请输入 API Key'
      case 'enter-baseurl':
        return '请输入 Base URL（如 https://api.example.com/v1）'
      case 'confirm': {
        const c = chosen.current
        const masked = c.apiKey.length > 10
          ? c.apiKey.slice(0, 6) + '...' + c.apiKey.slice(-4)
          : c.apiKey || '(空)'
        return [
          '确认配置：',
          `  Base URL：${c.baseUrl}`,
          `  Model：${c.model}`,
          `  API Key：${masked}`,
          '',
          '输入 y 确认保存，n 取消',
        ].join('\n')
      }
      default:
        return ''
    }
  }, [step])

  const start = useCallback(() => {
    chosen.current = { preset: null, model: '', apiKey: '', baseUrl: '', isCustom: false }
    setErrorText('')
    setStep('select-provider')
  }, [])

  const handleInput = useCallback(async (input: string): Promise<ConfigInitResult | null> => {
    const trimmed = input.trim()
    setErrorText('')

    switch (step) {
      case 'select-provider': {
        const idx = parseInt(trimmed, 10) - 1
        const maxIdx = PROVIDER_PRESETS.length

        if (Number.isNaN(idx) || idx < 0 || idx > maxIdx) {
          setErrorText(`请输入 1-${maxIdx + 1} 之间的序号`)
          return null
        }

        if (idx === maxIdx) {
          chosen.current.isCustom = true
          chosen.current.preset = null
          setStep('enter-baseurl')
          return null
        }

        const preset = PROVIDER_PRESETS[idx]!
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
          const idx = parseInt(trimmed, 10) - 1
          if (Number.isNaN(idx) || idx < 0 || idx >= preset.models.length) {
            setErrorText(`请输入 1-${preset.models.length} 之间的序号，或直接回车`)
            return null
          }
          chosen.current.model = preset.models[idx]!
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

        const c = chosen.current
        const config: ModelConfig = {
          provider: c.preset?.provider ?? 'openai-compatible',
          apiKey: c.apiKey,
          baseUrl: c.baseUrl,
          model: c.model,
          maxTokens: 4096,
          temperature: 0.7,
          timeoutMs: 60_000,
        }

        await writeModelConfig(config)
        setStep('done')

        return {
          config,
          message: `已保存到 ~/.adnify-cli/config.json\n当前模型：${config.model} (${config.baseUrl})\n重启 CLI 后生效，或使用 :model 切换。`,
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
