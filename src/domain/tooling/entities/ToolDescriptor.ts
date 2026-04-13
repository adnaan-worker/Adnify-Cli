export interface ToolDescriptorProps {
  id: string
  name: string
  description: string
  category: string
  riskLevel: 'safe' | 'careful' | 'dangerous'
}

/**
 * 工具描述实体。
 * 当前先承载目录信息，后续可拓展为工具协议与权限策略入口。
 */
export class ToolDescriptor {
  constructor(private readonly props: ToolDescriptorProps) {}

  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string {
    return this.props.description
  }

  get category(): string {
    return this.props.category
  }

  get riskLevel(): ToolDescriptorProps['riskLevel'] {
    return this.props.riskLevel
  }

  toPlainObject(): ToolDescriptorProps {
    return { ...this.props }
  }
}

