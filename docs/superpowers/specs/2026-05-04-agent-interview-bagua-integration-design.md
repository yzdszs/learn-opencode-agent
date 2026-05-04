# AI Agent 面试八股文接入设计

## 背景

当前仓库已经有一组稳定的面试专区页面：

- `docs/interview/index.md` 作为总览入口
- `docs/interview/fundamentals/` 到 `docs/interview/engineering/` 作为 7 个能力分类页
- `.vitepress/config.mts` 已经为 `/interview/` 配好了独立 sidebar

这套结构适合“按能力分类刷高频题”，阅读模型已经比较稳定，不适合为了新内容直接推倒重来。

本次新增内容主要位于 `converted-md/sections-clean/`，其中既有适合题库化阅读的模块长文，也有招聘分析、简历指南、STAR 面试稿、项目问答等配套资料。它们不应被直接拆散塞回现有 7 个分类页，否则会把“分类题页”和“长文八股文”两种阅读模型混在一起。

## 目标

本次接入要达成 5 个目标：

1. 在现有 `/interview/` 下新增一个明确的内标签入口：`AI Agent 面试八股文`
2. 不破坏现有 7 个能力分类页的导航结构与阅读节奏
3. 为 `converted-md/sections-clean/03-11` 这批题库型文章建立稳定挂载位置
4. 让读者从面试专区进入后，能清楚区分“高频分类题”和“系统化八股长文”两条阅读路径
5. 保持最小修改，优先复用现有 frontmatter、目录结构和 sidebar 组织方式

## 非目标

本次不做下面这些事情：

1. 不重构现有 `docs/interview/` 的 7 个分类页
2. 不把 `converted-md` 全量内容一次性并入导航
3. 不在本轮处理招聘分析、简历指南、STAR 稿、项目面试问答等资料型页面
4. 不为八股文页复用现有 `interview-details-page` 样式
5. 不新增新的顶层导航入口，八股文仍然从 `/interview/` 内部进入

## 核心判断

### 为什么不拆进现有 7 个分类页

真实问题不是“给现有页面补几道题”，而是“接入一组新的长文题库”。

如果强行拆进 `fundamentals / tools / memory / planning / rag / multi-agent / engineering` 这 7 页，会产生 3 个问题：

1. 页面阅读模型混杂
2. 单页长度快速膨胀
3. 后续新增文章时需要反复回头整理结构

更简单的方法是：在 `/interview/` 下增加第二条阅读路径，用独立子栏目承接八股文。

### 为什么要新增 `/interview/bagua/`

采用独立子栏目有 3 个直接收益：

1. 对现有结构改动最小
2. 用户能一眼分清“分类高频题”和“系统化八股文”
3. 后续继续迁入新文章时，不需要反复调整 7 个分类页

## 信息架构

本次采用“双路径并存”的方式组织面试专区：

### 路径 1：现有能力分类页

保持现状不变：

- `/interview/fundamentals/`
- `/interview/tools/`
- `/interview/memory/`
- `/interview/planning/`
- `/interview/rag/`
- `/interview/multi-agent/`
- `/interview/engineering/`

这条路径继续承担“按能力分类快速刷题”的角色。

### 路径 2：新增八股文子栏目

新增：

- `/interview/bagua/`

这条路径承担“按模块系统阅读八股文”的角色。

用户入口规则：

1. 面试专区首页 `docs/interview/index.md` 增加 `AI Agent 面试八股文` 入口说明
2. `/interview/` sidebar 在现有 `能力分类` 之外新增一个 `八股文` 分组
3. `八股文` 分组先挂总览页，再挂模块页

## 路由与目录命名

目录统一使用英文 slug，并延续当前站点的 `index.md` 组织方式：

- `docs/interview/bagua/index.md`
- `docs/interview/bagua/agent-basics/index.md`
- `docs/interview/bagua/core-frameworks/index.md`
- `docs/interview/bagua/rag/index.md`
- `docs/interview/bagua/tool-calling/index.md`
- `docs/interview/bagua/memory/index.md`
- `docs/interview/bagua/multi-agent/index.md`
- `docs/interview/bagua/llm-fundamentals/index.md`
- `docs/interview/bagua/engineering-practice/index.md`
- `docs/interview/bagua/prompt-engineering/index.md`

说明：

1. `bagua` 只作为栏目锚点，不把完整中文标题塞进路径
2. 模块 slug 与原始标题语义对齐，但保持 URL 简短稳定
3. 所有页面都采用目录式路由，和现有章节结构一致

## 内容映射

### 首批直接迁入八股文子栏目

以下内容适合作为首批主内容页：

- `converted-md/sections-clean/02-ai-agent-bagua-index.md` -> `/interview/bagua/`
- `converted-md/sections-clean/03-agent-basics.md` -> `/interview/bagua/agent-basics/`
- `converted-md/sections-clean/04-core-frameworks.md` -> `/interview/bagua/core-frameworks/`
- `converted-md/sections-clean/05-rag.md` -> `/interview/bagua/rag/`
- `converted-md/sections-clean/06-tool-calling.md` -> `/interview/bagua/tool-calling/`
- `converted-md/sections-clean/07-memory.md` -> `/interview/bagua/memory/`
- `converted-md/sections-clean/08-multi-agent.md` -> `/interview/bagua/multi-agent/`
- `converted-md/sections-clean/09-llm-fundamentals.md` -> `/interview/bagua/llm-fundamentals/`
- `converted-md/sections-clean/10-engineering-practice.md` -> `/interview/bagua/engineering-practice/`
- `converted-md/sections-clean/11-prompt-engineering.md` -> `/interview/bagua/prompt-engineering/`

