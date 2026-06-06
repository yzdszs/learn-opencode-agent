---
title: Agent 框架与 Runtime 怎么选
description: 从控制流、状态、工具调用、可观测性和生产约束判断什么时候需要 Agent Framework，并对比自研 loop、LangChain、LangGraph、LlamaIndex、AutoGen、CrewAI、Semantic Kernel、平台 SDK、MCP 和托管 Agent Runtime 的适用场景。
contentType: support
series: support
contentId: agent-selection-agent-frameworks
shortTitle: Agent 框架与 Runtime 选型
summary: Agent 框架选型要先分清模型 API、工具调用、Agent Runtime、Workflow Runtime、RAG 框架、工具协议和托管运行时，不要把所有能力混成一个框架品牌问题。
difficulty: advanced
estimatedTime: 40 分钟
learningGoals:
  - 判断什么时候需要 Agent Framework
  - 区分自研 loop、LangChain、LangGraph、LlamaIndex、AutoGen、CrewAI、Semantic Kernel、平台 SDK、MCP 和 Managed Agents 的边界
  - 识别框架过度设计和抽象泄漏风险
  - 建立按复杂度台阶升级的选型顺序
prerequisites:
  - 了解工具调用
  - 了解 Agent Loop
  - 了解基础 RAG
recommendedNext:
  - /agent-selection/02-langgraph
  - /agent-selection/07-scenario-playbook
  - /agent-selection/23-mcp-tool-selection
practiceLinks:
  - /practice/p10-react-loop/
  - /practice/p11-planning/
  - /practice/p14-mcp/
  - /practice/p15-multi-agent/
searchTags:
  - Agent Framework
  - LangChain
  - LangGraph
  - LlamaIndex
  - AutoGen
  - CrewAI
  - MCP
  - Agent Runtime
navigationLabel: Agent 框架与 Runtime 选型
entryMode: bridge
roleDescription: 适合在自研 loop、Agent 框架、状态图、平台 SDK、MCP 和托管 Agent Runtime 之间做工程取舍时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱，不是实时排名。平台 SDK、托管 Agent Runtime、工具协议、可用区域和 API surface 会变化，进入实现前请以官方文档、价格页、版本说明和业务样本评测为准。

## 先判断是否真的需要框架

Agent Framework 解决的是过程控制，不是模型能力本身。只有当任务出现多步执行、状态推进、工具编排、失败恢复、人工确认和审计时，框架才有价值。

如果只是下面这些场景，不要先上框架：

- 单轮分类、总结、改写；
- 简单问答；
- 一次搜索后总结；
- 固定 RAG pipeline；
- 只有一两个工具的轻量调用。

更简单的路线通常是：

```text
普通模型调用
  -> 手写少量工具调用
  -> 轻量 ReAct loop
  -> Agent Framework
  -> 多 Agent 编排
```

每升一级都要能说清"低一级哪里不够"。如果只是为了显得架构完整，通常就是过度设计。

## 这个类别解决的六类问题

Agent 框架组件解决的不是一个问题，而是几类不同问题：

```text
Model API
  -> 怎么调用模型

Tool Calling
  -> 模型怎么提出工具调用

Agent Runtime
  -> 谁管理 loop、session、handoff、guardrail、trace

Workflow Runtime
  -> 谁管理状态、分支、暂停、恢复和 checkpoint

RAG Framework
  -> 谁管理数据接入、索引、retriever、query engine

Tool Protocol
  -> 工具怎么暴露、发现、授权和复用

Managed Runtime
  -> 谁托管 agent loop、环境、工具执行和会话状态
```

很多选型失败，是因为团队把这些问题都塞进"用哪个 Agent 框架"一句话里。

## 主流选择对比

