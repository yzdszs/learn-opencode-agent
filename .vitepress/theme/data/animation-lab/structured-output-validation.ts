import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const structuredOutputValidationCanvas: FlowCanvasConfig = {
  ariaLabel: '结构化输出与校验修复路径',
  accent: 'teal',
  motion: 'validate',
  nodes: [
    { id: 'prompt', label: 'Prompt', role: '约束输入', x: 15, y: 20, mobileX: 20, mobileY: 12 },
    { id: 'draft', label: 'Model Output', role: '初稿', x: 45, y: 20, mobileX: 50, mobileY: 20 },
    { id: 'schema', label: 'Schema', role: '结构', x: 75, y: 20, mobileX: 80, mobileY: 30 },
    { id: 'validator', label: 'Validator', role: '校验器', x: 75, y: 55, mobileX: 65, mobileY: 50 },
    { id: 'repair', label: 'Repair', role: '修复', x: 45, y: 55, mobileX: 30, mobileY: 60 },
    { id: 'typed', label: 'Typed Result', role: '可用结果', x: 75, y: 85, mobileX: 50, mobileY: 88 },
  ],
  paths: [
    { id: 'prompt-draft', from: 'prompt', to: 'draft', d: 'M150 112 L450 112' },
    { id: 'draft-schema', from: 'draft', to: 'schema', d: 'M450 112 L750 112' },
    { id: 'schema-validator', from: 'schema', to: 'validator', d: 'M750 112 L750 308' },
    { id: 'validator-repair', from: 'validator', to: 'repair', d: 'M750 308 L450 308' },
    { id: 'repair-typed', from: 'repair', to: 'typed', d: 'M450 308 C500 320 700 400 750 476' },
  ],
}

export const structuredOutputValidationExperiment: Experiment = {
  id: 'structured-output-validation',
  title: '结构化输出与校验修复',
  summary: '展示模型输出如何经过 Schema 约束、错误路径定位、局部修复和二次校验，最终变成可被程序安全消费的数据。',
  kind: 'structured-output-validation',
  steps: [
    {
      id: 'schema-prompt',
      title: 'Schema Prompt',
      description: '系统把字段要求、类型、枚举范围和必填约束写入模型输入，让模型在生成前知道程序真正需要的数据形状。',
      activeNodes: ['prompt', 'draft'],
      activePaths: ['prompt-draft'],
      packet: { from: 'prompt', to: 'draft', label: 'rules' },
      traceEvents: [
        { id: 'schema-injected', type: 'input', title: '注入结构约束', detail: '将必填字段、类型要求、枚举值和非法值边界注入 Prompt，让模型先围绕数据契约生成。', status: 'done' },
        { id: 'consumer-defined', type: 'thinking', title: '绑定消费方契约', detail: '明确下游程序期待的是可解析对象，而不是看起来像 JSON 的自然语言片段。', status: 'active' },
      ],
    },
    {
      id: 'draft-output',
      title: 'Draft Output',
      description: '模型生成初版结构化结果，但它仍是候选数据；即使语法像 JSON，也必须经过程序校验才能进入业务逻辑。',
      activeNodes: ['draft', 'schema'],
      activePaths: ['draft-schema'],
      packet: { from: 'draft', to: 'schema', label: 'json' },
      traceEvents: [
        { id: 'draft-created', type: 'thinking', title: '生成初稿', detail: '生成初版 JSON，保留字段、嵌套结构和候选值，暂不假设它已经满足 Schema。', status: 'done' },
        { id: 'draft-is-candidate', type: 'thinking', title: '标记候选状态', detail: '把初稿标记为 candidate，禁止下游直接消费，等待校验器返回可验证结论。', status: 'active' },
      ],
    },
    {
      id: 'validate-schema',
      title: 'Validate Schema',
      description: '校验器检查缺字段、类型错误、非法枚举和嵌套路径错误，明确指出哪些字段不可用以及为什么不可用。',
      activeNodes: ['schema', 'validator'],
      activePaths: ['schema-validator'],
      packet: { from: 'schema', to: 'validator', label: 'check' },
      annotations: [
        { at: 'validator', text: '$.price: string -> number', tone: 'fail' },
      ],
      traceEvents: [
        { id: 'schema-invalid', type: 'observation', title: '校验失败', detail: '校验器返回错误路径、期望类型、实际值和错误原因，例如缺字段、类型不符或枚举越界。', status: 'done' },
        { id: 'invalid-fields-marked', type: 'observation', title: '标记错误字段', detail: '只标记不合规字段，保留已经通过校验的字段，避免修复阶段重写整份数据。', status: 'active' },
      ],
    },
    {
      id: 'repair-fields',
      title: 'Repair Fields',
      description: '系统把错误路径和修复要求反馈给模型，只重写不合格字段，并保持已通过字段稳定不变。',
      activeNodes: ['validator', 'repair'],
      activePaths: ['validator-repair'],
      packet: { from: 'validator', to: 'repair', label: 'fix' },
      traceEvents: [
        { id: 'fields-repaired', type: 'repair', title: '局部修复', detail: '把错误路径、期望类型和允许值反馈给模型，只重新生成问题字段，保留已合规字段。', status: 'done' },
        { id: 'repair-scope-locked', type: 'repair', title: '锁定修复范围', detail: '限制修复只作用于失败字段，避免模型在第二轮生成中引入新的字段漂移。', status: 'active' },
      ],
    },
    {
      id: 'typed-result',
      title: 'Typed Result',
      description: '二次校验通过后，数据才被提升为 Typed Result，进入下游程序逻辑并携带可追踪的校验记录。',
      activeNodes: ['repair', 'typed'],
      activePaths: ['repair-typed'],
      packet: { from: 'repair', to: 'typed', label: 'ok' },
      traceEvents: [
        { id: 'typed-ready', type: 'output', title: '输出可用数据', detail: '全字段校验通过，输出可被程序安全消费的 Typed Result，开放下游调用入口。', status: 'done' },
        { id: 'validation-audited', type: 'output', title: '保留校验记录', detail: '记录修复前后的错误路径和校验结果，方便后续排查模型输出质量。', status: 'active' },
      ],
    },
  ],
}
