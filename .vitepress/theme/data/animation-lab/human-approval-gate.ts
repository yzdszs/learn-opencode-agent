import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const humanApprovalGateCanvas: FlowCanvasConfig = {
  ariaLabel: '人工确认与高风险操作路径',
  accent: 'amber',
  motion: 'gate',
  nodes: [
    { id: 'model', label: 'Model', role: '意图', x: 12, y: 48, mobileX: 20, mobileY: 18 },
    { id: 'risk', label: 'Risk Scan', role: '风险扫描', x: 34, y: 28, mobileX: 56, mobileY: 20 },
    { id: 'gate', label: 'Approval Gate', role: '确认门', x: 58, y: 28, mobileX: 82, mobileY: 40 },
    { id: 'user', label: 'User Confirm', role: '用户确认', x: 76, y: 58, mobileX: 62, mobileY: 62 },
    { id: 'executor', label: 'Executor', role: '执行器', x: 48, y: 76, mobileX: 28, mobileY: 64 },
    { id: 'result', label: 'Result', role: '结果', x: 88, y: 40, mobileX: 50, mobileY: 86 },
  ],
  paths: [
    { id: 'model-risk', from: 'model', to: 'risk', d: 'M120 270 C190 205 265 160 340 155' },
    { id: 'risk-gate', from: 'risk', to: 'gate', d: 'M350 155 C425 120 520 120 580 155' },
    { id: 'gate-user', from: 'gate', to: 'user', d: 'M590 165 C680 230 735 300 760 325' },
    { id: 'user-executor', from: 'user', to: 'executor', d: 'M750 340 C650 430 555 445 480 425' },
    { id: 'executor-result', from: 'executor', to: 'result', d: 'M490 420 C630 455 785 340 880 225' },
  ],
}

export const humanApprovalGateExperiment: Experiment = {
  id: 'human-approval-gate',
  title: '人工确认与高风险操作',
  summary: '展示高风险工具动作如何被识别、暂停、解释风险，并在用户确认后才进入执行。',
  kind: 'human-approval-gate',
  steps: [
    {
      id: 'action-proposed',
      title: 'Action Proposed',
      description: '模型提出外部动作，但动作仍停留在意图层，不能直接进入执行器。',
      activeNodes: ['model', 'risk'],
      activePaths: ['model-risk'],
      packet: { from: 'model', to: 'risk', label: 'intent' },
      traceEvents: [
        { id: 'action-intent', type: 'thinking', title: '提出动作', detail: '系统记录动作目标、候选参数和可能影响的资源。', status: 'active' },
      ],
    },
    {
      id: 'risk-scan',
      title: 'Risk Scan',
      description: '系统识别删除、支付、写文件等高风险信号，并判断是否需要人工介入。',
      activeNodes: ['risk', 'gate'],
      activePaths: ['risk-gate'],
      packet: { from: 'risk', to: 'gate', label: 'risk' },
      traceEvents: [
        { id: 'risk-detected', type: 'tool-call', title: '识别风险', detail: '系统记录风险类型、影响范围和阻断策略。', status: 'active' },
      ],
    },
    {
      id: 'approval-required',
      title: 'Approval Required',
      description: '权限门暂停动作，并向用户说明将要执行什么、影响哪里和如何回退。',
      activeNodes: ['gate', 'user'],
      activePaths: ['gate-user'],
      packet: { from: 'gate', to: 'user', label: 'ask' },
      traceEvents: [
        { id: 'approval-paused', type: 'observation', title: '等待确认', detail: '系统记录确认文案、暂停原因和等待中的请求状态。', status: 'active' },
      ],
    },
    {
      id: 'user-confirms',
      title: 'User Confirms',
      description: '用户明确允许后，请求才获得执行资格；拒绝时链路会在这里终止。',
      activeNodes: ['user', 'executor'],
      activePaths: ['user-executor'],
      packet: { from: 'user', to: 'executor', label: 'allow' },
      traceEvents: [
        { id: 'approval-granted', type: 'input', title: '用户授权', detail: '系统记录授权结果、授权时间和用户确认的操作范围。', status: 'active' },
      ],
    },
    {
      id: 'execute-or-abort',
      title: 'Execute Or Abort',
      description: '执行器根据确认结果执行或终止，并把真实结果回填给模型上下文。',
      activeNodes: ['executor', 'result'],
      activePaths: ['executor-result'],
      packet: { from: 'executor', to: 'result', label: 'done' },
      traceEvents: [
        { id: 'approval-result', type: 'output', title: '回填结果', detail: '系统记录执行结果、拒绝状态或后续需要用户处理的事项。', status: 'active' },
      ],
    },
  ],
}
