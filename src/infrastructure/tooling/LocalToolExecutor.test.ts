import { describe, expect, test } from 'bun:test'
import { unlink } from 'node:fs/promises'
import { LocalToolExecutor } from './LocalToolExecutor'
import { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'

function createWorkspace() {
  return new WorkspaceContext({
    rootPath: 'E:/26Project/Adnify-Cli',
    isGitRepository: true,
    packageManager: 'bun',
    topLevelEntries: ['src', 'package.json'],
  })
}

describe('LocalToolExecutor', () => {
  test('should reject unsupported shell commands', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'shell-runner',
      input: '{"argv":["del","foo.txt"]}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(false)
    expect(result.content).toContain('Only read-only commands are allowed')
  })

  test('should validate shell-runner argv payload', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'shell-runner',
      input: '{}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(false)
    expect(result.content).toContain('Missing required field "argv"')
  })

  test('should return workspace summary for workspace-read', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'workspace-read',
      input: '{"focus":"layout"}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(true)
    expect(result.content).toContain('Focus: layout')
    expect(result.content).toContain('Package manager: bun')
  })

  test('should list a directory for file-ops', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'file-ops',
      input: '{"action":"list","path":"src"}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(true)
    expect(result.content).toContain('Directory: src')
  })

  test('should read a file for file-ops', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'file-ops',
      input: '{"action":"read","path":"package.json"}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(true)
    expect(result.content).toContain('File: package.json')
    expect(result.content).toContain('"name": "adnify-cli"')
  })

  test('should reject file-ops paths outside the workspace', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'file-ops',
      input: '{"action":"read","path":"../secret.txt"}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(false)
    expect(result.content).toContain('inside the current workspace')
  })

  test('should require explicit allowWrite flag for file-ops write', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'file-ops',
      input: '{"action":"write","path":"tmp-write-check.txt","content":"hello"}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(false)
    expect(result.content).toContain('allowWrite')
  })

  test('should write a text file for file-ops when explicitly allowed', async () => {
    const executor = new LocalToolExecutor()
    const targetPath = 'tmp-write-check.txt'

    try {
      const result = await executor.execute({
        toolId: 'file-ops',
        input: `{"action":"write","path":"${targetPath}","content":"hello from tool","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      expect(result.ok).toBe(true)
      expect(result.content).toContain(`File written: ${targetPath}`)

      const readResult = await executor.execute({
        toolId: 'file-ops',
        input: `{"action":"read","path":"${targetPath}"}`,
        workspace: createWorkspace(),
      })

      expect(readResult.ok).toBe(true)
      expect(readResult.content).toContain('hello from tool')
    } finally {
      await unlink(`E:/26Project/Adnify-Cli/${targetPath}`).catch(() => {})
    }
  })

  test('should reject binary-like file writes in this build', async () => {
    const executor = new LocalToolExecutor()

    const result = await executor.execute({
      toolId: 'file-ops',
      input: '{"action":"write","path":"image.png","content":"fake","allowWrite":true}',
      workspace: createWorkspace(),
    })

    expect(result.ok).toBe(false)
    expect(result.content).toContain('text-like files')
  })

  test('should update a file with a single targeted replacement', async () => {
    const executor = new LocalToolExecutor()
    const targetPath = 'tmp-update-check.ts'

    try {
      await executor.execute({
        toolId: 'file-ops',
        input: `{"action":"write","path":"${targetPath}","content":"const value = 1;\\n","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      const result = await executor.execute({
        toolId: 'file-ops',
        input:
          `{"action":"update","path":"${targetPath}","oldText":"const value = 1;","newText":"const value = 2;","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      expect(result.ok).toBe(true)
      expect(result.content).toContain(`File updated: ${targetPath}`)

      const readResult = await executor.execute({
        toolId: 'file-ops',
        input: `{"action":"read","path":"${targetPath}"}`,
        workspace: createWorkspace(),
      })

      expect(readResult.ok).toBe(true)
      expect(readResult.content).toContain('const value = 2;')
    } finally {
      await unlink(`E:/26Project/Adnify-Cli/${targetPath}`).catch(() => {})
    }
  })

  test('should reject update when matches are ambiguous', async () => {
    const executor = new LocalToolExecutor()
    const targetPath = 'tmp-update-ambiguous.ts'

    try {
      await executor.execute({
        toolId: 'file-ops',
        input:
          `{"action":"write","path":"${targetPath}","content":"item\\nitem\\n","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      const result = await executor.execute({
        toolId: 'file-ops',
        input:
          `{"action":"update","path":"${targetPath}","oldText":"item","newText":"next","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      expect(result.ok).toBe(false)
      expect(result.content).toContain('Expected 1 match')
    } finally {
      await unlink(`E:/26Project/Adnify-Cli/${targetPath}`).catch(() => {})
    }
  })

  test('should patch all matches when replaceAll is enabled', async () => {
    const executor = new LocalToolExecutor()
    const targetPath = 'tmp-update-all.ts'

    try {
      await executor.execute({
        toolId: 'file-ops',
        input:
          `{"action":"write","path":"${targetPath}","content":"a\\na\\na\\n","allowWrite":true}`,
        workspace: createWorkspace(),
      })

      const result = await executor.execute({
        toolId: 'file-ops',
        input:
          `{"action":"patch","path":"${targetPath}","oldText":"a","newText":"b","replaceAll":true,"allowWrite":true}`,
        workspace: createWorkspace(),
      })

      expect(result.ok).toBe(true)
      expect(result.content).toContain('Replacements: 3')

      const readResult = await executor.execute({
        toolId: 'file-ops',
        input: `{"action":"read","path":"${targetPath}"}`,
        workspace: createWorkspace(),
      })

      expect(readResult.ok).toBe(true)
      expect(readResult.content).toContain('b\nb\nb')
    } finally {
      await unlink(`E:/26Project/Adnify-Cli/${targetPath}`).catch(() => {})
    }
  })
})
