---
title: 向量数据库怎么选
description: 从数据规模、过滤能力、多租户、运维成本、混合检索和迁移风险判断向量库选型原则，并对比 Milvus、Qdrant、Pinecone、Weaviate、Chroma、pgvector、Elasticsearch、Redis Vector、Faiss 和 LanceDB 的适用场景。
contentType: support
series: support
contentId: agent-selection-vector-database
shortTitle: 向量数据库选型
summary: 向量数据库选型要看规模、过滤、多租户、运维、Hybrid、数据主权和迁移成本，不要从品牌开始选。
difficulty: intermediate
estimatedTime: 35 分钟
learningGoals:
  - 判断不同规模和治理要求下的向量库选择
  - 了解 Milvus、Qdrant、Pinecone、pgvector 等主流方案的差异
  - 理解 metadata filter、多租户和 hybrid 能力的重要性
  - 避免用向量数据库解决 chunk、权限、重排和知识治理问题
prerequisites:
  - 已了解 RAG 知识与检索选型
  - 了解向量检索基本概念
recommendedNext:
  - /agent-selection/33-hybrid-retrieval-rerank
  - /agent-selection/21-enterprise-knowledge-permission
  - /practice/p09-hybrid-retrieval/
practiceLinks:
  - /practice/p07-rag-basics/
  - /practice/p09-hybrid-retrieval/
searchTags:
  - 向量数据库
  - Vector DB
  - Milvus
  - Qdrant
  - Pinecone
  - pgvector
  - RAG
navigationLabel: 向量数据库选型
entryMode: bridge
roleDescription: 适合在 Milvus、Qdrant、Pinecone、Weaviate、pgvector、Elasticsearch 等方案之间做工程取舍时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱，不是实时排名。产品能力、托管区域、价格、开源协议和集成方式会变化，采购或上线前请以官方文档、价格页、版本说明和业务样本评测为准。

## 不要先问品牌

向量库只是 RAG 链路的一层。先问：

- 数据有多大；
- 是否多租户；
- 权限是否依赖 metadata；
- 是否需要 hybrid；
- 是否要自托管；
- 是否能接受迁移成本。

如果 parser、chunk 和 metadata 设计错了，换向量库也救不回来。

## 向量库负责什么

向量库通常负责：

```text
向量存储
  -> 相似度搜索
  -> metadata filter
  -> collection / index 管理
  -> 更新和删除
```

它不负责：文档解析、chunk 质量、Embedding 模型选择、业务权限决策、rerank、答案生成、引用审计。向量库是检索基础设施，不是 RAG 的大脑。

## 选型维度

| 维度 | 为什么重要 |
| --- | --- |
| 数据规模 | 决定单机、嵌入式、托管还是分布式 |
| QPS 和延迟 | 决定索引策略和服务架构 |
| 过滤能力 | 权限、版本、租户都依赖 filter |
| 写入更新 | 文档更新、删除和重建索引 |
| 多租户 | 企业知识库的隔离边界 |
| Hybrid 能力 | 影响 BM25 + vector 的组合成本 |
| 运维复杂度 | 决定团队能不能长期维护 |
| 迁移成本 | schema、filter 表达式、索引参数都会锁定 |
| 数据合规 | 决定能不能使用托管服务 |

## 先看数据形态

不同知识库对向量库的要求不一样：

| 数据形态 | 选型重点 |
| --- | --- |
| FAQ 和短文档 | 简单写入、低运维 |
| 产品手册 | metadata、版本、引用 |
| 企业制度 | 权限过滤、删除更新 |
| 客服知识库 | 高频更新、灰度发布 |
| 代码库 | 符号索引、路径过滤、hybrid |
| 多租户 SaaS | 隔离、备份、配额 |

如果数据每天变化，写入和删除比峰值检索性能更重要。如果数据涉及权限，filter 能力比 benchmark 分数更重要。

## 原型和生产的差别

