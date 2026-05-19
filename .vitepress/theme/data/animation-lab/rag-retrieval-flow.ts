import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const ragRetrievalFlowCanvas: FlowCanvasConfig = {
  ariaLabel: 'RAG 检索增强流程路径',
  accent: 'teal',
  motion: 'memory',
  nodes: [
    { id: 'question', label: 'Question', role: '问题', x: 18, y: 48, mobileX: 20, mobileY: 15 },
    { id: 'rewrite', label: 'Query Rewrite', role: '改写', x: 44, y: 26, mobileX: 50, mobileY: 25 },
    { id: 'retriever', label: 'Retriever', role: '检索器', x: 70, y: 18, mobileX: 78, mobileY: 35 },
    { id: 'reranker', label: 'Reranker', role: '重排', x: 78, y: 42, mobileX: 58, mobileY: 50 },
    { id: 'evidence', label: 'Evidence', role: '证据', x: 68, y: 70, mobileX: 28, mobileY: 65 },
    { id: 'answer', label: 'Answer', role: '答案', x: 42, y: 78, mobileX: 52, mobileY: 88 },
  ],
  paths: [
    { id: 'question-rewrite', from: 'question', to: 'rewrite', d: 'M180 269 C250 205 360 145 440 146' },
    { id: 'rewrite-retriever', from: 'rewrite', to: 'retriever', d: 'M450 142 C540 102 640 92 700 101' },
    { id: 'retriever-reranker', from: 'retriever', to: 'reranker', d: 'M705 110 C740 165 770 205 780 235' },
    { id: 'reranker-evidence', from: 'reranker', to: 'evidence', d: 'M775 244 C770 325 730 370 680 392' },
    { id: 'evidence-answer', from: 'evidence', to: 'answer', d: 'M670 398 C595 450 500 455 420 437' },
  ],
}

export const ragRetrievalFlowExperiment: Experiment = {
  id: 'rag-retrieval-flow',
  title: 'RAG 检索增强流程',
  summary: '展示问题如何经过意图抽取、查询改写、候选召回、重排过滤和引用生成，说明 RAG 如何用证据边界约束模型回答。',
  kind: 'rag-retrieval-flow',
  steps: [
    {
      id: 'question-intake',
      title: 'Question Intake',
      description: '用户问题进入系统后先被拆成目标实体、问题类型和证据缺口，明确哪些内容必须查知识库，哪些可以由上下文直接回答。',
      activeNodes: ['question', 'rewrite'],
      activePaths: ['question-rewrite'],
      packet: { from: 'question', to: 'rewrite', label: 'ask' },
      traceEvents: [
        { id: 'question-captured', type: 'input', title: '接收问题', detail: '接收原始问题，提取目标实体、时间范围和问题意图，避免把开放式提问直接丢给检索器。', status: 'done' },
        { id: 'evidence-gap-marked', type: 'thinking', title: '标记证据缺口', detail: '识别需要外部证据支撑的字段，例如事实依据、版本差异、来源出处或最近变更。', status: 'active' },
      ],
    },
    {
      id: 'query-rewrite',
      title: 'Query Rewrite',
      description: '系统把自然语言问题改写成更适合检索的查询，补充关键词、过滤条件和同义表达，降低召回噪声。',
      activeNodes: ['rewrite', 'retriever'],
      activePaths: ['rewrite-retriever'],
      packet: { from: 'rewrite', to: 'retriever', label: 'query' },
      traceEvents: [
        { id: 'query-rewritten', type: 'thinking', title: '改写查询', detail: '把原始问题改写为检索表达，拆出关键词、语义短语和过滤条件，提升召回命中率。', status: 'done' },
        { id: 'query-bounded', type: 'thinking', title: '限制检索范围', detail: '限定知识库、时间范围或文档类型，避免把相似但无关的材料混入候选集。', status: 'active' },
      ],
    },
    {
      id: 'retrieve-candidates',
      title: 'Retrieve Candidates',
      description: '检索器从知识库召回 TopK 候选片段，先保证覆盖面，再把命中文档、片段位置和初始分数交给重排层。',
      activeNodes: ['retriever', 'reranker'],
      activePaths: ['retriever-reranker'],
      packets: [
        { from: 'retriever', to: 'reranker', label: 'doc·1', kind: 'data', delay: 0, duration: 1300 },
        { from: 'retriever', to: 'reranker', label: 'doc·2', kind: 'data', delay: 160, duration: 1300 },
        { from: 'retriever', to: 'reranker', label: 'doc·3', kind: 'data', delay: 320, duration: 1300 },
      ],
      nodeBadges: { retriever: 'k=8', reranker: 'scoring' },
      nodeStates: { retriever: 'done', reranker: 'busy' },
      annotations: [
        { at: 'retriever', text: 'recall 8 / score>0.62', tone: 'info' },
      ],
      traceEvents: [
        { id: 'candidates-returned', type: 'observation', title: '召回候选', detail: '检索器返回命中文档、片段位置和初始相关度分数，保留足够候选给重排层判断。', status: 'done' },
        { id: 'recall-noise-kept', type: 'observation', title: '保留召回噪声', detail: '候选集允许包含弱相关片段，因为这一层优先保证不漏召，真正过滤交给后续重排。', status: 'active' },
      ],
    },
    {
      id: 'rerank-evidence',
      title: 'Rerank Evidence',
      description: '重排层按相关度、可信度和答案支撑度筛选证据，移除相似但不能回答问题的片段。',
      activeNodes: ['reranker', 'evidence'],
      activePaths: ['reranker-evidence'],
      packet: { from: 'reranker', to: 'evidence', label: 'top-3', kind: 'success' },
      nodeStates: { reranker: 'done', evidence: 'busy' },
      nodeBadges: { reranker: 'top=3', evidence: '3 chunks' },
      annotations: [
        { at: 'reranker', text: 'keep 3 / drop 5', tone: 'warn' },
      ],
      traceEvents: [
        { id: 'evidence-ranked', type: 'repair', title: '筛选证据', detail: '按相关度、来源可信度和问题覆盖度重排证据，保留能够直接支撑答案的片段。', status: 'done' },
        { id: 'weak-hits-dropped', type: 'repair', title: '丢弃弱命中', detail: '过滤只共享关键词但不回答问题的片段，缩短注入长度，降低模型被噪声带偏的概率。', status: 'active' },
      ],
    },
    {
      id: 'generate-with-citations',
      title: 'Generate With Citations',
      description: '模型只基于保留下来的证据生成答案，并保留引用来源；证据不足的部分必须标出边界，而不是补成看似完整的结论。',
      activeNodes: ['evidence', 'answer'],
      activePaths: ['evidence-answer'],
      packet: { from: 'evidence', to: 'answer', label: 'cite', kind: 'token' },
      nodeStates: { evidence: 'done', answer: 'done' },
      nodeBadges: { answer: '3 citations' },
      annotations: [
        { at: 'answer', text: 'cite / limit', tone: 'success' },
      ],
      traceEvents: [
        { id: 'answer-cited', type: 'output', title: '带引用生成', detail: '基于筛选证据生成答案，引用具体来源片段，让用户能追溯每个关键结论。', status: 'done' },
        { id: 'coverage-boundary', type: 'output', title: '声明覆盖边界', detail: '对知识库没有覆盖或证据不足的部分给出保守说明，避免模型凭内部记忆补全事实。', status: 'active' },
      ],
    },
  ],
}
