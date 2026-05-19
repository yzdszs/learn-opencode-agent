import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const humanApprovalGateCanvas: FlowCanvasConfig = {
  ariaLabel: '人类确认门与高风险动作流程路径',
  accent: 'amber',
  motion: 'gate',
  nodes: [
    { id: 'model', label: 'Model', role: '意图', x: 18, y: 30, mobileX: 20, mobileY: 14 },
    { id: 'risk', label: 'Risk Scan', role: '风险扫描', x: 36, y: 54, mobileX: 34, mobileY: 30 },
    { id: 'gate', label: 'Approval Gate', role: '确认门', x: 54, y: 30, mobileX: 62, mobileY: 20 },
    { id: 'user', label: 'User Confirm', role: '用户确认', x: 52, y: 74, mobileX: 54, mobileY: 56 },
    { id: 'executor', label: 'Executor', role: '执行器', x: 70, y: 54, mobileX: 78, mobileY: 40 },
    { id: 'result', label: 'Result', role: '结果', x: 82, y: 30, mobileX: 58, mobileY: 84 },
  ],
  paths: [
    { id: 'model-risk', from: 'model', to: 'risk', d: 'M180 168 C225 220 300 280 360 302' },
    { id: 'risk-gate', from: 'risk', to: 'gate', d: 'M360 302 C420 260 480 220 540 168' },
    { id: 'gate-user', from: 'gate', to: 'user', d: 'M540 168 C535 250 520 345 520 414' },
    { id: 'user-executor', from: 'user', to: 'executor', d: 'M520 414 C590 392 660 348 700 302' },
    { id: 'executor-result', from: 'executor', to: 'result', d: 'M700 302 C760 260 805 220 820 168' },
  ],
}

export const humanApprovalGateExperiment: Experiment = {
  id: 'human-approval-gate',
  title: '人类确认门与高风险动作',
  summary: '展示高风险动作如何经过风险扫描、确认门、用户决策、受控执行与审计回填，让 Agent 在关键节点先停下、说明影响、拿到明确授权后再动作。',
  kind: 'human-approval-gate',
  steps: [
    {
      id: 'intent-detected',
      title: 'Intent Detected',
      description: '模型生成可能影响外部世界的动作意图，系统先把它封装成待审请求，保留目标、参数和副作用范围，不让意图直接穿透到执行层。',
      activeNodes: ['model', 'risk'],
      activePaths: ['model-risk'],
      packet: { from: 'model', to: 'risk', label: 'intent' },
      traceEvents: [
        { id: 'intent-captured', type: 'input', title: '捕获意图', detail: '接收高风险动作意图，提取动作类型、目标对象、参数草案和可能产生的副作用范围。', status: 'done' },
        { id: 'execution-paused', type: 'thinking', title: '暂停直接执行', detail: '把动作标记为 pending approval，禁止模型绕过确认门直接调用工具或修改外部状态。', status: 'active' },
      ],
    },
    {
      id: 'risk-scan',
      title: 'Risk Scan',
      description: '风险扫描层根据动作类型、影响半径和可逆性判断风险等级，明确触发确认门的原因和需要用户核对的字段。',
      activeNodes: ['risk', 'gate'],
      activePaths: ['risk-gate'],
      packet: { from: 'risk', to: 'gate', label: 'risk' },
      annotations: [
        { at: 'risk', text: 'scope + reversibility', tone: 'warn' },
      ],
      traceEvents: [
        { id: 'risk-labelled', type: 'thinking', title: '风险定级', detail: '扫描规则库，结合金额、权限、删除动作、外部发送和不可逆操作判断风险等级。', status: 'done' },
        { id: 'approval-reason-built', type: 'observation', title: '生成确认理由', detail: '把命中的风险项转换成用户能理解的确认说明，避免只暴露内部规则编号。', status: 'active' },
      ],
    },
    {
      id: 'await-confirm',
      title: 'Await Confirm',
      description: '动作在确认门暂停，用户可以 approve、reject 或修改参数；系统必须把待执行内容讲清楚，而不是让用户盲点确认。',
      activeNodes: ['gate', 'user'],
      activePaths: ['gate-user'],
      packet: { from: 'gate', to: 'user', label: 'ask' },
      annotations: [
        { at: 'gate', text: 'approve / reject / edit', tone: 'info' },
      ],
      traceEvents: [
        { id: 'confirm-pending', type: 'observation', title: '等待确认', detail: '向用户展示动作摘要、关键参数、风险说明和预计影响，保持执行暂停状态。', status: 'done' },
        { id: 'decision-options-open', type: 'observation', title: '开放决策分支', detail: '允许用户批准、拒绝或要求修改参数；拒绝会结束执行，修改会回到待审请求重新扫描。', status: 'active' },
      ],
    },
    {
      id: 'execute-action',
      title: 'Execute Action',
      description: '用户确认后，动作才被释放给执行器，并使用确认时冻结的参数执行；后续任何参数漂移都必须重新走确认门。',
      activeNodes: ['user', 'executor'],
      activePaths: ['user-executor'],
      packet: { from: 'user', to: 'executor', label: 'go' },
      traceEvents: [
        { id: 'approval-recorded', type: 'input', title: '记录授权', detail: '记录确认人、确认时间、确认版本和最终参数，形成执行前的授权快照。', status: 'done' },
        { id: 'action-dispatched', type: 'tool-call', title: '放行执行', detail: '执行器只接收已授权参数，并在隔离边界内调用外部系统，避免临场追加未确认动作。', status: 'active' },
      ],
    },
    {
      id: 'result-feedback',
      title: 'Result Feedback',
      description: '执行结果回填到上下文和审计记录，无论成功、失败还是部分完成，都成为后续决策和用户复盘的证据。',
      activeNodes: ['executor', 'result'],
      activePaths: ['executor-result'],
      packet: { from: 'executor', to: 'result', label: 'done' },
      traceEvents: [
        { id: 'result-logged', type: 'output', title: '回填结果', detail: '记录外部系统返回值、实际副作用、错误码和是否需要补偿操作。', status: 'done' },
        { id: 'audit-trail-closed', type: 'output', title: '闭合审计链', detail: '把意图、风险理由、用户决策、执行参数和结果串成一条可追溯链路。', status: 'active' },
      ],
    },
  ],
}
