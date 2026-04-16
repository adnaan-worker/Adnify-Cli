# Adnify-Cli

> **Command AI Into Real Work.**  
> 一个为工程交付而生的品牌化 AI 编程终端。

`Adnify-Cli` 是一个基于 `Bun + TypeScript + Ink` 构建的 CLI AI 编程助手。  
它不是把聊天框塞进终端，而是尝试把“会话、命令、执行、配置、恢复、持续协作”整合成一套稳定、清晰、可扩展的终端工作台。

## 产品目标

- 有产品感：不是普通命令行壳子，而是有品牌、有节奏、有持续使用欲望的终端体验
- 有工程感：强调分层、低耦合、高内聚、可扩展，而不是堆功能
- 有执行感：不只回答问题，更为后续工具调用、Agent 执行和任务推进做好结构准备

## 当前能力

- Bun + TypeScript + Ink 基础工程
- DDD 风格分层：`domain / application / infrastructure / presentation`
- `chat / agent / plan` 三种工作模式
- 本地命令系统与命令提示
- 流式响应链路
- 模型配置向导
- 多 Provider 配置读取与运行时模型切换
- Prompt Pack 驱动的系统提示词、模式提示词、工具定义和命令定义
- 中英双语国际化基础设施
- 文件化会话持久化
- 按工作区自动恢复最近会话
- 自定义数据目录与跨平台存储路径解析

## 技术栈

- Runtime: `bun`
- Language: `TypeScript`
- Terminal UI: [Ink](https://github.com/vadimdemedes/ink)
- Architecture: DDD-style layered architecture

## 快速开始

安装依赖：

```bash
bun install
```

开发运行：

```bash
bun run dev
```

构建：

```bash
bun run build
```

测试：

```bash
bun test
```

类型检查：

```bash
bunx tsc --noEmit
```

## 配置

模型配置文件为 `config.json`，支持环境变量覆盖。

主要环境变量：

- `ADNIFY_PROVIDER`
- `ADNIFY_API_KEY`
- `ADNIFY_BASE_URL`
- `ADNIFY_MODEL`
- `ADNIFY_LOCALE`
- `ADNIFY_HOME`

`ADNIFY_HOME` 用于直接指定整个应用的数据目录。  
如果设置了它，会覆盖 `settings.json` 中保存的自定义目录。

### 配置文件示例

```json
{
  "model": {
    "provider": "openai-compatible",
    "apiKey": "your-api-key",
    "baseUrl": "https://api.openai.com/v1",
    "model": "gpt-5",
    "maxTokens": 4096,
    "temperature": 0.7,
    "timeoutMs": 60000
  },
  "providers": {
    "openai": {
      "provider": "openai-compatible",
      "apiKey": "your-api-key",
      "baseUrl": "https://api.openai.com/v1",
      "models": ["gpt-5", "gpt-4o"]
    }
  }
}
```

## 存储设计

当前版本已经使用文件存储，不再是纯内存会话。

### 默认路径

- Windows
  - settings: `%APPDATA%\\Adnify-Cli\\settings.json`
  - data: `%LOCALAPPDATA%\\Adnify-Cli`
- macOS
  - `~/Library/Application Support/Adnify-Cli`
- Linux
  - settings: `$XDG_CONFIG_HOME/adnify-cli` 或 `~/.config/adnify-cli`
  - data: `$XDG_DATA_HOME/adnify-cli` 或 `~/.local/share/adnify-cli`

### 数据内容

数据目录下当前包含：

- `config.json`
- `sessions/<sessionId>.json`

### 自定义数据目录

支持两种方式：

1. 环境变量 `ADNIFY_HOME`
2. CLI 命令保存到 `settings.json`

相关命令：

- `:storage`
- `:storage set <path>`
- `:storage reset`

当你执行 `:storage set <path>` 时，CLI 会尝试把现有 `config.json` 和 `sessions` 迁移到新目录。  
新的目录完整生效需要重启一次 CLI。

## 会话行为

当前会话系统具有这些行为：

- 每个工作区拥有自己的会话历史
- 启动时会优先恢复当前工作区最近一次会话
- 如果当前工作区没有历史会话，则自动创建新会话
- 第一次真实提问后，会话标题会根据首条 prompt 自动生成

相关命令：

- `:session`
- `:sessions`
- `:resume [index|id]`
- `:clear`

## 本地命令

- `:help`
- `:mode chat`
- `:mode agent`
- `:mode plan`
- `:workspace`
- `:tools`
- `:model [provider] [model]`
- `:config`
- `:config init`
- `:session`
- `:sessions`
- `:resume [index|id]`
- `:storage`
- `:storage set [path]`
- `:storage reset`
- `:clear`
- `:exit`

## Prompt Pack

以下内容都由 `prompts/` 下的 Markdown 文件驱动：

- 助手身份
- 系统提示词
- 模式提示词
- 工具定义
- 本地命令定义

这让提示词和工具描述不再硬编码在业务逻辑中，便于持续演进。

## 目录结构

```text
Adnify-Cli/
|-- .rules/
|-- prompts/
|-- src/
|   |-- application/
|   |-- domain/
|   |-- infrastructure/
|   |-- presentation/
|   `-- main.tsx
|-- package.json
|-- tsconfig.json
`-- README.md
```

## 架构说明

### `src/domain`

核心领域模型、聚合根、值对象和领域行为。

### `src/application`

用例编排、端口定义、DTO、i18n、应用层支持逻辑。

### `src/infrastructure`

配置读取、模型网关、日志、存储实现、Prompt 加载、工作区探测。

### `src/presentation`

Ink UI、输入处理、状态桥接、终端布局与交互层。

## 开发规范

仓库内置 `.rules/` 目录，用于约束 vibecoding 过程中的协作方式、架构边界和交付质量。

- [.rules/README.md](./.rules/README.md)
- [.rules/00-core.md](./.rules/00-core.md)
- [.rules/10-architecture.md](./.rules/10-architecture.md)
- [.rules/20-coding-style.md](./.rules/20-coding-style.md)
- [.rules/30-delivery-workflow.md](./.rules/30-delivery-workflow.md)
- [.rules/40-ai-collaboration.md](./.rules/40-ai-collaboration.md)

## 下一阶段

- `agent` 模式下的真实工具编排
- 工具权限与审批机制
- 更接近 `cc` 节奏的会话侧栏与历史视图
- 更完整的存储设置 UI
- 工作区记忆与插件扩展能力

## 项目信息

- Project: `Adnify-Cli`
- Author: `adnaan`
- Package Manager: `bun`
- Terminal UI: `Ink`
