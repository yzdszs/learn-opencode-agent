import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const artifactDeliveryReviewCanvas: FlowCanvasConfig = {
  ariaLabel: '交付产物生成与复盘路径',
  accent: 'sky',
  motion: 'merge',
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
  summary: '展示完成工作后如何盘点交付物、整理可用产物、绑定验证证据、复盘未覆盖风险，并把用户真正需要的结果、路径和后续动作交付出去。',
  kind: 'artifact-delivery-review',
  steps: [
    {
      id: 'work-collected',
      title: 'Work Collected',
      description: '系统收集已经完成的文件、命令、浏览器状态和生成产物，先确认本轮真实交付对象，避免把过程日志当成交付成果。',
      activeNodes: ['work', 'artifact'],
      activePaths: ['work-artifact'],
      packet: { from: 'work', to: 'artifact', label: 'files' },
      traceEvents: [
        { id: 'work-inventoried', type: 'input', title: '盘点工作', detail: '收集变更文件、生成产物和关键执行记录，确认本轮真正完成了哪些内容。', status: 'done' },
        { id: 'deliverable-boundary-set', type: 'thinking', title: '界定交付边界', detail: '区分最终产物、辅助文件、验证输出和未触碰内容，避免答复扩大实际完成范围。', status: 'active' },
      ],
    },
    {
      id: 'artifact-shaped',
      title: 'Artifact Shaped',
      description: '产物被整理成用户可使用的形态：文件路径、页面地址、变更摘要和可操作入口被归拢，而不是只交出内部过程碎片。',
      activeNodes: ['artifact', 'evidence'],
      activePaths: ['artifact-evidence'],
      packet: { from: 'artifact', to: 'evidence', label: 'proof' },
      annotations: [
        { at: 'artifact', text: 'files + urls + notes', tone: 'info' },
      ],
      traceEvents: [
        { id: 'artifact-organized', type: 'thinking', title: '整理产物', detail: '把文件、页面或报告整理成清晰输出，并关联对应的验证证据。', status: 'done' },
        { id: 'handoff-shape-selected', type: 'thinking', title: '选择交付形态', detail: '根据用户需要决定给出路径、URL、截图说明、命令结果或简要摘要，减少无用细节。', status: 'active' },
      ],
    },
    {
      id: 'evidence-checked',
      title: 'Evidence Checked',
      description: '验证命令、截图、类型检查或人工检查结果被复核，确认哪些结论有证据支撑，哪些只是未验证的观察。',
      activeNodes: ['evidence', 'review'],
      activePaths: ['evidence-review'],
      packet: { from: 'evidence', to: 'review', label: 'check' },
      annotations: [
        { at: 'evidence', text: 'verified vs unverified', tone: 'success' },
      ],
      traceEvents: [
        { id: 'evidence-reviewed', type: 'observation', title: '核验证据', detail: '复核测试输出、构建日志和浏览器截图，区分已验证结论和仍需说明的风险。', status: 'done' },
        { id: 'skipped-checks-marked', type: 'observation', title: '标记跳过项', detail: '把未运行、无法运行或被外部噪声影响的检查单独列出，防止验证结论被过度包装。', status: 'active' },
      ],
    },
    {
      id: 'risk-reviewed',
      title: 'Risk Reviewed',
      description: '复盘阶段标出未覆盖检查、已知限制、兼容性影响和可能影响后续工作的事项，让交付不是只报喜。',
      activeNodes: ['review', 'summary'],
      activePaths: ['review-summary'],
      packet: { from: 'review', to: 'summary', label: 'risk' },
      traceEvents: [
        { id: 'risk-summarized', type: 'repair', title: '整理风险', detail: '记录未运行的检查、外部噪声和剩余不确定性，避免把部分验证说成完全验证。', status: 'done' },
        { id: 'impact-ranked', type: 'repair', title: '排序影响范围', detail: '按用户是否需要立即处理来排序风险，保留真正影响使用的事项，压低内部噪声。', status: 'active' },
      ],
    },
    {
      id: 'handoff-sent',
      title: 'Handoff Sent',
      description: '最终答复只保留用户需要的变更摘要、关键路径、验证结果、剩余风险和下一步建议，让用户可以直接接手或继续推进。',
      activeNodes: ['summary', 'handoff'],
      activePaths: ['summary-handoff'],
      packet: { from: 'summary', to: 'handoff', label: 'ship' },
      traceEvents: [
        { id: 'handoff-ready', type: 'output', title: '完成交付', detail: '输出变更摘要、验证证据和必要后续建议，让用户能直接接手成果。', status: 'done' },
        { id: 'next-action-clear', type: 'output', title: '明确下一步', detail: '如果仍有可选动作，说明优先级和触发条件，避免用开放式寒暄替代真实交付。', status: 'active' },
      ],
    },
  ],
}
