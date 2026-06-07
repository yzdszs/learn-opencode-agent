---
title: 代码库 Agent 怎么选
description: 判断代码库助手应该使用代码 RAG、工具调用、LangGraph 还是轻量 Agent Loop，并说明代码库 RAG 在索引、chunk、metadata、检索策略和版本边界上的特殊设计。
contentType: support
series: support
contentId: agent-selection-codebase-agent
shortTitle: 代码库 Agent 选型
summary: 代码库 Agent 的关键是代码结构、可验证修改和测试闭环，代码 RAG 不能按普通文档做。
difficulty: advanced
estimatedTime: 45 分钟
learningGoals:
  - 区分代码问答、代码修改和自动修复任务
  - 判断什么时候需要 Code-aware RAG、工具调用或 LangGraph
  - 理解代码和普通文档在检索结构上的差异
  - 设计代码库 chunk、metadata 和符号索引
  - 识别代码库 Agent 的测试、权限和回滚风险
prerequisites:
  - 已了解 Agent Framework 和 RAG 选型
  - 了解代码库基本结构
recommendedNext:
  - /agent-selection/22-security-permission-selection
  - /agent-selection/16-retrieval-patterns
  - /practice/p22-project/
practiceLinks:
  - /practice/p10-react-loop/
  - /practice/p11-planning/
  - /practice/p20-observability/
searchTags:
  - 代码库 Agent
  - Code RAG
  - 代码库检索
  - 符号索引
  - 工具调用
  - LangGraph
navigationLabel: 代码库 Agent 选型
entryMode: bridge
roleDescription: 适合设计代码问答、代码审查、自动修复和仓库助手时阅读。
---

<ChapterLearningGuide />

## 先区分三类任务

| 任务 | 推荐技术 | 不要先做什么 |
| --- | --- | --- |
| 代码问答 | Code-aware RAG | 不要让模型全仓盲猜 |
| 代码审查 | Diff + 规则 + LLM | 不要只看完整文件 |
| 自动修改 | Tools + Tests + Approval | 不要直接写入主分支 |
| 自动修 Bug | Agent Loop / LangGraph | 不要跳过复现和测试 |

代码库 Agent 的核心不是"能读代码"，而是"改完以后能验证"。

## 代码库任务的技术边界

代码库 Agent 通常被混成一个概念，但实际是四种产品：

```text
Code Q&A
  -> 找上下文，解释代码

Code Review
  -> 理解 diff，指出风险

Code Editing
  -> 生成补丁，保持风格

Bug Fixing Agent
  -> 复现、定位、修改、测试、回归
```

这四类的风险级别完全不同。Code Q&A 可以只读；Bug Fixing Agent 必须能运行测试、处理失败、保留 diff，并在高风险文件前暂停。

## 能力分级

| 级别 | 能力 | 适合 | 风险 |
| --- | --- | --- | --- |
| L1 只读问答 | 检索 + 读取文件 | 解释代码、找入口 | 答错但不改代码 |
| L2 代码建议 | 生成 patch 建议 | review、重构建议 | 需要人手动应用 |
| L3 受控编辑 | 写文件 + diff | 小修小改、补测试 | 可能破坏工作区 |
| L4 自动修复 | 计划、编辑、测试、修复 | 有测试的 bug 修复 | 需要状态和回滚 |
| L5 自主任务 | 多轮执行、跨模块修改 | 明确边界的工程任务 | 高风险，必须审批 |

大多数团队应该从 L1/L2 开始，不要直接做 L4/L5。

## 代码不是普通文本

这是代码库 Agent 选型最根本的差异。

普通文档按段落组织，代码按结构组织：

```text
file
  -> module
  -> class / function
  -> symbol
  -> import / export
  -> tests
```

如果按固定 token 切片，函数、类型、调用关系和测试关系都会被切碎。

两种索引必须配合：

| 索引 | 解决什么 |
| --- | --- |
| Lexical / symbol index | 精确找函数、类、文件、错误码 |
| Semantic index | 找行为相似、语义相关的实现 |

只用语义索引会漏掉精确符号，只用关键词索引又找不到"实现了某个行为"的代码。

## 索引设计

代码索引至少要分三层：

| 层 | 存什么 | 用来解决什么 |
| --- | --- | --- |
| 文件索引 | path、language、module、owner | 先定位范围 |
| 符号索引 | function、class、export、import | 找精确代码结构 |
| 语义索引 | docstring、注释、实现片段 | 找"意思相近"的逻辑 |

不要把 `node_modules`、lock 文件、生成代码、构建产物全塞进索引。召回噪声会直接污染修改建议。

## 代码 RAG 的 metadata

每个 chunk 至少要有：

- repository、branch / commit；
- file_path、language；
- symbol_name、symbol_type；
- imports、exports；
- related_tests；
- owner 或 module；
- generated（排除生成文件和依赖）。

metadata 应该直接服务检索和过滤：

| metadata | 用途 |
| --- | --- |
| file_path | 按模块、目录、配置类型过滤 |
| symbol_name | 精确匹配函数、类、变量 |
| language | 选择 parser 和展示方式 |
| commit | 避免混用不同版本代码 |
| related_tests | 修改后定位验证入口 |
| generated | 排除生成文件和依赖文件 |

## chunk 应该怎么切

| 单元 | 适合 |
| --- | --- |
| 文件级 | 小文件、配置文件 |
| 符号级 | 函数、类、方法 |
| 代码块级 | 长函数内部局部逻辑 |
| 测试级 | case、fixture、snapshot |

