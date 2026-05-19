import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const errorRecoveryLoopCanvas: FlowCanvasConfig = {
  ariaLabel: '错误恢复与自修复循环路径',
  accent: 'amber',
  motion: 'recover',
  nodes: [
    { id: 'model', label: 'Model', role: '决策', x: 18, y: 28, mobileX: 20, mobileY: 18 },
    { id: 'tool', label: 'Tool', role: '工具', x: 46, y: 20, mobileX: 56, mobileY: 20 },
    { id: 'error', label: 'Error', role: '失败', x: 74, y: 28, mobileX: 78, mobileY: 38 },
    { id: 'analyzer', label: 'Analyzer', role: '分类', x: 78, y: 58, mobileX: 62, mobileY: 62 },
    { id: 'repair', label: 'Repair', role: '修正', x: 46, y: 76, mobileX: 30, mobileY: 64 },
    { id: 'final', label: 'Final', role: '收敛', x: 78, y: 80, mobileX: 52, mobileY: 86 },
  ],
  paths: [
    { id: 'model-tool', from: 'model', to: 'tool', d: 'M180 157 C260 105 370 95 460 112' },
    { id: 'tool-error', from: 'tool', to: 'error', d: 'M470 112 C575 105 675 120 740 157' },
    { id: 'error-analyzer', from: 'error', to: 'analyzer', d: 'M748 166 C810 235 815 300 780 325' },
    { id: 'analyzer-repair', from: 'analyzer', to: 'repair', d: 'M770 334 C680 420 560 440 460 426' },
    { id: 'repair-tool', from: 'repair', to: 'tool', d: 'M450 418 C340 320 350 180 460 120' },
    { id: 'tool-final', from: 'tool', to: 'final', d: 'M470 120 C620 205 740 325 780 448' },
  ],
}

export const errorRecoveryLoopExperiment: Experiment = {
  id: 'error-recovery-loop',
  title: '错误恢复与自修复循环',
  summary: '展示工具失败后，Agent 如何捕获错误、判断可恢复性、修正调用、限制重试，并在成功或停止时留下完整复盘路径。',
  kind: 'error-recovery-loop',
  steps: [
    {
      id: 'tool-attempt',
      title: 'Tool Attempt',
      description: '模型带着结构化参数调用工具，进入真实外部执行；从这一刻起，系统必须记录尝试编号和可失败边界。',
      activeNodes: ['model', 'tool'],
      activePaths: ['model-tool'],
      packet: { from: 'model', to: 'tool', label: 'call' },
      traceEvents: [
        { id: 'tool-called', type: 'tool-call', title: '执行工具', detail: '携带工具名、结构化参数和调用上下文，发起本次执行并记录执行编号。', status: 'done' },
        { id: 'attempt-budget-set', type: 'thinking', title: '设置重试预算', detail: '记录最大重试次数、退避策略和停止条件，防止失败后无限循环。', status: 'active' },
      ],
    },
    {
      id: 'error-returned',
      title: 'Error Returned',
      description: '工具返回错误，失败结果被当作观察进入 Trace，包含错误类型、退出码和失败位置，而不是被静默吞掉。',
      activeNodes: ['tool', 'error'],
      activePaths: ['tool-error'],
      packet: { from: 'tool', to: 'error', label: 'err', kind: 'error' },
      nodeStates: { tool: 'fail', error: 'fail' },
      nodeBadges: { error: 'HTTP 429' },
      annotations: [
        { at: 'tool', text: 'rate limit', tone: 'fail' },
      ],
      traceEvents: [
        { id: 'error-captured', type: 'observation', title: '捕获错误', detail: '工具返回 stderr、退出码和错误类型，失败位置注入 Trace，等待分类处理。', status: 'done' },
        { id: 'retry-not-immediate', type: 'thinking', title: '禁止盲目重试', detail: '在分类前不直接重放同一请求，避免重复触发限流、权限错误或破坏性动作。', status: 'active' },
      ],
    },
    {
      id: 'classify-error',
      title: 'Classify Error',
      description: '分析器区分参数错误、权限问题、限流、网络失败和不可恢复失败，决定修复、退避、换路径或停止。',
      activeNodes: ['error', 'analyzer'],
      activePaths: ['error-analyzer'],
      packet: { from: 'error', to: 'analyzer', label: 'signal', kind: 'control' },
      nodeStates: { error: 'fail', analyzer: 'busy' },
      nodeBadges: { analyzer: 'retriable' },
      annotations: [
        { at: 'analyzer', text: 'retriable: yes', tone: 'warn' },
      ],
      traceEvents: [
        { id: 'error-classified', type: 'thinking', title: '分类失败原因', detail: '分析错误类别和可恢复性，推断允许重试的条件，决策是否进入修复循环。', status: 'done' },
        { id: 'stop-boundary-checked', type: 'thinking', title: '检查停止边界', detail: '如果是权限拒绝、不可恢复错误或超出重试预算，系统应停止并返回原因，而不是继续修复。', status: 'active' },
      ],
    },
    {
      id: 'repair-params',
      title: 'Repair Params',
      description: '系统根据错误信号修正参数、缩小执行范围、增加退避或改换路径，避免重复同一次失败。',
      activeNodes: ['analyzer', 'repair'],
      activePaths: ['analyzer-repair'],
      packet: { from: 'analyzer', to: 'repair', label: 'fix', kind: 'control' },
      nodeStates: { analyzer: 'done', repair: 'busy' },
      nodeBadges: { repair: 'backoff 2s' },
      traceEvents: [
        { id: 'params-repaired', type: 'repair', title: '修正调用', detail: '根据错误信号修改参数，明确修复依据和重试边界，避免重复同一次失败。', status: 'done' },
        { id: 'backoff-applied', type: 'repair', title: '应用退避策略', detail: '对限流或临时失败加入等待、缩小范围或切换路径，降低二次失败概率。', status: 'active' },
      ],
    },
    {
      id: 'retry-success',
      title: 'Retry Success',
      description: '修正后的请求再次进入工具，成功观察成为最终响应依据，同时保留从失败到恢复的完整链路。',
      activeNodes: ['repair', 'tool', 'final'],
      activePaths: ['repair-tool', 'tool-final'],
      packets: [
        { from: 'repair', to: 'tool', label: 'retry', kind: 'control', delay: 0 },
        { from: 'tool', to: 'final', label: 'ok', kind: 'success', delay: 520 },
      ],
      nodeStates: { tool: 'done', final: 'done' },
      nodeBadges: { tool: 'attempt 2', final: '200 OK' },
      annotations: [
        { at: 'final', text: '✓ recovered', tone: 'success' },
      ],
      traceEvents: [
        { id: 'retry-succeeded', type: 'output', title: '重试成功', detail: '重试成功，输出可交付结果，保留失败到修复的完整路径供复盘。', status: 'done' },
        { id: 'recovery-audited', type: 'output', title: '记录恢复证据', detail: '记录第几次尝试成功、修复了什么、是否仍有剩余风险，方便后续判断系统稳定性。', status: 'active' },
      ],
    },
  ],
}
