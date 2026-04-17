import { describe, expect, test } from 'bun:test'
import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'
import type { AssistantPromptSet } from '../dto/AssistantPromptSet'
import { createAppI18n } from '../i18n/AppI18n'
import type {
  AssistantReply,
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
  const promptSet: AssistantPromptSet = {
    core: 'core prompt',
    modes: {
      chat: 'chat prompt',
      agent: 'agent prompt',
      plan: 'plan prompt',
    },
  }

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
    getAssistantPromptSet: () => promptSet,
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
    getStorage: () => ({
      dataRoot: '/tmp/adnify',
      configPath: '/tmp/adnify/config.json',
      sessionsDir: '/tmp/adnify/sessions',
      source: 'default',
      isCustom: false,
    }),
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
    save: async (session) => {
      sessions.set(session.id, session.clone())
    },
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
      createMockResponder('reply content'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
      createAppI18n('en'),
    )

    const result = await useCase.execute({ sessionId: 'sess-1', prompt: 'hello' })

    expect(result.session.getMessages()).toHaveLength(2)
    expect(result.session.getMessages()[0]?.role).toBe('user')
    expect(result.session.getMessages()[0]?.content).toBe('hello')
    expect(result.session.getMessages()[1]?.role).toBe('assistant')
    expect(result.session.getMessages()[1]?.content).toBe('reply content')
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
      createMockResponder('unused'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date()),
      createMockLogger(),
      createAppI18n('en'),
    )

    const result = await useCase.execute({ sessionId: 'sess-2', prompt: '   ' })

    expect(result.statusLine).toBe('Empty input ignored.')
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
      createAppI18n('en'),
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
      createMockResponder('stream reply'),
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
      createAppI18n('en'),
    )

    const chunks: string[] = []
    let doneContent = ''

    const result = await useCase.executeStreaming(
      { sessionId: 'sess-3', prompt: 'test stream' },
      {
        onChunk: (delta) => chunks.push(delta),
        onDone: (full) => {
          doneContent = full
        },
        onError: () => {},
      },
    )

    expect(chunks).toEqual(['stream reply'])
    expect(doneContent).toBe('stream reply')
    expect(result.session.getMessages()).toHaveLength(2)
    expect(result.session.getMessages()[1]?.content).toBe('stream reply')
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
        yield { delta: 'partial', done: false }
        throw new Error('network interrupted')
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
      createAppI18n('en'),
    )

    let errorMsg = ''

    const result = await useCase.executeStreaming(
      { sessionId: 'sess-4', prompt: 'failing request' },
      {
        onChunk: () => {},
        onDone: () => {},
        onError: (err) => {
          errorMsg = err.message
        },
      },
    )

    expect(errorMsg).toBe('network interrupted')
    expect(result.statusLine).toContain('network interrupted')
    const messages = result.session.getMessages()
    const lastMsg = messages[messages.length - 1]
    expect(lastMsg?.content).toContain('partial')
    expect(lastMsg?.content).toContain('[Response interrupted]')
  })

  test('executeStreaming should stop cleanly when aborted', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-5',
      title: 'test',
      mode: 'agent',
      workspacePath: '/test',
      createdAt: new Date('2026-01-01'),
    })
    await repo.save(session)

    const abortAwareResponder: AssistantResponderPort = {
      generateReply: async () => ({ content: '' }),
      async *streamReply(command) {
        yield { delta: 'partial ', done: false }
        await new Promise((resolve) => setTimeout(resolve, 10))
        if (command.abortSignal?.aborted) {
          throw new Error('Request aborted')
        }
        yield { delta: 'tail', done: true }
      },
    }

    const useCase = new SubmitPromptUseCase(
      repo,
      createMockWorkspace(),
      abortAwareResponder,
      createMockConfig(),
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00Z')),
      createMockLogger(),
      createAppI18n('en'),
    )

    const controller = new AbortController()
    let firstChunk = true

    const result = await useCase.executeStreaming(
      { sessionId: 'sess-5', prompt: 'abort me', abortSignal: controller.signal },
      {
        onChunk: () => {
          if (firstChunk) {
            firstChunk = false
            controller.abort(new Error('user-abort'))
          }
        },
        onDone: () => {},
        onError: () => {},
      },
    )

    expect(result.statusLine).toBe('Current execution aborted.')
    const messages = result.session.getMessages()
    expect(messages[messages.length - 1]?.content).toContain('partial')
  })
})
