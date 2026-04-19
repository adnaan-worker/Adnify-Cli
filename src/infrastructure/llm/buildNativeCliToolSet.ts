import { spawn } from 'node:child_process'
import { open, readdir, readFile, stat } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { tool, zodSchema, type ToolSet } from 'ai'
import { z } from 'zod'
import { nativeToolKeyFromCatalogId } from '../../application/tooling/nativeToolKey'
import { evaluateShellCommandPolicy } from '../../application/tooling/ToolShellPolicy'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type { ToolRegistryPort } from '../../application/ports/ToolRegistryPort'
import type { ToolDescriptorProps } from '../../domain/tooling/entities/ToolDescriptor'
import { PromptBundleNativeToolRegistry } from '../tooling/PromptBundleNativeToolRegistry'

const KNOWN_TOOL_IDS = ['workspace-read', 'file-ops', 'shell-runner', 'search-index'] as const

type KnownToolId = (typeof KNOWN_TOOL_IDS)[number]

export interface BuildNativeCliToolSetParams {
  workspacePath: string
  toolCatalog: ToolDescriptorProps[]
  logger: LoggerPort
  /** 可选；默认使用与 `prompts/tools` 对齐的内置注册表。 */
  toolRegistry?: ToolRegistryPort
}

function resolveUnderWorkspace(root: string, rel: string | undefined): string {
  if (!rel || rel === '.' || rel === '') {
    return root
  }

  const abs = resolve(root, rel)
  const relToRoot = relative(root, abs)
  if (relToRoot.startsWith('..') || relToRoot === '..') {
    throw new Error('Path escapes workspace root')
  }

  return abs
}

async function readTextFileLimited(absPath: string, maxBytes: number): Promise<string> {
  const s = await stat(absPath)
  if (!s.isFile()) {
    throw new Error('Not a regular file')
  }

  if (s.size > maxBytes) {
    const buf = Buffer.alloc(maxBytes)
    const handle = await open(absPath, 'r')
    try {
      await handle.read(buf, 0, maxBytes, 0)
    } finally {
      await handle.close()
    }

    return `${buf.toString('utf8')}\n\n[truncated: file exceeds ${maxBytes} bytes]`
  }

  return readFile(absPath, 'utf8')
}

async function workspaceSummary(root: string): Promise<Record<string, unknown>> {
  const entries = await readdir(root)
  let packageJson: unknown
  try {
    packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as unknown
  } catch {
    packageJson = null
  }

  return {
    rootPath: root,
    topLevelEntries: entries,
    packageJson:
      packageJson && typeof packageJson === 'object' && packageJson !== null
        ? {
            name: (packageJson as { name?: string }).name,
            version: (packageJson as { version?: string }).version,
            description: (packageJson as { description?: string }).description,
          }
        : null,
  }
}

