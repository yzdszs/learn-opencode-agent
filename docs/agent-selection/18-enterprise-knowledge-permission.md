---
title: 企业知识库权限过滤怎么设计
description: 说明企业 RAG 中检索前过滤、租户隔离、文档 ACL、引用脱敏和审计应该如何设计。
contentType: support
series: support
contentId: agent-selection-enterprise-knowledge-permission
shortTitle: 知识权限设计
summary: 企业知识库权限必须在检索前生效，生成后过滤无法防止泄露。
difficulty: advanced
estimatedTime: 25 分钟
learningGoals:
  - 理解检索前权限过滤为什么是企业 RAG 底线
  - 设计文档、chunk、租户和用户权限 metadata
  - 识别引用、脱敏和审计中的泄露风险
prerequisites:
  - 已了解 RAG 选型
  - 已了解企业 Copilot 选型
recommendedNext:
  - /agent-selection/09-enterprise-copilot-stack
  - /agent-selection/22-security-permission-selection
  - /practice/p19-security/
practiceLinks:
  - /practice/p07-rag-basics/
  - /practice/p19-security/
  - /practice/p20-observability/
searchTags:
  - 企业知识库
  - 权限过滤
  - ACL
  - RAG 安全
  - 多租户
navigationLabel: 知识权限设计
entryMode: bridge
roleDescription: 适合设计企业 RAG、多租户知识库和权限隔离检索系统时阅读。
---

<ChapterLearningGuide />

## 核心原则

```text
先过滤，再检索，再生成
```

不能先检索全量知识，再让模型“不要说出来”。只要未授权内容进入上下文，就已经泄露。

## 权限模型先于索引模型

企业 RAG 设计顺序应该是：

```text
用户身份
  -> 组织 / 角色 / 项目 / 数据域
  -> 文档 ACL
  -> chunk metadata
  -> 检索 filter
  -> 引用和 trace 脱敏
```

如果先建索引再补权限，后面通常会发现 metadata 不够用，只能重建索引。

## 权限数据结构

每个 chunk 至少要带：

- tenant_id；
- document_id；
- source；
- version；
- owner；
- department；
- acl；
- sensitivity；
- valid_from / valid_to；
- deletion_status。

权限不是额外字段，它是检索数据结构的一部分。

## 权限变化必须能生效

企业权限不是静态的。员工会转岗，项目会关闭，文档会撤回，合同会过期。权限系统至少要处理：

- 用户角色变化；
- 组织架构变化；
- 文档 ACL 更新；
- 文档删除和撤回；
- 敏感级别调整；
- 临时授权过期。

如果权限变化后旧 chunk 仍然能被召回，系统就会持续泄露。权限更新要么实时进入 filter，要么有明确的索引刷新和删除机制。

## ACL 粒度怎么选

| 粒度 | 适合 | 风险 |
| --- | --- | --- |
| 文档级 | 制度、产品手册、FAQ | 文档内混合权限时不够 |
| chunk 级 | 大文档、章节权限不同 | metadata 更复杂 |
| 字段级 | 表格、客户数据、合同 | 检索和脱敏成本高 |
| 动态策略 | 项目、地域、岗位变化快 | 需要权限服务实时计算 |

不要默认文档级 ACL 足够。很多企业文档标题可见，但内容某些章节不可见。

## 一个错误设计

常见错误链路是：

```text
全量文档进入向量库
  -> 检索 TopK
  -> 代码过滤无权限 chunk
  -> 剩余 chunk 交给模型
```

这个设计看似没有把无权限内容交给用户，但问题已经发生：无权限 chunk 进入过召回结果、日志和调试 trace。过滤后 TopK 也可能只剩一两条，导致模型回答不稳定。

正确做法是让权限条件进入向量库和关键词搜索查询，让无权限 chunk 从第一步就不可见。

## 检索前过滤

检索请求应先计算用户可访问范围：

