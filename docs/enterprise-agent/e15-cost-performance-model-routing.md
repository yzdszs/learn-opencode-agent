---
title: E15 成本、性能与模型路由
description: 设计企业 Agent 的模型路由、缓存、降级和成本控制策略
contentType: theory
series: support
contentId: enterprise-agent-e15-cost-performance-model-routing
shortTitle: 成本、性能与模型路由
summary: 企业 Agent 不能所有步骤都调用最强模型，要按意图、风险、上下文长度和延迟要求做模型路由与降级
difficulty: advanced
estimatedTime: 35 分钟
learningGoals:
  - 理解企业 Agent 成本和性能问题来自多步链路
  - 掌握模型路由、缓存、批处理和降级的基本策略
  - 设计 IMS Copilot 的分层模型调用方案
prerequisites:
  - 读过 E14 企业 Agent 的观测与审计
  - 了解多模型调用和基础缓存策略
recommendedNext:
  - /enterprise-agent/e16-project-to-platform-evolution
practiceLinks:
  - /practice/p18-model-routing
  - /practice/p20-observability
searchTags:
  - 模型路由
  - 成本控制
  - 性能优化
  - 企业 Agent
navigationLabel: E15 成本、性能与模型路由
entryMode: bridge
roleDescription: 正在优化企业 Agent 延迟、成本和模型调用策略的工程师
---

# E15 · 成本、性能与模型路由

企业 Agent 一旦进入多步执行，成本和延迟会快速变成现实问题。

一次看似简单的请求，可能包含：

- 意图识别；
- 查询改写；
- RAG 检索后重排；
- Text-to-SQL 计划生成；
- 答案生成；
- 工具调用结果总结。

如果每一步都用最强模型，系统会慢，也会贵。

## 不同步骤不需要同一个模型

IMS Copilot 可以把模型调用分层：

| 任务 | 模型策略 |
| --- | --- |
| 意图分类 | 小模型或规则优先 |
| 实体抽取 | 小模型 + schema 校验 |
| 查询改写 | 中等模型 |
| 高风险计划 | 强模型 + 校验 |
| 最终回答 | 按场景选择模型 |
| 审计摘要 | 小模型或模板 |

关键原则是：把强模型用在需要推理和综合判断的地方，而不是每个步骤都用。

## 路由依据

模型路由至少要看四个维度：

| 维度 | 说明 |
| --- | --- |
| 任务类型 | 分类、抽取、生成、推理 |
| 风险等级 | 是否涉及写操作或敏感数据 |
| 上下文长度 | 是否需要处理长制度文档 |
| 延迟要求 | 是否在用户实时等待路径上 |

可以抽象成：

```ts
type ModelRouteDecision = {
  taskType: 'classify' | 'extract' | 'rewrite' | 'reason' | 'summarize'
  riskLevel: 'low' | 'medium' | 'high'
  latencyClass: 'realtime' | 'background'
  selectedModel: string
  fallbackModel?: string
}
```

模型路由应该是运行时策略，不要散落在各个 Prompt 里。

## 缓存要谨慎

企业 Agent 里缓存很有价值，但也很危险。

可以缓存：

- 公共制度文档的检索结果；
- 文档 chunk 的 embedding；
- 非敏感的意图分类结果；
- 操作入口配置。

不应该随便缓存：

- 个人数据查询结果；
- 带用户身份的完整回答；
- 高风险工具调用结果；
- 审计明细。

缓存的核心问题不是能不能命中，而是会不会跨用户泄露。

## 降级策略

生产系统一定会遇到模型超时或服务不可用。

IMS Copilot 可以按能力降级：

| 能力 | 降级方式 |
| --- | --- |
| Policy Q&A | 返回检索到的原文摘要和引用 |
| 个人数据查询 | 返回结构化结果，不做复杂总结 |
| 操作引导 | 返回固定流程模板 |
| 流程自动化 | 停止在确认前，不执行写操作 |

高风险场景的降级原则是：宁可少做，不要盲做。

## 这一篇的结论

企业 Agent 的成本和性能优化，不是简单换便宜模型。

它要把任务拆细，按任务类型、风险等级、上下文长度和延迟要求做路由。

IMS Copilot 的稳定方案是：

- 小任务小模型；
- 高风险计划强模型；
- 公共知识可缓存；
- 个人数据慎缓存；
- 模型失败时按能力降级；
- 写操作失败或不确定时直接停在安全边界。
