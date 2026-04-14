import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

const CONFIG_DIR = join(homedir(), '.adnify-cli')
const CONFIG_PATH = join(CONFIG_DIR, 'config.json')

/**
 * 将模型配置写入 ~/.adnify-cli/config.json。
 * 保留已有的 providers 配置，只覆盖 model 字段。
 */
export async function writeModelConfig(config: ModelConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true })

  let existing: Record<string, unknown> = {}
  try {
    const raw = await readFile(CONFIG_PATH, 'utf-8')
    existing = JSON.parse(raw) as Record<string, unknown>
  } catch {
    // no existing config
  }

  existing['model'] = {
    provider: config.provider,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    timeoutMs: config.timeoutMs,
  }

  await writeFile(CONFIG_PATH, JSON.stringify(existing, null, 2) + '\n', 'utf-8')
}
