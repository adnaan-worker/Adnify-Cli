export const SUPPORTED_APP_LOCALES = ['zh-CN', 'en'] as const

export type AppLocale = (typeof SUPPORTED_APP_LOCALES)[number]

export type TranslationVariables = Record<string, string | number | boolean | null | undefined>

const messages = {
  'zh-CN': {
    'assistant.tagline': '冷静执行，精准掌控你的代码库。',
    'assistant.description':
      '一个专注终端编程协作的 AI 助手，强调结构清晰、执行可靠和真实交付。',
    'common.by': '作者',
    'common.yes': '是',
    'common.no': '否',
    'app.boot.panelTitle': '启动中',
    'app.boot.panelSubtitle': '运行时预热',
    'app.boot.workspaceName': '启动环境',
    'app.boot.modelLabel': '初始化中',
    'app.boot.heading': '正在启动 Adnify-Cli',
    'app.boot.description': '正在装配运行时、工作区上下文与模型配置。',
    'app.boot.failed': '启动失败',
    'header.meta.workspace': '工作区 ',
    'header.meta.package': '包管理 ',
    'header.meta.git': 'Git ',
    'header.meta.gitTracked': '已跟踪',
    'header.meta.gitDetached': '未跟踪',
    'empty.hint': '从一个目标、文件路径开始，或输入 `/` 打开命令面板。',
    'empty.panelSession': '会话',
    'empty.panelQuickStart': '快速开始',
    'input.panelCommands': '命令',
    'input.panelConsole': '控制台',
    'input.labelInput': '输入',
    'input.labelPalette': '面板',
    'input.placeholder': '描述任务，或输入 / 打开命令列表。',
    'input.hintSuggestions': '上下选择  Tab 补全  Enter 执行',
    'input.hintDefault': 'Enter 发送  / 命令',
    'status.system': '系统',
    'status.configured': '已配置',
    'status.setupRequired': '需要配置',
    'status.initializing': '正在初始化…',
    'status.notConfigured': '尚未检测到模型配置，请先完成初始化。',
    'status.runtimeReady': '运行时已就绪，可以开始交互。',
    'status.enteringConfigInit': '正在进入模型配置向导…',
    'status.executionFailed': '执行失败：{message}',
    'status.responseFailed': '响应失败：{message}',
    'status.configFailed': '配置失败：{message}',
    'status.responseCompleted': '已完成一轮响应。',
    'status.inputIgnored': '输入为空，已忽略。',
    'conversation.panelSession': '会话',
    'conversation.panelConfiguration': '配置向导',
    'conversation.response': '响应',
    'conversation.notice': '提示',
    'conversation.output': '输出',
    'conversation.localCommand': '本地命令',
    'conversation.thinking': '思考中',
    'conversation.configError': '错误：{message}',
    'transcript.commands': '命令',
    'transcript.mode': '模式',
    'transcript.workspace': '工作区',
    'transcript.tools': '工具',
    'transcript.model': '模型',
    'transcript.config': '配置',
    'transcript.conversation': '会话',
    'transcript.session': '会话',
    'transcript.command': '命令',
    'config.selectProviderTitle': '请选择 AI Provider：',
    'config.customProvider': '自定义 OpenAI 兼容端点',
    'config.enterIndexContinue': '输入序号继续',
    'config.selectModelTitle': '已选择 {provider}，请选择模型：',
    'config.defaultSuffix': '（默认）',
    'config.selectModelInstruction': '输入序号，或直接回车使用默认模型',
    'config.enterApiKey': '请输入 API Key',
    'config.enterBaseUrl': '请输入 Base URL，例如 https://api.example.com/v1',
    'config.confirmTitle': '确认配置：',
    'config.confirmBaseUrl': 'Base URL：{value}',
    'config.confirmModel': 'Model：{value}',
    'config.confirmApiKey': 'API Key：{value}',
    'config.confirmInstruction': '输入 y 确认保存，输入 n 取消',
    'config.rangeError': '请输入 1-{max} 之间的序号',
    'config.modelRangeError': '请输入 1-{max} 之间的序号，或直接回车',
    'config.baseUrlRequired': 'Base URL 不能为空',
    'config.apiKeyRequired': 'API Key 不能为空',
    'config.confirmChoiceError': '请输入 y 或 n',
    'config.savedLine1': '配置已保存到 ~/.adnify-cli/config.json',
    'config.savedLine2': '当前模型：{model} ({baseUrl})',
    'config.savedLine3': '现在可以直接开始对话，或使用 :model 继续切换模型。',
    'command.desc.default': '执行本地命令',
    'command.desc.help': '查看本地命令列表',
    'command.desc.mode.chat': '切换到对话模式',
    'command.desc.mode.agent': '切换到代理执行模式',
    'command.desc.mode.plan': '切换到规划模式',
    'command.desc.workspace': '查看当前工作区摘要',
    'command.desc.tools': '查看工具目录规划',
    'command.desc.model': '查看或切换当前模型',
    'command.desc.config': '查看当前模型配置',
    'command.desc.configInit': '启动模型配置向导',
    'command.desc.clear': '清空当前会话消息',
    'command.desc.exit': '退出 Adnify-Cli',
    'cli.help.title': '本地命令列表：',
    'cli.help.status': '已输出本地命令帮助。',
    'cli.mode.invalidOutput': '模式无效。可选模式：{modes}',
    'cli.mode.invalidStatus': '模式切换失败，请检查命令参数。',
    'cli.mode.changedOutput': '会话模式已切换为 {mode}。',
    'cli.mode.changedStatus': '当前模式：{mode}',
    'cli.workspace.status': '已输出工作区摘要。',
    'cli.tools.title': '当前规划的工具目录：',
    'cli.tools.status': '已输出工具目录。',
    'cli.model.current': '当前模型：{model} ({baseUrl})',
    'cli.model.providersTitle': '可用 Provider：',
    'cli.model.noProviders':
      '尚未配置额外 Provider，可在 ~/.adnify-cli/config.json 的 providers 字段中添加。',
    'cli.model.usage': '用法：:model <provider> [model]',
    'cli.model.example': '示例：:model openai gpt-5',
    'cli.model.unavailable': '模型切换能力尚未就绪。',
    'cli.model.unavailableStatus': '模型切换失败。',
    'cli.model.providerMissing':
      'Provider "{provider}" 不存在或未配置模型。\n可用 Provider：{available}',
    'cli.model.providerMissingStatus': '切换失败：未找到 {provider}',
    'cli.model.switchedOutput': '已切换到 {model} ({baseUrl})',
    'cli.model.switchedStatus': '当前模型：{model}',
    'cli.config.unset': '未配置',
    'cli.config.title': '当前模型配置：',
    'cli.config.provider': '- Provider：{value}',
    'cli.config.apiKey': '- API Key：{value}',
    'cli.config.baseUrl': '- Base URL：{value}',
    'cli.config.model': '- Model：{value}',
    'cli.config.maxTokens': '- Max Tokens：{value}',
    'cli.config.temperature': '- Temperature：{value}',
    'cli.config.timeout': '- Timeout：{value}ms',
    'cli.config.howTo': '配置方式：',
    'cli.config.howToFile': '1. 创建 ~/.adnify-cli/config.json',
    'cli.config.howToEnv':
      '2. 或设置环境变量：ADNIFY_API_KEY、ADNIFY_BASE_URL、ADNIFY_MODEL、ADNIFY_PROVIDER',
    'cli.config.status': '已输出模型配置。',
    'cli.clear.output': '会话已清空，但工作区上下文和当前模式仍然保留。',
    'cli.clear.status': '会话已清空。',
    'cli.exit.output': '正在退出 Adnify-Cli...',
    'cli.exit.status': '正在退出 Adnify-Cli...',
    'cli.unknown.output': '未知命令：{command}。输入 /help 查看可用命令。',
    'cli.unknown.status': '命令无法识别。',
    'workspace.summaryTitle': '工作区摘要：',
    'workspace.root': '- 根目录：{value}',
    'workspace.git': '- Git 仓库：{value}',
    'workspace.packageManager': '- 包管理器：{value}',
    'workspace.topLevelEntries': '- 顶层条目：{value}',
    'workspace.none': '无',
    'tool.workspace-read.name': '工作区读取',
    'tool.workspace-read.description':
      '读取仓库结构、包元数据和工作区上下文，为后续决策提供依据。',
    'tool.file-ops.name': '文件操作',
    'tool.file-ops.description':
      '读取、编辑、创建和重构仓库文件，同时保持项目结构和用户意图不被破坏。',
    'tool.shell-runner.name': '终端执行',
    'tool.shell-runner.description':
      '执行终端命令用于检查、构建、测试和定向自动化，并遵守危险操作审批边界。',
    'tool.search-index.name': '代码检索',
    'tool.search-index.description':
      '搜索代码、符号和项目文本，帮助快速定位实现细节并减少盲改。',
    'stub.received': '已收到你的输入：{prompt}',
    'stub.currentMode': '当前模式：{mode}',
    'stub.packageManager': '工作区包管理器：{value}',
    'stub.toolCount': '已规划工具数：{count}',
    'stub.suggestionsTitle': '初步建议：',
    'stub.suggestion.architecture': '建议先稳定领域边界，再逐步接入工具系统和模型网关。',
    'stub.suggestion.readme': 'README 应持续与目录和用例保持同步，避免文档漂移。',
    'stub.suggestion.tools':
      '工具系统建议采用“目录 + 权限 + 执行器 + 结果模型”四段式设计。',
    'stub.suggestion.default':
      '当前是初版脚手架阶段，建议优先补齐模型网关、工具注册中心和配置系统。',
    'modelPrompt.language.self': '简体中文',
    'modelPrompt.respondIn': 'Unless the user explicitly asks otherwise, respond in {language}.',
    'modelPrompt.currentMode': '当前模式：{mode}',
    'modelPrompt.workspaceRoot': '工作区根目录：{value}',
    'modelPrompt.packageManager': '包管理器：{value}',
    'modelPrompt.gitRepository': 'Git 仓库：{value}',
    'modelPrompt.topLevelEntries': '顶层条目：{value}',
    'modelPrompt.noTools': '- 未注册工具。',
    'session.defaultTitle': 'Adnify-Cli 会话',
  },
  en: {
    'assistant.tagline': 'Command your codebase with calm precision.',
    'assistant.description':
      'An AI pair-programming assistant for the terminal, focused on clear structure, reliable execution, and real delivery.',
    'common.by': 'by',
    'common.yes': 'yes',
    'common.no': 'no',
    'app.boot.panelTitle': 'Boot',
    'app.boot.panelSubtitle': 'runtime warmup',
    'app.boot.workspaceName': 'booting',
    'app.boot.modelLabel': 'initializing',
    'app.boot.heading': 'Bootstrapping Adnify-Cli',
    'app.boot.description': 'Preparing runtime services, workspace context, and model configuration.',
    'app.boot.failed': 'Boot failed',
    'header.meta.workspace': 'workspace ',
    'header.meta.package': 'pkg ',
    'header.meta.git': 'git ',
    'header.meta.gitTracked': 'tracked',
    'header.meta.gitDetached': 'detached',
    'empty.hint': 'Start with a goal, a file path, or `/` to open the command palette.',
    'empty.panelSession': 'session',
    'empty.panelQuickStart': 'Quick start',
    'input.panelCommands': 'Commands',
    'input.panelConsole': 'Console',
    'input.labelInput': 'input',
    'input.labelPalette': 'palette',
    'input.placeholder': 'Describe the task, or type / to open commands.',
    'input.hintSuggestions': 'Up/Down select  Tab complete  Enter run',
    'input.hintDefault': 'Enter send  / commands',
    'status.system': 'system',
    'status.configured': 'configured',
    'status.setupRequired': 'setup required',
    'status.initializing': 'Initializing…',
    'status.notConfigured': 'No model configuration detected yet. Please finish setup first.',
    'status.runtimeReady': 'Runtime is ready. You can start working now.',
    'status.enteringConfigInit': 'Entering model setup wizard…',
    'status.executionFailed': 'Execution failed: {message}',
    'status.responseFailed': 'Response failed: {message}',
    'status.configFailed': 'Configuration failed: {message}',
    'status.responseCompleted': 'Completed one response.',
    'status.inputIgnored': 'Empty input ignored.',
    'conversation.panelSession': 'Session',
    'conversation.panelConfiguration': 'configuration',
    'conversation.response': 'response',
    'conversation.notice': 'notice',
    'conversation.output': 'output',
    'conversation.localCommand': 'local command',
    'conversation.thinking': 'thinking',
    'conversation.configError': 'Error: {message}',
    'transcript.commands': 'commands',
    'transcript.mode': 'mode',
    'transcript.workspace': 'workspace',
    'transcript.tools': 'tools',
    'transcript.model': 'model',
    'transcript.config': 'config',
    'transcript.conversation': 'conversation',
    'transcript.session': 'session',
    'transcript.command': 'command',
    'config.selectProviderTitle': 'Select an AI provider:',
    'config.customProvider': 'Custom OpenAI-compatible endpoint',
    'config.enterIndexContinue': 'Enter the index to continue',
    'config.selectModelTitle': '{provider} selected. Choose a model:',
    'config.defaultSuffix': ' (default)',
    'config.selectModelInstruction': 'Enter the index, or press Enter to use the default model',
    'config.enterApiKey': 'Enter the API key',
    'config.enterBaseUrl': 'Enter the Base URL, for example https://api.example.com/v1',
    'config.confirmTitle': 'Confirm configuration:',
    'config.confirmBaseUrl': 'Base URL: {value}',
    'config.confirmModel': 'Model: {value}',
    'config.confirmApiKey': 'API Key: {value}',
    'config.confirmInstruction': 'Enter y to save or n to cancel',
    'config.rangeError': 'Enter a number between 1 and {max}',
    'config.modelRangeError': 'Enter a number between 1 and {max}, or press Enter',
    'config.baseUrlRequired': 'Base URL is required',
    'config.apiKeyRequired': 'API Key is required',
    'config.confirmChoiceError': 'Enter y or n',
    'config.savedLine1': 'Configuration saved to ~/.adnify-cli/config.json',
    'config.savedLine2': 'Current model: {model} ({baseUrl})',
    'config.savedLine3': 'You can start chatting now, or use :model to switch models later.',
    'command.desc.default': 'Run a local command',
    'command.desc.help': 'Show local command list',
    'command.desc.mode.chat': 'Switch to chat mode',
    'command.desc.mode.agent': 'Switch to agent mode',
    'command.desc.mode.plan': 'Switch to plan mode',
    'command.desc.workspace': 'Show current workspace summary',
    'command.desc.tools': 'Show planned tool catalog',
    'command.desc.model': 'Show or switch the current model',
    'command.desc.config': 'Show current model configuration',
    'command.desc.configInit': 'Launch model setup wizard',
    'command.desc.clear': 'Clear current conversation messages',
    'command.desc.exit': 'Exit Adnify-Cli',
    'cli.help.title': 'Local commands:',
    'cli.help.status': 'Local command help displayed.',
    'cli.mode.invalidOutput': 'Invalid mode. Available modes: {modes}',
    'cli.mode.invalidStatus': 'Mode switch failed. Check the command arguments.',
    'cli.mode.changedOutput': 'Session mode switched to {mode}.',
    'cli.mode.changedStatus': 'Current mode: {mode}',
    'cli.workspace.status': 'Workspace summary displayed.',
    'cli.tools.title': 'Planned tool catalog:',
    'cli.tools.status': 'Tool catalog displayed.',
    'cli.model.current': 'Current model: {model} ({baseUrl})',
    'cli.model.providersTitle': 'Available providers:',
    'cli.model.noProviders':
      'No additional providers are configured yet. Add them under providers in ~/.adnify-cli/config.json.',
    'cli.model.usage': 'Usage: :model <provider> [model]',
    'cli.model.example': 'Example: :model openai gpt-5',
    'cli.model.unavailable': 'Model switching is not ready yet.',
    'cli.model.unavailableStatus': 'Model switch failed.',
    'cli.model.providerMissing':
      'Provider "{provider}" does not exist or has no configured models.\nAvailable providers: {available}',
    'cli.model.providerMissingStatus': 'Switch failed: provider {provider} was not found',
    'cli.model.switchedOutput': 'Switched to {model} ({baseUrl})',
    'cli.model.switchedStatus': 'Current model: {model}',
    'cli.config.unset': 'not configured',
    'cli.config.title': 'Current model configuration:',
    'cli.config.provider': '- Provider: {value}',
    'cli.config.apiKey': '- API Key: {value}',
    'cli.config.baseUrl': '- Base URL: {value}',
    'cli.config.model': '- Model: {value}',
    'cli.config.maxTokens': '- Max Tokens: {value}',
    'cli.config.temperature': '- Temperature: {value}',
    'cli.config.timeout': '- Timeout: {value}ms',
    'cli.config.howTo': 'Configuration methods:',
    'cli.config.howToFile': '1. Create ~/.adnify-cli/config.json',
    'cli.config.howToEnv':
      '2. Or set environment variables: ADNIFY_API_KEY, ADNIFY_BASE_URL, ADNIFY_MODEL, ADNIFY_PROVIDER',
    'cli.config.status': 'Model configuration displayed.',
    'cli.clear.output': 'Conversation cleared. Workspace context and current mode were kept.',
    'cli.clear.status': 'Conversation cleared.',
    'cli.exit.output': 'Exiting Adnify-Cli...',
    'cli.exit.status': 'Exiting Adnify-Cli...',
    'cli.unknown.output': 'Unknown command: {command}. Type /help to see available commands.',
    'cli.unknown.status': 'Command could not be recognized.',
    'workspace.summaryTitle': 'Workspace summary:',
    'workspace.root': '- Root path: {value}',
    'workspace.git': '- Git repository: {value}',
    'workspace.packageManager': '- Package manager: {value}',
    'workspace.topLevelEntries': '- Top-level entries: {value}',
    'workspace.none': 'none',
    'tool.workspace-read.name': 'Workspace Read',
    'tool.workspace-read.description':
      'Read repository structure, package metadata, and workspace context to ground later decisions.',
    'tool.file-ops.name': 'File Ops',
    'tool.file-ops.description':
      'Read, edit, create, and refactor repository files while preserving project structure and user intent.',
    'tool.shell-runner.name': 'Shell Runner',
    'tool.shell-runner.description':
      'Run terminal commands for inspection, build, test, and targeted automation while respecting approval boundaries.',
    'tool.search-index.name': 'Search Index',
    'tool.search-index.description':
      'Search code, symbols, and project text to locate implementation details quickly and avoid blind edits.',
    'stub.received': 'Received your input: {prompt}',
    'stub.currentMode': 'Current mode: {mode}',
    'stub.packageManager': 'Workspace package manager: {value}',
    'stub.toolCount': 'Planned tools: {count}',
    'stub.suggestionsTitle': 'Initial suggestions:',
    'stub.suggestion.architecture':
      'Stabilize domain boundaries first, then bring in the tool system and model gateway step by step.',
    'stub.suggestion.readme':
      'Keep the README aligned with the directory structure and use cases so documentation does not drift.',
    'stub.suggestion.tools':
      'The tool system should follow a four-part design: catalog, permissions, executor, and result model.',
    'stub.suggestion.default':
      'This is still an early scaffold, so model gateway, tool registry, and configuration deserve priority.',
    'modelPrompt.language.self': 'English',
    'modelPrompt.respondIn': 'Unless the user explicitly asks otherwise, respond in {language}.',
    'modelPrompt.currentMode': 'Current mode: {mode}',
    'modelPrompt.workspaceRoot': 'Workspace root: {value}',
    'modelPrompt.packageManager': 'Package manager: {value}',
    'modelPrompt.gitRepository': 'Git repository: {value}',
    'modelPrompt.topLevelEntries': 'Top-level entries: {value}',
    'modelPrompt.noTools': '- No tools registered.',
    'session.defaultTitle': 'Adnify-Cli Session',
  },
} as const

