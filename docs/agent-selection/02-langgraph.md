---
title: LangGraph 与平台 SDK 怎么选
description: 从状态图、多步骤执行、人机确认、恢复执行和审计角度判断什么时候应该使用 LangGraph，并比较平台 Agents SDK、模型 Tool Use 和 LangGraph 的适用边界。
contentType: support
series: support
contentId: agent-selection-langgraph
shortTitle: LangGraph 与 SDK 选型
summary: LangGraph 的价值是显式状态和可恢复流程；平台 SDK、工具调用和 LangGraph 解决的问题不同，不能混为一谈。
difficulty: advanced
estimatedTime: 35 分钟
learningGoals:
  - 理解 LangGraph 的状态机本质
  - 判断什么时候 LangGraph 是必要编排层
  - 区分平台 Agents SDK、模型 Tool Use 和 LangGraph 的主战场
  - 识别 provider 锁定和迁移风险
prerequisites:
  - 了解 Agent Framework 基础选型
  - 了解工具调用和 ReAct Loop
  - 了解多步骤任务执行
recommendedNext:
  - /agent-selection/03-rag-knowledge-selection
  - /agent-selection/07-scenario-playbook
  - /agent-selection/26-human-approval
practiceLinks:
  - /practice/p10-react-loop/
  - /practice/p11-planning/
  - /practice/p14-mcp/
  - /practice/p28-human-in-loop/
searchTags:
  - LangGraph
  - 状态机
  - Human-in-the-Loop
  - Agents SDK
  - Claude Tool Use
  - Checkpoint
navigationLabel: LangGraph 与 SDK 选型
entryMode: bridge
roleDescription: 适合在平台 SDK、模型工具调用和状态图框架之间做取舍时阅读。
---

<ChapterLearningGuide />

## 三者不是同一层

| 方案 | 主要解决 | 不主要解决 |
| --- | --- | --- |
| 平台 Agents SDK | 平台内工具、handoff、trace、运行集成 | 跨平台迁移 |
| Claude API Tool Use | Claude-first 工具调用和工具边界 | 通用工作流状态机 |
| LangGraph | 显式状态、分支、checkpoint、恢复执行 | provider 平台集成 |
| 轻量自研 loop | 小范围工具调用和强控制 | 复杂恢复和可视化编排 |

不要把"能调用工具"误解成"有完整 Agent Runtime"。工具调用只是能力之一。

做取舍前，先明确你到底在选什么：

```text
Model API
  -> 怎么调用模型和工具

Agent Runtime
  -> 谁管理 loop、handoff、session、guardrail

Workflow Runtime
  -> 谁管理状态、分支、暂停、恢复

Tool Protocol
  -> 工具如何暴露、发现、授权和执行
```

OpenAI Agents SDK 更偏 Agent Runtime，Claude API Tool Use 更偏模型工具调用边界，LangGraph 更偏 Workflow Runtime，MCP 更偏 Tool Protocol。它们可以组合，不是互斥替代。

## LangGraph 什么时候值得用

LangGraph 的价值可以压成一句话：

```text
显式状态 + 图结构 + 条件路由 + 持久化 + 恢复执行
```

| 场景 | 为什么 LangGraph 有价值 |
| --- | --- |
| 多阶段任务 | 每一步有明确输入、输出和状态变化 |
| 分支流程 | 不同观察结果进入不同节点 |
| 重试与修复 | 失败后回到指定节点，而不是重跑全部流程 |
| Human-in-the-Loop | 高风险操作前暂停，等待人工确认 |
| 长任务恢复 | 任务中断后从 checkpoint 继续 |
| 多 Agent 工作流 | 每个角色或阶段边界明确 |
| 审计和回放 | 能解释每一步为什么执行 |

典型任务：

```text
plan -> search -> inspect -> edit -> test -> fix -> review -> deliver
```

这种流程如果用一段 Prompt 硬撑，迟早会丢状态、重复动作或跳过关键步骤。

## 什么时候别用 LangGraph

| 场景 | 更简单的选择 |
| --- | --- |
| 单轮问答 | 普通模型调用 |
| 搜索后总结 | Search + LLM |
| 固定知识库问答 | RAG pipeline |
| 少量工具调用 | 手写 tool loop |
| 没有状态 schema | 先设计数据结构 |
| 团队没有 trace 和测试 | 先补可观测性 |

如果你画不出状态图，就别用图框架。图不是装饰，它是系统的数据结构。

## 判断标准

问五个问题：

1. 任务是否会分支？
2. 中间状态是否必须保存？
3. 失败后是否要从某一步恢复？
4. 是否需要人工确认？
5. 是否需要回放和审计？

如果只有一个问题是"是"，不一定要用 LangGraph。至少三个是"是"，LangGraph 才开始有明显收益。

## LangGraph 和 LangChain 的区别

| 维度 | LangChain | LangGraph |
| --- | --- | --- |
| 核心定位 | 集成模型、工具、链和 agent | 状态图与流程编排 |
| 控制流 | 更偏线性或 agent loop | 显式节点、边、条件路由 |
| 状态 | 可以有，但不是核心表达 | 状态是核心数据结构 |
| 恢复执行 | 需要额外设计 | 更适合 checkpoint 和恢复 |
| 适用任务 | 原型、工具集成、中等复杂 Agent | 长流程、可审计、可恢复 Agent |

