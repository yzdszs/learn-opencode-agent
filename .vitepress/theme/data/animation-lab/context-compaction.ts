import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const contextCompactionCanvas: FlowCanvasConfig = {
  ariaLabel: '上下文压缩与摘要生成路径',
  accent: 'teal',
  motion: 'compact',
  nodes: [
    { id: 'window', label: 'Context Window', role: '上下文窗口', x: 15, y: 15, mobileX: 22, mobileY: 18 },
    { id: 'meter', label: 'Token Meter', role: '容量检测', x: 85, y: 15, mobileX: 58, mobileY: 22 },
    { id: 'pruner', label: 'Pruner', role: '裁剪', x: 85, y: 85, mobileX: 82, mobileY: 42 },
    { id: 'summarizer', label: 'Summarizer', role: '摘要器', x: 15, y: 85, mobileX: 58, mobileY: 66 },
    { id: 'prompt', label: 'Next Prompt', role: '重建输入', x: 50, y: 50, mobileX: 28, mobileY: 84 },
  ],
  paths: [
    { id: 'window-meter', from: 'window', to: 'meter', d: 'M150 84 L850 84' },
    { id: 'meter-pruner', from: 'meter', to: 'pruner', d: 'M850 84 L850 476' },
    { id: 'pruner-summarizer', from: 'pruner', to: 'summarizer', d: 'M850 476 L150 476' },
    { id: 'summarizer-prompt', from: 'summarizer', to: 'prompt', d: 'M150 476 C150 476 150 280 500 280' },
    { id: 'prompt-window', from: 'prompt', to: 'window', d: 'M500 280 C500 280 150 280 150 84' },
  ],
}

export const contextCompactionExperiment: Experiment = {
  id: 'context-compaction',
  title: '上下文压缩与摘要生成',
  summary: '观察上下文逼近窗口上限后，系统如何识别高占用来源、裁剪噪声、保留关键事实并重建下一轮 Prompt。',
  kind: 'context-compaction',
  steps: [
    {
      id: 'window-growth',
      title: 'Window Growth',
      description: '多轮消息和工具输出持续进入窗口，Token 使用率逼近上限，系统开始关注容量、噪声和任务漂移风险。',
      activeNodes: ['window', 'meter'],
      activePaths: ['window-meter'],
      packet: { from: 'window', to: 'meter', label: 'usage' },
      traceEvents: [
        { id: 'usage-counted', type: 'input', title: '统计窗口容量', detail: '统计消息、工具结果和约束各自的 Token 占用，评估当前窗口压力。', status: 'done' },
        { id: 'hotspots-found', type: 'observation', title: '定位高占用来源', detail: '识别长工具输出、重复对话和过期上下文，作为后续裁剪优先级依据。', status: 'active' },
      ],
    },
    {
      id: 'overflow-check',
      title: 'Overflow Check',
      description: '容量检测发现即将溢出，压缩流程被显式触发，避免下一次模型调用超出窗口或丢失关键约束。',
      activeNodes: ['meter', 'pruner'],
      activePaths: ['meter-pruner'],
      packet: { from: 'meter', to: 'pruner', label: 'limit' },
      traceEvents: [
        { id: 'overflow-detected', type: 'thinking', title: '触发压缩', detail: '推断触发压缩的阈值条件，定位高风险来源，标记需要优先裁剪的内容块。', status: 'done' },
        { id: 'must-keep-marked', type: 'thinking', title: '标记不可丢信息', detail: '把用户目标、开发约束、关键决策、风险和未完成项标记为 must keep，防止摘要丢核心状态。', status: 'active' },
      ],
    },
    {
      id: 'prune-tool-output',
      title: 'Prune Tool Output',
      description: '长工具输出被折叠，只保留错误、路径、结论和后续需要的证据，降低噪声占用但不丢复盘线索。',
      activeNodes: ['pruner', 'summarizer'],
      activePaths: ['pruner-summarizer'],
      packet: { from: 'pruner', to: 'summarizer', label: 'facts' },
      traceEvents: [
        { id: 'tool-output-pruned', type: 'repair', title: '裁剪工具输出', detail: '按裁剪规则折叠冗余工具输出，保留错误、路径和结论片段，替换大段无效内容。', status: 'done' },
        { id: 'evidence-preserved', type: 'repair', title: '保留证据锚点', detail: '即使删除大段输出，也保留命令、文件路径、错误摘要和可复查位置。', status: 'active' },
      ],
    },
    {
      id: 'summary-built',
      title: 'Summary Built',
      description: '摘要器把保留事实压成可继续推理的状态快照，让任务连续性不依赖完整历史，但仍保留决策链。',
      activeNodes: ['summarizer', 'prompt'],
      activePaths: ['summarizer-prompt'],
      packet: { from: 'summarizer', to: 'prompt', label: 'summary' },
      traceEvents: [
        { id: 'summary-created', type: 'observation', title: '生成摘要', detail: '压缩后的状态快照包含目标、决策、风险和证据，作为下一轮推理的记忆替代。', status: 'done' },
        { id: 'summary-quality-checked', type: 'thinking', title: '检查摘要质量', detail: '确认摘要没有把不确定信息写成事实，也没有丢失用户最新指令和未完成任务。', status: 'active' },
      ],
    },
    {
      id: 'prompt-rebuilt',
      title: 'Prompt Rebuilt',
      description: '新 Prompt 用摘要替换冗长历史，让下一轮模型调用回到可控窗口，同时保持目标、约束和证据连续。',
      activeNodes: ['prompt', 'window'],
      activePaths: ['prompt-window'],
      packet: { from: 'prompt', to: 'window', label: 'ctx' },
      traceEvents: [
        { id: 'context-restored', type: 'output', title: '重建上下文', detail: '摘要替换冗长历史后窗口空间释放，输出新的上下文入口供下一次模型调用使用。', status: 'done' },
        { id: 'continuity-protected', type: 'output', title: '保护任务连续性', detail: '新 Prompt 仍保留目标、已做决策、剩余风险和下一步入口，降低压缩导致的任务漂移。', status: 'active' },
      ],
    },
  ],
}
