# 10 Architecture

## 1. 固定分层

项目当前采用以下固定分层：

- `src/domain`
- `src/application`
- `src/infrastructure`
- `src/presentation`

没有充分理由时，不新增新层。

## 2. 依赖方向

必须遵守以下依赖方向：

- `presentation -> application`
- `application -> domain`
- `application -> ports`
- `infrastructure -> application ports`
- `infrastructure -> domain`

禁止以下方向：

- `domain -> infrastructure`
- `domain -> presentation`
- `application -> presentation`
- `application` 直接依赖具体 UI 组件

## 3. 各层职责

### domain

只放业务语义和业务规则：

- 聚合根
- 实体
- 值对象
- 领域服务
- 领域规则

禁止放入：

- `fs`
- `path`
- 网络请求
- Ink 组件
- React Hook
- Shell 执行逻辑

### application

只负责用例编排：

- 调用聚合根
- 组织端口协作
- 处理输入输出 DTO

禁止放入：

- 具体数据库实现
- 具体文件系统实现
- 具体模型 SDK 实现
- 具体 CLI 渲染细节

### infrastructure

只负责技术适配：

- 仓储实现
- 本地文件系统访问
- 模型网关实现
- 日志与时钟
- 配置加载

禁止放入：

- 领域规则主逻辑
- UI 状态逻辑
- 临时堆砌的业务判断

### presentation

只负责交互展示：

- Ink 组件
- 输入处理
- 调用用例
- 状态映射

禁止放入：

- 复杂业务编排
- 跨用例事务逻辑
- 文件系统直接访问
- 模型调用细节

## 4. 边界上下文

当前默认边界上下文：

- `assistant`
- `session`
- `tooling`
- `workspace`

后续新增上下文必须满足：

1. 有独立业务语言。
2. 有清晰边界。
3. 有长期演进价值。

不满足这三点，不新建上下文。

## 5. 目录规则

### 允许

- 按边界上下文分目录
- 按实体类型分子目录
- 在 `infrastructure` 下按能力分适配器目录

### 禁止

- 一个目录同时混放实体、用例、组件和脚本
- 在 `src` 根目录堆满横向散文件
- 目录层级超过必要深度

## 6. 复用规则

如果出现以下情况，必须先复用再新增：

- 已存在同义 DTO
- 已存在同义实体
- 已存在同义端口
- 已存在同义基础设施实现

如果必须新建，需要在命名上明确区分用途。

## 7. 模块拆分标准

当一个文件满足以下任意两条时，应考虑拆分：

- 超过 300 行
- 同时处理两类职责
- 出现多个独立状态块
- 出现明显重复逻辑
- 注释开始变成“解释为什么这么乱”

## 8. 架构红线

以下情况出现时必须立即重构，不允许继续叠加：

- UI 组件里直接拼业务对象
- 多个用例互相穿透调用造成循环理解
- 同一功能在多个层重复实现
- 同一数据模型在多个目录各自定义一份

