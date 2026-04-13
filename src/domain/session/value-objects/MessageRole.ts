export const MESSAGE_ROLES = ['system', 'user', 'assistant'] as const

export type MessageRole = (typeof MESSAGE_ROLES)[number]

