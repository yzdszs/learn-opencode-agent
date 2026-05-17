import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const promptAssemblyPipelineCanvas: FlowCanvasConfig = {
  ariaLabel: 'Prompt 组装流水线路径',
  accent: 'sky',
  motion: 'compact',
  nodes: [
    { id: 'instruction', label: 'Instruction', role: '指令', x: 16, y: 20, mobileX: 18, mobileY: 12 },
    { id: 'context', label: 'Context', role: '上下文', x: 38, y: 36, mobileX: 48, mobileY: 24 },
    { id: 'memory', label: 'Memory', role: '记忆', x: 22, y: 72, mobileX: 78, mobileY: 38 },
    { id: 'evidence', label: 'Evidence', role: '证据', x: 62, y: 68, mobileX: 72, mobileY: 62 },
    { id: 'builder', label: 'Prompt Builder', role: '组装器', x: 76, y: 36, mobileX: 42, mobileY: 74 },
    { id: 'model', label: 'Model Input', role: '模型输入', x: 88, y: 76, mobileX: 18, mobileY: 90 },
  ],
  paths: [
    { id: 'instruction-context', from: 'instruction', to: 'context', d: 'M160 112 C230 132 320 176 380 202' },
    { id: 'context-builder', from: 'context', to: 'builder', d: 'M380 202 C500 190 650 186 760 202' },
    { id: 'memory-builder', from: 'memory', to: 'builder', d: 'M220 403 C400 410 610 322 760 202' },
    { id: 'evidence-builder', from: 'evidence', to: 'builder', d: 'M620 381 C690 330 742 260 760 202' },
    { id: 'builder-model', from: 'builder', to: 'model', d: 'M760 202 C820 314 860 392 880 426' },
  ],
}

export const promptAssemblyPipelineExperiment: Experiment = {
  id: 'prompt-assembly-pipeline',
  title: 'Prompt 组装流水线',
  summary: '展示系统指令、当前上下文、长期记忆和检索证据如何被筛选、排序并组装成模型输入。',
  kind: 'prompt-assembly-pipeline',
  steps: [
    {
      id: 'instruction-loaded',
      title: 'Instruction Loaded',
      description: '系统指令先确定角色、边界和输出要求，成为后续组装的稳定骨架。',
      activeNodes: ['instruction', 'context'],
      activePaths: ['instruction-context'],
      packet: { from: 'instruction', to: 'context', label: 'rule' },
      traceEvents: [
        { id: 'rules-loaded', type: 'input', title: '加载指令', detail: '读取系统指令、开发者约束和输出格式要求，形成 Prompt 的优先级骨架。', status: 'active' },
      ],
    },
    {
      id: 'context-selected',
      title: 'Context Selected',
      description: '当前对话和工具结果被筛选，只保留仍然影响本轮决策的信息。',
      activeNodes: ['context', 'builder'],
      activePaths: ['context-builder'],
      packet: { from: 'context', to: 'builder', label: 'ctx' },
      traceEvents: [
        { id: 'context-filtered', type: 'thinking', title: '筛选上下文', detail: '过滤过期消息和噪声工具输出，保留目标、约束、已完成事项和当前阻塞点。', status: 'active' },
      ],
    },
    {
      id: 'memory-injected',
      title: 'Memory Injected',
      description: '长期偏好和项目经验被提取出来，只注入与当前任务相关的片段。',
      activeNodes: ['memory', 'builder'],
      activePaths: ['memory-builder'],
      packet: { from: 'memory', to: 'builder', label: 'mem' },
      traceEvents: [
        { id: 'memory-ranked', type: 'observation', title: '注入记忆', detail: '按任务相关性挑选项目偏好和历史决策，避免把无关旧信息塞进模型输入。', status: 'active' },
      ],
    },
    {
      id: 'evidence-attached',
      title: 'Evidence Attached',
      description: '检索证据被放到明确位置，让模型知道哪些事实来自当前环境。',
      activeNodes: ['evidence', 'builder'],
      activePaths: ['evidence-builder'],
      packet: { from: 'evidence', to: 'builder', label: 'cite' },
      traceEvents: [
        { id: 'evidence-bound', type: 'observation', title: '绑定证据', detail: '把文件片段、命令输出或检索结果附到 Prompt 中，保留来源和约束边界。', status: 'active' },
      ],
    },
    {
      id: 'prompt-emitted',
      title: 'Prompt Emitted',
      description: '组装器输出最终模型输入，既压缩噪声，也保留完成任务所需的证据链。',
      activeNodes: ['builder', 'model'],
      activePaths: ['builder-model'],
      packet: { from: 'builder', to: 'model', label: 'prompt' },
      traceEvents: [
        { id: 'prompt-ready', type: 'output', title: '生成输入', detail: '按优先级组装最终 Prompt，输出给模型前确认格式、上下文和证据完整。', status: 'active' },
      ],
    },
  ],
}
