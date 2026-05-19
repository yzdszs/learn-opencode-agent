import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const safetyBoundaryFilterCanvas: FlowCanvasConfig = {
  ariaLabel: '安全边界与敏感信息过滤路径',
  accent: 'rose',
  motion: 'gate',
  nodes: [
    { id: 'input', label: 'Input', role: '输入', x: 16, y: 36, mobileX: 18, mobileY: 14 },
    { id: 'scanner', label: 'Scanner', role: '扫描', x: 38, y: 18, mobileX: 52, mobileY: 18 },
    { id: 'policy', label: 'Policy', role: '策略', x: 66, y: 28, mobileX: 78, mobileY: 36 },
    { id: 'redact', label: 'Redaction', role: '脱敏', x: 76, y: 68, mobileX: 72, mobileY: 62 },
    { id: 'allow', label: 'Allowed', role: '放行', x: 46, y: 82, mobileX: 42, mobileY: 78 },
    { id: 'block', label: 'Blocked', role: '阻断', x: 20, y: 70, mobileX: 18, mobileY: 92 },
  ],
  paths: [
    { id: 'input-scanner', from: 'input', to: 'scanner', d: 'M160 202 C220 135 300 95 380 101' },
    { id: 'scanner-policy', from: 'scanner', to: 'policy', d: 'M380 101 C490 104 600 130 660 157' },
    { id: 'policy-redact', from: 'policy', to: 'redact', d: 'M660 157 C755 250 795 330 760 381' },
    { id: 'redact-allow', from: 'redact', to: 'allow', d: 'M760 381 C660 460 545 480 460 459' },
    { id: 'allow-block', from: 'allow', to: 'block', d: 'M460 459 C350 438 250 405 200 392' },
    { id: 'block-scanner', from: 'block', to: 'scanner', d: 'M200 392 C210 250 285 135 380 101' },
  ],
}

export const safetyBoundaryFilterExperiment: Experiment = {
  id: 'safety-boundary-filter',
  title: '安全边界与敏感信息过滤',
  summary: '展示用户输入和工具结果如何作为未信任数据进入扫描器，经过策略匹配、语义保留脱敏、放行或阻断，最终只把安全且必要的信息交给后续模型流程。',
  kind: 'safety-boundary-filter',
  steps: [
    {
      id: 'input-captured',
      title: 'Input Captured',
      description: '外部输入进入系统后先被视为未信任数据，系统记录来源和用途，避免把用户文本或工具返回直接交给模型、工具或日志。',
      activeNodes: ['input', 'scanner'],
      activePaths: ['input-scanner'],
      packet: { from: 'input', to: 'scanner', label: 'raw' },
      traceEvents: [
        { id: 'raw-received', type: 'input', title: '接收原始输入', detail: '捕获用户输入、上传内容和工具返回内容，记录来源通道并标记为未信任数据。', status: 'done' },
        { id: 'trust-boundary-set', type: 'thinking', title: '建立信任边界', detail: '在扫描完成前限制数据用途，禁止敏感值进入模型上下文、调试日志或外部请求。', status: 'active' },
      ],
    },
    {
      id: 'sensitive-scanned',
      title: 'Sensitive Scanned',
      description: '扫描器识别密钥、个人信息、危险命令和越权提示，给出命中标签、置信度和需要策略层判断的上下文。',
      activeNodes: ['scanner', 'policy'],
      activePaths: ['scanner-policy'],
      packet: { from: 'scanner', to: 'policy', label: 'tag' },
      annotations: [
        { at: 'scanner', text: 'secret / pii / unsafe intent', tone: 'warn' },
      ],
      traceEvents: [
        { id: 'signals-found', type: 'observation', title: '识别信号', detail: '查找 token、邮箱、身份证明、危险命令和越权提示，生成风险标签。', status: 'done' },
        { id: 'context-preserved', type: 'observation', title: '保留判断上下文', detail: '保留字段名、用途和周边语义，帮助策略层区分真实敏感值、示例占位符和误报。', status: 'active' },
      ],
    },
    {
      id: 'policy-evaluated',
      title: 'Policy Evaluated',
      description: '策略层根据命中类型、请求意图和任务必要性决定放行、脱敏、要求用户改写或直接阻断，并给出可解释的处理理由。',
      activeNodes: ['policy', 'redact'],
      activePaths: ['policy-redact'],
      packet: { from: 'policy', to: 'redact', label: 'rule' },
      annotations: [
        { at: 'policy', text: 'allow / redact / ask / block', tone: 'info' },
      ],
      traceEvents: [
        { id: 'policy-picked', type: 'thinking', title: '匹配策略', detail: '根据命中标签、用户意图和任务必要性判断处理策略，明确哪些内容可用、哪些必须隐藏或阻断。', status: 'done' },
        { id: 'reason-attached', type: 'thinking', title: '附带处理理由', detail: '把策略结果转换成可解释原因，便于后续向用户说明边界，而不是只返回模糊失败。', status: 'active' },
      ],
    },
    {
      id: 'content-redacted',
      title: 'Content Redacted',
      description: '可继续使用的内容被局部脱敏，敏感值被替换为稳定占位符，同时保留字段含义、任务语义和后续处理所需结构。',
      activeNodes: ['redact', 'allow'],
      activePaths: ['redact-allow'],
      packet: { from: 'redact', to: 'allow', label: 'safe' },
      traceEvents: [
        { id: 'content-sanitized', type: 'repair', title: '执行脱敏', detail: '替换敏感字段，保留字段含义和必要上下文，生成可继续处理的安全版本。', status: 'done' },
        { id: 'meaning-checked', type: 'repair', title: '校验语义保留', detail: '确认脱敏后的文本仍能支持任务判断，避免把关键业务结构一并删空。', status: 'active' },
      ],
    },
    {
      id: 'unsafe-blocked',
      title: 'Unsafe Blocked',
      description: '无法安全处理的请求被阻断，系统返回明确原因、可接受替代路径，并避免泄露被拦截内容或内部策略细节。',
      activeNodes: ['allow', 'block'],
      activePaths: ['allow-block'],
      packet: { from: 'allow', to: 'block', label: 'deny' },
      traceEvents: [
        { id: 'blocked-output', type: 'output', title: '输出边界', detail: '对不可处理内容返回清晰边界说明，同时提供安全替代请求方式。', status: 'done' },
        { id: 'leakage-avoided', type: 'output', title: '避免二次泄露', detail: '回复中不复述敏感原文、不暴露内部规则细节，只说明用户可以如何安全改写请求。', status: 'active' },
      ],
    },
  ],
}
