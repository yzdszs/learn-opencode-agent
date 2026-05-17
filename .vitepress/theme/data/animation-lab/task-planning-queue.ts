import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const taskPlanningQueueCanvas: FlowCanvasConfig = {
  ariaLabel: '任务拆解与执行队列路径',
  accent: 'teal',
  motion: 'dispatch',
  nodes: [
    { id: 'goal', label: 'Goal', role: '目标', x: 15, y: 22, mobileX: 20, mobileY: 12 },
    { id: 'planner', label: 'Planner', role: '规划器', x: 36, y: 44, mobileX: 50, mobileY: 20 },
    { id: 'queue', label: 'Task Queue', role: '队列', x: 58, y: 24, mobileX: 78, mobileY: 34 },
    { id: 'worker', label: 'Worker', role: '执行', x: 82, y: 42, mobileX: 70, mobileY: 58 },
    { id: 'checkpoint', label: 'Checkpoint', role: '检查点', x: 62, y: 74, mobileX: 42, mobileY: 74 },
    { id: 'done', label: 'Done', role: '完成', x: 28, y: 76, mobileX: 18, mobileY: 88 },
  ],
  paths: [
    { id: 'goal-planner', from: 'goal', to: 'planner', d: 'M150 123 C218 160 286 212 360 246' },
    { id: 'planner-queue', from: 'planner', to: 'queue', d: 'M360 246 C430 170 510 126 580 134' },
    { id: 'queue-worker', from: 'queue', to: 'worker', d: 'M580 134 C682 150 766 196 820 235' },
    { id: 'worker-checkpoint', from: 'worker', to: 'checkpoint', d: 'M820 235 C760 344 686 408 620 414' },
    { id: 'checkpoint-done', from: 'checkpoint', to: 'done', d: 'M620 414 C500 468 370 468 280 426' },
    { id: 'checkpoint-queue', from: 'checkpoint', to: 'queue', d: 'M620 414 C680 330 680 210 590 145' },
  ],
}

export const taskPlanningQueueExperiment: Experiment = {
  id: 'task-planning-queue',
  title: '任务拆解与执行队列',
  summary: '展示用户目标如何被拆成有依赖的任务队列，并在检查点反馈后继续推进或重排。',
  kind: 'task-planning-queue',
  steps: [
    {
      id: 'goal-normalized',
      title: 'Goal Normalized',
      description: '用户目标先被整理成边界清楚的任务说明，避免后续队列带着含糊输入执行。',
      activeNodes: ['goal', 'planner'],
      activePaths: ['goal-planner'],
      packet: { from: 'goal', to: 'planner', label: 'goal' },
      traceEvents: [
        { id: 'goal-captured', type: 'input', title: '整理目标', detail: '提取用户目标、约束和完成标准，把自然语言请求转换成可规划的任务输入。', status: 'active' },
      ],
    },
    {
      id: 'tasks-split',
      title: 'Tasks Split',
      description: '规划器把目标拆成可独立检查的子任务，并标出依赖关系和执行顺序。',
      activeNodes: ['planner', 'queue'],
      activePaths: ['planner-queue'],
      packet: { from: 'planner', to: 'queue', label: 'plan' },
      traceEvents: [
        { id: 'queue-built', type: 'thinking', title: '生成队列', detail: '把目标拆解为小任务，写入依赖、优先级和预期产物，形成可顺序推进的执行队列。', status: 'active' },
      ],
    },
    {
      id: 'task-dispatched',
      title: 'Task Dispatched',
      description: '队列弹出当前可执行任务，交给执行单元处理，其他任务继续等待依赖满足。',
      activeNodes: ['queue', 'worker'],
      activePaths: ['queue-worker'],
      packet: { from: 'queue', to: 'worker', label: 'task' },
      traceEvents: [
        { id: 'task-started', type: 'tool-call', title: '派发任务', detail: '选择已满足依赖的任务，携带上下文和验收条件交给执行单元处理。', status: 'active' },
      ],
    },
    {
      id: 'checkpoint-review',
      title: 'Checkpoint Review',
      description: '执行结果进入检查点，系统确认产物是否满足当前任务的退出条件。',
      activeNodes: ['worker', 'checkpoint'],
      activePaths: ['worker-checkpoint'],
      packet: { from: 'worker', to: 'checkpoint', label: 'result' },
      traceEvents: [
        { id: 'result-checked', type: 'observation', title: '检查结果', detail: '读取执行产物，对照任务验收条件判断是否完成、需要补充，还是要重新排队。', status: 'active' },
      ],
    },
    {
      id: 'queue-updated',
      title: 'Queue Updated',
      description: '检查结果更新队列状态，未完成项回到队列，已完成项释放下游依赖。',
      activeNodes: ['checkpoint', 'queue'],
      activePaths: ['checkpoint-queue'],
      packet: { from: 'checkpoint', to: 'queue', label: 'state' },
      traceEvents: [
        { id: 'queue-refreshed', type: 'repair', title: '刷新队列', detail: '根据检查结果更新任务状态，重排仍需处理的任务，并释放已经满足的依赖。', status: 'active' },
      ],
    },
    {
      id: 'plan-completed',
      title: 'Plan Completed',
      description: '所有任务完成后，系统汇总执行证据，形成可以交付的最终状态。',
      activeNodes: ['checkpoint', 'done'],
      activePaths: ['checkpoint-done'],
      packet: { from: 'checkpoint', to: 'done', label: 'done' },
      traceEvents: [
        { id: 'plan-closed', type: 'output', title: '完成计划', detail: '确认所有队列项完成，汇总关键产物、验证结果和剩余风险，关闭本轮计划。', status: 'active' },
      ],
    },
  ],
}
