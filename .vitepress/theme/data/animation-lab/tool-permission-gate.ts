import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const toolPermissionGateCanvas: FlowCanvasConfig = {
  ariaLabel: '工具调用与权限门路径',
  accent: 'amber',
  motion: 'gate',
  nodes: [
    { id: 'model', label: 'Model', role: '意图', x: 18, y: 44, mobileX: 20, mobileY: 20 },
    { id: 'request', label: 'Tool Request', role: '请求', x: 42, y: 22, mobileX: 52, mobileY: 18 },
    { id: 'gate', label: 'Permission Gate', role: '权限门', x: 62, y: 48, mobileX: 78, mobileY: 36 },
    { id: 'execute', label: 'Executor', role: '执行器', x: 78, y: 22, mobileX: 62, mobileY: 58 },
    { id: 'result', label: 'Result', role: '结果', x: 76, y: 72, mobileX: 30, mobileY: 62 },
    { id: 'model-update', label: 'Model Update', role: '回填', x: 42, y: 74, mobileX: 50, mobileY: 84 },
  ],
  paths: [
    { id: 'model-request', from: 'model', to: 'request', d: 'M180 246 C250 170 340 130 420 123' },
    { id: 'request-gate', from: 'request', to: 'gate', d: 'M430 130 C500 180 570 225 620 269' },
    { id: 'gate-execute', from: 'gate', to: 'execute', d: 'M630 260 C685 170 740 125 780 123' },
    { id: 'execute-result', from: 'execute', to: 'result', d: 'M760 154 C825 278 825 356 760 403' },
    { id: 'result-model-update', from: 'result', to: 'model-update', d: 'M750 406 C645 438 520 432 420 414' },
    { id: 'model-update-model', from: 'model-update', to: 'model', d: 'M410 406 C280 390 190 325 180 254' },
  ],
}

export const toolPermissionGateExperiment: Experiment = {
  id: 'tool-permission-gate',
  title: '工具调用与权限门',
  summary: '展示模型意图如何经过结构化请求、权限规则、风险分级、执行隔离与结果回填，避免意图直接变成外部动作。',
  kind: 'tool-permission-gate',
  steps: [
    {
      id: 'model-intent',
      title: 'Model Intent',
      description: '模型根据当前目标判断需要外部工具，并先生成调用意图；此时它只是待审请求，还未授权，也未进入执行层。',
      activeNodes: ['model', 'request'],
      activePaths: ['model-request'],
      packet: { from: 'model', to: 'request', label: 'intent' },
      traceEvents: [
        { id: 'intent-created', type: 'thinking', title: '形成调用意图', detail: '推断工具调用目标，提取候选参数，标记潜在风险信号，等待权限层接管。', status: 'done' },
        { id: 'request-not-executed', type: 'thinking', title: '保持未执行状态', detail: '调用意图不会直接触发外部动作，必须先通过结构化和权限检查。', status: 'active' },
      ],
    },
    {
      id: 'permission-check',
      title: 'Permission Check',
      description: '工具请求进入权限门，系统检查操作范围、资源权限、风险等级和用户授权，再决定放行、阻断或升级确认。',
      activeNodes: ['request', 'gate'],
      activePaths: ['request-gate'],
      packet: { from: 'request', to: 'gate', label: 'check' },
      traceEvents: [
        { id: 'gate-checking', type: 'tool-call', title: '检查权限', detail: '执行权限检查，记录通过、阻断或升级确认结果，对高风险动作标记需要用户确认。', status: 'done' },
        { id: 'risk-classified', type: 'thinking', title: '风险分级', detail: '根据读写范围、外部副作用和敏感资源判断风险等级，决定是否需要人类确认门。', status: 'active' },
      ],
    },
    {
      id: 'execute-tool',
      title: 'Execute Tool',
      description: '权限通过后，执行器只接收已授权的结构化参数，并在隔离边界内运行工具，不能临时扩大操作范围。',
      activeNodes: ['gate', 'execute'],
      activePaths: ['gate-execute'],
      packet: { from: 'gate', to: 'execute', label: 'allow' },
      traceEvents: [
        { id: 'tool-executed', type: 'tool-call', title: '执行工具', detail: '以授权后的结构化参数发起调用，在隔离边界内执行，跟踪工具运行状态。', status: 'done' },
        { id: 'sandbox-held', type: 'observation', title: '保持执行隔离', detail: '执行器只能访问授权资源，任何额外文件、网络或系统动作都需要重新过门。', status: 'active' },
      ],
    },
    {
      id: 'return-result',
      title: 'Return Result',
      description: '工具结果回到系统，作为观察进入上下文；stdout、错误和结构化输出都需要被模型再次评估。',
      activeNodes: ['execute', 'result'],
      activePaths: ['execute-result'],
      packet: { from: 'execute', to: 'result', label: 'result' },
      traceEvents: [
        { id: 'result-returned', type: 'observation', title: '返回结果', detail: '工具返回 stdout、错误信息和结构化输出，注入上下文等待模型评估。', status: 'done' },
        { id: 'side-effect-recorded', type: 'observation', title: '记录副作用', detail: '如果工具改变了文件、外部状态或权限范围，结果必须带上可追踪的副作用说明。', status: 'active' },
      ],
    },
    {
      id: 'model-update',
      title: 'Model Update',
      description: '结果作为观察回填给模型，模型结合原目标、权限结果和副作用记录判断下一步行动或生成最终响应。',
      activeNodes: ['result', 'model-update', 'model'],
      activePaths: ['result-model-update', 'model-update-model'],
      packet: { from: 'result', to: 'model-update', label: 'obs' },
      traceEvents: [
        { id: 'observation-applied', type: 'output', title: '回填观察', detail: '工具事实回填进上下文，更新计划状态，触发模型决策下一步行动或生成响应。', status: 'done' },
        { id: 'next-gate-decided', type: 'output', title: '判断下一道门', detail: '如果下一步仍涉及外部副作用，模型必须重新生成待审请求，而不是沿用旧授权。', status: 'active' },
      ],
    },
  ],
}
