---
title: 成本与延迟预算检查
description: 用 Token、动作和时间三类预算检查 Agent 方案是否具备生产准入条件，并判断超预算时应该降级、停止还是请求确认。
contentType: support
series: support
contentId: agent-selection-cost-latency
shortTitle: 成本延迟预算
summary: 成本与延迟不是独立选型主题，而是生产准入检查项；每类任务都要有 Token、动作和时间预算。
difficulty: intermediate
estimatedTime: 25 分钟
learningGoals:
  - 为不同 Agent 任务定义 Token、动作和时间预算
  - 识别模型、检索、搜索和工具链路中的成本延迟风险
  - 判断超预算时应该降级、停止还是请求确认
prerequisites:
  - 已了解模型路由选型
  - 已了解可观测性选型
recommendedNext:
  - /agent-selection/13-model-routing-selection
  - /agent-selection/24-fallback-strategy
  - /intermediate/32-performance-cost/
practiceLinks:
  - /practice/p18-model-routing/
  - /practice/p20-observability/
searchTags:
  - 成本控制
  - 延迟
  - Token 预算
  - 模型路由
  - 缓存
navigationLabel: 成本延迟预算检查
entryMode: bridge
roleDescription: 适合在 Agent 上线评审中检查成本、延迟、预算和超预算处理策略时阅读。
---

<ChapterLearningGuide />

## 这篇解决什么

这篇不是性能优化手册，也不是模型价格对比。它只解决一个生产准入问题：

```text
这个 Agent 在最坏情况下会花多少钱、等多久，超过边界时怎么停下来？
```

如果这个问题答不上来，方案还不能进入生产。

## 三类预算

| 预算 | 控制什么 | 常见失控点 |
| --- | --- | --- |
| Token 预算 | prompt、上下文、工具结果、最终输出 | 长历史、无效 chunk、工具返回全文 |
| Action 预算 | 搜索次数、网页读取数、工具调用数、重试次数 | 多 query、循环 tool call、盲目 retry |
| Time 预算 | 单步超时、总耗时、排队时间 | 串行网页读取、慢工具、强模型推理 |

只设 token 预算不够。研究型 Agent 往往贵在搜索和读取，工具型 Agent 往往慢在外部系统。

## 任务预算卡

不同任务必须有不同预算，不要让所有请求共用一套上限。

| 任务 | Token | Action | Time | 超预算处理 |
| --- | --- | --- | --- | --- |
| 简单问答 | 低 | 0 | 秒级 | 截短输出或要求补充 |
| 知识库问答 | 中 | 1 次检索链路 | 秒级到十秒级 | 降低 TopK 或明确资料不足 |
| 联网研究 | 中到高 | 限制搜索和读取页数 | 可异步或展示进度 | 使用缓存、标注无法确认最新信息 |
| 工具执行 | 中 | 限制工具和重试次数 | 受工具 SLA 约束 | 停止、查状态或转人工 |
| 代码修复 | 高 | 限制文件读取和测试次数 | 可异步 | 展示部分结果并请求继续 |

预算不应该只存在文档里。运行时要能读取预算，并在超过时降级、停止或请求用户确认。

## 成本路径检查

评审时先画一次调用路径，不要只统计最终模型调用。

```text
router
  -> retrieval / search / tool
  -> rerank / reader
  -> main model
  -> retry / fallback
```

| 层 | 检查问题 |
| --- | --- |
| 模型 | 是否所有任务都用了强模型 |
| 上下文 | 是否塞入无关历史、无效 chunk 或工具全文 |
| RAG | TopK、rerank、filter 是否有上限 |
| Search | 搜索次数、读取页数、缓存策略是否明确 |
| Tool | 单步超时、重试次数、副作用状态是否明确 |
| Loop | 是否有最大轮数和停止条件 |

如果估算不出数量级，说明架构边界还没清楚。

## 延迟策略

同样是 30 秒，用户感受不同。选型时要决定哪些任务同步返回，哪些任务异步执行。

| 场景 | 处理 |
| --- | --- |
| 普通问答 | 快速返回，超时直接降级 |
| 联网研究 | 展示进度、来源和读取状态 |
| 工具执行 | 展示状态、确认点和结果通知 |
| 代码修复 | 异步执行，展示 diff 和测试结果 |

复杂 Agent 如果强行同步阻塞，会让用户以为系统卡死。

## 准入检查

进入生产前至少回答：

- 单次请求最多花多少 token、动作和时间；
- 多轮会话累计预算怎么限制；
- 哪些搜索、读取、schema 和工具结果可以缓存；
- 什么任务可以降级模型；
- 超预算后是停止、降级、转人工，还是请求用户确认；
- trace 里是否能看到每层 token、耗时、工具次数和 fallback 次数。

没有预算的 Agent 方案，本质上还没有进入生产设计。

## 最终判断

```text
Token 超限：裁剪上下文
Action 超限：停止工具链路
Time 超限：降级或异步
Search 超限：缓存或说明无法确认
Tool 超限：查状态，不盲目重试
成本不明：不能上线
```

成本与延迟不需要单独复杂化，但必须成为生产准入检查项。