| 维度 | 原型 | 生产 |
| --- | --- | --- |
| 数据量 | 小 | 持续增长 |
| 删除 | 可重建 | 必须可追踪 |
| 权限 | 可忽略 | 必须 filter |
| 评估 | 人工看几条 | 固定评测集 |
| 运维 | 本地即可 | 备份、监控、扩容 |
| 迁移 | 无所谓 | schema 和版本要记录 |

原型选简单，生产选治理能力。

## 主流产品对比

| 方案 | 本质 | 强项 | 代价 | 适合场景 | 不适合场景 |
| --- | --- | --- | --- | --- | --- |
| Milvus / Zilliz | 分布式向量数据库 | 大规模向量、多索引、多集合、分布式扩展 | 运维复杂，组件多，容量规划要求高 | 千万级/亿级向量、多租户平台、企业级向量检索基础设施 | 小型 RAG、Demo、没有运维团队 |
| Qdrant | 开源向量数据库 | payload filter 强、部署简单、工程体验好 | 极大规模仍需压测和集群规划 | 中大型 RAG、权限过滤、多租户知识库、自托管 | 已有成熟搜索体系且只需轻量向量能力 |
| Pinecone | 托管向量数据库 | 免运维、高可用、快速生产化 | 成本、供应商锁定、数据合规 | SaaS、小团队快速上线、没有运维资源 | 强内网部署、强数据主权、成本敏感 |
| Weaviate | 向量数据库 + schema/object 模型 | schema、hybrid search、多模态能力 | 抽象较多，生态绑定 | 对象化知识库、多模态搜索、schema 驱动检索 | 只需要简单 TopK 向量召回 |
| Chroma | 轻量向量库 | 上手快、本地开发简单 | 生产治理能力有限 | POC、Demo、本地实验、教学项目 | 高并发、权限复杂、企业生产系统 |
| pgvector | PostgreSQL 扩展 | 和业务数据天然结合，事务和 metadata 方便 | 大规模 ANN、高 QPS 要谨慎 | 已有 PostgreSQL、小中规模 RAG、metadata 强依赖 | 亿级向量、高并发专用检索平台 |
| Elasticsearch / OpenSearch Vector | 搜索引擎 + 向量检索 | BM25 + vector hybrid，复用现有搜索体系 | 向量能力不是唯一核心，成本和性能要测 | 关键词检索重要、已有 ES/OpenSearch、需要 Hybrid Retrieval | 纯向量大规模低延迟场景 |
| Redis Vector | 内存数据库 + 向量索引 | 低延迟、缓存友好 | 成本高，大规模长期知识库不合适 | 实时推荐、短期记忆、session 级向量检索 | 长期大规模企业知识库 |
| Faiss | 向量索引库 | 性能强、研究灵活 | 不是完整数据库，没有权限、metadata、服务治理 | 离线检索、算法实验、自研检索服务 | 直接做企业 RAG 生产系统 |
| LanceDB | 嵌入式 / lakehouse 向量存储 | 本地、多模态、数据湖友好 | 企业级服务化成熟度需评估 | 本地 AI 应用、多模态数据集、轻量服务 | 强 SLA 企业检索平台 |

## 关键产品场景判断

**Milvus**：适合平台级大规模向量检索（千万到亿级、多租户、分布式）。不适合小型 RAG 起步——没有运维团队会被复杂度拖死。

**Qdrant**：适合中大型自托管企业 RAG，payload filter 强、工程体验好。如果你的系统需要强 metadata filter 且想自托管，Qdrant 是首选。

**Pinecone**：适合小团队快速上线、免运维。不适合强内网部署或成本极敏感的场景。

**pgvector**：适合已有 PostgreSQL 的中小规模 RAG——和业务数据天然结合，少引入一个系统。不适合亿级向量或高并发低延迟。

**Elasticsearch / OpenSearch**：如果系统已有搜索基础设施且关键词检索重要，先评估 ES/OpenSearch vector + BM25 hybrid，而不是急着再引入一个向量库。

## filter 是企业 RAG 的底线

企业场景里，向量查询通常不是：

