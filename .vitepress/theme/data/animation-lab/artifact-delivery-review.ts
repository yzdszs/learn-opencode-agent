import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const artifactDeliveryReviewCanvas: FlowCanvasConfig = {
  ariaLabel: '交付产物生成与复盘路径',
  accent: 'sky',
  motion: 'memory',
  nodes: [
    { id: 'work', label: 'Work Done', role: '工作结果', x: 18, y: 24, mobileX: 18, mobileY: 12 },
    { id: 'artifact', label: 'Artifact', role: '产物', x: 46, y: 18, mobileX: 50, mobileY: 20 },
    { id: 'evidence', label: 'Evidence', role: '证据', x: 74, y: 34, mobileX: 78, mobileY: 40 },
    { id: 'review', label: 'Review', role: '复盘', x: 82, y: 72, mobileX: 72, mobileY: 64 },
    { id: 'summary', label: 'Summary', role: '摘要', x: 52, y: 82, mobileX: 42, mobileY: 78 },
    { id: 'handoff', label: 'Handoff', role: '交付', x: 22, y: 62, mobileX: 18, mobileY: 92 },
  ],
  paths: [
    { id: 'work-artifact', from: 'work', to: 'artifact', d: 'M180 134 C270 86 380 78 460 101' },
    { id: 'artifact-evidence', from: 'artifact', to: 'evidence', d: 'M460 101 C570 112 680 160 740 190' },
    { id: 'evidence-review', from: 'evidence', to: 'review', d: 'M740 190 C825 280 850 370 820 403' },
    { id: 'review-summary', from: 'review', to: 'summary', d: 'M820 403 C705 468 610 480 520 459' },
    { id: 'summary-handoff', from: 'summary', to: 'handoff', d: 'M520 459 C400 430 285 372 220 347' },
    { id: 'handoff-work', from: 'handoff', to: 'work', d: 'M220 347 C150 285 125 205 180 134' },
  ],
}

export const artifactDeliveryReviewExperiment: Experiment = {
  id: 'artifact-delivery-review',
  title: '交付产物生成与复盘',
  summary: '展示完成工作后如何整理产物、验证证据、复盘风险，并把用户真正需要的信息交付出去。',
  kind: 'artifact-delivery-review',
  steps: [
    {
      id: 'work-collected',
      title: 'Work Collected',
      description: '系统收集已经完成的文件、命令和浏览器状态，确认交付对象是什么。',
      activeNodes: ['work', 'artifact'],
      activePaths: ['work-artifact'],
      packet: { from: 'work', to: 'artifact', label: 'files' },
      traceEvents: [
        { id: 'work-inventoried', type: 'input', title: '盘点工作', detail: '收集变更文件、生成产物和关键执行记录，确认本轮真正完成了哪些内容。', status: 'active' },
      ],
    },
    {
      id: 'artifact-shaped',
      title: 'Artifact Shaped',
      description: '产物被整理成用户可使用的形态，避免只交出内部过程碎片。',
      activeNodes: ['artifact', 'evidence'],
      activePaths: ['artifact-evidence'],
      packet: { from: 'artifact', to: 'evidence', label: 'proof' },
      traceEvents: [
        { id: 'artifact-organized', type: 'thinking', title: '整理产物', detail: '把文件、页面或报告整理成清晰输出，并关联对应的验证证据。', status: 'active' },
      ],
    },
    {
      id: 'evidence-checked',
      title: 'Evidence Checked',
      description: '验证命令、截图或人工检查结果被复核，确认哪些结论有证据支撑。',
      activeNodes: ['evidence', 'review'],
      activePaths: ['evidence-review'],
      packet: { from: 'evidence', to: 'review', label: 'check' },
      traceEvents: [
        { id: 'evidence-reviewed', type: 'observation', title: '核验证据', detail: '复核测试输出、构建日志和浏览器截图，区分已验证结论和仍需说明的风险。', status: 'active' },
      ],
    },
    {
      id: 'risk-reviewed',
      title: 'Risk Reviewed',
      description: '复盘阶段标出未覆盖检查、已知限制和可能影响后续工作的事项。',
      activeNodes: ['review', 'summary'],
      activePaths: ['review-summary'],
      packet: { from: 'review', to: 'summary', label: 'risk' },
      traceEvents: [
        { id: 'risk-summarized', type: 'repair', title: '整理风险', detail: '记录未运行的检查、外部噪声和剩余不确定性，避免把部分验证说成完全验证。', status: 'active' },
      ],
    },
    {
      id: 'handoff-sent',
      title: 'Handoff Sent',
      description: '最终答复只保留用户需要的变更摘要、验证结果和下一步建议。',
      activeNodes: ['summary', 'handoff'],
      activePaths: ['summary-handoff'],
      packet: { from: 'summary', to: 'handoff', label: 'ship' },
      traceEvents: [
        { id: 'handoff-ready', type: 'output', title: '完成交付', detail: '输出变更摘要、验证证据和必要后续建议，让用户能直接接手成果。', status: 'active' },
      ],
    },
  ],
}
