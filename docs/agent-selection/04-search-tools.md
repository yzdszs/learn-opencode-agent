---
title: 搜索与抓取工具怎么选
description: 判断 Search API、Reader、Crawler、Browser Automation 和 Scraper 的适用边界，并对比 Tavily、Exa、Brave Search、SerpAPI、Firecrawl、Jina Reader、Crawl4AI、Scrapy、Playwright 等工具。
contentType: support
series: support
contentId: agent-selection-search-tools
shortTitle: 搜索与抓取工具选型
summary: Search、Reader、Crawler、Browser 和 Scraper 是不同层级；能用官方 API 就不要抓网页，能用 Search + Reader 就不要开浏览器。
difficulty: intermediate
estimatedTime: 40 分钟
learningGoals:
  - 区分 Search API、Reader、Crawler、Browser Automation 和 Scraper 的边界
  - 判断研究型 Agent、实时问答、站点索引、网页抽取和登录交互场景该用什么工具
  - 理解搜索结果的来源过滤、冲突处理和引用输出
  - 避免用浏览器自动化解决本该由 API、搜索或静态解析解决的问题
prerequisites:
  - 了解 Agent 工具调用
  - 了解 RAG 与搜索的区别
  - 了解基本 Web Search 场景
recommendedNext:
  - /agent-selection/11-research-agent-selection
  - /agent-selection/19-mcp-tool-selection
practiceLinks:
  - /practice/p14-mcp/
  - /practice/p18-model-routing/
  - /practice/p20-observability/
searchTags:
  - 搜索工具
  - Search API
  - Web Reader
  - Crawler
  - Browser Automation
  - Scraper
  - Tavily
  - Firecrawl
navigationLabel: 搜索与抓取工具选型
entryMode: bridge
roleDescription: 适合需要给 Agent 接入实时网页、官方文档、外部资料或搜索 API 时阅读。
---

<ChapterLearningGuide />

> 说明：本文是截至 2026-06 的选型图谱，不是实时排名。产品能力、价格、配额、托管区域、开源协议和集成方式会变化，采购或上线前请以官方文档、价格页、版本说明和业务样本评测为准。

## 搜索解决什么

搜索工具解决的是动态外部信息，不是私有知识治理。

适合搜索的场景：最新官方文档、新版本发布说明、新闻/论坛/博客、开放网页事实、需要多来源交叉验证的问题、用户明确要求"当前""最新""最近"。

搜索结果不是答案。搜索只给候选来源，后面还要做来源过滤、正文读取、去重、冲突检测、摘要和引用。

## 五分层的工具链

网页信息获取不是一个工具能解决的事。至少有五层：

```text
Search API
  -> 找到候选 URL

Reader / Fetch
  -> 读取单个网页正文

Crawler
  -> 批量遍历站点并抽取页面

Browser Automation
  -> 打开浏览器执行登录、点击、表单、截图

Scraper / Parser
  -> 从 HTML 或 DOM 中抽取结构化字段
```

选错层级，系统会又慢又贵，还更难维护。

## 分层原则：从轻到重

```text
Search API
  -> URL Reader
  -> Site Crawler
  -> Browser Automation
```

每升级一层，成本、延迟和不稳定性都会上升。只有当 Reader 读不到正文、页面依赖交互、或需要截图验证时，才升级到浏览器自动化。

推荐链路：

```text
Search
  -> Source Filter
  -> Reader
  -> Optional Browser
  -> Summary + Citation
```

| 任务 | 正确拆法 |
| --- | --- |
| 查某个政策是否有更新 | Search 找来源，Reader 读官方页面 |
| 总结某家公司公开资料 | Search 多来源，Reader 读取，按来源汇总 |
| 同步一个文档站 | Sitemap 或 Crawler 批量抓取 |
| 检查后台某个订单状态 | 优先官方 API，没有 API 再用 Browser |
| 验证页面按钮是否存在 | Browser screenshot 或 DOM 检查 |

## 搜索 query 也要设计

用户问题通常不能直接丢给搜索 API。研究型 Agent 至少要处理：关键词提取、中英文或术语改写、官方来源优先、时间范围、排除低质量站点、多 query 并发、结果去重。

例如"这个库最新版怎么用"应该改写成库名、版本、官方文档、release notes 等多个 query。搜索质量差，很多时候不是工具差，而是 query 没有被设计。