```text
query_vector -> top_k
```

而是：

```text
query_vector
  + tenant_id
  + user_acl
  + document_status
  + version
  + sensitivity
  -> top_k
```

如果向量库的 metadata filter 表达能力弱，后面就只能在召回后过滤。这会带来越权召回、TopK 不稳定和 trace 泄露问题。企业 RAG 里，优先级通常是：

```text
metadata filter
  -> 多租户隔离
  -> 更新删除流程
  -> hybrid 支持
  -> 运维和备份
  -> 性能优化
```

不要为了跑 benchmark 牺牲权限过滤。速度快但会泄露数据的向量库不能上线。

## 怎么选

```text
只是 POC？
  -> Chroma / pgvector / Qdrant local

已有 PostgreSQL，数据量不大？
  -> pgvector

需要强 metadata filter / ACL？
  -> Qdrant / Weaviate / Milvus，先验证 filter 性能

已有 Elasticsearch / OpenSearch？
  -> 先评估 ES/OpenSearch vector + BM25 hybrid

亿级向量、多租户平台？
  -> Milvus / Zilliz / Pinecone

团队不想运维？
  -> Pinecone / Zilliz Cloud / Weaviate Cloud

数据不能出内网？
  -> 自托管 Qdrant / Milvus / Weaviate / pgvector

需要极低延迟短期记忆？
  -> Redis Vector

只是算法实验？
  -> Faiss
```

## POC 要测什么

向量库 POC 不要只测"能不能搜到相似文本"。至少要测：

- 带 metadata filter 的召回质量；
- 更新一篇文档后的可见时间；
- 删除一篇文档后的不可召回时间；
- 多租户隔离；
- hybrid 查询；
- 索引重建时间；
- 备份和恢复；
- embedding 版本升级。

如果 POC 样本只有几十条公开文档，测不出生产里真正会出问题的权限、更新和迁移能力。

## 迁移风险

向量库迁移痛点通常不是向量本身，而是：collection schema、metadata 命名、filter 表达式、索引参数、embedding 模型版本、文档 ID 和 chunk ID、删除和更新语义。

从第一天就要保存原始文档、chunk、metadata 和 embedding 版本。否则后面无法重建索引。

## 常见错误

| 错误 | 后果 |
| --- | --- |
| 只按性能榜单选 | 忽略权限、删除和运维 |
| metadata 设计太少 | 后续无法按租户、版本、权限过滤 |
| 不保存 chunk 原文 | embedding 升级时无法重建 |
| 召回后过滤权限就行 | 无权内容已经进入候选和 trace，风险已经发生 |
| 大厂或热门产品一定适合 | 数据规模、权限、团队能力才是关键 |
| Chroma 跑通 Demo 就能生产 | Demo 能搜到，不代表能做权限、备份和高可用 |
| 向量库解决 RAG 不准 | 很多问题在 parser、chunk、metadata、rerank |

## 推荐策略

| 场景 | 推荐 |
| --- | --- |
| 本地 Demo | Chroma / LanceDB |
| 已有 PostgreSQL 的小中规模 RAG | pgvector |
| 自托管中大型企业 RAG | Qdrant / Weaviate |
| 平台级大规模向量检索 | Milvus / Zilliz |
| 快速生产且不想运维 | Pinecone / Zilliz Cloud / Weaviate Cloud |
| 已有搜索体系且需要 Hybrid | Elasticsearch / OpenSearch Vector |
| 短期记忆和低延迟缓存 | Redis Vector |
| 算法实验和离线索引 | Faiss |

## 最终判断

```text
Demo：Chroma / LanceDB
已有 PG：pgvector
强过滤自托管：Qdrant
托管生产：Pinecone
大规模平台：Milvus
已有搜索：Elasticsearch / OpenSearch
算法实验：Faiss
```

向量库不是 RAG 的大脑。它只是检索基础设施，真正的质量来自数据治理和评估。先看规模、权限、过滤、运维和迁移成本，最后再看品牌。
