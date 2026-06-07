---
title: Agent 可观测性与评估怎么选
description: 从 Trace、Replay、Eval、日志、指标和告警判断 Agent 生产可观测性应该怎么设计，并对比 LangSmith、Langfuse、Arize Phoenix、Helicone、OpenTelemetry、Braintrust、Ragas、DeepEval 和 promptfoo 的适用场景。
contentType: support
series: support
contentId: agent-selection-observability-trace-replay-eval
shortTitle: 可观测性与评估选型
summary: Agent 可观测性的核心是能解释、能回放、能评估；Trace、Replay、Eval、Monitoring 和 Audit 五层缺一不可。
difficulty: advanced
estimatedTime: 40 分钟
learningGoals:
  - 区分 Trace、Replay、Eval、Monitoring 和 Audit 的边界
  - 设计能定位检索、搜索、工具和模型问题的记录结构
  - 判断 LangSmith、Langfuse、Phoenix、Helicone、Braintrust、Ragas、DeepEval、promptfoo 等工具适合什么场景
  - 建立生产 Agent 的最小观测和评估组合
prerequisites:
  - 已了解 Agent 框架、RAG 和搜索工具边界
  - 已了解 POC 与评估标准
recommendedNext:
  - /agent-selection/23-cost-latency-selection
  - /agent-selection/24-fallback-strategy
  - /practice/p20-observability/
practiceLinks:
  - /practice/p20-observability/
  - /practice/p21-evaluation/
searchTags:
  - Agent 可观测性
  - Trace
  - Replay
  - Eval
  - LangSmith
  - Langfuse
  - Ragas
  - Observability
navigationLabel: 可观测性与评估选型
entryMode: bridge
roleDescription: 适合为生产 Agent、RAG 系统、工具执行 Agent 和模型路由系统选择 trace、eval、monitoring 工具时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱，不是实时排名。产品能力、托管区域、价格、开源协议和集成方式会变化，采购或上线前请以官方文档、价格页、版本说明和业务样本评测为准。

## 只看最终答案不够

Agent 出错时，问题可能来自：意图识别、检索、搜索、工具调用、模型生成、状态路由、权限过滤。如果没有 trace，只能猜。

Agent 可观测性要回答四个问题：

```text
为什么这么做？
  -> 决策 trace

看到了什么？
  -> 上下文和来源 trace

调用了什么？
  -> 工具和参数 trace

结果如何？
  -> eval 和用户反馈
```

普通服务日志只能告诉你哪里报错；Agent trace 要告诉你为什么走到了那一步。

## 五层能力分层

| 能力 | 作用 | 必须回答的问题 |
| --- | --- | --- |
| Trace | 记录每一步输入输出 | 为什么这么做？看到了什么？ |
| Replay | 用同一输入重放问题 | 当时哪里出错了？修复是否生效？ |
| Eval | 用样本集持续评估 | 质量在提升还是退化？ |
| Monitoring | 线上趋势和异常 | 成本、延迟、错误率是否正常？ |
| Audit | 谁访问了什么、是否越权 | 合规和安全边界是否被突破？ |

这几类能力不要混成一个日志文件。

## Trace 数据模型

建议把一次 Agent 运行拆成这些 span：

| Span | 记录 |
| --- | --- |
| intent | 用户目标、分类结果、置信度 |
| retrieval | query、filter、chunks、scores |
| search | 搜索词、来源、时间、读取状态 |
| tool | 工具名、参数、结果、错误 |
| model | 模型、输入摘要、输出、usage |
| decision | 路由、fallback、审批原因 |
| final | 答案、引用、成本、延迟 |

最小 trace schema：

```text
run_id:
span_id:
parent_id:
span_type: intent / retrieval / search / tool / model / decision / final
start_time:
end_time:
input_summary:
output_summary:
error_type:
cost:
latency:
redaction_level:
```

每个 span 都应该有 run id、parent id、时间、输入摘要、输出摘要和错误类型。否则排查时只能看到碎片，无法还原决策链路。

## 脱敏不要破坏调试

可观测性和安全要一起设计：

| 信息 | 保存方式 |
| --- | --- |
| 原始敏感内容 | 受控存储、短保留期 |
| 调试摘要 | 脱敏、长期保留 |
| 文档引用 | 保存 ID、版本、权限范围 |
| 工具参数 | 敏感字段 hash 或 mask |
| 模型输入 | 保存结构和来源，不保存完整密文 |