| 方案 | 本质 | 强项 | 代价 | 适合场景 | 不适合场景 |
| --- | --- | --- | --- | --- | --- |
| 自研轻量 loop | 应用自己写 tool call / observe / answer 循环 | 透明、可控、依赖少、容易调试 | 状态、恢复、trace 要自己补 | 少量工具调用、第一版 Agent、强业务控制 | 长流程、复杂分支、恢复执行 |
| LangChain | LLM 应用组件生态 | 模型、工具、chain、retriever 集成多，上手快 | 抽象层多，生产边界要收紧 | 快速原型、多模型和工具集成 | 需要严格状态机和可恢复工作流 |
| LangGraph | 状态图 / Workflow Runtime | 显式状态、分支、checkpoint、human-in-the-loop、恢复执行 | 简单任务会过度设计，状态 schema 要设计 | 长流程、多分支、可回放、可暂停恢复 | 单轮问答、固定 RAG pipeline、少量工具调用 |
| LlamaIndex | 数据连接和 RAG 框架 | loader、index、retriever、query engine、RAG 抽象强 | 通用 Agent 控制流不是主战场 | 知识库、企业文档、数据接入、RAG 产品 | 复杂业务流程编排 |
| AutoGen | 多 Agent 对话协作框架 | 多角色对话、研究原型、协作实验 | 容易把流程写成角色聊天，责任边界变虚 | 多 Agent 研究、方案探索、角色协作原型 | 严肃业务流程自动化、强审计生产系统 |
| CrewAI | Role / Task / Process 编排 | 概念直观，适合业务角色任务原型 | 拟人化角色过多会稀释责任和状态边界 | 内容生产、业务流程原型、多角色任务分配 | 需要精确状态、权限、恢复和审计 |
| Semantic Kernel | 企业插件和函数编排框架 | .NET / Azure 生态、插件模式、企业集成 | 微软生态绑定更明显 | .NET 企业系统、Azure 集成、函数插件体系 | 非微软生态或轻量原型 |
| Haystack | 搜索和 RAG pipeline 框架 | 检索、Reader、pipeline、搜索系统集成 | Agent Runtime 能力不是核心 | 搜索/RAG pipeline、问答系统、信息检索 | 复杂行动型 Agent |
| OpenAI Agents SDK | OpenAI-first Agent Runtime | agent loop、tools、handoff、guardrails、sessions、tracing | OpenAI 平台抽象和 runtime 迁移成本要评估 | OpenAI-first 产品、平台 trace 和 guardrail 集成 | 强跨 provider、强自有 runtime 控制 |
| Claude API Tool Use | Claude 模型工具调用能力 | 工具 schema 清楚，应用可完全控制执行和审批 | loop、状态、trace、工具执行要应用自己管 | Claude-first，自有 runtime，强审批和安全边界 | 想把 agent loop 和环境都交给平台托管 |
| Claude Managed Agents | Anthropic 托管 Agent Runtime | Anthropic 执行 agent loop，session、container、工具执行、事件流和版本化 agent 配置更完整 | Beta / API surface 约束，平台可用性和迁移成本要评估 | 需要托管长任务、workspace、文件操作、bash、MCP、session 事件流 | Bedrock / Vertex / Foundry 接入面，或必须自托管全部运行时 |
| MCP | 工具协议，不是 Agent 框架 | 工具暴露、发现、授权和跨客户端复用 | 不负责 agent loop、状态机和业务审批 | 多工具生态、第三方系统接入、工具复用 | 想让 MCP 替代 runtime 或 workflow |
| Dify / Flowise / Langflow | 低代码 LLM 应用平台 | 快速搭建、可视化、适合内部工具和原型 | 深度定制、复杂权限和迁移成本要评估 | 业务原型、运营配置、内部知识助手 | 核心产品 runtime、强代码治理场景 |

这个表不是排名。先确定你要解决哪一层问题，再选组件。

## 先看复杂度台阶

框架选型最容易犯的错，是把"未来可能复杂"当成"现在必须上框架"。更稳的做法是按复杂度台阶升级：

| 台阶 | 典型形态 | 退出条件 |
| --- | --- | --- |
| 模型调用 | prompt + response | 需要调用外部能力 |
| 固定 pipeline | RAG、Search、固定工具链 | 需要按结果分支 |
| 轻量 loop | tool call + observe + answer | 需要持久状态和恢复 |
| 状态图 | 节点、边、checkpoint | 需要多团队协作和审计 |
| 多 Agent | 多角色分工 | 单 Agent 已验证仍不够 |

每升一级都要能说清"低一级哪里不够"。如果只是为了显得架构完整，通常就是过度设计。

## 各框架适用场景

### 自研轻量 loop 什么时候够用

自研 loop 不是低级方案。很多生产 Agent 第一版就应该这么做。

