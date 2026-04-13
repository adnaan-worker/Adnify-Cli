export interface ModelConfig {
  provider: 'openai-compatible'
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
  timeoutMs: number
}

export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  models: string[]
}

export interface ProvidersMap {
  [name: string]: ProviderConfig
}
