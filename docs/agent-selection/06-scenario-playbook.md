---
title: 场景选型手册
description: 按企业 Copilot、代码库助手、研究型 Agent、客服知识库和自动化执行等典型场景判断技术组合。
contentType: support
series: support
contentId: agent-selection-scenario-playbook
shortTitle: 场景选型手册
summary: 把 Agent Framework、RAG、Search、工具调用和审计能力映射到常见业务场景。
difficulty: intermediate
estimatedTime: 25 分钟
learningGoals:
  - 按业务场景快速判断技术组合
  - 识别不同场景的核心风险和最小可行方案
  - 避免把所有 Agent 项目都套成同一种架构
prerequisites:
  - 已了解 Agent 框架、RAG 和搜索工具边界
recommendedNext:
  - /agent-selection/07-poc-evaluation
  - /agent-selection/08-build-vs-buy
  - /practice/p20-observability/
practiceLinks:
  - /practice/p09-hybrid-retrieval/
  - /practice/p14-mcp/
  - /practice/p18-model-routing/
  - /practice/p20-observability/
searchTags:
  - 场景选型
  - 企业 Copilot
  - 代码库 Agent
  - 研究型 Agent
  - 客服知识库
navigationLabel: 场景选型手册
entryMode: bridge
roleDescription: 适合把抽象技术选型映射到具体业务场景时阅读。
---

<ChapterLearningGuide />

## 先按场景选，不要按框架选

同样叫 Agent，不同场景的核心矛盾完全不同：

```text
企业 Copilot：权限、审计、工具边界
代码库助手：代码结构、符号检索、可验证修改
研究型 Agent：搜索、来源可信度、冲突处理
客服知识库：稳定回答、引用、兜底转人工
自动化执行：状态、确认、失败恢复
```

先把场景说清楚，技术组合通常就会收敛。

## 场景推荐表

| 场景 | 推荐组合 | 最小可行方案 | 主要风险 |
| --- | --- | --- | --- |
| 企业 Copilot | Intent Router + RAG + Tools + Audit | RAG + 权限过滤 + 引用 | 权限泄露、工具越权、审计缺失 |
| 代码库助手 | Code-aware RAG + Tools + Tests + Trace | 文件/符号检索 + 只读问答 | 代码结构被普通 chunk 破坏 |
| 研究型 Agent | Search + Reader + Source Verification | 搜索 + 正文读取 + 引用 | 来源漂移、事实冲突、过期信息 |
| 客服知识库 | RAG + Citation + Escalation | FAQ RAG + 不知道就转人工 | 编造答案、版本混用 |
| 自动化执行 | Agent Workflow + Tools + Human Approval | 轻量 tool loop + 审批点 | 高风险动作无人确认 |
| 数据分析助手 | Text-to-SQL + Permission + Review | 只读 SQL + 查询解释 | 数据越权、SQL 误查 |
| 多 Agent 协作 | Single Agent baseline + Role Split | 先单 Agent 跑通 | 角色聊天替代业务流程 |

## 怎么使用这张表

先选主场景，再看是否混合第二场景。不要反过来先堆技术。

例如“企业 Copilot 能查制度，也能查订单状态”，主场景是企业 Copilot，第二场景是工具查询。第一版应该先做身份、权限、RAG 引用和只读订单工具，而不是直接上多 Agent 编排。

如果一个需求同时命中三类以上场景，通常说明范围太大。先拆成 POC：问答、查询、执行、研究分别验证，不要一次性做成全能助手。

## 企业 Copilot

企业 Copilot 的重点不是“模型多聪明”，而是它能不能在权限边界内稳定工作。

优先设计：

- 用户身份和权限；
- 检索前过滤；
- 工具调用白名单；
- 高风险动作确认；
- 审计日志和引用。

不要一开始就追求多 Agent。大多数企业 Copilot 的第一版，应该先把意图识别、RAG、工具执行和审计链路做稳。

## 代码库助手

代码库助手最容易犯的错，是把代码当普通文档切片。

优先设计：

- 文件路径、模块边界和符号名；
- import / export 关系；
- 测试文件与实现文件的关联；
- 修改前后的 diff；
- 测试和回滚策略。

如果只是问答，可以先做 code-aware RAG。如果要自动改代码，就必须把工具执行、测试和人工确认纳入流程。

## 研究型 Agent

研究型 Agent 的主要信息来自外部网页，所以重点是搜索链路，而不是私有知识库。

优先设计：

- 查询拆解；
- 来源域名限制；
- 正文读取；
- 时间过滤；
- 冲突检测；
- 引用输出。

这类系统不要把搜索结果直接当答案。搜索只提供候选来源，答案需要经过读取、筛选和合成。

## 客服知识库

客服知识库的目标是稳定和可追溯，不是每次都生成漂亮长答案。

