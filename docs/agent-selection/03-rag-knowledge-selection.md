---
title: RAG 链路设计原则
description: 从文档解析、chunking、Metadata、Embedding、检索、重排、权限过滤和引用审计判断 RAG 方案怎么选，建立正确的链路设计顺序。
contentType: support
series: support
contentId: agent-selection-rag-knowledge-selection
shortTitle: RAG 链路设计
summary: RAG 的核心不是向量库品牌，而是知识治理、检索质量、权限边界和引用审计；先定位失败发生在哪一层，再选升级方案。
difficulty: advanced
estimatedTime: 30 分钟
learningGoals:
  - 区分私有知识、实时信息和用户输入三类上下文
  - 掌握 RAG 链路中 parser、chunk、metadata、embedding、retrieval 和 rerank 的选型顺序
  - 按失败样本逐层归因，定位根因再选升级方案
  - 理解权限过滤、引用审计和评估为什么是生产 RAG 的核心
prerequisites:
  - 了解 RAG 基础概念
  - 了解向量检索
  - 了解文档知识库场景
recommendedNext:
  - /agent-selection/05-rag-platforms
  - /agent-selection/19-vector-database-selection
  - /agent-selection/20-retrieval-patterns
  - /agent-selection/21-enterprise-knowledge-permission
practiceLinks:
  - /practice/p07-rag-basics/
  - /practice/p08-graphrag/
  - /practice/p09-hybrid-retrieval/
searchTags:
  - RAG
  - 检索增强
  - Hybrid Retrieval
  - Rerank
  - Chunking
  - 引用审计
navigationLabel: RAG 链路设计
entryMode: bridge
roleDescription: 适合设计企业知识库、代码库问答和可引用检索系统时阅读。
---

<ChapterLearningGuide />

## RAG 解决什么

RAG 解决的是稳定、可治理、可索引、可追溯的知识进入上下文的问题。它不负责过程控制，也不负责开放世界实时信息。

适合 RAG 的数据：企业制度、产品手册、API 文档、代码库、架构文档、FAQ、工单、需要权限过滤和引用溯源的资料。

不适合直接离线 RAG 的数据：最新新闻、高频变化的网页、实时价格和版本公告、来源质量不稳定的开放资料。

## 正确选型顺序

不要先问"用哪个向量库"。先按链路判断：

```text
文档解析
  -> Chunking
  -> Metadata
  -> Embedding
  -> Dense / Sparse / Hybrid Retrieval
  -> Rerank
  -> Permission Filter
  -> Citation
  -> Evaluation
```

## 先判断知识是否适合入库

| 问题 | 判断 |
| --- | --- |
| 是否稳定 | 高频变化资料更适合 Search 或实时 API |
| 是否有明确来源 | 来源不清的资料会污染答案 |
| 是否能版本化 | 不能版本化就难以解释引用 |
| 是否有权限边界 | 有权限就必须进入 metadata |
| 是否能删除和更新 | 不能删除就不适合生产索引 |
| 是否有评测样本 | 没样本就无法判断检索质量 |

RAG 的输入质量决定上限。把脏资料塞进向量库，只会让模型更稳定地输出错误。

## 链路决策表

| 层 | 默认建议 | 什么时候升级 | 主要风险 |
| --- | --- | --- | --- |
| 文档解析 | Markdown、HTML、结构化文本 | PDF、表格、扫描件、多格式企业文档 | parser 错，后面全错 |
| Chunking | 按语义结构切 | 代码、表格、API、法规制度 | 边界错，召回和重排都救不回来 |
| Metadata | source、version、owner、acl | 多租户、权限、版本管理 | 没 metadata 就无法治理 |
| Embedding | 通用多语种模型起步 | 代码、法律、金融等垂直领域 | 模型升级导致索引重建 |
| 向量库 | 按规模和过滤能力选 | 多租户、高 QPS、复杂 filter | schema 锁定比向量迁移更痛 |
| Hybrid Retrieval | dense + sparse/BM25 | 错误码、API 名、类名、编号很多 | 分数融合不可随便相加 |
| Rerank | TopK 后重排 | 精度要求高、候选多 | 成本和延迟上升 |
| GraphRAG | 高关系密度再上 | 跨实体、跨文档、全局总结 | 构建贵、更新难、调试难 |
| Long Context RAG | 少量长文档全局推理 | 上下文成本可接受 | 贵、慢、权限过滤难 |
| 权限过滤 | 检索前过滤 | 企业知识库必须做 | 生成后过滤已经泄露 |
| 引用审计 | 保留 source、chunk、version | 面向用户输出必须做 | 无引用就无法验错 |

> 具体组件怎么选看 [检索组件选型](/agent-selection/20-retrieval-patterns)。具体产品怎么选看 [向量数据库选型](/agent-selection/19-vector-database-selection) 和 [Embedding 模型选型](/agent-selection/31-embedding-models)。如果是选 RAG 平台（RAGFlow、Dify 等）还是自建 pipeline，看 [RAG 平台与方案选型](/agent-selection/05-rag-platforms)。

## 一个失败样本怎么分析

用户问"最新休假制度里陪产假是多少天"，系统答错时不要直接换 embedding。先拆：

```text
是否解析到了最新制度？
chunk 是否保留了"适用地区"和"生效日期"？
metadata 是否有 version 和 region？
检索 query 是否带上"陪产假"同义词？
正确 chunk 是否进入 TopK？
rerank 是否把旧制度排到前面？
最终答案是否引用了旧版本？
```

只有知道错误发生在哪一层，才知道该修 parser、chunk、metadata、hybrid、rerank，还是引用策略。

## 评估不要只看答案

RAG 评估至少分三层：

| 层 | 评估什么 |
| --- | --- |
| 召回 | 正确 chunk 是否进 TopK |
| 重排 | 正确 chunk 是否排在前面 |
| 生成 | 答案是否基于引用，不编造 |

只看最终答案会掩盖问题。生产 RAG 要把检索质量和生成质量分开看。

## 生产 RAG 最小要求

上线前至少要有：可重复的索引构建流程、文档版本和删除回收、检索前权限过滤、召回/重排/生成的 trace、答案引用、固定评测集、成本和延迟监控。

没有这些，RAG 只是 demo，不是系统。

## 什么时候用 RAG 平台，什么时候自建

如果文档以 PDF、扫描件、复杂的多格式混合为主，或者团队没有专门的检索工程能力，RAG 平台（如 RAGFlow）可能比自建 pipeline 更快落地。如果知识格式可控、权限逻辑复杂、需要深度定制评估体系，自建 pipeline 更合适。

具体方案对比和选型判断，见 [RAG 平台与方案选型](/agent-selection/05-rag-platforms)。
