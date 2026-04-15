# Adnify-Cli

> **Command AI Into Real Work.**
> 一个兼具品牌感、执行力与工程纪律的下一代 AI 编程终端。

`Adnify-Cli` 不是把聊天框塞进命令行，也不是“能跑就行”的 AI 工具壳。  
它是一台真正面向开发工作的智能终端: 既能保持终端体验该有的速度、直接与掌控感，也能承接 AI 编程助手该有的上下文理解、模式切换、命令系统、工具扩展与长期演进能力。

如果你想要的不是“会回复”，而是“会推进任务、会保持秩序、会随着项目一起成长”，那 `Adnify-Cli` 就是为这种体验准备的。

---

## 产品简介

`Adnify-Cli` 想做的，不是一个普通 CLI，而是一套真正能进入开发者工作流的 AI 编程工作台。

它强调三件事:

- **产品感**
  终端不该只是冰冷的文本堆叠。它也可以有节奏、有布局、有识别度，有一种打开之后就想继续用下去的气质。

- **执行力**
  AI 不应该只负责解释、总结和“给建议”。它应该能够围绕真实任务推进结果，承接命令、模式、上下文和后续工具能力。

- **可成长**
  一个好的 AI CLI 不该越做越乱。它需要从第一天起就有清晰边界，能自然承接持久化、工具系统、权限审批、记忆、插件、多 Agent 等能力。

一句话概括:

**Adnify-Cli 不是终端里的聊天机器人，而是一台真正面向工程交付的 AI 编程终端。**

---

## 核心特性

### 1. 终端产品体验

- 更讲究布局与信息密度，不靠把所有状态塞满屏幕来制造“高级感”
- 让命令、会话、响应、配置和工作状态有清晰层次
- 追求耐看、耐用、耐长时间协作的终端观感

### 2. AI Agent 深度集成

- 支持 `chat / agent / plan` 三种核心工作模式
- 让对话、执行、规划三类任务有清晰分工
- 后续可自然承接工具调用、权限审批与复杂任务分步执行

### 3. 命令与自然语言双通道

- 可以像传统 CLI 一样输入本地命令
- 也可以像 AI 助手一样直接描述任务
- 不强迫用户在“命令行工具”和“聊天窗口”之间来回切换

### 4. Prompt Pack 驱动

- 系统提示词
- 模式提示词
- 工具定义
- 本地命令说明

以上内容统一由 `prompts/` 下的 Markdown 文件驱动，不再把大段 prompt 硬编码在业务代码中。

### 5. 多模型接入能力

当前已支持:

- `openai-compatible`
- `openai-responses`
- `anthropic`
- `google`

并可通过本地配置与命令切换运行时模型。

### 6. 国际化基础设施

当前已支持:

- `zh-CN`
- `en`

并且国际化并不只覆盖少量 UI 标签，而是已经开始向界面文案、命令输出、配置流程和运行时提示统一推进。

---

## 独特优势

### 真正适合长期演进

很多 AI CLI 一开始看起来很快能跑，但做一段时间后往往会出现这些问题:

- UI 文案分散在各处，越改越乱
- 会话、配置、命令、模型调用互相缠绕
- 想加一个功能，结果要改一大片
- 表面是产品，内部却只是临时拼装

`Adnify-Cli` 从一开始就避免走这条路。

它更在意:

- 是否有稳定的边界
- 是否能承接真正的工具系统
- 是否能让后续能力自然长出来
- 是否能在持续迭代后依然保持清晰

### 真正像一个“工作台”

`Adnify-Cli` 想解决的不是“AI 能不能回答问题”，而是:

- 能不能让人更快进入工作状态
- 能不能把终端从输入框升级成任务界面
- 能不能让 AI 编程协作变得有秩序，而不是越来越吵

### 真正有品牌识别度

不是千篇一律的通用 AI 工具壳，也不是只有技术没有气质的命令行项目。  
`Adnify-Cli` 追求的是一种明确的产品角色:

- 冷静
- 直接
- 有执行力
- 有审美控制
- 有工程底线

---

## 适合谁

- 想做一个真正有产品气质的 AI CLI
- 想做一个能长期演进的编程助手内核
- 想兼顾界面体验、工程质量和后续扩展性
- 想让终端里的 AI 协作不再停留在“对话演示”层面

---

## 当前已落地能力

- Bun + TypeScript + Ink 基础工程
- 清晰的 `domain / application / infrastructure / presentation` 分层
- 会话聚合根与消息流模型
- 本地命令系统
- 命令建议与命令面板基础能力
- 流式响应链路
- 模型配置向导
- 多 Provider 模型接入
- Markdown Prompt Pack
- 中英文国际化基础设施

---

## 当前真实存储设计

这部分不是概念图，而是当前代码里已经真实落地的存储方式。

### 会话存储

当前会话仓储实现:

- [InMemorySessionRepository.ts](/E:/26Project/Adnify-Cli/src/infrastructure/persistence/InMemorySessionRepository.ts)

当前特点:

- 使用内存 `Map` 存储 `ConversationSessionSnapshot`
- 只在当前进程生命周期内有效
- 关闭 CLI 后不会保留历史会话

这意味着当前已经具备稳定的仓储边界，但还没有接入文件、SQLite 或远程持久化实现。

### 配置存储

当前模型配置读写位于:

- [loadLocalConfig.ts](/E:/26Project/Adnify-Cli/src/infrastructure/config/loadLocalConfig.ts)
- [writeLocalConfig.ts](/E:/26Project/Adnify-Cli/src/infrastructure/config/writeLocalConfig.ts)

实际文件位置:

- `~/.adnify-cli/config.json`

当前读取优先级:

1. 环境变量
2. `~/.adnify-cli/config.json`
3. 默认值

当前主要环境变量:

- `ADNIFY_PROVIDER`
- `ADNIFY_API_KEY`
- `ADNIFY_BASE_URL`
- `ADNIFY_MODEL`
- `ADNIFY_LOCALE`

### Prompt / 工具 / 命令定义存储

当前这些定义统一放在 Markdown Prompt Pack 中:

- [prompts/assistant/profile.md](/E:/26Project/Adnify-Cli/prompts/assistant/profile.md)
- [prompts/system/core.md](/E:/26Project/Adnify-Cli/prompts/system/core.md)
- [prompts/system/modes/chat.md](/E:/26Project/Adnify-Cli/prompts/system/modes/chat.md)
- [prompts/system/modes/agent.md](/E:/26Project/Adnify-Cli/prompts/system/modes/agent.md)
- [prompts/system/modes/plan.md](/E:/26Project/Adnify-Cli/prompts/system/modes/plan.md)
- [prompts/tools/](/E:/26Project/Adnify-Cli/prompts/tools)
- [prompts/commands/local-commands.md](/E:/26Project/Adnify-Cli/prompts/commands/local-commands.md)

加载入口:

- [loadPromptBundle.ts](/E:/26Project/Adnify-Cli/src/infrastructure/prompt/loadPromptBundle.ts)

---

## 快速开始

安装依赖:

```bash
bun install
```

开发运行:

```bash
bun run dev
```

构建:

```bash
bun run build
```

测试:

```bash
bun test
```

类型检查:

```bash
bunx tsc --noEmit
```

---

## 配置示例

`~/.adnify-cli/config.json`

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
    },
    "deepseek": {
      "provider": "openai-compatible",
      "apiKey": "your-api-key",
      "baseUrl": "https://api.deepseek.com/v1",
      "models": ["deepseek-chat", "deepseek-reasoner"]
    }
  }
}
```

---

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
- `:clear`
- `:exit`

---

## 架构概览

### 分层结构

| 层级 | 职责 |
| --- | --- |
| `src/domain` | 核心领域模型与聚合根 |
| `src/application` | 用例编排、端口、DTO、国际化与应用支持逻辑 |
| `src/infrastructure` | 配置、模型网关、日志、工作区探测、存储实现 |
| `src/presentation` | Ink UI、输入处理、CLI 状态桥接 |

### 关键上下文

- `assistant`
- `session`
- `tooling`
- `workspace`

---

## 目录结构

```text
Adnify-Cli/
├─ .rules/
├─ prompts/
├─ src/
│  ├─ application/
│  ├─ domain/
│  ├─ infrastructure/
│  ├─ presentation/
│  └─ main.tsx
├─ package.json
├─ tsconfig.json
└─ README.md
```

---

## 路线图

### 下一阶段

- 工具注册中心
- 文件 / 搜索 / Shell / Git 工具协议
- 权限审批层
- 会话持久化
- 工作区记忆
- 更完整的品牌化终端体验

### 中长期

- 多 Agent
- 插件系统
- MCP 集成
- 更强的上下文压缩与检索增强

---

## 开发规范

仓库内置了 `.rules/`，用于约束 `vibecoding` 过程中的结构质量与协作方式:

- [Rules Index](.rules/README.md)
- [Core Rules](.rules/00-core.md)
- [Architecture Rules](.rules/10-architecture.md)
- [Coding Style Rules](.rules/20-coding-style.md)
- [Delivery Workflow Rules](.rules/30-delivery-workflow.md)
- [AI Collaboration Rules](.rules/40-ai-collaboration.md)

---

## 项目信息

- 项目名: `Adnify-Cli`
- 作者: `adnaan`
- 包管理: `bun`
- 终端 UI: [Ink](https://github.com/vadimdemedes/ink)

`Adnify-Cli` 当前最有价值的地方，不是“已经做完了多少功能”，而是它已经具备了一个优秀产品应有的方向感。  
接下来要做的，是继续把这份方向感打磨成真正让人上瘾的终端体验。
