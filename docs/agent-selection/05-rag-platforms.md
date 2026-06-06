---
title: RAG 平台与方案怎么选
description: 对比自建 RAG pipeline、RAGFlow、Dify、Microsoft GraphRAG 和 Weaviate 等方案，判断什么时候用 RAG 平台，什么时候自建检索链路。
contentType: support
series: support
contentId: agent-selection-rag-platforms
shortTitle: RAG 平台选型
summary: RAGFlow 强在文档解析，Dify 强在可视化编排，GraphRAG 强在关系推理，自建 pipeline 强在定制和控制。
difficulty: intermediate
estimatedTime: 30 分钟
learningGoals:
  - 区分自建 RAG pipeline、RAG 平台和图增强检索的适用边界
  - 判断 RAGFlow、Dify、Microsoft GraphRAG 等方案分别适合什么场景
  - 理解文档复杂度、权限需求、团队能力和长期演进对方案选择的影响
prerequisites:
  - 已了解 RAG 链路设计原则
  - 了解向量检索和 Embedding 基础
recommendedNext:
  - /agent-selection/19-vector-database-selection
  - /agent-selection/20-retrieval-patterns
  - /agent-selection/21-enterprise-knowledge-permission
practiceLinks:
  - /practice/p07-rag-basics/
  - /practice/p08-graphrag/
  - /practice/p09-hybrid-retrieval/
searchTags:
  - RAGFlow
  - Dify
  - GraphRAG
  - RAG 平台
  - LlamaIndex
  - 自建 RAG
navigationLabel: RAG 平台选型
entryMode: bridge
roleDescription: 适合在自建 RAG pipeline、RAGFlow、Dify、GraphRAG 和 Weaviate 等方案之间做取舍时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱。产品能力、开源协议、托管区域和价格会变化，上线前请以官方文档、版本说明和业务样本评测为准。

## 先分清你要的是什么

RAG 方案选型最容易犯的错，是把"我需要文档问答"等同于"我需要搭一套 RAG pipeline"。实际上至少有四条路线：

```text
自建 RAG pipeline
  -> LlamaIndex / LangChain + 自己的 parser、向量库、检索引擎

RAG 平台
  -> RAGFlow / Dify，平台帮你管文档解析、索引和检索

图增强检索
  -> Microsoft GraphRAG，用实体关系图增强跨文档推理

自带 RAG 的向量库
  -> Weaviate，向量库内直接做 hybrid search + generative search
```

这四条路线解决的是不同问题。文档复杂度、权限需求、团队能力和长期演进方向，决定了哪条路更适合你。

## 方案对比

| 方案 | 本质 | 强项 | 代价 | 适合场景 | 不适合场景 |
| --- | --- | --- | --- | --- | --- |
| 自建 pipeline（LlamaIndex / LangChain） | 用框架搭 RAG 链路 | 完全可控、可定制、可接入已有基础设施 | 需要检索工程能力和持续维护 | 知识格式可控、权限复杂、需要深度定制评估体系 | 文档格式混乱、团队没有检索工程能力 |
| RAGFlow | 开源 RAG 平台 | 文档解析强、开箱即用的知识库管理、可视化配置 | 深度定制受限、平台升级和迁移要评估 | PDF 多、扫描件多、表格多、文档格式复杂 | 只需要 API 接入、不需要完整平台 |
| Dify | 低代码 LLM 应用平台 | 可视化编排、RAG + Agent + Workflow 一体化 | 平台绑定、深度检索定制受限 | 业务原型、运营配置、需要快速搭建完整应用 | 核心产品检索层、强代码治理 |
| Microsoft GraphRAG | 图增强检索 | 实体关系、跨文档汇总、社区检测、全局视角 | 构建贵、更新难、调试复杂 | 组织/人物/系统依赖、多跳推理、知识图谱场景 | 普通 FAQ、高频更新文档、关系密度不高 |
| Weaviate | 向量库 + 内置 RAG | hybrid search、generative search、schema 驱动 | 生成能力有限、不是完整 RAG 平台 | 对象化知识库、多模态搜索、想少引入组件 | 复杂文档解析、深度业务定制 |

## 什么时候自建 pipeline

自建 pipeline 不是"低级方案"。如果你的知识格式可控（Markdown、结构化文档、API 文档），权限逻辑复杂，而且需要把检索深度集成进自有评估体系，自建通常是最稳的选择。

适合：
- 文档格式已经结构化或半结构化；
- 权限过滤逻辑复杂，需要和已有权限系统深度集成；
- 需要自定义 chunk 策略、metadata schema 和评估体系；
- 团队有检索工程能力；
- 检索是核心产品能力，不是辅助功能。

不适合：
- 大量 PDF、扫描件、表格需要解析；
- 团队没有检索工程能力；
- 只是内部知识问答，不需要深度定制。

典型技术栈：

```text
LlamaIndex / LangChain（链路编排）
  + 合适的 parser（Markdown、PDF、代码等）
  + 自选 Embedding 模型
  + 自选向量库（Qdrant / Milvus / pgvector）
  + 自建评估体系
```

## 什么时候用 RAGFlow

