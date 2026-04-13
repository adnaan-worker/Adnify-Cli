# Adnify-Cli

`Adnify-Cli` 是一个面向终端场景的 AI 编程助手脚手架，目标是在 `CLI + Ink + Bun + TypeScript` 的基础上，逐步融合 `cc` 项目的 CLI 编排能力与 `adnify` 项目的 Agent 领域拆分经验，沉淀出一个适合长期演进的 DDD 架构。

- 项目名：`Adnify-Cli`
- 作者：`adnaan`
- 包管理：`bun`
- 终端 UI：[`ink`](https://github.com/vadimdemedes/ink)
- 当前阶段：`初步项目搭建 / 架构起盘`

## 1. 项目目标

这个项目不做“把两个项目硬拼起来”的临时工程，而是做一个可持续演进的 CLI AI 编程助手内核。初版重点不是把所有功能一次性搬完，而是先把以下基础打牢：

1. 明确边界上下文，避免会话、工具、配置、工作区、模型调用相互缠绕。
2. 使用 DDD 分层，把“业务规则”和“技术实现”拆开。
3. 用 Bun 保持启动速度和开发效率，用 Ink 做终端交互层。
4. 保持低耦合、高内聚，方便后续接入真实模型、工具系统、权限系统、会话持久化和插件机制。

## 2. 参考项目融合策略

### 来自 `cc` 的借鉴方向

`E:\26Project\Adnify-Cli\cc`

- CLI 入口与启动路径拆分
- 工具编排与权限边界意识
- 会话主循环与终端交互组织方式
- 面向终端的交互体验设计

### 来自 `adnify` 的借鉴方向

`E:\Project\adnify`

- `ModeRegistry` 这类模式注册思想
- `ContextAssembler` 这类上下文聚合思路
- `ToolManager` 这类提供者管理方式
- 领域职责拆分与服务解耦方向

### 当前实现策略

初版不会直接复制两个项目的目录，而是抽出更适合 CLI 的统一架构：

- `Session` 负责会话聚合与消息生命周期
- `Assistant` 负责助手画像、模式与未来的推理策略
- `Tooling` 负责工具目录与未来的工具编排
- `Workspace` 负责工作区洞察与上下文来源
- `Application` 负责用例编排
- `Infrastructure` 负责文件系统、日志、ID、时钟、模型网关等适配器
- `Presentation` 负责 Ink 界面与输入控制

## 3. 架构原则

### 3.1 设计原则

- 高性能：优先轻量依赖、快速启动、少做无意义抽象。
- 低耦合：领域对象不依赖 Ink、不依赖 Node API、不依赖具体模型 SDK。
- 高内聚：每个目录只解决一类问题，避免“万能 utils”和“超级 service”。
- 高复用：通过端口与适配器隔离基础设施，便于替换模型、存储、工具执行器。
- 无冗余：只放当前阶段真正有价值的抽象，不堆空接口和死代码。

### 3.2 DDD 分层

| 层 | 作用 | 当前内容 |
| --- | --- | --- |
| `domain` | 核心业务规则与聚合 | 会话、消息、模式、工具、工作区 |
| `application` | 编排业务用例 | 启动、建会话、提交消息、本地命令 |
| `infrastructure` | 技术细节适配 | 本地工作区探测、日志、内存仓储、ID、时钟、AI 桩实现 |
| `presentation` | CLI 表现层 | Ink 界面、输入处理、状态桥接 |

## 4. 边界上下文规划

### 4.1 Session 上下文

职责：

- 管理消息流
- 管理当前模式
- 维护会话标题、时间戳、工作区归属
- 作为 CLI 交互的核心聚合根

后续可扩展：

- 会话持久化
- 分支会话
- 检查点与回滚
- 多轮上下文压缩

### 4.2 Assistant 上下文

职责：

- 管理助手身份信息
- 管理模式定义（`chat` / `agent` / `plan`）
- 承载后续不同推理策略入口

后续可扩展：

- 多模型策略
- 模式级 Prompt Profile
- Token Budget 策略

### 4.3 Tooling 上下文

职责：

- 维护工具目录
- 统一展示工具能力
- 为后续工具执行编排预留稳定模型

后续可扩展：

- 工具提供者注册
- 权限审批
- Shell / File / Search / Web / MCP / Git 工具

### 4.4 Workspace 上下文

职责：

- 探测当前工作区状态
- 提供 Git、包管理器、顶层目录等摘要
- 为后续上下文组装与工具执行提供基础环境信息

后续可扩展：

- 文件索引
- 代码摘要
- 检索增强
- 忽略规则与目录权限

## 5. 当前目录结构

```text
Adnify-Cli/
├─ cc/                                # 参考项目快照，仅用于研究与对照
├─ src/
│  ├─ application/
│  │  ├─ dto/
│  │  ├─ ports/
│  │  └─ use-cases/
│  ├─ domain/
│  │  ├─ assistant/
│  │  ├─ session/
│  │  ├─ tooling/
│  │  └─ workspace/
│  ├─ infrastructure/
│  │  ├─ bootstrap/
│  │  ├─ config/
│  │  ├─ llm/
│  │  ├─ logging/
│  │  ├─ persistence/
│  │  ├─ system/
│  │  └─ workspace/
│  ├─ presentation/
│  │  └─ ink/
│  └─ main.tsx
├─ package.json
├─ tsconfig.json
└─ README.md
```

## 6. 当前已搭建的内容

初版脚手架会先交付下面这些能力：

1. Bun + TypeScript + Ink 基础工程配置。
2. DDD 目录骨架。
3. 会话聚合根与消息实体。
4. 应用层用例：
   `BootstrapCliUseCase`
   `CreateSessionUseCase`
   `SubmitPromptUseCase`
   `ApplyCliCommandUseCase`
5. 基础设施适配器：
   内存仓储、控制台日志、系统时钟、UUID 生成器、本地工作区探测器、AI 响应桩。
6. 可运行的 Ink 初版界面：
   标题区、消息区、输入区、底部帮助区。
7. 本地命令雏形：
   `:help`
   `:mode chat|agent|plan`
   `:workspace`
   `:tools`
   `:clear`
   `:exit`

## 7. 运行方式

安装依赖后可使用：

```bash
bun install
bun run dev
```

构建：

```bash
bun run build
```

运行测试：

```bash
bun test
```

## 8. 迭代路线图

### Phase 1：架构起盘

- 完成项目目录
- 完成领域模型
- 完成 CLI 初版
- 完成基础 README

### Phase 2：真实 AI 接入

- 抽象 `ModelGateway`
- 接入 OpenAI / Anthropic / OpenAI-Compatible
- 增加流式输出
- 增加错误恢复与超时控制

### Phase 3：工具系统

- 设计工具注册中心
- 接入文件读写、搜索、Shell、Git
- 引入权限审批层
- 引入工具执行日志

### Phase 4：上下文系统

- 工作区摘要
- 文件片段注入
- 代码索引
- 记忆与规则

### Phase 5：高级能力

- 多 Agent
- Plan 模式
- 插件系统
- 会话持久化
- MCP 集成

## 9. 架构约束

为了避免后面失控，项目从一开始就约束以下事项：

- `domain` 内禁止出现 Ink、Node 文件系统、终端 IO 依赖。
- `presentation` 不直接编排复杂业务，只调用用例。
- `infrastructure` 不承载业务规则，只负责技术实现。
- `use-case` 可以依赖端口，但不能反向依赖具体适配器。
- 所有新增模块优先考虑“能否成为独立边界上下文”。

## 10. 下一步建议

这个初版脚手架完成后，下一步最值得继续做的是：

1. 接入真实模型网关，把当前 AI 桩替换成流式推理适配器。
2. 建立工具注册中心，把文件、命令、搜索能力纳入统一协议。
3. 增加本地配置系统，支持模型、工作模式、权限和主题。
4. 接入会话持久化与工作区记忆。

## 11. 开发规范

为了让 `vibecoding` 保持高效率但不失控，仓库增加了 `.rules` 规范目录：

- [Rules Index](E:\26Project\Adnify-Cli\.rules\README.md)
- [Core Rules](E:\26Project\Adnify-Cli\.rules\00-core.md)
- [Architecture Rules](E:\26Project\Adnify-Cli\.rules\10-architecture.md)
- [Coding Style Rules](E:\26Project\Adnify-Cli\.rules\20-coding-style.md)
- [Delivery Workflow Rules](E:\26Project\Adnify-Cli\.rules\30-delivery-workflow.md)
- [AI Collaboration Rules](E:\26Project\Adnify-Cli\.rules\40-ai-collaboration.md)

后续所有新增功能、重构、AI 生成代码和工具接入，都应以 `.rules` 中的约束为准。

## 12. 说明

当前仓库中的 `cc` 目录保留为参考资料；`E:\Project\adnify` 作为外部参考工程，不会直接写入本仓库。当前脚手架的目标是先把 `Adnify-Cli` 自身的架构地基打稳，后续再逐步把可复用能力迁移进来。