如果把所有上下文都删掉，trace 失去调试价值；如果全部明文保存，又会变成新的泄露面。

## Replay 要可控

Replay 不是简单"再跑一遍"。要区分：

| Replay 类型 | 用途 |
| --- | --- |
| 固定输入重放 | 验证 prompt 或路由修复 |
| 固定检索结果重放 | 排除向量库漂移 |
| 固定工具结果重放 | 排除外部系统变化 |
| 全链路重放 | 验证当前生产行为 |

这些场景应该优先支持 replay：用户投诉答案错误、工具执行产生副作用、权限或安全告警、模型或检索版本变更、线上质量突然下降。Replay 的目标不是复刻每一次随机输出，而是固定关键输入和外部结果，让团队能验证修复是否真的生效。

## Eval 要分层

| Eval | 样本 |
| --- | --- |
| RAG eval | query、期望 chunk、答案引用 |
| Tool eval | 用户目标、期望工具和参数 |
| Workflow eval | 状态路径和审批点 |
| Safety eval | 注入、越权、高风险动作 |
| Cost eval | token、工具次数、延迟上限 |

不要只评"最终答案像不像"。如果工具选错但答案编得通顺，最终答案评估会把问题掩盖掉。最小 eval 样本结构：

```text
样本 ID：
用户问题：
期望路径：
期望工具和参数：
期望检索来源：
期望答案要点：
拒答条件：
权限要求：
成本上限：
延迟上限：
人工判定标准：
```

Eval 不是上线后才做。它应该从 POC 开始：POC 样本 → 回归样本 → 线上失败样本 → 定期评估。每次修 Prompt、换模型、改检索、换工具，都应该跑关键评测集。

## 主流工具对比

| 方案 | 本质 | 强项 | 代价 | 适合场景 | 不适合场景 |
| --- | --- | --- | --- | --- | --- |
| LangSmith | LLM 应用 trace / eval 平台 | 和 LangChain / LangGraph 集成强，trace、dataset、eval 体系完整 | 生态绑定和平台成本要评估 | LangChain / LangGraph 项目、Agent trace、评估集管理 | 完全自研栈且不想绑定平台 |
| Langfuse | 开源 LLM observability 平台 | Trace、prompt、eval、成本观测，自托管友好 | 需要部署和治理 | 自托管观测、企业 LLM 应用、成本和 trace 监控 | 只需要简单 API 网关日志 |
| Arize Phoenix | 开源 observability / eval | RAG eval、embedding、trace 分析友好 | 要接入和维护 | RAG 质量分析、实验和本地观测 | 只想看 billing 和 token |
| Helicone | LLM Gateway / observability | API 请求、成本、延迟、缓存、用户维度观测 | 更偏网关和请求层 | 多模型 API 监控、成本和延迟分析 | 深层 Agent 状态图 debug |
| OpenTelemetry | 标准化 trace / metrics / logs | 企业统一观测体系，跨服务 | 需要自定义 span schema | 企业已有可观测平台、Agent 进入统一 trace | 想开箱即用 LLM eval |
| Braintrust | Eval 和实验平台 | 数据集、实验、评估、回归测试 | 平台成本和流程接入 | Prompt/模型/Agent 版本评估 | 只需要线上 trace |
| Ragas | RAG 评估框架 | faithfulness、context precision、answer relevance 等 RAG 指标 | 指标要结合业务解释，不能盲信 | RAG 离线评估、POC、回归测试 | 工具执行 Agent 评估 |
| DeepEval | LLM 应用测试框架 | 单元测试式 eval、LLM judge、CI 集成 | judge 质量和稳定性要校准 | 自动化评测、CI 回归、Agent 输出测试 | 只看线上监控 |
| promptfoo | Prompt / 模型回归测试 | 配置化测试、多模型对比、CI 友好 | 深层 trace 不是重点 | Prompt 回归、多 provider 对比、红队样本 | 生产 trace 和 replay |
| 自研 trace + eval | 自定义 schema 和评估闭环 | 完全贴合业务，权限和审计可控 | 开发和维护成本高 | 强合规、复杂工具链、企业核心 Agent | 小团队快速原型 |

## 先分清你要观测什么

