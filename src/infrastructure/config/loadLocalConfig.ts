import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

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

/**
 * 从 ~/.adnify-cli/config.json 和环境变量加载模型配置。
 * 优先级：环境变量 > 配置文件 > 内置默认值。
 */
export async function loadModelConfig(): Promise<ModelConfig> {
  let fileConfig: RawConfigFile = {}

  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    fileConfig = JSON.parse(raw) as RawConfigFile
  } catch {
    // config file not found or invalid — fall through to defaults
  }

  const model = fileConfig.model ?? {}

  return {
    provider: 'openai-compatible',
    apiKey: process.env['ADNIFY_API_KEY'] ?? model.apiKey ?? DEFAULT_MODEL_CONFIG.apiKey,
    baseUrl: process.env['ADNIFY_BASE_URL'] ?? model.baseUrl ?? DEFAULT_MODEL_CONFIG.baseUrl,
    model: process.env['ADNIFY_MODEL'] ?? model.model ?? DEFAULT_MODEL_CONFIG.model,
    maxTokens: model.maxTokens ?? DEFAULT_MODEL_CONFIG.maxTokens,
    temperature: model.temperature ?? DEFAULT_MODEL_CONFIG.temperature,
    timeoutMs: model.timeoutMs ?? DEFAULT_MODEL_CONFIG.timeoutMs,
  }
}
