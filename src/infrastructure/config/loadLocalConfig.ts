import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ModelConfig, ModelProvider, ProvidersMap } from '../../domain/assistant/value-objects/ModelConfig'

const VALID_PROVIDERS = new Set<ModelProvider>(['openai-compatible', 'openai-responses', 'anthropic', 'google'])

interface RawConfigFile {
  model?: {
    provider?: string
    apiKey?: string
    baseUrl?: string
    model?: string
    maxTokens?: number
    temperature?: number
    timeoutMs?: number
  }
  providers?: Record<string, {
    provider?: string
    apiKey?: string
    baseUrl?: string
    models?: string[]
  }>
}

const CONFIG_DIR = join(homedir(), '.adnify-cli')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

const DEFAULT_MODEL_CONFIG: ModelConfig = {
  provider: 'openai-compatible',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  maxTokens: 4096,
  temperature: 0.7,
  timeoutMs: 60_000,
}

function parseProvider(value: string | undefined): ModelProvider {
  if (value && VALID_PROVIDERS.has(value as ModelProvider)) return value as ModelProvider
  return 'openai-compatible'
}

async function readConfigFile(): Promise<RawConfigFile> {
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(raw) as RawConfigFile
  } catch {
    return {}
  }
}

/**
 * 从 ~/.adnify-cli/config.json 和环境变量加载模型配置。
 * 优先级：环境变量 > 配置文件 > 内置默认值。
 */
export async function loadModelConfig(): Promise<ModelConfig> {
  const fileConfig = await readConfigFile()
  const model = fileConfig.model ?? {}

  return {
    provider: parseProvider(process.env['ADNIFY_PROVIDER'] ?? model.provider),
    apiKey: process.env['ADNIFY_API_KEY'] ?? model.apiKey ?? DEFAULT_MODEL_CONFIG.apiKey,
    baseUrl: process.env['ADNIFY_BASE_URL'] ?? model.baseUrl ?? DEFAULT_MODEL_CONFIG.baseUrl,
    model: process.env['ADNIFY_MODEL'] ?? model.model ?? DEFAULT_MODEL_CONFIG.model,
    maxTokens: model.maxTokens ?? DEFAULT_MODEL_CONFIG.maxTokens,
    temperature: model.temperature ?? DEFAULT_MODEL_CONFIG.temperature,
    timeoutMs: model.timeoutMs ?? DEFAULT_MODEL_CONFIG.timeoutMs,
  }
}

/**
 * 加载 providers 配置，用于运行时切换模型。
 */
export async function loadProviders(): Promise<ProvidersMap> {
  const fileConfig = await readConfigFile()
  const raw = fileConfig.providers ?? {}
  const result: ProvidersMap = {}

  for (const [name, entry] of Object.entries(raw)) {
    if (entry.apiKey && entry.baseUrl) {
      result[name] = {
        provider: parseProvider(entry.provider),
        apiKey: entry.apiKey,
        baseUrl: entry.baseUrl,
        models: entry.models ?? [],
      }
    }
  }

  return result
}
