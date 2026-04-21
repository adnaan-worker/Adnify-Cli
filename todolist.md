# Adnify-Cli 任务清单

## 角色分工

- 开发者 A：Agent、工具执行、模型能力、工具编排
- 开发者 B：持久化、启动恢复、文档、交互体验、终端 UI

---

## 里程碑

| 代号 | 目标 | 当前状态 |
|------|------|----------|
| M1 | 会话可持久化到本地，退出重开后可恢复工作区最近会话 | 已完成 |
| M2 | 模型可调用工具，工具过程与结果可回到会话流中 | 开发中，已具备最小可用闭环 |
| M3 | 多轮工具协作、权限控制、稳定 UI 与完整协作链路 | 待推进 |

---

## A 线：Agent 与工具

### 已完成

- [x] 建立 `prompts/` 驱动的工具目录加载机制
- [x] 接入最小可用工具调用协议
- [x] `ModelAssistantResponder` 支持多轮工具执行闭环
- [x] `workspace-read` 工具可执行
- [x] `search-index` 工具可执行
- [x] `shell-runner` 工具可执行，且限制为只读命令
- [x] `file-ops` 支持 `read`
- [x] `file-ops` 支持 `list`
- [x] `file-ops` 支持 `write`
- [x] `file-ops` 支持 `update`
- [x] `file-ops` 支持 `patch`
- [x] 文件写入必须显式声明 `allowWrite: true`
- [x] 工具执行过程与结果已写入会话流，可在终端会话区看到
- [x] 已补齐工具执行相关单元测试

### 当前能力边界

- `shell-runner` 当前仅允许只读命令：
- `rg`
- `git status`
- `git diff`
- `git log`
- `git show`
- `git branch`
- `git rev-parse`
- `file-ops` 当前仅允许工作区内文本类文件
- `update/patch` 默认要求单次精确命中，避免误改多处
- 如需全量替换，必须显式声明 `replaceAll: true`

### 待继续

- [ ] 设计工具权限与审批占位机制
- [ ] 为高风险工具补更清晰的风险分级与执行策略
- [ ] 考虑把 `file-ops` 进一步扩展为更结构化的 patch 方案
- [ ] 继续提升模型选择工具与组合工具的稳定性
- [ ] 评估是否迁移到更原生的模型工具调用方案

---

## B 线：持久化与体验

### 已完成

- [x] 会话文件化持久化
- [x] 启动时按工作区恢复最近会话
- [x] `createRuntime` 与启动流程接通
- [x] `:session`
- [x] `:sessions` / `:resume`
- [x] 自定义数据目录与跨平台存储路径解析
- [x] `:storage` / `:storage set` / `:storage reset`
- [x] `:config` 命令式配置链路
- [x] 运行时切换模型配置
- [x] 中英文国际化基础设施
- [x] 输入历史
- [x] `Esc` 中止当前执行，而不是退出程序
- [x] 命令建议回车先填充，不直接执行
- [x] 会话区固定高度视窗基础能力
- [x] 工具执行事件进入会话流，可见化调试体验

### 待继续

- [ ] 继续清理终端中个别文本的编码与展示细节
- [ ] 再优化 `sessions` 展示逻辑，使其更贴近目标交互
- [ ] 做一轮终端渲染稳定性回归检查
- [ ] 补更完整的产品化 README 展示内容与截图
- [ ] 视情况补一份存储与配置专题文档

---

## 推荐合并顺序

1. 先把 M2 收口，补审批边界与更稳定的工具协作体验。
2. 再继续打磨终端 UI、会话区、sessions 展示与动效稳定性。
3. 最后将权限、记忆、插件等能力并入更完整的 M3。

---

## 容易冲突的文件

- `src/infrastructure/bootstrap/createRuntime.ts`
- `src/presentation/ink/hooks/useCliController.ts`
- `src/infrastructure/llm/ModelAssistantResponder.ts`
- `src/infrastructure/tooling/LocalToolExecutor.ts`

如果多人同时修改这些文件，建议先对齐边界再合并。

---

## 当前建议

### 对开发者 A

- 优先继续推进“审批层占位机制”，不要让写入能力无限扩张
- 在现有 `file-ops` 能力稳定后，再考虑更复杂的补丁协议

### 对开发者 B

- 继续控制终端渲染稳定性，避免重复渲染、抖动、信息冗余
- 逐步提升会话区与命令区的品牌化表现，但稳定性优先

---

## 进度勾选

- [x] M1
- [ ] M2
- [ ] M3

---

## 最近更新

### 2026-04-21

- 完成工具执行过程可见化，工具开始与结果可写入会话流
- `file-ops` 新增 `write`，并要求显式 `allowWrite: true`
- `file-ops` 新增 `update/patch`，支持定点替换与全量替换
- 当前测试状态：`47 pass / 0 fail`