```text
user identity
  -> roles / groups
  -> accessible document scope
  -> vector / keyword filter
  -> retrieval
```

filter 表达式必须进入向量库或搜索引擎查询，不要在召回后用代码过滤 TopK。

## 引用必须二次校验

即使检索前过滤正确，最终引用也要校验：

- 引用链接当前用户是否能打开；
- 引用标题是否泄露项目名；
- 引用摘要是否包含敏感字段；
- 引用原文是否已经过期；
- trace 中是否保存了完整敏感内容。

很多泄露不是出现在答案正文，而是出现在引用、调试面板、导出报告和错误日志里。

## 为什么召回后过滤不够

召回后过滤会带来两个问题：

1. 未授权 chunk 已经进入系统上下文或 trace；
2. 过滤后 TopK 可能变空，导致回答质量和调试都不稳定。

正确做法是把 ACL 变成检索条件，让未授权内容从一开始就不可召回。

## RBAC 与企业身份集成

企业 RAG 的权限来源通常不是独立系统，而是已有的身份和权限体系。

### 常见身份系统对接

| 系统 | 接入方式 | 注意点 |
| --- | --- | --- |
| LDAP / Active Directory | 查询用户组和 OU | 缓存 TTL 不能太长，组织变化要及时同步 |
| OAuth 2.0 / OIDC | 解析 token claims | scope 和 group claim 要包含所需权限信息 |
| SCIM | 实时同步用户和组变化 | 事件驱动同步比定时拉取更实时 |
| 内部 RBAC 服务 | API 查询权限 | 高频检索时要缓存权限决策结果 |

### 权限解析链

每次检索前需要把用户身份转换为可用于 filter 的权限表达式：

```text
user_id
  -> 查询角色和组（LDAP / RBAC API）
  -> 转换为 accessible_department、accessible_project、accessible_sensitivity
  -> 构建 vector filter 表达式
  -> 检索
```

不要在每次检索时实时调用 LDAP，要在会话层或请求层缓存权限决策结果，并设合理 TTL（如 5–15 分钟）。

### 权限传播模型

| 类型 | 说明 | 典型用法 |
| --- | --- | --- |
| 直接 ACL | 用户直接列在文档 ACL 里 | 特殊文档、合同 |
| 组继承 | 用户属于某组，组有文档访问权限 | 部门文档、项目文档 |
| 角色策略 | 角色决定能访问哪类文档 | 岗位分类（销售/法务/研发） |
| 动态策略 | 运行时计算（项目组成员、地域合规） | 合规场景、外部用户 |

优先使用组继承和角色策略，减少逐个文档配置 ACL 的维护成本。

## 行级安全设计模式

并非所有权限都可以在文档级解决。部分场景需要更细粒度的行级安全。

### 三种粒度

| 粒度 | 示例 | 实现方式 |
| --- | --- | --- |
| 文档级 | 整份合同是否可见 | document_id + ACL |
| Chunk 级 | 合同某章节仅高级别可见 | chunk 独立 metadata + ACL |
| 字段级 | 表格行中薪资字段不可见 | 解析时脱敏或分片存储 |

### 混合权限文档的处理

当一个文档中不同章节权限不同时：

```text
解析文档
  -> 按权限边界切割 chunk
  -> 每个 chunk 赋予对应 ACL
  -> 同一文档的 chunk 可以有不同的 acl 字段
```

不要把整个文档的最高权限 chunk 和最低权限 chunk 混在同一个 chunk 里。切割边界应该和权限边界对齐。

### 动态脱敏

对于字段级安全，可以在检索后、注入上下文前做动态脱敏：

- 替换敏感字段为 `[REDACTED]`；
- 保留结构但掩码具体值（如 `****-****-****-1234`）；
- 完全删除字段；
- 替换为角色允许看到的聚合值（如用"部门平均"替换个人薪资）。

脱敏操作必须在 chunk 进入 LLM 上下文之前执行，不能依赖模型自行过滤。

