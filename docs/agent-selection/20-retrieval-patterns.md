---
title: 检索组件怎么选
description: 判断 Dense、BM25、Hybrid Retrieval、Rerank、Query Rewrite、Multi-query、Context Compression、GraphRAG 和 Long Context 各自适合什么问题，建立检索链路选型原则。
contentType: support
series: support
contentId: agent-selection-retrieval-patterns
shortTitle: 检索组件选型
summary: Hybrid 解决召回互补，Rerank 解决候选排序，GraphRAG 解决关系密集问题，Long Context 解决少量长文档整体阅读，不能混用。
difficulty: advanced
estimatedTime: 35 分钟
learningGoals:
  - 区分 Dense、Sparse、Hybrid、Rerank、GraphRAG 和 Long Context 的边界
  - 判断错误码、函数名、政策编号、自然语言问题等场景该用什么检索组合
  - 按失败样本归因定位根因，再选升级方案
  - 避免用 Rerank 解决召回漏、用 Long Context 解决权限、用 GraphRAG 掩盖 parser 问题
prerequisites:
  - 了解 RAG 基础概念
  - 了解 Embedding 和向量数据库
recommendedNext:
  - /agent-selection/21-enterprise-knowledge-permission
  - /agent-selection/22-code-rag-structure
  - /practice/p09-hybrid-retrieval/
practiceLinks:
  - /practice/p08-graphrag/
  - /practice/p09-hybrid-retrieval/
searchTags:
  - Hybrid Retrieval
  - Rerank
  - BM25
  - GraphRAG
  - Long Context
  - Query Rewrite
navigationLabel: 检索组件选型
entryMode: bridge
roleDescription: 适合为企业知识库、代码库 Agent、客服知识库和研究型 Agent 设计检索链路时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱，不是实时排名。检索组件、模型能力、价格和部署选项会变化，采购或上线前请以官方文档、版本说明和业务样本评测为准。

## 先定位问题

每个 RAG 失败样本先标注根因，不要直接上重方案：

| 失败现象 | 优先检查 | 不要先做什么 |
| --- | --- | --- |
| 错误码找不到 | BM25 / keyword recall | 不要只换 Embedding |
| 同义问题找不到 | Dense Retrieval / Query Rewrite | 不要只加关键词 |
| 正确文档在 TopK 但排很后 | Rerank | 不要扩大 chunk |
| TopK 全是噪音 | chunk / metadata / Query Rewrite | 不要盲目加 TopK |
| 权限外文档被召回 | metadata filter / ACL | 不要生成后过滤 |
| 文档过期 | version / timestamp filter | 不要换 Rerank 模型 |

## 先做失败样本归因

每个 RAG 失败样本先标注根因：

| 根因 | 现象 | 修复方向 |
| --- | --- | --- |
| 解析失败 | 表格、PDF、代码结构丢失 | parser |
| chunk 错 | 关键上下文被切断 | chunk 策略 |
| 召回漏 | 正确文档没进 TopK | hybrid / query rewrite |
| 排序错 | 正确文档在后面 | rerank |
| 权限错 | 召回了不该看的内容 | metadata filter |
| 生成错 | 资料正确但回答编造 | prompt / citation |

只有当根因定位清楚，才知道该加 hybrid、rerank，还是先修数据。

## 检索组件全景

检索链路不是只有向量搜索。一个生产 RAG 通常至少要考虑：

```text
Query
  -> Query Rewrite
  -> Dense Retrieval
  -> Sparse Retrieval / BM25
  -> Candidate Merge
  -> Metadata Filter
  -> Rerank
  -> Context Compression
  -> Generation
```

| 方案 | 解决什么 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| Dense Retrieval | 语义相似召回 | 同义表达、自然语言问题 | 对精确词、编号、代码符号不稳定 | 普通知识问答 |
| BM25 / Sparse Retrieval | 关键词召回 | 错误码、函数名、专有名词、条款编号 | 语义泛化弱 | 技术文档、代码、法规、产品手册 |
| Hybrid Retrieval | Dense + Sparse 合并 | 同时兼顾语义和关键词 | 合并策略、权重、去重复杂 | 企业知识库、代码库、客服知识库 |
| Rerank | 对候选结果重新排序 | 提高 TopK 质量 | 不能召回没被召回的文档，增加延迟 | 高精度 RAG |
| Query Rewrite | 改写用户问题 | 提高召回表达 | 可能改错意图 | 用户问题口语化、上下文依赖强 |
| Multi-query Retrieval | 多问题扩展召回 | 覆盖更多表达方式 | 成本和噪音增加 | 复杂研究型问题 |
| Context Compression | 压缩上下文 | 降低 token，提高相关性 | 可能丢信息 | TopK 很长、上下文预算紧 |
| GraphRAG | 图谱关系检索 | 实体关系、多跳问题、全局总结 | 构建和维护成本高 | 组织、人物、系统依赖、知识图谱场景 |
| Long Context | 直接塞更多上下文 | 简化少量长文档分析 | 成本高、延迟高、权限风险仍在 | 小规模资料、临时分析、低频任务 |

## 不同问题不要混用方案