RAGFlow 的核心价值是**文档解析**。如果你的知识库里有大量 PDF、扫描件、表格、图片中的文字，自建 parser 的工程量会远超预期。RAGFlow 的 DeepDoc 解析能力是这个品类里最突出的。

适合：
- 大量非结构化文档（PDF、扫描件、图片）；
- 表格和混合排版文档很多；
- 需要开箱即用的知识库管理和可视化配置；
- 团队不想从 parser 开始造轮子；
- 可以接受自托管开源方案。

不适合：
- 文档已经是纯 Markdown 或结构化 API 文档（parser 优势用不上）；
- 检索逻辑需要深度定制（chunk 策略、metadata schema、评估流程）；
- 权限模型需要和已有系统深度集成。

RAGFlow 的劣势在于：它是一个平台，不是一个库。你可以配置它，但很难把它嵌入到已有的检索评估和治理流程里。

## 什么时候用 Dify

Dify 的定位不是纯粹 RAG 工具，而是低代码 LLM 应用平台。它的 RAG 能力是平台能力的一部分，和 Workflow、Agent、对话界面打包在一起。

适合：
- 快速搭建内部知识问答应用；
- 需要可视化编排（RAG + Agent + 条件分支）；
- 业务和运营人员需要参与配置；
- 原型验证和内部工具。

不适合：
- 检索是核心产品能力，不是辅助功能；
- 需要深度定制 chunk、检索和评估；
- 需要嵌入已有权限和审计体系；
- 长期演进方向是需要完整控制检索链路的。

Dify 的 RAG 适合"让非工程团队快速上线一个能用的知识问答"，不适合"把 RAG 当作产品核心壁垒"。

## 什么时候用 Microsoft GraphRAG

GraphRAG 不是普通 RAG 的升级版，而是完全不同的检索范式。它通过实体抽取、关系构建和社区检测，把文档变成知识图谱，适合回答"跨文档汇总"和"多跳推理"类问题。

适合：
- 实体和关系密度高（组织架构、项目依赖、合规体系）；
- 用户问题经常涉及多跳关系（"A 项目负责人是谁的上级"）；
- 需要全局视角的摘要和汇总；
- 文档更新频率不高。

不适合：
- 普通 FAQ 和产品手册；
- 文档高频更新；
- 关系抽取质量难以保证；
- 没有跨文档问题样本；
- 团队没有图谱维护能力。

GraphRAG 的关键不是"有没有图数据库"，而是实体和关系抽取是否可靠。如果抽取质量不稳定，图只会把噪声组织得更像真的。具体技术细节见 [检索组件选型](/agent-selection/20-retrieval-patterns)。

## 什么时候用 Weaviate 内置 RAG

Weaviate 在向量库里直接提供了 hybrid search 和 generative search（检索后直接调用模型生成答案）。它不是完整 RAG 平台，但可以让你少引入一个检索编排层。

适合：
- 知识库已经是对象化结构；
- 需要 hybrid search + 简单生成；
- 想减少系统组件数量；
- 多模态搜索需求。

不适合：
- 需要复杂文档解析（PDF、扫描件）；
- 需要自定义 chunk 和 metadata 策略；
- 生成质量要求高但不想绑定 Weaviate 的生成能力。

## 怎么选

```text
文档以 PDF、扫描件、表格为主？
  -> 先评估 RAGFlow

需要快速搭建完整的问答应用（RAG + Agent + 界面）？
  -> 先评估 Dify

知识是结构化文档，权限和评估要求高？
  -> 自建 pipeline（LlamaIndex / LangChain）

问题涉及跨文档关系和多跳推理？
  -> 先验证实体关系密度，再决定是否上 GraphRAG

已经用 Weaviate，想少引入组件？
  -> 评估 Weaviate generative search 是否够用

团队没有检索工程能力，也不想建？
  -> RAGFlow / Dify，但接受平台绑定
```

## 混合路线

很多团队最终不是单选一条路，而是组合：

```text
RAGFlow 负责文档解析和初始索引
  -> 导出 chunk 和 metadata
  -> 自建 pipeline 负责检索、评估和持续优化
```

或者：

```text
Dify 负责原型和内部工具
  -> 验证场景和样本
  -> 核心产品走自建 pipeline
```

平台可以加速启动，但不要把"平台的默认行为"变成你系统的长期架构。

## 典型误判

| 误判 | 问题 |
| --- | --- |
| 文档全是 PDF 还坚持自建 parser | 解析工程量远超预期 |
| 用 Dify/RAGFlow 做核心产品检索 | 定制深度和治理能力受限 |
| GraphRAG 是 RAG 升级版 | 是完全不同范式，不是升级路径 |
| 自建 pipeline 就是落后 | 结构化文档 + 强定制场景，自建更灵活 |
| 平台能导出数据就等于没锁定 | 导出数据不等于能复现检索质量和评估流程 |

## 最终判断

```text
文档格式复杂：RAGFlow
快速原型和内部工具：Dify
强定制和深度治理：自建 pipeline
关系密集跨文档：GraphRAG
已有 Weaviate 且需求简单：内置 generative search
```

RAG 平台的价值是降低启动成本，自建 pipeline 的价值是长期控制力。选择的关键不是你更熟悉哪个工具，而是你的文档长什么样、你的团队能维护什么、你的检索质量需要多细的控制粒度。