适合：
- 只有一到几个工具；
- 工具调用风险可控；
- 流程短、状态简单；
- 团队需要强控制和强可观测；
- 审批、权限、日志都在自有系统里。

典型结构：

```text
user input
  -> model call
  -> tool call?
  -> validate tool args
  -> execute tool
  -> append observation
  -> model answer
```

不适合：状态节点很多、需要 checkpoint、需要暂停恢复、需要复杂人机确认、需要可视化流程和系统级 replay。

一句话：短流程自己写，长流程再找 runtime。

### LangChain 什么时候用

LangChain 的价值在生态和集成，不在替你设计业务边界。

适合：快速原型、多模型接入、多工具接入、chain/retriever/loader 组合。

不适合：明确需要显式状态图、严格 checkpoint、每个状态迁移都要审计、业务权限和审批强约束。

```text
用了 LangChain 不等于有了生产 Agent Runtime。
它能帮你接很多东西，但不会替你定义状态、权限、停止条件和评估集。
```

### LangGraph 什么时候用

LangGraph 适合 workflow runtime 问题，不是"更高级的 LangChain"。

适合：多步长流程、有明确状态 schema、有分支和循环、需要 checkpoint、需要恢复执行、需要 human-in-the-loop、需要 replay 和 trace。

不适合：单轮问答、搜索后总结、固定 RAG pipeline、只有一个工具调用、没有状态 schema。

判断标准：

```text
如果你说不清每个节点的输入、输出和失败处理，别上 LangGraph。
如果低一级 loop 能跑通业务样本，先别画图。
```

### LlamaIndex 什么时候用

主战场是数据接入、索引和 RAG。

适合：企业文档知识库、多数据源 loader、向量索引/关键词索引、query engine、文档问答。

不适合：复杂业务流程编排、高风险工具执行、多状态审批流。

一句话：知识复杂选 LlamaIndex，流程复杂看 LangGraph 或自有 runtime。

### AutoGen 和 CrewAI 什么时候用

适合探索多 Agent 协作，但要小心拟人化过度。

适合：研究原型、多角色内容生产、方案生成和评审、模拟多人协作、低风险自动化。

不适合：生产关键业务流程、强权限系统、高风险工具执行、必须可审计可恢复的状态流。

坏味道：

```text
Planner Agent
Reviewer Agent
Executor Agent
Manager Agent
Critic Agent
```

如果这些角色没有清晰输入输出，只是在互相聊天，就是把业务流程写成戏剧脚本。

### Semantic Kernel 什么时候用

更适合企业插件和函数编排，尤其是 .NET / Azure 生态。

适合：.NET 企业系统、Azure 生态、现有服务函数化、插件模式、企业内部助手和业务系统集成。

不适合：非微软生态的小型原型、只需要简单工具调用。判断重点不是它能不能做 Agent，而是你的组织是否已经在微软生态里。

### OpenAI Agents SDK 什么时候用

OpenAI-first Agent Runtime。

适合：OpenAI-first 产品、希望使用平台内 tools/handoff/guardrails/sessions/tracing、团队接受 OpenAI 平台抽象。

不适合：强跨 provider、核心状态必须完全自有、工具 schema 必须平台无关、不接受平台 runtime 迁移成本。

注意：锁定风险更多在 runtime、tracing、guardrails、sessions、handoff 等平台抽象，而不是单纯的 model provider。

### Claude Tool Use、MCP、Managed Agents 怎么分

三者不是同一层。

| 方案 | 层级 | 主要解决 | 不主要解决 |
| --- | --- | --- | --- |
| Claude API Tool Use | 模型工具调用层 | Claude 产生 tool call，应用执行或接入 server-side tools | 通用 workflow 状态机、完整托管 runtime |
| MCP | 工具协议层 | 工具如何暴露、发现、授权和跨客户端复用 | Agent loop、状态、业务审批 |
| Claude Managed Agents | 托管 Agent Runtime | Anthropic 管理 agent loop、session、container、事件流、工具执行工作区 | 所有云接入面都可用、完全自有 runtime |

**Claude API Tool Use** 适合：Claude-first、自己管理 loop 和工具执行、需要强审批、权限和审计放在自有系统。