优先设计：

- FAQ 和制度文档的版本管理；
- RAG 引用；
- 没有资料时明确拒答；
- 低置信度转人工；
- 热点问题评测集。

如果资料不全，先补知识治理。不要用 Prompt 掩盖知识库缺口。

## 自动化执行

自动化执行类 Agent 的关键问题是“能不能做动作”，不是“能不能回答”。

优先设计：

- 工具权限；
- 状态 schema；
- 停止条件；
- 重试和恢复；
- 人工确认点；
- 操作审计。

只要涉及删除、支付、发送、发布、修改生产数据，都应该默认需要人工确认。

> 完整设计见 [Agent 安全边界与权限模型怎么选](/agent-selection/22-security-permission-selection) 和 [Agent 降级策略怎么设计](/agent-selection/24-fallback-strategy)。

## 数据分析助手

数据分析助手的关键不是 SQL 有多复杂，而是数据访问边界和查询结果可解释。

优先设计：

- 只读原则（SELECT-only）；
- 用户只能查自己有权访问的表和字段；
- 查询结果要能解释口径和来源；
- 避免让模型直接生成生产查询而无人校验；
- 高成本或大范围查询需要确认。

如果业务口径复杂，先在数据层建视图或语义层，降低模型生成 SQL 的难度和风险。

分阶段建设路径：

```text
第一版：只读 SQL + 固定表集 + 查询解释
第二版：动态字段发现 + 口径注释 + 查询成本检查
第三版：跨表分析 + 聚合维度 + 用户反馈闭环
```

典型风险：

| 风险 | 处理 |
| --- | --- |
| 数据越权 | 查询时注入用户权限过滤条件，不靠模型自我限制 |
| 口径错误 | 在 schema 注释和 Prompt 里维护字段业务含义 |
| 大范围扫表 | 设置查询行数、时间窗口和成本上限 |
| 敏感字段泄露 | 查询层脱敏或字段白名单 |
| 模型生成错误 SQL | 静态语法校验 + 干运行 + 人工审批 |

> 完整设计见 [Text-to-SQL Agent 怎么选型](/agent-selection/20-text-to-sql-agent)。

## 多 Agent 协作

多 Agent 系统的诱惑在于分工清晰，风险在于协作质量难以控制。

优先设计：

- 先用单 Agent 跑通核心流程，再按真实边界拆角色；
- 子 Agent 的职责边界要明确，不能"都问它"；
- Agent 间通信要结构化，不要用自然语言"聊天"替代业务流程；
- 多 Agent 比单 Agent 更难调试，trace 必须跨 Agent 串联；
- 第一版通常不需要多 Agent。

多 Agent 适合真正需要并行执行、独立领域专长或分布式执行的任务。如果只是把一个长流程拆成对话，单 Agent + workflow 通常更简单。

什么时候才真正需要多 Agent：

| 情况 | 是否适合 |
| --- | --- |
| 不同任务需要并行执行 | 适合 |
| 不同领域需要专属知识库 | 适合 |
| 任务之间独立性高、低耦合 | 适合 |
| 一个长流程想拆成多个"角色" | 通常不适合 |
| 单 Agent 尚未跑稳 | 不适合 |

多 Agent 常见错误：

- 把角色定义成对话风格（"你是专家 A"），而不是职责边界；
- 没有 trace 跨 Agent 串联，失败时找不到断点；
- 子 Agent 间互相等待，没有超时和降级；
- 拆分太细，通信开销超过执行收益。

> 完整框架选型见 [Agent 框架选型](/agent-selection/01-agent-frameworks) 和 [LangGraph 深度选型](/agent-selection/02-langgraph)。

## 场景 POC 的最小样本

每个场景都应该有自己的 POC 样本：

| 场景 | 样本重点 |
| --- | --- |
| 企业 Copilot | 权限内问答、越权拒绝、引用正确 |
| 代码库助手 | 符号定位、相关测试、错误修改拒绝 |
| 研究型 Agent | 官方来源、冲突来源、过期信息 |
| 客服知识库 | 热点问题、无资料拒答、转人工 |
| 自动化执行 | 高风险确认、工具失败、审计记录 |
| 数据分析助手 | 只读 SQL、口径解释、敏感字段拦截 |
| 多 Agent 协作 | 单 Agent baseline 通过、跨 Agent trace 串联、子 Agent 失败降级 |

样本集能暴露真正的选型边界。没有样本，只靠场景名称很容易选错技术组合。

## 最小判断句

```text
只问答：先看 RAG 或 Search
要行动：再看 Agent Framework
要高风险行动：必须加权限、确认和审计
要跨内部和外部知识：RAG 与 Search 分层
```

场景选型的目的不是给每个项目套模板，而是快速找出最小可行技术组合。
