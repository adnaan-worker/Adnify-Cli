import type { ModelConfig } from '../../domain/assistant/value-objects/ModelConfig'
import type { ApplyCliCommandUseCase } from '../use-cases/ApplyCliCommandUseCase'
import type { BootstrapCliUseCase } from '../use-cases/BootstrapCliUseCase'
import type { CreateSessionUseCase } from '../use-cases/CreateSessionUseCase'
import type { SubmitPromptUseCase } from '../use-cases/SubmitPromptUseCase'

export interface AdnifyCliRuntime {
  useCases: {
    bootstrapCli: BootstrapCliUseCase
    createSession: CreateSessionUseCase
    submitPrompt: SubmitPromptUseCase
    applyCliCommand: ApplyCliCommandUseCase
  }
  switchModel: (providerName: string, modelName?: string) => ModelConfig | null
}
