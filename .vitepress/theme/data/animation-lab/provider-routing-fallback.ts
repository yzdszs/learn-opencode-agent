import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const providerRoutingFallbackCanvas: FlowCanvasConfig = {
  ariaLabel: 'Provider 路由与降级路径',
  accent: 'sky',
  motion: 'route',
  nodes: [
    { id: 'request', label: 'Request', role: '请求', x: 18, y: 48, mobileX: 20, mobileY: 18 },
    { id: 'router', label: 'Router', role: '路由器', x: 44, y: 28, mobileX: 56, mobileY: 22 },
    { id: 'budget', label: 'Budget', role: '策略评估', x: 44, y: 72, mobileX: 78, mobileY: 42 },
    { id: 'primary', label: 'Primary', role: '主 Provider', x: 70, y: 24, mobileX: 62, mobileY: 62 },
    { id: 'fallback', label: 'Fallback', role: '降级 Provider', x: 70, y: 72, mobileX: 30, mobileY: 64 },
    { id: 'response', label: 'Response', role: '响应', x: 82, y: 48, mobileX: 52, mobileY: 86 },
  ],
  paths: [
    { id: 'request-router', from: 'request', to: 'router', d: 'M180 269 C245 190 360 150 440 157' },
    { id: 'router-budget', from: 'router', to: 'budget', d: 'M440 166 C400 280 400 360 440 403' },
    { id: 'router-primary', from: 'router', to: 'primary', d: 'M450 150 C545 95 640 98 700 134' },
    { id: 'primary-fallback', from: 'primary', to: 'fallback', d: 'M710 144 C785 250 785 340 700 403' },
    { id: 'budget-fallback', from: 'budget', to: 'fallback', d: 'M450 405 C545 445 640 435 700 403' },
    { id: 'fallback-response', from: 'fallback', to: 'response', d: 'M710 396 C775 355 820 315 820 269' },
  ],
}

export const providerRoutingFallbackExperiment: Experiment = {
  id: 'provider-routing-fallback',
  title: 'Provider 路由与降级',
  summary: '拆解模型请求如何根据能力、上下文长度、质量目标、成本预算、延迟和健康状态选择 Provider，并在失败时按约束降级。',
  kind: 'provider-routing-fallback',
  steps: [
    {
      id: 'request-enters',
      title: 'Request Enters',
      description: '一次模型请求进入路由层，先被标准化为任务类型、上下文规模、能力要求和质量目标，作为后续打分依据。',
      activeNodes: ['request', 'router'],
      activePaths: ['request-router'],
      packet: { from: 'request', to: 'router', label: 'req' },
      traceEvents: [
        { id: 'request-normalized', type: 'input', title: '标准化请求', detail: '接收任务类型、上下文长度、工具需求和质量目标，提取候选 Provider 必须满足的能力标签。', status: 'done' },
        { id: 'hard-requirements', type: 'thinking', title: '锁定硬约束', detail: '先过滤不支持长上下文、结构化输出或工具调用的 Provider，避免后续只按价格排序。', status: 'active' },
      ],
    },
    {
      id: 'budget-check',
      title: 'Budget Check',
      description: '路由器按成本、延迟、上下文长度、质量等级和近期健康状态打分，避免简单任务打到昂贵或不稳定模型。',
      activeNodes: ['router', 'budget'],
      activePaths: ['router-budget'],
      packet: { from: 'router', to: 'budget', label: 'policy' },
      traceEvents: [
        { id: 'budget-evaluated', type: 'thinking', title: '评估策略', detail: '结合预算上限、延迟目标、质量等级和上下文长度计算路由分数，排除明显不划算的候选。', status: 'done' },
        { id: 'health-checked', type: 'observation', title: '检查健康状态', detail: '读取 Provider 近期超时率、错误率和限流状态，把不稳定服务降权或移出主路径。', status: 'active' },
      ],
    },
    {
      id: 'primary-call',
      title: 'Primary Call',
      description: '主 Provider 满足硬约束并获得最高综合分，系统发起调用，同时保存可满足最低能力的降级候选。',
      activeNodes: ['router', 'primary'],
      activePaths: ['router-primary'],
      packet: { from: 'router', to: 'primary', label: 'call' },
      traceEvents: [
        { id: 'primary-selected', type: 'tool-call', title: '选择主 Provider', detail: '发起首选 Provider 调用，记录命中的能力标签、路由分数、预算消耗和调用开始时间。', status: 'done' },
        { id: 'fallback-armed', type: 'thinking', title: '保留备用路径', detail: '同步保留满足最低质量和上下文约束的备用 Provider，等待超时、限流或错误信号触发。', status: 'active' },
      ],
    },
    {
      id: 'fallback-route',
      title: 'Fallback Route',
      description: '主 Provider 超时、限流或返回不可恢复错误后，路由器按策略切到仍满足最低能力的备用路径。',
      activeNodes: ['primary', 'fallback', 'budget'],
      activePaths: ['primary-fallback', 'budget-fallback'],
      packet: { from: 'primary', to: 'fallback', label: 'failover' },
      traceEvents: [
        { id: 'primary-failed', type: 'observation', title: '识别主路径失败', detail: '记录超时、限流、服务错误或能力不匹配等失败原因，避免把失败包装成正常响应。', status: 'done' },
        { id: 'fallback-selected', type: 'repair', title: '触发降级', detail: '按预设策略选择备用 Provider，并确认备用路径仍满足最低上下文、质量和输出格式要求。', status: 'active' },
      ],
    },
    {
      id: 'response-returned',
      title: 'Response Returned',
      description: '备用 Provider 返回可用响应后，系统把实际来源、降级原因、质量影响和成本变化写入 Trace，便于后续复盘。',
      activeNodes: ['fallback', 'response'],
      activePaths: ['fallback-response'],
      packet: { from: 'fallback', to: 'response', label: 'resp' },
      traceEvents: [
        { id: 'response-ready', type: 'output', title: '返回响应', detail: '备用 Provider 返回响应，输出实际来源、路由路径、质量影响和成本变化。', status: 'done' },
        { id: 'route-audited', type: 'output', title: '记录路由证据', detail: '把主路径失败原因和降级选择依据写入 Trace，方便定位是否需要调整阈值或供应商权重。', status: 'active' },
      ],
    },
  ],
}
