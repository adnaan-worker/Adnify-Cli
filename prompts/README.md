# Prompt Pack

`Adnify-Cli` 的系统提示词、工具定义、命令说明统一放在这个目录里维护。

## 目录约定

- `assistant/profile.md`
  - 助手品牌身份、作者、默认模式、产品简介
- `system/core.md`
  - 所有模式共享的核心系统提示词
- `system/modes/*.md`
  - 按模式拆分的行为约束
- `tools/*.md`
  - 每个工具一份文档，包含元信息和职责描述
- `commands/local-commands.md`
  - 本地命令清单与入口说明

## 设计原则

1. 提示词资产优先放 Markdown，不把长 prompt 写死在 TypeScript 里。
2. 代码层只负责加载、校验、组装，不负责维护大段文案。
3. 每个工具定义都是独立文档，方便后续扩展为更完整的协议。
4. 模式提示和核心提示分离，避免一个巨型 system prompt 难以维护。

## Frontmatter 规范

工具和助手 profile 文件使用极简 frontmatter：

```md
---
id: shell-runner
name: Shell Runner
category: terminal
riskLevel: dangerous
---
```

当前实现只支持简单的 `key: value` 结构。