## 最小状态设计

LangGraph 项目真正难的不是画图，而是定义状态。

状态里应该放：用户目标、当前计划、工具调用结果、检索和搜索来源、人工确认结果、错误和重试次数、最终输出和引用。

状态里不应该放：无边界的原始上下文、不可序列化对象、只为某个节点临时存在的数据、没有生命周期的调试字段。

| 常见错误 | 后果 |
| --- | --- |
| 把所有上下文塞进一个 messages | 节点边界失效，难以恢复 |
| 状态字段没有 owner | 不知道哪个节点能修改 |
| 错误只存自然语言 | 无法结构化重试和降级 |
| checkpoint 不含工具结果 | 回放时必须重新调用外部系统 |
| 审批结果不入状态 | 恢复执行时无法判断是否批准 |

状态 schema 一旦混乱，LangGraph 只会把混乱显式化。先设计数据，再画图。

## 平台 SDK vs Tool Use vs LangGraph 怎么选

| 场景 | 推荐 |
| --- | --- |
| OpenAI-first 产品 | 平台 Agents SDK |
| Claude-first 且自有 runtime | Claude API Tool Use + MCP |
| 长流程、分支、恢复 | LangGraph |
| 简单工具调用 | 轻量 loop |
| 多 provider 产品 | 自有抽象 + 可替换工具层 |
| 企业高审计流程 | 自有状态和审计 + 框架能力 |

## 方案对比

| 方案 | 抽象层级 | 你获得什么 | 你要自己补什么 |
| --- | --- | --- | --- |
| 直接模型 API | 最低 | 最大控制权 | loop、tool dispatch、trace、session |
| Claude API Tool Use | 模型工具层 | 工具调用和 server/client tool 边界 | 跨 provider runtime、复杂状态 |
| OpenAI Agents SDK | Agent runtime | agent loop、tools、handoff、guardrails、sessions、tracing | 非 OpenAI 栈迁移策略 |
| LangGraph | Workflow runtime | durable execution、streaming、human-in-the-loop、persistence | 模型和工具集成选择 |
| 自研 runtime | 自定义 | 完整控制 | 研发和维护成本 |

如果只是"模型需要调用一个查询工具"，直接 tool calling 或轻量 loop 足够。如果任务要暂停、恢复、回放和状态迁移，才考虑 LangGraph。

## 关键判断

问五个问题：
1. 是否必须使用某个平台的托管能力？
2. 是否需要显式状态和恢复执行？
3. 工具定义是否需要跨 provider 复用？
4. trace 是否需要进入自有观测系统？
5. 未来是否可能换模型或换平台？

答案决定你是在选 SDK、工具调用、状态图，还是自有 runtime。

## 两个典型误判

第一个误判是"有工具调用就需要 SDK"。如果只是让模型查询一个只读 API，轻量 tool wrapper 足够。SDK 的价值在于会话、handoff、guardrails、trace 等 runtime 能力。

第二个误判是"有多步流程就需要 LangGraph"。如果流程是固定 pipeline，普通 pipeline 更简单。LangGraph 适合有分支、暂停、恢复和回放的流程。

## 组合模式

| 组合 | 适合 |
| --- | --- |
| Claude API Tool Use + MCP | Claude-first，工具生态要统一 |
| OpenAI Agents SDK + MCP | OpenAI-first，需要 agent loop 和外部工具 |
| LangGraph + 任意模型工具调用 | 长流程、状态强、provider 可替换 |
| 自研 runtime + MCP | 强控制、多客户端复用工具 |
| SDK 原型 -> 自有 runtime | 先验证需求，再降低锁定 |

真正要保护的是业务状态、权限和审计，不是表面上的框架选择。

## 控制边界怎么放

| 边界 | 建议 |
| --- | --- |
| 模型选择 | 可用平台 SDK，但保留路由策略 |
| 工具 schema | 尽量平台无关，便于复用 |
| 业务状态 | 放在自有系统 |
| 审批状态 | 放在自有系统 |
| trace | 至少能导出关键 span |
| 评测样本 | 自有，不绑定平台 |

这样即使用平台 SDK，也不会让平台成为唯一控制面。

## 工程建议

| 建议 | 原因 |
| --- | --- |
| 先画状态流，再写节点 | 数据结构错了，图只会放大错误 |
| 节点只做一件事 | 节点太大，图就失去意义 |
| 每个节点记录输入输出 | 方便回放和评估 |
| 高风险工具前加人工确认 | 不要让模型直接执行危险动作 |
| 每个分支都写测试样例 | 图最容易在边界分支出错 |

## 不要做什么

- 不要为了工具调用引入复杂图框架；
- 不要为了平台集成牺牲关键业务状态；
- 不要把高风险审批藏在模型 Prompt 里；
- 不要把 trace 只留在不可导出的控制台；
- 不要让工具 schema 只存在某个 provider 的私有格式里。

## 最终判断

```text
简单任务：别用 LangGraph
平台产品：优先 SDK
模型工具调用：优先 Tool Use / 轻量 loop
复杂状态：优先 LangGraph
固定流程：谨慎用 LangGraph
高迁移要求：自有边界
```

选型重点不是谁更高级，而是谁控制了状态、工具、权限和观测边界。LangGraph 不是默认选择，是当系统复杂到必须显式管理状态时，才值得引入的工具。
