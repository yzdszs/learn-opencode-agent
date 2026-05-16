import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const ragRetrievalFlowCanvas: FlowCanvasConfig = {
  ariaLabel: 'RAG 检索增强流程路径',
  accent: 'teal',
  motion: 'memory',
  nodes: [
    { id: 'question', label: 'Question', role: '问题', x: 12, y: 48, mobileX: 20, mobileY: 18 },
    { id: 'rewrite', label: 'Query Rewrite', role: '改写', x: 34, y: 28, mobileX: 56, mobileY: 20 },
    { id: 'retriever', label: 'Retriever', role: '检索器', x: 58, y: 28, mobileX: 82, mobileY: 40 },
    { id: 'reranker', label: 'Reranker', role: '重排', x: 76, y: 58, mobileX: 62, mobileY: 62 },
    { id: 'evidence', label: 'Evidence', role: '证据', x: 48, y: 76, mobileX: 28, mobileY: 64 },
    { id: 'answer', label: 'Answer', role: '答案', x: 88, y: 40, mobileX: 50, mobileY: 86 },
  ],
  paths: [
    { id: 'question-rewrite', from: 'question', to: 'rewrite', d: 'M120 270 C190 205 265 160 340 155' },
    { id: 'rewrite-retriever', from: 'rewrite', to: 'retriever', d: 'M350 155 C425 120 520 120 580 155' },
    { id: 'retriever-reranker', from: 'retriever', to: 'reranker', d: 'M590 165 C680 230 735 300 760 325' },
    { id: 'reranker-evidence', from: 'reranker', to: 'evidence', d: 'M750 340 C650 430 555 445 480 425' },
    { id: 'evidence-answer', from: 'evidence', to: 'answer', d: 'M490 420 C630 455 785 340 880 225' },
  ],
}

export const ragRetrievalFlowExperiment: Experiment = {
  id: 'rag-retrieval-flow',
  title: 'RAG 检索增强流程',
  summary: '展示问题如何经过改写、检索、重排、证据注入和带引用生成，避免模型只凭记忆回答。',
  kind: 'rag-retrieval-flow',
  steps: [
    {
      id: 'question-intake',
      title: 'Question Intake',
      description: '用户问题进入系统，先提取检索意图和需要补齐的信息缺口。',
      activeNodes: ['question', 'rewrite'],
      activePaths: ['question-rewrite'],
      packet: { from: 'question', to: 'rewrite', label: 'ask' },
      traceEvents: [
        { id: 'question-captured', type: 'input', title: '接收问题', detail: '系统记录原始问题、目标实体和缺失证据类型。', status: 'active' },
      ],
    },
    {
      id: 'query-rewrite',
      title: 'Query Rewrite',
      description: '系统把自然语言问题改写成更适合检索的查询，降低召回噪声。',
      activeNodes: ['rewrite', 'retriever'],
      activePaths: ['rewrite-retriever'],
      packet: { from: 'rewrite', to: 'retriever', label: 'query' },
      traceEvents: [
        { id: 'query-rewritten', type: 'thinking', title: '改写查询', detail: '系统记录关键词、过滤条件和检索范围。', status: 'active' },
      ],
    },
    {
      id: 'retrieve-candidates',
      title: 'Retrieve Candidates',
      description: '检索器从知识库召回候选片段，先扩大覆盖面，再交给重排层筛选。',
      activeNodes: ['retriever', 'reranker'],
      activePaths: ['retriever-reranker'],
      packet: { from: 'retriever', to: 'reranker', label: 'docs' },
      traceEvents: [
        { id: 'candidates-returned', type: 'observation', title: '召回候选', detail: '系统记录命中文档、片段数量和初始相关度。', status: 'active' },
      ],
    },
    {
      id: 'rerank-evidence',
      title: 'Rerank Evidence',
      description: '重排层按相关度和可信度筛选证据，只把可支撑答案的片段留下。',
      activeNodes: ['reranker', 'evidence'],
      activePaths: ['reranker-evidence'],
      packet: { from: 'reranker', to: 'evidence', label: 'top' },
      traceEvents: [
        { id: 'evidence-ranked', type: 'repair', title: '筛选证据', detail: '系统记录保留片段、排序依据和被丢弃的低质命中。', status: 'active' },
      ],
    },
    {
      id: 'generate-with-citations',
      title: 'Generate With Citations',
      description: '模型基于证据生成答案，并保留引用来源，避免只凭内部记忆回答。',
      activeNodes: ['evidence', 'answer'],
      activePaths: ['evidence-answer'],
      packet: { from: 'evidence', to: 'answer', label: 'cite' },
      traceEvents: [
        { id: 'answer-cited', type: 'output', title: '带引用生成', detail: '系统记录答案、引用来源和未被证据覆盖的边界。', status: 'active' },
      ],
    },
  ],
}