其中：

1. `02-ai-agent-bagua-index.md` 作为总览页主体来源
2. `01-ai-agent-interview-guide-overview.md` 中适合做导语的部分，可合并到总览页前言，但不单独开页

### 暂不纳入首批主导航

以下内容先不进入首批八股文主结构：

- `converted-md/sections-clean/12-hiring-analysis-2026.md`
- `converted-md/sections-clean/13-open-source-notes.md`
- `converted-md/sections-clean/14-resume-guide.md`
- `converted-md/sections-clean/15-star-interview-guide.md`
- `converted-md/sections-clean/16-project-interview-qa.md`

原因：

1. 它们是资料型内容，不是八股文模块主体
2. 首批目标是先打通稳定阅读路径，而不是一次性做全量求职专区
3. 这批内容后续更适合单独评估是否建立 `求职资料` 或 `项目面试` 分组

## 页面规范

### 总览页规范

`docs/interview/bagua/index.md` 沿用当前 support/bridge 型页面风格，保留以下核心字段：

- `title`
- `description`
- `contentType: support`
- `series: support`
- `contentId`
- `shortTitle`
- `summary`
- `difficulty`
- `estimatedTime`
- `learningGoals`
- `prerequisites`
- `recommendedNext`
- `practiceLinks`
- `searchTags`
- `navigationLabel`
- `entryMode`
- `roleDescription`

总览页职责：

1. 说明八股文栏目的定位
2. 告诉用户它和现有 7 个能力分类页的区别
3. 给出模块目录和推荐阅读顺序
4. 提供回链到 `/interview/`、`/discover/`、`/practice/`、`/intermediate/`

### 模块页规范

每个模块页也沿用当前文档站 frontmatter 体系，但不加：

- `pageClass: interview-details-page`

理由：

1. 现有 `interview-details-page` 是为“分类题页 + 深答折叠块”准备的样式作用域
2. 八股文模块页是长文模块，不应默认套入当前分类题样式
3. 若后续八股文需要统一样式，应新增专用 page class，而不是复用已有 class

## Sidebar 设计

`.vitepress/config.mts` 的 `/interview/` sidebar 建议调整为：

1. 保留现有：
   - `← 返回首页`
   - `专区总览`
   - `能力分类`
2. 新增：
   - `八股文`
3. `八股文` 分组首批包含：
   - `AI Agent 面试八股文`
   - `基础概念`
   - `核心框架`
   - `RAG 技术`
   - `工具调用`
   - `记忆系统`
   - `多智能体`
   - `大模型基础`
   - `工程化实践`
   - `Prompt 工程`

这样做可以保证：

1. 现有分类刷题路径仍然是第一阅读入口
2. 八股文成为同级补充，而不是替代现有路径
3. 后续扩展依然在 `/interview/` 内部完成

## 首批实施范围

首批最小实施集合如下：

### 修改文件

- `docs/interview/index.md`
- `.vitepress/config.mts`

### 新建文件

- `docs/interview/bagua/index.md`
- `docs/interview/bagua/agent-basics/index.md`
- `docs/interview/bagua/core-frameworks/index.md`
- `docs/interview/bagua/rag/index.md`
- `docs/interview/bagua/tool-calling/index.md`
- `docs/interview/bagua/memory/index.md`
- `docs/interview/bagua/multi-agent/index.md`
- `docs/interview/bagua/llm-fundamentals/index.md`
- `docs/interview/bagua/engineering-practice/index.md`
- `docs/interview/bagua/prompt-engineering/index.md`

### 明确不改

- 现有 7 个能力分类页内容
- `.vitepress/theme/custom.css`
- 顶层导航结构
- `converted-md/` 原始文件

## 验收标准

完成后应满足以下标准：

1. `/interview/` 首页能看到 `AI Agent 面试八股文` 入口
2. `/interview/` sidebar 中存在独立的 `八股文` 分组
3. `/interview/bagua/` 和首批 9 个模块页都能正常访问
4. 现有 7 个能力分类页链接和内容不受影响
5. 新页面 frontmatter 完整，能通过现有内容校验脚本
6. 本轮不引入额外样式副作用

## 风险与约束

### 风险 1：原始 markdown 结构不够干净

`converted-md` 来源于转换内容，正文里可能存在：

- 标题层级不统一
- 列表缩进不稳定
- 代码块格式不完整
- 个别段落不符合当前站点文风

约束：

迁入时应做最小必要清理，但不重写内容结构，不扩大为“全文编辑项目”。

### 风险 2：总览页与模块页风格漂移

如果总览页写成目录，模块页写成纯原始导入，用户阅读体验会明显割裂。

约束：

总览页需要补齐当前站点常用的导语、适合谁读、怎么用、推荐顺序和回链入口。

### 风险 3：资料型内容提前进入主导航

如果把招聘分析、简历、STAR、项目问答也一并挂进 sidebar，会让八股文主路径变得过宽。

约束：

本轮只做模块主体，资料型内容延后单独决策。

## 实施后下一步

在用户确认这份设计文档后，再进入实现计划阶段。实现阶段应进一步明确：

1. 每个新页面的 frontmatter 草案
2. `docs/interview/index.md` 中入口区块的精确文案
3. `.vitepress/config.mts` 的 sidebar 具体增量
4. 需要运行的校验命令与最小验证顺序
