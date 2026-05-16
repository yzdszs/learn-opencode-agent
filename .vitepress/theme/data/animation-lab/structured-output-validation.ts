import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const structuredOutputValidationCanvas: FlowCanvasConfig = {
  ariaLabel: '结构化输出与校验修复路径',
  accent: 'teal',
  motion: 'compact',
  nodes: [
    { id: 'prompt', label: 'Prompt', role: '约束输入', x: 12, y: 48, mobileX: 20, mobileY: 18 },
    { id: 'draft', label: 'Model Output', role: '初稿', x: 34, y: 28, mobileX: 56, mobileY: 20 },
    { id: 'schema', label: 'Schema', role: '结构', x: 58, y: 28, mobileX: 82, mobileY: 40 },
    { id: 'validator', label: 'Validator', role: '校验器', x: 76, y: 58, mobileX: 62, mobileY: 62 },
    { id: 'repair', label: 'Repair', role: '修复', x: 48, y: 76, mobileX: 28, mobileY: 64 },
    { id: 'typed', label: 'Typed Result', role: '可用结果', x: 88, y: 40, mobileX: 50, mobileY: 86 },
  ],
  paths: [
    { id: 'prompt-draft', from: 'prompt', to: 'draft', d: 'M120 270 C190 205 265 160 340 155' },
    { id: 'draft-schema', from: 'draft', to: 'schema', d: 'M350 155 C425 120 520 120 580 155' },
    { id: 'schema-validator', from: 'schema', to: 'validator', d: 'M590 165 C680 230 735 300 760 325' },
    { id: 'validator-repair', from: 'validator', to: 'repair', d: 'M750 340 C650 430 555 445 480 425' },
    { id: 'repair-typed', from: 'repair', to: 'typed', d: 'M490 420 C630 455 785 340 880 225' },
  ],
}

export const structuredOutputValidationExperiment: Experiment = {
  id: 'structured-output-validation',
  title: '结构化输出与校验修复',
  summary: '展示模型输出如何经过 Schema 校验、错误定位和局部修复，最终得到可被程序消费的数据。',
  kind: 'structured-output-validation',
  steps: [
    {
      id: 'schema-prompt',
      title: 'Schema Prompt',
      description: '系统把字段要求、类型和约束写入模型输入，让输出目标先被结构化。',
      activeNodes: ['prompt', 'draft'],
      activePaths: ['prompt-draft'],
      packet: { from: 'prompt', to: 'draft', label: 'rules' },
      traceEvents: [
        { id: 'schema-injected', type: 'input', title: '注入结构约束', detail: '系统记录必填字段、类型要求和非法值边界。', status: 'active' },
      ],
    },
    {
      id: 'draft-output',
      title: 'Draft Output',
      description: '模型生成初版结构化结果，但这只是候选数据，仍需要程序校验。',
      activeNodes: ['draft', 'schema'],
      activePaths: ['draft-schema'],
      packet: { from: 'draft', to: 'schema', label: 'json' },
      traceEvents: [
        { id: 'draft-created', type: 'thinking', title: '生成初稿', detail: '系统记录模型返回的字段、缺失项和原始 JSON 文本。', status: 'active' },
      ],
    },
    {
      id: 'validate-schema',
      title: 'Validate Schema',
      description: '校验器检查缺字段、类型错误和非法枚举，明确指出哪些字段不可用。',
      activeNodes: ['schema', 'validator'],
      activePaths: ['schema-validator'],
      packet: { from: 'schema', to: 'validator', label: 'check' },
      traceEvents: [
        { id: 'schema-invalid', type: 'observation', title: '校验失败', detail: '系统记录错误路径、期望类型和实际输出值。', status: 'active' },
      ],
    },
    {
      id: 'repair-fields',
      title: 'Repair Fields',
      description: '系统把错误反馈给模型，只修复不合格字段，避免重写已经合格的数据。',
      activeNodes: ['validator', 'repair'],
      activePaths: ['validator-repair'],
      packet: { from: 'validator', to: 'repair', label: 'fix' },
      traceEvents: [
        { id: 'fields-repaired', type: 'repair', title: '局部修复', detail: '系统记录待修字段、修复提示和保留不变的字段。', status: 'active' },
      ],
    },
    {
      id: 'typed-result',
      title: 'Typed Result',
      description: '通过校验的数据进入后续程序逻辑，成为可安全消费的 Typed Result。',
      activeNodes: ['repair', 'typed'],
      activePaths: ['repair-typed'],
      packet: { from: 'repair', to: 'typed', label: 'ok' },
      traceEvents: [
        { id: 'typed-ready', type: 'output', title: '输出可用数据', detail: '系统记录最终结构、校验通过状态和下游消费入口。', status: 'active' },
      ],
    },
  ],
}