## 主流工具对比

### Search API

| 方案 | 本质 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| Tavily | 面向 AI 应用的搜索/抽取 API | 接入快，适合 Agent 搜索链路 | 依赖外部服务，结果质量要评测 | 研究型 Agent、实时问答 |
| Exa | 神经搜索 / Web 搜索 API | 语义搜索、找相似网页 | 成本和覆盖要评测 | 研究、资料发现、相似来源查找 |
| SerpAPI | 搜索结果页 API | 能取搜索引擎结果结构 | 成本、合规和依赖搜索引擎 | SERP 分析、搜索结果聚合 |
| Brave Search API | 独立搜索 API | 通用网页搜索，接入直接 | 覆盖和排序要实测 | 通用实时信息搜索 |
| Bing / Google Custom Search | 搜索引擎 API | 覆盖广，生态成熟 | 配额、成本、结果控制有限 | 通用搜索、企业已有云生态 |

### Reader

| 方案 | 本质 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| Jina Reader | URL 转可读文本 | 快速读取网页正文 | 动态页面和复杂结构有限 | 单页读取、摘要、引用 |
| Firecrawl | 抓取、读取、站点 crawl | 面向 AI 的网页抽取和爬取 | 外部服务、成本和限制要评估 | 文档站抓取、网页资料库 |
| Tavily Extract | 搜索后网页抽取 | 和搜索链路组合方便 | 覆盖和抽取质量要测 | 搜索 + 阅读一体化 |

### Crawler

| 方案 | 本质 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| Crawl4AI | 面向 LLM 的开源 crawler | 自托管、适合 AI 内容抽取 | 需要运维和反爬处理 | 文档站、站点资料库 |
| Scrapy | 通用爬虫框架 | 稳定、可扩展、工程成熟 | 开发和维护成本高 | 大规模结构化爬取 |
| Apify | 爬虫和自动化平台 | actor 生态、托管执行 | 成本和平台绑定 | 批量采集、现成 actor |

### Browser Automation

| 方案 | 本质 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| Playwright | 浏览器自动化 | 现代、稳定、支持多浏览器 | 慢、资源重、维护复杂 | 登录、点击、截图、动态页面 |
| Puppeteer | Chrome 自动化 | Chrome 生态成熟 | 浏览器资源成本 | Chrome 页面自动化 |
| Selenium | 老牌浏览器自动化 | 跨浏览器、企业测试生态 | API 和维护成本较高 | 企业测试体系、遗留系统 |

### Scraper

| 方案 | 本质 | 强项 | 代价 | 适合场景 |
| --- | --- | --- | --- | --- |
| BeautifulSoup | Python HTML 解析 | 简单、稳定 | 不执行 JS | 静态 HTML 抽取 |
| Cheerio | Node.js HTML 解析 | 类 jQuery，轻量 | 不执行 JS | Node 静态网页解析 |
| Scrapling | 抓取和解析工具 | 面向复杂抓取场景 | 需要按目标站点验证 | 结构化抽取、反爬复杂场景 |

## 按任务选层级

| 任务 | 优先工具 | 不要先做什么 |
| --- | --- | --- |
| 找最新资料或候选来源 | Search API | 不要直接 crawler 全网 |
| 读取一个公开网页正文 | Reader / Web Fetch | 不要开浏览器 |
| 把一个文档站建成资料库 | Crawler | 不要每次问答实时抓全站 |
| 抽取商品价格、列表、表格 | Scraper / Crawler | 不要让 LLM 直接猜字段 |
| 需要登录、点击、表单、截图 | Browser Automation | 不要用静态 fetch 硬抓 |
| 有官方 API | 官方 API | 不要抓网页 |

## Search API 什么时候用

Search API 负责找候选来源，不负责保证网页正文可读。适合最新信息、官方文档发现、研究型 Agent 的第一步、需要多来源交叉验证。Search API 的输出要保留 URL、标题、摘要、时间和来源。没有来源的搜索结果不能进入研究型 Agent 的结论。

## Reader 什么时候用

Reader 负责把一个 URL 转成模型可读的正文。适合已有候选 URL、读取官方文档页面、搜索后深读、生成摘要和引用、公开静态网页。不适合需要登录、复杂 JS 渲染、交互页面或批量遍历站点的场景。

