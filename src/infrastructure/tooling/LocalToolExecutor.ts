import { readFile, readdir } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type {
  ToolExecutionRequest,
  ToolExecutionResult,
} from '../../application/ports/ToolExecutorPort'
import type { ToolExecutorPort } from '../../application/ports/ToolExecutorPort'

const execFileAsync = promisify(execFile)
const DEFAULT_SEARCH_LIMIT = 8
const MAX_SCAN_FILES = 200
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.txt',
  '.yml',
  '.yaml',
  '.toml',
  '.css',
  '.scss',
  '.html',
])

export class LocalToolExecutor implements ToolExecutorPort {
  async execute(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    switch (request.toolId) {
      case 'workspace-read':
        return this.executeWorkspaceRead(request)
      case 'search-index':
        return this.executeSearchIndex(request)
      default:
        return {
          toolId: request.toolId,
          ok: false,
          content: `Tool "${request.toolId}" is not implemented yet.`,
        }
    }
  }

  private async executeWorkspaceRead(
    request: ToolExecutionRequest,
  ): Promise<ToolExecutionResult> {
    const prompt = parseJsonObject(request.input)
    const focus = typeof prompt.focus === 'string' ? prompt.focus : 'workspace'
    const entries = request.workspace.topLevelEntries.slice(0, 12).join(', ') || '(empty)'

    return {
      toolId: request.toolId,
      ok: true,
      content: [
        `Focus: ${focus}`,
        `Root: ${request.workspace.rootPath}`,
        `Git: ${request.workspace.isGitRepository ? 'yes' : 'no'}`,
        `Package manager: ${request.workspace.packageManager}`,
        `Top-level entries: ${entries}`,
      ].join('\n'),
    }
  }

  private async executeSearchIndex(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const prompt = parseJsonObject(request.input)
    const query = typeof prompt.query === 'string' ? prompt.query.trim() : ''
    const limit =
      typeof prompt.limit === 'number' && Number.isFinite(prompt.limit)
        ? Math.max(1, Math.min(20, Math.trunc(prompt.limit)))
        : DEFAULT_SEARCH_LIMIT

    if (!query) {
      return {
        toolId: request.toolId,
        ok: false,
        content: 'Missing required field "query".',
      }
    }

    const rgResult = await this.tryRipgrepSearch(request.workspace.rootPath, query, limit)
    if (rgResult) {
      return {
        toolId: request.toolId,
        ok: true,
        content: rgResult,
      }
    }

    return {
      toolId: request.toolId,
      ok: true,
      content: await this.fallbackSearch(request.workspace.rootPath, query, limit),
    }
  }

  private async tryRipgrepSearch(
    rootPath: string,
    query: string,
    limit: number,
  ): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync(
        'rg',
        ['--line-number', '--no-heading', '--color', 'never', '--max-count', String(limit), query, '.'],
        { cwd: rootPath, windowsHide: true, maxBuffer: 1024 * 1024 },
      )

      const trimmed = stdout.trim()
      return trimmed || 'No matches found.'
    } catch {
      return null
    }
  }

  private async fallbackSearch(rootPath: string, query: string, limit: number): Promise<string> {
    const files = await collectSearchableFiles(rootPath, MAX_SCAN_FILES)
    const matches: string[] = []

    for (const filePath of files) {
      if (matches.length >= limit) {
        break
      }

      let content: string
      try {
        content = await readFile(filePath, 'utf8')
      } catch {
        continue
      }

      const lines = content.split(/\r?\n/g)
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        if (!line || !line.includes(query)) {
          continue
        }

        matches.push(`${relative(rootPath, filePath)}:${index + 1}:${line.trim()}`)
        if (matches.length >= limit) {
          break
        }
      }
    }

    return matches.length > 0 ? matches.join('\n') : 'No matches found.'
  }
}

async function collectSearchableFiles(rootPath: string, limit: number): Promise<string[]> {
  const queue = [resolve(rootPath)]
  const files: string[] = []

  while (queue.length > 0 && files.length < limit) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of entries) {
      if (files.length >= limit) {
        break
      }

      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue
      }

      const nextPath = join(current, entry.name)
      if (entry.isDirectory()) {
        queue.push(nextPath)
        continue
      }

      if (TEXT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        files.push(nextPath)
      }
    }
  }

  return files
}

function parseJsonObject(input: string): Record<string, unknown> {
  if (!input.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(input)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {}
  } catch {
    return {}
  }
}
