import { readFile, readdir, stat } from 'node:fs/promises'
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
const MAX_DIRECTORY_ENTRIES = 40
const MAX_FILE_READ_CHARS = 12_000
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
      case 'file-ops':
        return this.executeFileOps(request)
      case 'shell-runner':
        return this.executeShellRunner(request)
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

  private async executeFileOps(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const prompt = parseJsonObject(request.input)
    const action = typeof prompt.action === 'string' ? prompt.action.trim().toLowerCase() : 'read'
    const rawPath = typeof prompt.path === 'string' ? prompt.path.trim() : '.'

    const resolvedPath = resolveWorkspacePath(request.workspace.rootPath, rawPath)
    if (!resolvedPath) {
      return {
        toolId: request.toolId,
        ok: false,
        content: 'Path must stay inside the current workspace.',
      }
    }

    if (action === 'read') {
      try {
        const fileInfo = await stat(resolvedPath)
        if (!fileInfo.isFile()) {
          return {
            toolId: request.toolId,
            ok: false,
            content: 'The requested path is not a file.',
          }
        }

        const content = await readFile(resolvedPath, 'utf8')
        const relativePath = relative(request.workspace.rootPath, resolvedPath) || '.'
        const truncated =
          content.length > MAX_FILE_READ_CHARS
            ? `${content.slice(0, MAX_FILE_READ_CHARS)}\n\n[truncated]`
            : content

        return {
          toolId: request.toolId,
          ok: true,
          content: [`File: ${relativePath}`, '', truncated].join('\n'),
        }
      } catch (error) {
        return {
          toolId: request.toolId,
          ok: false,
          content: error instanceof Error ? error.message : 'Failed to read the file.',
        }
      }
    }

    if (action === 'list') {
      try {
        const directoryInfo = await stat(resolvedPath)
        if (!directoryInfo.isDirectory()) {
          return {
            toolId: request.toolId,
            ok: false,
            content: 'The requested path is not a directory.',
          }
        }

        const entries = await readdir(resolvedPath, { withFileTypes: true })
        const lines = entries
          .filter((entry) => entry.name !== '.git' && entry.name !== 'node_modules')
          .slice(0, MAX_DIRECTORY_ENTRIES)
          .map((entry) => `${entry.isDirectory() ? 'dir ' : 'file'} ${entry.name}`)

        return {
          toolId: request.toolId,
          ok: true,
          content: [
            `Directory: ${relative(request.workspace.rootPath, resolvedPath) || '.'}`,
            ...lines,
          ].join('\n'),
        }
      } catch (error) {
        return {
          toolId: request.toolId,
          ok: false,
          content: error instanceof Error ? error.message : 'Failed to list the directory.',
        }
      }
    }

    return {
      toolId: request.toolId,
      ok: false,
      content: 'Unsupported file-ops action. Supported: read, list.',
    }
  }

  private async executeShellRunner(
    request: ToolExecutionRequest,
  ): Promise<ToolExecutionResult> {
    const prompt = parseJsonObject(request.input)
    const argv = Array.isArray(prompt.argv)
      ? prompt.argv.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : []

    if (argv.length === 0) {
      return {
        toolId: request.toolId,
        ok: false,
        content:
          'Missing required field "argv". Example: {"argv":["rg","useCliController","src"]}',
      }
    }

    const validation = validateReadonlyCommand(argv)
    if (!validation.ok) {
      return {
        toolId: request.toolId,
        ok: false,
        content: validation.reason,
      }
    }

    try {
      const { stdout, stderr } = await execFileAsync(argv[0]!, argv.slice(1), {
        cwd: request.workspace.rootPath,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      })

      const output = [stdout.trim(), stderr.trim()].filter(Boolean).join('\n')
      return {
        toolId: request.toolId,
        ok: true,
        content: output || 'Command completed with no output.',
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Shell command execution failed.'
      return {
        toolId: request.toolId,
        ok: false,
        content: message,
      }
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

function resolveWorkspacePath(rootPath: string, candidatePath: string): string | null {
  const workspaceRoot = resolve(rootPath)
  const nextPath = resolve(workspaceRoot, candidatePath || '.')

  if (nextPath === workspaceRoot) {
    return nextPath
  }

  return nextPath.startsWith(`${workspaceRoot}\\`) || nextPath.startsWith(`${workspaceRoot}/`)
    ? nextPath
    : null
}

function validateReadonlyCommand(
  argv: string[],
): { ok: true } | { ok: false; reason: string } {
  const command = argv[0]?.toLowerCase()
  if (!command) {
    return { ok: false, reason: 'Missing command name.' }
  }

  if (command === 'rg') {
    return { ok: true }
  }

  if (command === 'git') {
    const subcommand = argv[1]?.toLowerCase()
    const allowed = new Set(['status', 'diff', 'log', 'show', 'branch', 'rev-parse'])
    if (!subcommand || !allowed.has(subcommand)) {
      return {
        ok: false,
        reason:
          'Only read-only git commands are allowed: status, diff, log, show, branch, rev-parse.',
      }
    }

    return { ok: true }
  }

  return {
    ok: false,
    reason: 'Only read-only commands are allowed in this build. Supported: rg, git status/diff/log/show/branch/rev-parse.',
  }
}
