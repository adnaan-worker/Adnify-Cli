export const ASSISTANT_MODES = ['chat', 'agent', 'plan'] as const

export type AssistantMode = (typeof ASSISTANT_MODES)[number]

export function isAssistantMode(value: string): value is AssistantMode {
  return ASSISTANT_MODES.includes(value as AssistantMode)
}