type MessageCatalog = typeof messages
type MessageKey = keyof MessageCatalog['zh-CN']

export class AppI18n {
  constructor(public readonly locale: AppLocale) {}

  t(key: MessageKey, variables?: TranslationVariables): string {
    const template = this.maybeT(key, variables)
    if (!template) {
      throw new Error(`Missing translation for key: ${key}`)
    }

    return template
  }

  maybeT(key: string, variables?: TranslationVariables): string | null {
    const catalog = messages[this.locale] as Record<string, string>
    const fallbackCatalog = messages['zh-CN'] as Record<string, string>
    const template = catalog[key] ?? fallbackCatalog[key]

    if (!template) {
      return null
    }

    return formatTemplate(template, variables)
  }
}

export function createAppI18n(locale: AppLocale): AppI18n {
  return new AppI18n(locale)
}

export function resolveAppLocale(input?: string | null): AppLocale {
  if (!input) {
    return 'zh-CN'
  }

  const normalized = input.toLowerCase()

  if (normalized.startsWith('zh')) {
    return 'zh-CN'
  }

  if (normalized.startsWith('en')) {
    return 'en'
  }

  return 'zh-CN'
}

export function resolveAppLocaleFromEnv(
  env: Record<string, string | undefined> = process.env,
): AppLocale {
  const candidates = [
    env.ADNIFY_LOCALE,
    env.LC_ALL,
    env.LC_MESSAGES,
    env.LANG,
    getRuntimeLocale(),
  ]

  for (const candidate of candidates) {
    if (candidate) {
      return resolveAppLocale(candidate)
    }
  }

  return 'zh-CN'
}

function getRuntimeLocale(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale
  } catch {
    return undefined
  }
}

function formatTemplate(template: string, variables?: TranslationVariables): string {
  if (!variables) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key]
    return value === undefined || value === null ? '' : String(value)
  })
}