## Crawler 什么时候用

Crawler 适合批量构建资料库，不适合每次问答临时跑。适合文档站索引、企业公开资料库、帮助中心和 FAQ、需要定期同步和增量更新。Crawler 输出应该进入 RAG 数据治理流程，而不是直接塞给 LLM。

## Browser Automation 什么时候用

浏览器自动化是最重的方案。只有需要真实交互时才用：登录后页面、点击/筛选/分页、表单填写、截图验证、动态页面必须执行 JS 才有内容。一句话：能不用浏览器，就别用浏览器。

## 搜索和 RAG 的边界

| 问题 | RAG | Search |
| --- | --- | --- |
| 数据是否私有 | 是 | 通常不是 |
| 是否需要权限过滤 | 强依赖 | 视场景而定 |
| 是否实时变化 | 不适合高频变化 | 适合 |
| 是否可治理 | 高 | 低到中 |
| 是否需要引用 | 必须 | 必须 |
| 是否适合离线评估 | 适合 | 较难，因为结果变化 |

## 冲突处理

搜索类 Agent 必须处理来源冲突：

| 冲突 | 处理 |
| --- | --- |
| 官方文档和博客不一致 | 官方优先，标注博客可能过期 |
| 不同发布时间结论不同 | 按时间排序，说明变化 |
| 多个媒体报道不一致 | 输出差异，不强行合并 |
| 搜索摘要和正文不一致 | 以正文为准 |
| 页面不可读 | 不引用不可验证来源 |

不要把多个来源平均成一个看似确定的答案。搜索的价值是提供证据，不是掩盖不确定性。

## 怎么选

```text
有官方 API？
  -> 官方 API 优先

要找来源？
  -> Search API

已有 URL，要读正文？
  -> Reader / Web Fetch

要建站点资料库？
  -> Crawler

要抽结构化字段？
  -> Scraper

要登录、点击、截图？
  -> Browser Automation

要研究型 Agent？
  -> Search API + Reader + 引用检查

要长期知识库？
  -> Crawler + Parser + RAG 数据治理
```

## 生产要求

生产系统要看：

- 是否能限制来源域名；
- 是否能拿到网页正文；
- 是否能输出稳定引用；
- 是否能控制时间范围；
- 是否能缓存结果；
- 是否有失败降级；
- 是否记录 query、来源、摘要和最终答案；
- 是否能处理来源冲突。

搜索解决实时性，但不自动解决可信度。可信度是系统设计问题，不是搜索 API 的赠品。

## POC 要测什么

搜索工具 POC 至少要测：能否找到官方来源、能否读取正文、能否过滤过期页面、能否保留引用、多来源冲突时是否说明差异、搜索失败时是否降级、是否能控制成本和延迟。只测"搜索结果看起来不错"不够。生产 Agent 要看证据链是否稳定。

## 典型误判

| 误判 | 问题 |
| --- | --- |
| Browser 最强，所以默认用 Browser | 慢、贵、脆弱，维护成本高 |
| Search API 返回摘要就能回答 | 摘要不是完整来源，关键事实要 Reader 深读 |
| Crawler 抓完就能问答 | 还需要 parser、chunk、metadata、版本和权限 |
| 官方 API 和网页抓取等价 | API 更稳定、更合规、更结构化 |
| 让 LLM 从 HTML 里猜字段 | 结构化抽取应该用 parser / scraper 明确规则 |
| 每次问答都实时抓全站 | 延迟和成本会失控 |

## 推荐策略

| 场景 | 推荐 |
| --- | --- |
| 实时问答 | Search API + Reader |
| 研究型 Agent | Search API + Reader + 多来源引用 |
| 文档站知识库 | Crawler + Parser + RAG pipeline |
| 商品/列表抽取 | Scraper / Crawler |
| 登录后操作 | Playwright / Puppeteer |
| 企业已有 API | 官方 API + Tool Calling |
| 强自建爬虫 | Scrapy / Crawl4AI / Playwright 组合 |
| MCP-first Agent | MCP 搜索工具 |

## 最终判断

```text
找来源：Search API
读正文：Reader
批量建库：Crawler
抽字段：Scraper
要交互：Browser
有 API：别抓网页
```

工具越重，越应该晚引入。先用最轻的工具解决真实问题。
