import { describe, expect, test } from 'bun:test'
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
})
