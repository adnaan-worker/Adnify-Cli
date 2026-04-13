export type ModelProvider = 'openai-compatible' | 'openai-responses' | 'anthropic' | 'google'

export interface ModelConfig {
  provider: ModelProvider
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
  timeoutMs: number
}

export interface ProviderConfig {
  provider: ModelProvider
  apiKey: string
  baseUrl: string
  models: string[]
}

export interface ProvidersMap {
  [name: string]: ProviderConfig
}
