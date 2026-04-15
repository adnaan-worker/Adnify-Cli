import { describe, expect, test } from 'bun:test'
import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'
import { parseCliTranscriptMarkup } from '../support/CliTranscriptMarkup'
import type { ClockPort } from '../ports/ClockPort'
import type { IdGeneratorPort } from '../ports/IdGeneratorPort'
import type { LoggerPort } from '../ports/LoggerPort'
import type { SessionRepositoryPort } from '../ports/SessionRepositoryPort'
import { ApplyCliCommandUseCase } from './ApplyCliCommandUseCase'

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

function createBootstrapSnapshot() {
  return {
    profile: new AssistantProfile({
      id: 'adnify',
      name: 'Adnify-Cli',
      author: 'adnaan',
      tagline: 'test',
      description: 'test',
      defaultMode: 'agent',
    }),
    workspace: new WorkspaceContext({
      rootPath: 'E:/26Project/Adnify-Cli',
      isGitRepository: true,
      packageManager: 'bun',
      topLevelEntries: ['src', 'package.json'],
    }),
    modelConfig: {
      provider: 'openai-compatible',
      apiKey: 'sk-test-1234567890',
      baseUrl: 'https://example.com',
      model: 'gpt-5.4',
      maxTokens: 8192,
      temperature: 0.2,
      timeoutMs: 30_000,
    } satisfies ModelConfig,
    providers: {
      openai: {
        provider: 'openai-compatible',
        apiKey: 'sk-openai',
        baseUrl: 'https://api.openai.com/v1',
        models: ['gpt-5', 'gpt-5.4'],
      },
    },
    supportedModes: ['chat', 'agent', 'plan'],
    toolCatalog: [
      new ToolDescriptor({
        id: 'shell',
        name: 'shell',
        description: 'run shell commands',
        category: 'execution',
        riskLevel: 'careful',
      }),
    ],
    localCommands: [':help', ':mode chat', ':workspace', ':tools', ':model', ':config', ':clear'],
    welcomeMessage: 'hello',
  }
}

describe('ApplyCliCommandUseCase', () => {
  test('should append structured command input and output for help', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-help',
      title: 'test',
      mode: 'agent',
      workspacePath: 'E:/26Project/Adnify-Cli',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    await repo.save(session)

    const useCase = new ApplyCliCommandUseCase(
      repo,
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:01:00.000Z')),
      createMockLogger(),
    )

    const result = await useCase.execute({
      sessionId: session.id,
      commandLine: ':help',
      bootstrap: createBootstrapSnapshot(),
    })

    const messages = result.session.getMessages()
    expect(messages).toHaveLength(2)

    expect(parseCliTranscriptMarkup(messages[0]?.content ?? '')).toEqual({
      kind: 'command-input',
      content: '/help',
    })

    expect(parseCliTranscriptMarkup(messages[1]?.content ?? '')).toEqual({
      kind: 'command-output',
      title: 'commands',
      tone: 'info',
      content: '本地命令列表：\n- :help\n- :mode chat\n- :workspace\n- :tools\n- :model\n- :config\n- :clear',
    })
  })

  test('should clear existing conversation before appending clear transcript', async () => {
    const repo = createMockSessionRepo()
    const session = ConversationSession.create({
      id: 'sess-clear',
      title: 'test',
      mode: 'agent',
      workspacePath: 'E:/26Project/Adnify-Cli',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })
    session.addUserMessage('existing-user', new Date('2026-01-01T00:00:10.000Z'), 'legacy prompt')
    session.addAssistantMessage(
      'existing-assistant',
      new Date('2026-01-01T00:00:20.000Z'),
      'legacy reply',
    )
    await repo.save(session)

    const useCase = new ApplyCliCommandUseCase(
      repo,
      createMockIdGenerator(),
      createMockClock(new Date('2026-01-01T00:02:00.000Z')),
      createMockLogger(),
    )

    const result = await useCase.execute({
      sessionId: session.id,
      commandLine: ':clear',
      bootstrap: createBootstrapSnapshot(),
    })

    const messages = result.session.getMessages()
    expect(messages).toHaveLength(2)
    expect(parseCliTranscriptMarkup(messages[0]?.content ?? '')).toEqual({
      kind: 'command-input',
      content: '/clear',
    })
    expect(parseCliTranscriptMarkup(messages[1]?.content ?? '')).toEqual({
      kind: 'command-output',
      title: 'conversation',
      tone: 'success',
      content: '会话已清空，但工作区上下文和当前模式仍然保留。',
    })
  })
})
