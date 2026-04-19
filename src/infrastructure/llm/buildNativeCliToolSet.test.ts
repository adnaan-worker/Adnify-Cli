import { describe, expect, test } from 'bun:test'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import { buildNativeCliToolSet } from './buildNativeCliToolSet'

const silentLogger: LoggerPort = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
}

describe('buildNativeCliToolSet', () => {
  test('file_ops read rejects path traversal', async () => {
    const root = await mkdtemp(join(tmpdir(), 'adnify-cli-tools-'))
    await writeFile(join(root, 'safe.txt'), 'hello', 'utf8')

    const tools = buildNativeCliToolSet({
      workspacePath: root,
      toolCatalog: [
        {
          id: 'file-ops',
          name: 'File Ops',
          description: 'test',
          category: 'filesystem',
          riskLevel: 'careful',
        },
      ],
      logger: silentLogger,
    })

    const fileOps = tools.file_ops as {
      execute?: (input: { operation: 'read_file'; relativePath: string }) => Promise<unknown>
    }

    await expect(
      fileOps.execute?.({ operation: 'read_file', relativePath: join('..', 'outside') }),
    ).rejects.toThrow()

    const read = await fileOps.execute?.({ operation: 'read_file', relativePath: 'safe.txt' })
    expect(read).toMatchObject({ content: 'hello' })
  })
})
