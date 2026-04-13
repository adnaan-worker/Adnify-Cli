import { describe, expect, test } from 'bun:test'
import { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import type {
  AssistantReply,
  AssistantResponderCommand,
  AssistantResponderPort,
  AssistantStreamChunk,
} from '../ports/AssistantResponderPort'
import type { CliConfigPort } from '../ports/CliConfigPort'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import type { WorkspaceContextPort } from '../ports/WorkspaceContextPort'
import { SubmitPromptUseCase } from './SubmitPromptUseCase'
import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'

function createMockLogger(): LoggerPort {
  return {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }
}

function createMockClock(time: Date): ClockPort {
  return { now: () => time }
}

let idCounter = 0
function createMockIdGenerator(): IdGeneratorPort {
  idCounter = 0
  return { next: () => `id-${++idCounter}` }
}

function createMockWorkspace(): WorkspaceContextPort {
  return {
    inspect: async () =>
      new WorkspaceContext({
        rootPath: '/test/workspace',
        isGitRepository: true,
        packageManager: 'bun',
        topLevelEntries: ['src', 'package.json'],
      }),
  }
}

function createMockConfig(): CliConfigPort {
  return {
    getAssistantProfile: () =>
      new AssistantProfile({
        id: 'test',
        name: 'Test',
        author: 'test',
        tagline: 'test',
        description: 'test',
        defaultMode: 'agent',
      }),
    getModelConfig: () =>
      ({
        provider: 'openai-compatible',
        apiKey: '',
        baseUrl: 'http://localhost',
        model: 'test',
        maxTokens: 100,
        temperature: 0,
        timeoutMs: 5000,
      }) satisfies ModelConfig,
    getProviders: () => ({}),
    switchModel: () => null,
    getToolCatalog: () => [],
    getLocalCommands: () => [],
  }
}

function createMockResponder(reply: string): AssistantResponderPort {
  return {
    generateReply: async (): Promise<AssistantReply> => ({ content: reply }),
    async *streamReply(): AsyncIterable<AssistantStreamChunk> {
      yield { delta: reply, done: false }
      yield { delta: '', done: true }
    },
  }
}

function createMockSessionRepo(): SessionRepositoryPort & { sessions: Map<string, ConversationSession> } {
  const sessions = new Map<string, ConversationSession>()
  return {
    sessions,
    save: async (session) => { sessions.set(session.id, session.clone()) },
    findById: async (id) => sessions.get(id)?.clone() ?? null,
  }
}

describe('SubmitPromptUseCase', () => {
  test('execute should append user and assistant messages', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-1',
      title: 'test',
      mode: 'agent',
      workspacePath: '/test/workspace',
      createdAt: new Date('2026-01-01'),
    })
    await repo.save(session)

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      createMockResponder('回复内容'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
    )

    const result = await useCase.execute({ sessionId: 'sess-1', prompt: '你好' })

    expect(result.session.getMessages()).toHaveLength(2)
    expect(result.session.getMessages()[0]?.role).toBe('user')
    expect(result.session.getMessages()[0]?.content).toBe('你好')
    expect(result.session.getMessages()[1]?.role).toBe('assistant')
    expect(result.session.getMessages()[1]?.content).toBe('回复内容')
  })

  test('execute should ignore empty prompt', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-2',
      title: 'test',
      mode: 'chat',
      workspacePath: '/test',
      createdAt: new Date('2026-01-01'),
    })
    await repo.save(session)

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      createMockResponder('不应被调用'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date()),
      createMockLogger(),
    )

    const result = await useCase.execute({ sessionId: 'sess-2', prompt: '   ' })

    expect(result.statusLine).toBe('输入为空，已忽略。')
    expect(result.session.getMessages()).toHaveLength(0)
  })

  test('execute should throw for missing session', async () => {
    const repo = createMockSessionRepo()

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      createMockResponder('x'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date()),
      createMockLogger(),
    )

    expect(useCase.execute({ sessionId: 'not-exist', prompt: 'hello' })).rejects.toThrow(
      'Session not found',
    )
  })

  test('executeStreaming should call onChunk and onDone', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-3',
      title: 'test',
      mode: 'agent',
      workspacePath: '/test',
      createdAt: new Date('2026-01-01'),
    })
    await repo.save(session)

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      createMockResponder('流式回复'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
    )

    const chunks: string[] = []
    let doneContent = ''

    const result = await useCase.executeStreaming(
      { sessionId: 'sess-3', prompt: '测试流式' },
      {
        onChunk: (delta) => chunks.push(delta),
        onDone: (full) => { doneContent = full },
        onError: () => {},
      },
    )

    expect(chunks).toEqual(['流式回复'])
    expect(doneContent).toBe('流式回复')
    expect(result.session.getMessages()).toHaveLength(2)
    expect(result.session.getMessages()[1]?.content).toBe('流式回复')
  })

  test('executeStreaming should handle errors gracefully', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-4',
      title: 'test',
      mode: 'agent',
      workspacePath: '/test',
      createdAt: new Date('2026-01-01'),
    })
    await repo.save(session)

    const errorResponder: AssistantResponderPort = {
      generateReply: async () => ({ content: '' }),
      async *streamReply() {
        yield { delta: '部分', done: false }
        throw new Error('网络中断')
      },
    }

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      errorResponder,
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
    )

    let errorMsg = ''

    const result = await useCase.executeStreaming(
      { sessionId: 'sess-4', prompt: '会失败的请求' },
      {
        onChunk: () => {},
        onDone: () => {},
        onError: (err) => { errorMsg = err.message },
      },
    )

    expect(errorMsg).toBe('网络中断')
    expect(result.statusLine).toContain('网络中断')
    const messages = result.session.getMessages()
    const lastMsg = messages[messages.length - 1]
    expect(lastMsg?.content).toContain('部分')
    expect(lastMsg?.content).toContain('[响应中断]')
  })
})
