export interface ModelConfig {
  provider: 'openai-compatible'
  apiKey: string
  baseUrl: string
  model: string
  maxTokens: number
  temperature: number
  timeoutMs: number
}