function runShell(command: string, cwd: string, timeoutMs: number): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('sh', ['-c', command], { cwd, env: process.env })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error(`Shell command timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    child.stdout?.on('data', (d) => {
      out += d.toString()
    })
    child.stderr?.on('data', (d) => {
      err += d.toString()
    })

    child.on('error', (e) => {
      clearTimeout(timer)
      reject(e)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      const combined = [out.trimEnd(), err.trimEnd()].filter(Boolean).join('\nstderr:\n')
      if (code !== 0 && !combined) {
        resolvePromise(`(exit ${code})`)
      } else {
        resolvePromise(combined || `(exit ${code})`)
      }
    })
  })
}

async function runRipgrep(
  root: string,
  pattern: string,
  subdir: string | undefined,
  maxMatches: number,
): Promise<string> {
  const cwd = resolveUnderWorkspace(root, subdir)
  const rgArgs = ['-n', '--max-count', String(maxMatches), '--hidden', '--glob', '!.git/**', pattern, '.']

  return new Promise((resolvePromise, reject) => {
    const child = spawn('rg', rgArgs, { cwd, env: process.env })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('ripgrep timed out'))
    }, 25_000)

    child.stdout?.on('data', (d) => {
      out += d.toString()
    })
    child.stderr?.on('data', (d) => {
      err += d.toString()
    })

    child.on('error', (e) => {
      clearTimeout(timer)
      const errMsg = e instanceof Error ? e.message : String(e)
      if (errMsg.includes('ENOENT')) {
        resolvePromise(
          'ripgrep (rg) is not available on PATH. Install ripgrep or narrow the question to specific files.',
        )
        return
      }

      reject(e)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 1 && !out) {
        resolvePromise('No matches.')
        return
      }

      if (code !== 0 && code !== 1) {
        resolvePromise(`${out}\n${err || `(rg exit ${code})`}`.trim())
        return
      }

      resolvePromise(out.trimEnd() || 'No matches.')
    })
  })
}

function catalogById(catalog: ToolDescriptorProps[]): Map<string, ToolDescriptorProps> {
  const map = new Map<string, ToolDescriptorProps>()
  for (const item of catalog) {
    map.set(item.id, item)
  }

  return map
}

function descriptorFor(id: KnownToolId, map: Map<string, ToolDescriptorProps>): ToolDescriptorProps | undefined {
  return map.get(id)
}

/**
 * Builds AI SDK native tools aligned with `prompts/tools/*.md` catalog entries.
 */
export function buildNativeCliToolSet(params: BuildNativeCliToolSetParams): ToolSet {
  const registry = params.toolRegistry ?? new PromptBundleNativeToolRegistry()
  const executableCatalog = registry.resolveExecutableCatalog(params.toolCatalog)
  const byId = catalogById(executableCatalog)
  const tools = {} as Record<string, unknown>
  const root = params.workspacePath
  const log = params.logger

  const addIfPresent = (id: KnownToolId, factory: (d: ToolDescriptorProps) => void) => {
    const d = descriptorFor(id, byId)
    if (!d) {
      return
    }

    factory(d)
  }

  addIfPresent('workspace-read', (d) => {
    const key = nativeToolKeyFromCatalogId(d.id)
    const schema = z.object({
      scope: z
        .enum(['workspace_summary', 'list_directory', 'read_text_file'])
        .describe('What kind of workspace inspection to perform.'),
      relativePath: z
        .string()
        .optional()
        .describe('Path relative to workspace root; required for list_directory and read_text_file.'),
      maxBytes: z.number().optional().default(200_000),
    })

    tools[key] = tool({
      description: `${d.description} (catalog id: ${d.id})`,
      inputSchema: zodSchema(schema),
      execute: async (input: z.infer<typeof schema>) => {
        switch (input.scope) {
          case 'workspace_summary':
            return workspaceSummary(root)
          case 'list_directory': {
            const dir = resolveUnderWorkspace(root, input.relativePath)
            const names = await readdir(dir)
            return { path: dir, entries: names }
          }
          case 'read_text_file': {
            if (!input.relativePath) {
              throw new Error('relativePath is required for read_text_file')
            }

            const file = resolveUnderWorkspace(root, input.relativePath)
            const text = await readTextFileLimited(file, input.maxBytes ?? 200_000)
            return { path: file, content: text }
          }
          default:
            throw new Error('Unsupported scope')
        }
      },
    })
  })

  addIfPresent('file-ops', (d) => {
    const key = nativeToolKeyFromCatalogId(d.id)
    const schema = z.object({
      operation: z
        .enum(['read_file', 'list_directory'])
        .describe('MVP file access: read a text file or list a directory (writes are not enabled yet).'),
      relativePath: z.string().describe('Path relative to the workspace root.'),
      maxBytes: z.number().optional().default(200_000),
    })

    tools[key] = tool({
      description: `${d.description} (catalog id: ${d.id}; writes disabled pending approval flow.)`,
      inputSchema: zodSchema(schema),
      execute: async (input: z.infer<typeof schema>) => {
        const abs = resolveUnderWorkspace(root, input.relativePath)
        if (input.operation === 'list_directory') {
          const names = await readdir(abs)
          return { path: abs, entries: names }
        }

        const text = await readTextFileLimited(abs, input.maxBytes ?? 200_000)
        return { path: abs, content: text }
      },
    })
  })

  addIfPresent('search-index', (d) => {
    const key = nativeToolKeyFromCatalogId(d.id)
    const schema = z.object({
      pattern: z.string().min(1).describe('Search pattern passed to ripgrep.'),
      relativePath: z.string().optional().describe('Optional subdirectory (relative to workspace) to search under.'),
      maxMatches: z.number().optional().default(40),
    })

    tools[key] = tool({
      description: `${d.description} (catalog id: ${d.id}; uses ripgrep when available.)`,
      inputSchema: zodSchema(schema),
      execute: async (input: z.infer<typeof schema>) => {
        return runRipgrep(root, input.pattern, input.relativePath, input.maxMatches ?? 40)
      },
    })
  })

  addIfPresent('shell-runner', (d) => {
    const key = nativeToolKeyFromCatalogId(d.id)
    const schema = z.object({
      command: z.string().min(1).describe('Shell command to run under the workspace root cwd.'),
    })

    tools[key] = tool({
      description: `${d.description} (catalog id: ${d.id}; commands are filtered by a conservative placeholder policy.)`,
      inputSchema: zodSchema(schema),
      execute: async (input: z.infer<typeof schema>) => {
        const gate = evaluateShellCommandPolicy(input.command)
        if (!gate.allowed) {
          return { ok: false, blocked: true, reason: gate.reason ?? 'blocked' }
        }

        log.info('Executing shell tool (policy-approved)', {
          preview: input.command.slice(0, 120),
        })

        try {
          const output = await runShell(input.command, root, 60_000)
          return { ok: true, output }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          return { ok: false, output: message }
        }
      },
    })
  })

  return tools as ToolSet
}