**MCP** 适合：多工具生态、工具跨客户端复用、GitHub/Linear/Notion 等第三方接入、工具协议标准化。但 MCP 是 Tool Protocol，不是 Agent Runtime。

**Claude Managed Agents** 适合：希望 Anthropic 托管 agent loop、需要持久 agent config 和 container workspace、需要 bash/文件读写/代码执行等工具环境。当前是 beta / 特定 API surface，不要默认 Bedrock、Vertex、Foundry 等接入面也支持。

## 选型顺序

```text
只是一次模型调用？
  -> 不要 Agent 框架

只有一两个工具？
  -> Claude/OpenAI tool use + 自研轻量 loop

需要快速接模型、工具、retriever？
  -> LangChain

知识库和索引复杂？
  -> LlamaIndex / Haystack

流程有状态、分支、恢复、人机确认？
  -> LangGraph

多角色协作实验？
  -> AutoGen / CrewAI

.NET / Azure 企业集成？
  -> Semantic Kernel

OpenAI-first，并接受平台 runtime？
  -> OpenAI Agents SDK

Claude-first，自有 runtime？
  -> Claude API Tool Use + 自研 loop + MCP

Claude-first，想要托管长任务和 workspace？
  -> Claude Managed Agents

工具要跨多个 Agent / 客户端复用？
  -> MCP

业务人员要可视化配置？
  -> Dify / Flowise / Langflow，但核心产品要评估迁移成本
```

## 典型误判

| 误判 | 问题 |
| --- | --- |
| 有工具调用就要 Agent 框架 | 一个 tool call 用轻量 loop 就够 |
| 有多步就要 LangGraph | 固定 pipeline 不需要状态图 |
| LlamaIndex 能替代业务 workflow | 它主战场是 RAG，不是审批流 |
| AutoGen / CrewAI 角色越多越智能 | 角色多通常只是责任边界更模糊 |
| MCP 是 Agent 框架 | MCP 是工具协议，不管理 agent loop |
| Managed Agents 等于 MCP | Managed Agents 是托管 runtime，MCP 是工具协议 |
| 平台 SDK 一定锁死模型 | 锁定常在 runtime、trace、session、guardrail，而不只是模型 |
| 自研 loop 不专业 | 简单流程自研更透明、更可控 |

## 框架准入检查

引入 Agent Framework 前，至少回答：

- 是否有明确状态 schema；
- 是否有工具错误结构；
- 是否有停止条件；
- 是否有 trace 和 replay 需求；
- 是否有分支测试样本；
- 是否需要人工确认；
- 是否能接受框架升级和迁移成本。

如果这些问题答不上来，先用轻量 loop 跑通业务样本。框架应该承载已经清楚的流程，不应该替团队发现流程。

框架带来的不是免费能力，而是新的约束：状态 schema 要设计、trace 要接入、工具错误要规范化、任务停止条件要明确、测试样例要覆盖分支、后续迁移要考虑平台锁定。

## 推荐策略

| 场景 | 推荐 |
| --- | --- |
| 单轮分类、总结、抽取 | 普通模型调用 |
| 少量工具调用 | Tool Use + 自研轻量 loop |
| RAG 原型 | LlamaIndex / LangChain |
| 企业知识库 | LlamaIndex / Haystack + 自有权限和评估 |
| 长流程行动 Agent | LangGraph 或自有 workflow runtime |
| 多 Agent 研究原型 | AutoGen / CrewAI |
| OpenAI-first 产品 | OpenAI Agents SDK |
| Claude-first 自有 runtime | Claude API Tool Use + MCP |
| Claude-first 托管长任务 | Claude Managed Agents |
| 企业 .NET / Azure | Semantic Kernel |
| 工具生态标准化 | MCP |

## 最终判断

```text
少量工具：轻量 loop
集成生态：LangChain
显式状态：LangGraph
知识检索：LlamaIndex / Haystack
多角色实验：AutoGen / CrewAI
企业微软栈：Semantic Kernel
OpenAI-first runtime：OpenAI Agents SDK
Claude-first 自有控制：Claude Tool Use + MCP
Claude-first 托管工作区：Managed Agents
工具协议：MCP
```

不要从框架品牌开始。先问清楚你要的是工具调用、状态机、RAG、协议，还是托管运行时。
