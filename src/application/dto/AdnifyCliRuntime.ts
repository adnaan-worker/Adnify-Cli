import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import type { AppI18n } from '../i18n/AppI18n'
import type { ApplyCliCommandUseCase } from '../use-cases/ApplyCliCommandUseCase'
import type { BootstrapCliUseCase } from '../use-cases/BootstrapCliUseCase'
import type { CreateSessionUseCase } from '../use-cases/CreateSessionUseCase'
import type { ListSessionsUseCase } from '../use-cases/ListSessionsUseCase'
import type { SubmitPromptUseCase } from '../use-cases/SubmitPromptUseCase'

export interface AdnifyCliRuntime {
  i18n: AppI18n
  useCases: {
    bootstrapCli: BootstrapCliUseCase
    createSession: CreateSessionUseCase
    listSessions: ListSessionsUseCase
    submitPrompt: SubmitPromptUseCase
    applyCliCommand: ApplyCliCommandUseCase
  }
  switchModel: (providerName: string, modelName?: string) => ModelConfig | null
}