| 目标 | 优先工具方向 | 不要先做什么 |
| --- | --- | --- |
| 看 token、成本、延迟 | Helicone / Langfuse / 自研网关日志 | 不要先做复杂 eval |
| 看 Agent 每一步做了什么 | LangSmith / Langfuse / OpenTelemetry | 不要只存最终答案 |
| 看 RAG 检索质量 | Phoenix / Ragas / 自研检索评测 | 不要只看生成答案 |
| 做 prompt 回归测试 | promptfoo / Braintrust / DeepEval | 不要靠人工随便试几条 |
| 做生产审计 | OpenTelemetry / 自研 audit log | 不要把敏感 trace 原样外发 |
| 做 LangGraph debug | LangSmith | 不要只打印日志 |

## RAG Eval 必须分层

| 层 | 指标 | 说明 |
| --- | --- | --- |
| Retrieval | Recall@K、MRR、nDCG | 正确 chunk 是否召回并排前面 |
| Context | Context Precision、Context Relevance | 放进上下文的内容是否有用 |
| Generation | Faithfulness、Answer Relevance | 答案是否基于上下文 |
| Citation | Citation Accuracy | 引用是否支持答案 |
| Permission | Violation Rate | 是否召回或输出无权内容 |

指标不是结论。企业 RAG 最后仍然要有业务样本和人工校准。

## Monitoring 监控什么

线上监控要看趋势，不是只看单次 trace。至少监控：P50/P95/P99 延迟、单次请求成本、模型/工具调用成功率、检索无结果率、fallback 触发率、人工确认率、拒答率、用户反馈、权限拦截次数。如果成本上涨、延迟上涨、fallback 上涨，但最终答案看起来还行，系统已经在退化。

## 怎么选工具

```text
LangChain / LangGraph 项目？
  -> LangSmith 优先评估

想自托管 LLM observability？
  -> Langfuse / Phoenix

主要看 API 成本和延迟？
  -> Helicone / Langfuse / 自研网关日志

重点是 RAG 评估？
  -> Ragas / Phoenix / DeepEval + 自研样本集

重点是 Prompt 回归测试？
  -> promptfoo / Braintrust / DeepEval

企业已有统一观测平台？
  -> OpenTelemetry + 自研 span schema

强合规和权限审计？
  -> 自研 audit log，不要只依赖第三方 trace 平台
```

## 观测能力分阶段建设

| 阶段 | 最小能力 |
| --- | --- |
| POC | 保存样本、最终答案、人工判断 |
| 内测 | trace 检索、工具、模型 span |
| 上线 | metrics、告警、成本延迟监控 |
| 生产迭代 | replay、回归 eval、失败样本沉淀 |

不要等系统出事故再补可观测性。没有早期样本和 trace，后面很难知道质量是提升还是退化。

## 典型误判

| 误判 | 问题 |
| --- | --- |
| 有日志就等于可观测 | 日志没有因果链，debug 仍然靠猜 |
| 有 trace 就等于有 eval | trace 解释单次请求，eval 衡量样本集质量 |
| LLM judge 分数就是质量 | judge 要校准，不能替代业务验收 |
| RAG eval 只看最终答案 | 检索、排序、引用、权限要分开评估 |
| 第三方 trace 可直接存敏感上下文 | 企业场景要脱敏、采样和权限控制 |
| prompt 改完人工试几条就上线 | 没有回归样本，迟早引入退化 |

## 推荐策略

| 阶段 | 推荐 |
| --- | --- |
| POC | 固定样本集 + 手工 trace 表 + promptfoo / DeepEval |
| RAG 原型 | Ragas / Phoenix + retrieval trace |
| LangGraph 项目 | LangSmith |
| 自托管生产 | Langfuse / Phoenix + 自研审计 |
| 多模型网关 | Helicone / Langfuse / 自研 gateway metrics |
| 企业核心系统 | OpenTelemetry + 自研 span schema + audit log |
| 高风险 Agent | Trace + Replay + Eval + Approval audit 全部必须有 |

## 最终判断

```text
看链路：Trace
复现失败：Replay
防止退化：Eval
看线上趋势：Monitoring
查责任：Audit
RAG 质量：Retrieval + Generation 分层评估
```

生产 Agent 没有观测和评估，就是黑盒。黑盒不能上线高风险场景。

> Replay 发现失败时的降级处理策略见 [Agent 降级策略怎么设计](/agent-selection/24-fallback-strategy)；监控中的成本和延迟告警阈值设定见 [成本与延迟预算检查](/agent-selection/23-cost-latency-selection)。
