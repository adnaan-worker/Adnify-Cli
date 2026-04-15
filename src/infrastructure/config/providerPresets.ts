import type { ModelProvider } from '../../domain/assistant/value-objects/ModelConfig'

export interface ProviderPreset {
  label: string
  provider: ModelProvider
  baseUrl: string
  defaultModel: string
  models: string[]
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    label: 'OpenAI',
    provider: 'openai-compatible',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-5', 'o3', 'o4-mini'],
  },
  {
    label: 'OpenAI (Responses API)',
    provider: 'openai-responses',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-5', 'gpt-5.1-codex', 'o3', 'o4-mini'],
  },
  {
    label: 'Anthropic',
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'],
  },
  {
    label: 'Google Gemini',
    provider: 'google',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.5-flash',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  },
  {
    label: 'DeepSeek',
    provider: 'openai-compatible',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  {
    label: 'MiniMax',
    provider: 'openai-compatible',
    baseUrl: 'https://api.minimaxi.com/v1',
    defaultModel: 'MiniMax-M2.7',
    models: ['MiniMax-M2.7'],
  },
  {
    label: 'Ollama (Local)',
    provider: 'openai-compatible',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    models: ['llama3', 'codellama', 'mistral', 'qwen2'],
  },
]
