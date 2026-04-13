import type { AssistantMode } from '../value-objects/AssistantMode'

export interface AssistantProfileProps {
  id: string
  name: string
  author: string
  tagline: string
  description: string
  defaultMode: AssistantMode
}

/**
 * 助手画像实体。
 * 这个对象不关心 UI、不关心模型 SDK，只表达产品身份和默认行为。
 */
export class AssistantProfile {
  constructor(private readonly props: AssistantProfileProps) {}

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get author(): string {
    return this.props.author
  }

  get tagline(): string {
    return this.props.tagline
  }

  get description(): string {
    return this.props.description
  }

  get defaultMode(): AssistantMode {
    return this.props.defaultMode
  }

  toPlainObject(): AssistantProfileProps {
    return { ...this.props }
  }
}

