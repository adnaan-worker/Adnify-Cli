import { describe, expect, test } from 'bun:test'
import type { AssistantPromptSet } from '../../application/dto/AssistantPromptSet'
import { createAppI18n } from '../../application/i18n/AppI18n'
import type { CliConfigPort } from '../../application/ports/CliConfigPort'
import type { LoggerPort } from '../../application/ports/LoggerPort'
import type {
  ModelGatewayPort,
  ModelRequest,
  ModelStreamChunk,
} from '../../application/ports/ModelGatewayPort'
import { AssistantProfile } from '../../domain/assistant/entities/AssistantProfile'
import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import { ConversationSession } from '../../domain/session/aggregates/ConversationSession'
import { ToolDescriptor } from '../../domain/tooling/entities/ToolDescriptor'
import { WorkspaceContext } from '../../domain/workspace/entities/WorkspaceContext'
import { ModelAssistantResponder } from './ModelAssistantResponder'

function createMockLogger(): LoggerPort {
  return {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }
}

function createMockConfig(promptSet: AssistantPromptSet): CliConfigPort {
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
        apiKey: 'x',
        baseUrl: 'https://example.com',
        model: 'test-model',
        maxTokens: 1000,
        temperature: 0,
        timeoutMs: 1000,
      }) satisfies ModelConfig,
    getProviders: () => ({}),
    switchModel: () => null,
    getToolCatalog: () => [],
    getLocalCommands: () => [],
  }
}

describe('ModelAssistantResponder', () => {
  test('should compose system prompt from prompt set, workspace context, and tools', async () => {
    let capturedRequest: ModelRequest | null = null

    const gateway: ModelGatewayPort = {
      async *streamChat(request: ModelRequest): AsyncIterable<ModelStreamChunk> {
        capturedRequest = request
        yield { delta: 'done', finishReason: 'stop' }
      },
    }

    const promptSet: AssistantPromptSet = {
      core: 'core system',
      modes: {
        chat: 'chat instructions',
        agent: 'agent instructions',
        plan: 'plan instructions',
      },
    }

    const responder = new ModelAssistantResponder(
      gateway,
      {
        provider: 'openai-compatible',
        apiKey: 'x',
        baseUrl: 'https://example.com',
        model: 'test-model',
        maxTokens: 1000,
        temperature: 0,
        timeoutMs: 1000,
      },
      createMockConfig(promptSet),
      createMockLogger(),
      createAppI18n('zh-CN'),
    )

    const session = ConversationSession.create({
      id: 'session-1',
      title: 'test',
      mode: 'agent',
      workspacePath: '/workspace',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    })

    for await (const _chunk of responder.streamReply({
      prompt: 'implement feature',
      session,
      workspace: new WorkspaceContext({
        rootPath: '/workspace',
        isGitRepository: true,
        packageManager: 'bun',
        topLevelEntries: ['src', 'package.json'],
      }),
      toolCatalog: [
        new ToolDescriptor({
          id: 'shell-runner',
          name: 'Shell Runner',
          description: 'Run terminal commands',
          category: 'terminal',
          riskLevel: 'dangerous',
        }),
      ],
    })) {
      // Consume the stream to trigger the gateway request.
    }

    expect(capturedRequest).not.toBeNull()
    expect(capturedRequest?.messages[0]?.role).toBe('system')
    expect(capturedRequest?.messages[0]?.content).toContain('core system')
    expect(capturedRequest?.messages[0]?.content).toContain('agent instructions')
    expect(capturedRequest?.messages[0]?.content).toContain('当前模式：agent')
    expect(capturedRequest?.messages[0]?.content).toContain('Shell Runner [terminal] (dangerous)')
    expect(capturedRequest?.messages[capturedRequest.messages.length - 1]?.content).toBe(
      'implement feature',
    )
  })
})
