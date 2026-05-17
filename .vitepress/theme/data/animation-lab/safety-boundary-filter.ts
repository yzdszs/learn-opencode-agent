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
  summary: '展示输入和工具结果如何经过敏感信息扫描、策略判断、脱敏或阻断，再进入后续模型流程。',
  kind: 'safety-boundary-filter',
  steps: [
    {
      id: 'input-captured',
      title: 'Input Captured',
      description: '外部输入进入系统，先被视为未验证数据，不直接交给模型或工具。',
      activeNodes: ['input', 'scanner'],
      activePaths: ['input-scanner'],
      packet: { from: 'input', to: 'scanner', label: 'raw' },
      traceEvents: [
        { id: 'raw-received', type: 'input', title: '接收原始输入', detail: '捕获用户输入和工具返回内容，标记为未信任数据，等待安全扫描。', status: 'active' },
      ],
    },
    {
      id: 'sensitive-scanned',
      title: 'Sensitive Scanned',
      description: '扫描器识别密钥、个人信息和高风险指令，给出命中标签。',
      activeNodes: ['scanner', 'policy'],
      activePaths: ['scanner-policy'],
      packet: { from: 'scanner', to: 'policy', label: 'tag' },
      traceEvents: [
        { id: 'signals-found', type: 'observation', title: '识别信号', detail: '查找 token、邮箱、身份证明、危险命令和越权提示，生成风险标签。', status: 'active' },
      ],
    },
    {
      id: 'policy-evaluated',
      title: 'Policy Evaluated',
      description: '策略层根据风险等级决定放行、脱敏、降级处理或直接阻断。',
      activeNodes: ['policy', 'redact'],
      activePaths: ['policy-redact'],
      packet: { from: 'policy', to: 'redact', label: 'rule' },
      traceEvents: [
        { id: 'policy-picked', type: 'thinking', title: '匹配策略', detail: '根据命中标签和上下文判断处理策略，明确哪些内容可用、哪些必须隐藏或阻断。', status: 'active' },
      ],
    },
    {
      id: 'content-redacted',
      title: 'Content Redacted',
      description: '可继续使用的内容被局部脱敏，保留任务必要语义，移除敏感值。',
      activeNodes: ['redact', 'allow'],
      activePaths: ['redact-allow'],
      packet: { from: 'redact', to: 'allow', label: 'safe' },
      traceEvents: [
        { id: 'content-sanitized', type: 'repair', title: '执行脱敏', detail: '替换敏感字段，保留字段含义和必要上下文，生成可继续处理的安全版本。', status: 'active' },
      ],
    },
    {
      id: 'unsafe-blocked',
      title: 'Unsafe Blocked',
      description: '无法安全处理的请求被阻断，并返回明确原因和可接受的替代路径。',
      activeNodes: ['allow', 'block'],
      activePaths: ['allow-block'],
      packet: { from: 'allow', to: 'block', label: 'deny' },
      traceEvents: [
        { id: 'blocked-output', type: 'output', title: '输出边界', detail: '对不可处理内容返回清晰边界说明，同时提供安全替代请求方式。', status: 'active' },
      ],
    },
  ],
}