## 多租户隔离

多租户有两种路线：

| 路线 | 适合 | 风险 |
| --- | --- | --- |
| 物理隔离 collection | 租户少、隔离要求高 | 运维复杂 |
| 逻辑隔离 metadata | 租户多、规模大 | filter 错误风险高 |

无论哪种路线，都要有权限测试样本，专门验证越权召回。

## 权限测试样本

上线前至少准备这些样本：

| 样本 | 期望 |
| --- | --- |
| A 用户查询 B 部门文档 | 无召回 |
| 项目成员查询已撤回文档 | 无召回 |
| 有标题权限但无正文权限 | 不返回正文 |
| 跨租户查询同名文档 | 只返回本租户 |
| 权限变更后再次查询 | 按新权限生效 |
| trace 导出 | 敏感内容脱敏 |

企业 RAG 的权限测试应该是固定回归集，不是上线前人工随便试几次。

## 大规模 Metadata Filter 性能影响

权限 filter 不是没有代价的，在数百万 chunk 规模下，设计不当会严重影响检索性能。

### 性能影响来源

向量数据库的 ANN（近似近邻）搜索在加入 metadata filter 后可能出现：

- **Pre-filtering**：先过滤元数据，再在过滤后的子集上做向量搜索。当过滤后结果集很小时，ANN 索引优势消失，退化为线性扫描。
- **Post-filtering**：先 ANN 搜索，再按 metadata 过滤。当过滤比例很高时（例如大部分结果被过滤掉），需要召回更多候选才能满足 TopK，增加 ANN 计算量。

### 不同数据库的行为差异

| 数据库 | Filter 策略 | 大规模表现 |
| --- | --- | --- |
| Weaviate | 自适应 pre/post filter | 过滤比例高时自动切换策略 |
| Qdrant | 带 filter 的 HNSW | filter 友好，性能相对稳定 |
| Pinecone | Pre-filter 为主 | 过滤后数据集小时需要增加 candidate 数 |
| pgvector | Post-filter | 过滤比例高时性能下降明显 |
| Milvus | 支持 pre-filter | 索引设计影响较大 |

### 优化策略

1. **高频 filter 字段加索引**：`tenant_id`、`department`、`acl` 这类高频过滤字段要加 payload 索引或数据库特定索引。
2. **避免过于复杂的 filter 表达式**：多层嵌套 AND/OR 会影响 filter 评估性能。
3. **权限分桶**：对于权限组合固定的场景，可以预计算用户的权限 bucket，用 bucket_id 单字段过滤替代多字段组合过滤。
4. **物理分区兜底**：当某租户数据量占比很高时，考虑按 tenant_id 做物理分区或 collection 隔离，减少 filter 范围。
5. **缓存权限计算结果**：不要每次检索都实时计算用户可访问的 filter 表达式，会话层缓存权限快照（带 TTL）。

### 性能测试建议

上线前至少用生产数量级数据测试：

- 单租户大量 chunk 时的检索延迟；
- 多租户并发检索时的延迟分布；
- 权限过滤比例在 50%、80%、95% 时的 p95 延迟；
- 权限变更（批量删除 chunk 权限）时的索引更新耗时。

## 引用和脱敏

引用也可能泄露信息。需要检查：

- source 名称是否包含敏感项目；
- chunk 原文是否需要脱敏；
- 引用链接是否可被当前用户访问；
- 摘要是否暴露未授权事实；
- trace 是否包含敏感上下文。

不要只保护最终答案。trace、日志、引用和调试界面都要纳入权限边界。

## 上线检查

- 是否有越权召回测试；
- 是否有删除回收机制；
- 是否能处理用户权限变更；
- 是否记录每次检索 filter；
- 是否能解释某条 chunk 为什么可见；
- 是否有敏感数据脱敏；
- 是否审计引用和 trace。

企业 RAG 的第一指标不是召回率，而是“不该看的永远召不出来”。
