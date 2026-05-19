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
  summary: '展示用户目标如何被标准化、拆成带依赖的任务队列，并在检查点反馈后按 ready/blocked/done 状态继续推进或重排。',
  kind: 'task-planning-queue',
  steps: [
    {
      id: 'goal-normalized',
      title: 'Goal Normalized',
      description: '用户目标先被整理成边界清楚的任务说明，包含完成标准、约束和不可做事项，避免队列带着含糊输入执行。',
      activeNodes: ['goal', 'planner'],
      activePaths: ['goal-planner'],
      packet: { from: 'goal', to: 'planner', label: 'goal' },
      traceEvents: [
        { id: 'goal-captured', type: 'input', title: '整理目标', detail: '提取用户目标、约束、完成标准和禁止事项，把自然语言请求转换成可规划的任务输入。', status: 'done' },
        { id: 'exit-criteria-set', type: 'thinking', title: '设定退出条件', detail: '明确什么状态算完成、什么状态需要暂停确认，避免任务队列无限扩张。', status: 'active' },
      ],
    },
    {
      id: 'tasks-split',
      title: 'Tasks Split',
      description: '规划器把目标拆成可独立检查的子任务，标出依赖关系、优先级和每个任务的预期产物。',
      activeNodes: ['planner', 'queue'],
      activePaths: ['planner-queue'],
      packet: { from: 'planner', to: 'queue', label: 'plan' },
      traceEvents: [
        { id: 'queue-built', type: 'thinking', title: '生成队列', detail: '把目标拆解为小任务，写入依赖、优先级和预期产物，形成可顺序推进的执行队列。', status: 'done' },
        { id: 'blocked-marked', type: 'thinking', title: '标记阻塞项', detail: '把依赖未满足的任务标为 blocked，只释放当前可执行的 ready 任务。', status: 'active' },
      ],
    },
    {
      id: 'task-dispatched',
      title: 'Task Dispatched',
      description: '队列弹出 ready 状态的当前任务，携带上下文和验收条件交给执行单元，其他任务继续等待依赖满足。',
      activeNodes: ['queue', 'worker'],
      activePaths: ['queue-worker'],
      packet: { from: 'queue', to: 'worker', label: 'task' },
      traceEvents: [
        { id: 'task-started', type: 'tool-call', title: '派发任务', detail: '选择已满足依赖的 ready 任务，携带上下文、输入材料和验收条件交给执行单元。', status: 'done' },
        { id: 'queue-state-held', type: 'observation', title: '保持队列状态', detail: '未满足依赖的任务保持 blocked，避免执行单元抢跑导致结果无法合并。', status: 'active' },
      ],
    },
    {
      id: 'checkpoint-review',
      title: 'Checkpoint Review',
      description: '执行结果进入检查点，系统对照验收条件确认产物是否完成、需要补充，还是应退回队列重排。',
      activeNodes: ['worker', 'checkpoint'],
      activePaths: ['worker-checkpoint'],
      packet: { from: 'worker', to: 'checkpoint', label: 'result' },
      traceEvents: [
        { id: 'result-checked', type: 'observation', title: '检查结果', detail: '读取执行产物，对照任务验收条件判断是否完成、需要补充，还是要重新排队。', status: 'done' },
        { id: 'evidence-linked', type: 'observation', title: '绑定证据', detail: '把文件改动、命令输出或人工确认绑定到当前任务，作为释放下游依赖的依据。', status: 'active' },
      ],
    },
    {
      id: 'queue-updated',
      title: 'Queue Updated',
      description: '检查结果更新队列状态，未完成项回到 pending，已完成项标为 done 并释放下游依赖。',
      activeNodes: ['checkpoint', 'queue'],
      activePaths: ['checkpoint-queue'],
      packet: { from: 'checkpoint', to: 'queue', label: 'state' },
      traceEvents: [
        { id: 'queue-refreshed', type: 'repair', title: '刷新队列', detail: '根据检查结果更新 pending、ready、blocked 和 done 状态，重排仍需处理的任务。', status: 'done' },
        { id: 'dependencies-released', type: 'repair', title: '释放依赖', detail: '完成项释放下游任务，让新的 ready 任务进入下一轮派发。', status: 'active' },
      ],
    },
    {
      id: 'plan-completed',
      title: 'Plan Completed',
      description: '所有任务完成后，系统汇总执行证据、剩余风险和未覆盖项，形成可以交付的最终状态。',
      activeNodes: ['checkpoint', 'done'],
      activePaths: ['checkpoint-done'],
      packet: { from: 'checkpoint', to: 'done', label: 'done' },
      traceEvents: [
        { id: 'plan-closed', type: 'output', title: '完成计划', detail: '确认所有队列项完成，汇总关键产物、验证结果和剩余风险，关闭本轮计划。', status: 'done' },
        { id: 'handoff-ready', type: 'output', title: '形成交付状态', detail: '输出哪些任务已完成、哪些证据支撑完成结论，以及是否仍有需要用户知晓的限制。', status: 'active' },
      ],
    },
  ],
}