| 误用 | 问题 |
| --- | --- |
| 用 rerank 解决召回漏 | 正确文档没进候选，重排无效 |
| 用 Long Context 解决权限 | 无权资料进入上下文就是泄露 |
| 用 GraphRAG 解决 parser 差 | 图会放大错误实体和关系 |
| 用 hybrid 解决生成编造 | 资料正确但生成错，需要引用和评估 |
| 用更大 TopK 解决 chunk 错 | 只会带来更多噪声 |

先定位缺口，再选升级方案。

## Dense Retrieval 什么时候够用

适合：自然语言语义匹配——FAQ、概念解释、语义相似的段落召回。

不适合单独使用：错误码、API 名、函数名、订单号、政策编号、版本号等精确实体。如果用户会搜 `ERR_CONN_RESET`、`GB/T 35273`，只靠 Dense Retrieval 会不稳。

## BM25 什么时候必须有

必须优先考虑 BM25 的场景：技术文档（API 名、错误码）、代码库 Agent（函数名、变量名、路径）、法规制度（条款编号）、客服知识库（产品型号、业务术语）、企业知识库（部门、系统名、缩写）。

BM25 语义泛化弱，不替代向量检索，而是和向量检索组合。

## 什么时候必须 Hybrid

```text
用户会搜错误码、函数名、订单号、政策编号？
  -> BM25 必须有

用户会用自然语言描述问题？
  -> Dense 必须有

文档既有专业术语，又有语义问答？
  -> Hybrid

代码库 RAG？
  -> Hybrid 基本是底线

企业知识库？
  -> Hybrid + metadata filter + rerank 通常更稳
```

典型融合方式：

| 方式 | 特点 | 风险 |
| --- | --- | --- |
| 分数加权 | 直观，容易实现 | Dense 和 BM25 分数尺度不同，不能直接相加 |
| Reciprocal Rank Fusion | 稳健，常用于多路召回合并 | 需要保留各路排名 |
| 规则提升 | 对标题、路径、精确词命中加权 | 规则太多会变成手工调参地狱 |

不要把向量分数和 BM25 分数直接相加。

## Rerank 什么时候用

Rerank 适合排序问题，不适合召回问题。

适合：正确文档已进候选集但排序靠后、TopK 里混入相似但无关内容、需要更高答案精度、想减少塞进 LLM 的上下文。

Rerank 的代价：多一次模型调用、延迟上升、成本上升、可能牺牲来源多样性。

验收要点：
- 正确 chunk 是否进入 rerank 输入；
- rerank 后正确 chunk 排名是否上升；
- 延迟和成本是否可接受；
- 是否保存重排前后列表方便 debug。

如果 rerank 后答案变好但 trace 看不出为什么，后续调参会很困难。

## Query Rewrite 什么时候用

适合：多轮对话里的省略问题、用户表达和文档术语差异很大、需要加入时间/地区/系统名等过滤条件。

风险：改错用户意图、增加延迟、把原本应拒答的问题改成可检索问题。要保留原始 query 和改写 query，方便 debug。

## GraphRAG 什么时候值得上

适合：实体关系密集、跨文档汇总、需要全局视角、用户问题经常涉及多跳关系。

不适合：小型 FAQ、高频更新文档、关系抽取质量不稳定、没有跨文档问题样本、没有图谱维护能力。

GraphRAG 管道：

```text
文档
  -> 实体抽取
  -> 关系抽取
  -> 图构建
  -> 社区或子图检索
  -> 生成总结
```

准入条件：实体和关系密度高、关系抽取能稳定复核、更新频率不高、有跨文档问题样本、能接受构建和维护成本。如果只是 FAQ 或产品手册，hybrid + rerank 通常更直接。

## Long Context 什么时候用

适合：少量长文档、低频分析任务、权限边界简单、需要整体阅读和总结。

不适合：多租户权限复杂、文档很多、高频查询、需要稳定引用和可重复评估。长上下文扩大容量，但不自动提升事实可靠性。把无权资料塞进长上下文，就是更贵的泄露。

## 升级顺序

```text
修 parser 和 chunk
  -> 补 metadata
  -> 加 hybrid
  -> 加 rerank
  -> 评估 GraphRAG 或 Long Context
```

如果前两步没做好，后面的方案都是在放大复杂度。

## 推荐策略

| 场景 | 推荐 |
| --- | --- |
| 普通 FAQ | Dense Retrieval 起步，必要时加 Rerank |
| 技术文档 | Hybrid Retrieval |
| 代码库 Agent | Hybrid + 符号索引 + 路径 metadata |
| 企业知识库 | Hybrid + metadata filter + Rerank + Citation |
| 客服知识库 | Hybrid + 版本过滤 + 人工转接策略 |
| 研究型 Agent | Search + Reader + Multi-query + 引用检查 |
| 关系密集资料 | GraphRAG，但先验证实体关系质量 |
| 少量长资料 | Long Context，注意成本和权限 |

## 最终判断

```text
语义问题：Dense
精确词：BM25
两者都有：Hybrid
排不准：Rerank
问法差异大：Query Rewrite
关系密集：GraphRAG
少量长文档：Long Context
权限复杂：Metadata Filter
```

检索模式选型要从失败样本出发，不要从技术热度出发。先定位失败发生在哪一层，再加组件。
