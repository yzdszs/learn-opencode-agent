import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const agentCollaborationMergeCanvas: FlowCanvasConfig = {
  ariaLabel: '子 Agent 协作与结果合并路径',
  accent: 'rose',
  motion: 'merge',
  nodes: [
    { id: 'lead', label: 'Lead Agent', role: '主控', x: 18, y: 50, mobileX: 18, mobileY: 18 },
    { id: 'brief', label: 'Brief', role: '任务简报', x: 34, y: 20, mobileX: 52, mobileY: 18 },
    { id: 'workerA', label: 'Worker A', role: '实现', x: 60, y: 18, mobileX: 78, mobileY: 34 },
    { id: 'workerB', label: 'Worker B', role: '验证', x: 62, y: 78, mobileX: 72, mobileY: 58 },
    { id: 'merge', label: 'Merge Board', role: '合并', x: 84, y: 50, mobileX: 46, mobileY: 76 },
    { id: 'answer', label: 'Final Reply', role: '答复', x: 42, y: 58, mobileX: 18, mobileY: 90 },
  ],
  paths: [
    { id: 'lead-brief', from: 'lead', to: 'brief', d: 'M180 280 C210 185 270 125 340 112' },
    { id: 'brief-workerA', from: 'brief', to: 'workerA', d: 'M340 112 C430 85 530 85 600 101' },
    { id: 'brief-workerB', from: 'brief', to: 'workerB', d: 'M340 112 C470 250 560 360 620 437' },
    { id: 'workerA-merge', from: 'workerA', to: 'merge', d: 'M600 101 C720 130 815 205 840 280' },
    { id: 'workerB-merge', from: 'workerB', to: 'merge', d: 'M620 437 C735 420 815 355 840 280' },
    { id: 'merge-answer', from: 'merge', to: 'answer', d: 'M840 280 C710 345 555 360 420 325' },
  ],
}

export const agentCollaborationMergeExperiment: Experiment = {
  id: 'agent-collaboration-merge',
  title: '子 Agent 协作与结果合并',
  summary: '展示主 Agent 如何把并行子 Agent 产物收回、去重、处理冲突、补齐证据，并合并成一份口径一致的最终答复。',
  kind: 'agent-collaboration-merge',
  steps: [
    {
      id: 'brief-created',
      title: 'Brief Created',
      description: '主 Agent 把当前目标压缩成任务简报，明确每个子任务的输入、输出、禁止事项和验收口径。',
      activeNodes: ['lead', 'brief'],
      activePaths: ['lead-brief'],
      packet: { from: 'lead', to: 'brief', label: 'brief' },
      traceEvents: [
        { id: 'brief-written', type: 'thinking', title: '生成简报', detail: '提炼任务目标、输入材料、禁止事项和预期输出，准备分发给子 Agent。', status: 'done' },
        { id: 'merge-contract-set', type: 'thinking', title: '设定合并契约', detail: '提前约定子 Agent 必须返回结论、证据、风险和改动范围，方便后续统一口径。', status: 'active' },
      ],
    },
    {
      id: 'workers-dispatched',
      title: 'Workers Dispatched',
      description: '实现与验证两类子任务并行派发给 Worker A 和 Worker B，两条链路同时推进但不能互相覆盖对方的工作。',
      activeNodes: ['brief', 'workerA', 'workerB'],
      activePaths: ['brief-workerA', 'brief-workerB'],
      packets: [
        { from: 'brief', to: 'workerA', label: 'impl', kind: 'data', delay: 0 },
        { from: 'brief', to: 'workerB', label: 'verify', kind: 'control', delay: 180 },
      ],
      nodeBadges: { workerA: 'busy', workerB: 'busy' },
      nodeStates: { workerA: 'busy', workerB: 'busy' },
      annotations: [
        { at: 'brief', text: 'fan-out × 2', tone: 'info' },
      ],
      traceEvents: [
        { id: 'workers-started', type: 'tool-call', title: '并行派发', detail: '同时把实现任务交给 Worker A、验证任务交给 Worker B，开启互不阻塞的双链路。', status: 'done' },
        { id: 'write-sets-separated', type: 'thinking', title: '隔离写入范围', detail: '明确每个 Worker 的负责文件或问题域，降低并行工作互相覆盖的风险。', status: 'active' },
      ],
    },
    {
      id: 'worker-results',
      title: 'Worker Results',
      description: 'Worker A 提交变更摘要，Worker B 返回验证结果和风险列表，所有结果先进入合并板而不是直接交付。',
      activeNodes: ['workerA', 'workerB'],
      activePaths: [],
      nodeStates: { workerA: 'done', workerB: 'done' },
      nodeBadges: { workerA: 'diff +42 / -8', workerB: '3 risks' },
      annotations: [
        { at: 'workerB', text: 'risk: race', tone: 'warn' },
      ],
      traceEvents: [
        { id: 'workers-finished', type: 'observation', title: '子 Agent 结果回收', detail: '收齐两个子 Agent 的产物：实现侧的变更摘要 + 验证侧的风险列表，等待去重与冲突消解。', status: 'done' },
        { id: 'evidence-readiness', type: 'observation', title: '检查证据完整性', detail: '标记哪些结论有命令、截图或代码证据支撑，哪些只是建议或未验证风险。', status: 'active' },
      ],
    },
    {
      id: 'results-merged',
      title: 'Results Merged',
      description: '两个子 Agent 的结果汇入合并板，主 Agent 按证据优先级处理冲突、重复和缺失验证。',
      activeNodes: ['workerA', 'workerB', 'merge'],
      activePaths: ['workerA-merge', 'workerB-merge'],
      packets: [
        { from: 'workerA', to: 'merge', label: 'diff', kind: 'data', delay: 0 },
        { from: 'workerB', to: 'merge', label: 'risks', kind: 'control', delay: 200 },
      ],
      nodeStates: { merge: 'busy' },
      nodeBadges: { merge: 'fan-in × 2' },
      traceEvents: [
        { id: 'merge-reviewed', type: 'observation', title: '合并结果', detail: '读取子 Agent 产物，处理重复结论、冲突建议和缺失证据，保留可执行部分。', status: 'done' },
        { id: 'conflict-policy-applied', type: 'repair', title: '应用冲突策略', detail: '事实冲突优先看证据，建议冲突保留风险说明，缺失验证必须显式标注。', status: 'active' },
      ],
    },
    {
      id: 'final-composed',
      title: 'Final Composed',
      description: '主 Agent 把合并后的事实、改动、风险和验证状态组织成用户可读答复，隐藏内部噪声但保留关键证据。',
      activeNodes: ['merge', 'answer'],
      activePaths: ['merge-answer'],
      packet: { from: 'merge', to: 'answer', label: 'final' },
      traceEvents: [
        { id: 'answer-ready', type: 'output', title: '形成答复', detail: '把合并后的事实、改动和验证结果整理成最终回复，避免暴露内部噪声。', status: 'done' },
        { id: 'residual-risk-stated', type: 'output', title: '说明剩余风险', detail: '把未验证项、冲突处理结果和下一步建议写入答复，让用户知道哪些结论最可靠。', status: 'active' },
      ],
    },
  ],
}