不要盲目按 token 切。优先保持语法结构完整，再考虑长度。代码 chunk 最好来自语法树而不是纯文本规则。跨语言项目里，每种语言使用对应 parser，无法解析时再退回文件级或段落级切分。

## 检索策略

| 查询 | 推荐检索 |
| --- | --- |
| 找函数或类 | 关键词 + 符号索引 |
| 解释逻辑 | 文件读取 + 语义检索 |
| 查调用链 | import / reference 图 |
| 改 bug | 相关实现 + 相关测试 |
| 找配置 | 路径和关键词检索 |

纯向量检索容易漏掉精确符号名。代码库 RAG 通常需要 hybrid。

## 上下文来源怎么组合

| 上下文 | 来源 | 用途 |
| --- | --- |
| 用户目标 | 当前请求 | 判断任务范围 |
| 当前 diff | git diff | 做 code review 或续改 |
| 文件内容 | read file tool | 精确理解实现 |
| 符号关系 | language server / parser | 找调用和定义 |
| 测试结果 | test runner | 验证修改 |
| 历史约定 | docs / AGENTS.md | 保持项目风格 |

不要只靠向量库。代码修改必须读取真实文件内容，尤其是当前工作区可能有未提交变更时。

## RAG、工具调用还是 LangGraph

| 场景 | 选择 |
| --- | --- |
| 查某段逻辑在哪里 | Code-aware RAG + 文件读取 |
| 解释调用链 | 符号检索 + 代码阅读工具 |
| 改一个小函数 | 工具调用 + diff |
| 多文件修改 | Agent Loop + 测试 |
| 修复复杂 bug | LangGraph / 显式状态 |
| 需要暂停审核 | Human-in-the-Loop |

LangGraph 只有在"搜索、修改、测试、修复、复审"需要恢复和回放时才值得用。

## 三条典型方案

| 方案 | 架构 | 适合 | 不适合 |
| --- | --- | --- | --- |
| 只读代码助手 | Code-aware RAG + read file | 解释代码、找入口、问调用关系 | 自动修改 |
| 编辑助手 | 只读检索 + edit tool + diff | 小范围重构、补测试、修小 bug | 长流程自恢复 |
| 自动修复 Agent | Plan -> inspect -> edit -> test -> fix -> review | 多文件 bug、回归测试明确 | 无测试仓库 |

如果项目没有可靠测试，自动修复 Agent 的上限很低。

## 修改任务要补影响分析

修改任务还需要判断影响范围：

```text
changed symbol
  -> direct callers
  -> related tests
  -> config / schema
  -> public API boundary
```

如果系统只召回当前函数，模型可能改出局部正确、全局破坏的代码。代码库 Agent 至少要能继续读取调用方、测试和类型定义。

## 工具清单怎么设计

| 工具 | 风险 | 建议 |
| --- | --- | --- |
| read_file / search_code | 低 | 默认开放 |
| inspect_symbol | 低 | 适合代码结构查询 |
| edit_file | 中 | 需要 diff 记录 |
| run_tests | 中 | 限制命令范围和超时 |
| shell | 高 | 默认禁用或强确认 |
| git operation | 高 | 禁止 destructive 操作 |

工具权限不要等同于开发者权限。Agent 能做什么，应该比开发者手动操作更窄。

## 自动修改的边界

允许 Agent 自动修改前，至少要有：工作区隔离、diff 可见、测试命令、失败回滚策略、高风险文件保护、人工确认。不要让 Agent 在没有测试和 diff 的情况下批量改代码。

## 上线检查

- 是否排除了 `node_modules`、lock 文件、生成文件和构建产物；
- 是否记录 branch 或 commit；
- 是否有符号索引；
- 是否能从实现找到相关测试；
- 是否支持精确文件读取；
- 是否能处理未提交变更；
- 修改类任务是否必须跑检查。

代码库 RAG 的验收不应该只看"能不能回答问题"，还要看它是否帮助模型做出可验证的修改。

## 版本边界

代码 RAG 必须记录 commit 或 branch。否则模型可能把不同版本的实现混在一起。需要特别处理：当前工作区未提交变更、目标分支、生成文件、vendored 代码、大型 lock 文件、测试快照。不是所有文件都应该进入索引。

## POC 怎么验收

| 样本 | 通过标准 |
| --- | --- |
| 查入口文件 | 能定位正确文件并解释理由 |
| 解释调用链 | 能引用真实函数和文件路径 |
| review 一个 diff | 能指出具体风险，不泛泛而谈 |
| 修一个小 bug | 修改最小，测试通过 |
| 测试失败后再修 | 能根据失败信息调整 |
| 高风险文件修改 | 能暂停并要求确认 |

代码库 Agent 的 POC 不要只演示"生成一段代码"。要验证它是否能在真实仓库里读、改、测、解释。

## 最终判断

```text
普通文档：段落和标题
代码库：文件、符号、调用、测试
只读问答：Code-aware RAG
小范围修改：工具调用 + diff
复杂修复：Agent Loop + Tests
长流程修复：LangGraph + checkpoint
高风险仓库：必须人工确认
```

代码库 Agent 选型要围绕"可定位、可修改、可验证、可回滚"展开。代码库 RAG 的目标不是"召回一段像代码的文本"，而是召回能支持正确修改的程序上下文。
