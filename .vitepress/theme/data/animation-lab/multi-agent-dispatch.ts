import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const multiAgentDispatchCanvas: FlowCanvasConfig = {
  ariaLabel: '多 Agent 调度路径',
  accent: 'sky',
  motion: 'dispatch',
  nodes: [
    { id: 'coordinator', label: 'Coordinator', role: '调度器', x: 14, y: 44, mobileX: 20, mobileY: 18 },
    { id: 'planner', label: 'Planner', role: '计划 Agent', x: 40, y: 22, mobileX: 56, mobileY: 20 },
    { id: 'coder', label: 'Coder', role: '实现 Agent', x: 66, y: 30, mobileX: 82, mobileY: 40 },
    { id: 'reviewer', label: 'Reviewer', role: '审查 Agent', x: 66, y: 68, mobileX: 62, mobileY: 64 },
    { id: 'merge', label: 'Merge', role: '汇总', x: 38, y: 76, mobileX: 26, mobileY: 64 },
    { id: 'answer', label: 'Answer', role: '交付', x: 86, y: 50, mobileX: 50, mobileY: 86 },
  ],
  paths: [
    { id: 'coordinator-planner', from: 'coordinator', to: 'planner', d: 'M140 246 C220 150 300 110 400 125' },
    { id: 'planner-coder', from: 'planner', to: 'coder', d: 'M405 125 C495 95 590 115 660 165' },
    { id: 'planner-reviewer', from: 'planner', to: 'reviewer', d: 'M415 145 C525 210 605 285 660 378' },
    { id: 'coder-reviewer', from: 'coder', to: 'reviewer', d: 'M665 185 C705 250 705 320 665 380' },
    { id: 'reviewer-merge', from: 'reviewer', to: 'merge', d: 'M645 395 C545 445 465 445 385 425' },
    { id: 'merge-answer', from: 'merge', to: 'answer', d: 'M395 420 C550 475 735 405 860 280' },
  ],
}

export const multiAgentDispatchExperiment: Experiment = {
  id: 'multi-agent-dispatch',
  title: '多 Agent 调度',
  summary: '拆解复杂任务何时值得分发给多个 Agent，以及并行协作、审查与结果汇总的运行轨迹。',
  kind: 'multi-agent-dispatch',
  steps: [
    {
      id: 'dispatch-plan',
      title: 'Dispatch Plan',
      description: '调度器先把任务交给计划 Agent，判断任务是否可拆分，并确定分工边界。',
      activeNodes: ['coordinator', 'planner'],
      activePaths: ['coordinator-planner'],
      packet: { from: 'coordinator', to: 'planner', label: 'brief' },
      traceEvents: [
        { id: 'brief-sent', type: 'input', title: '下发任务摘要', detail: '系统记录任务目标、约束、共享上下文和可并行部分。', status: 'active' },
      ],
    },
    {
      id: 'parallel-work',
      title: 'Parallel Work',
      description: '计划 Agent 把互不阻塞的子任务分派给实现和审查链路，让多个角色并行推进。',
      activeNodes: ['planner', 'coder', 'reviewer'],
      activePaths: ['planner-coder', 'planner-reviewer'],
      packet: { from: 'planner', to: 'coder', label: 'task' },
      traceEvents: [
        { id: 'work-split', type: 'thinking', title: '拆分并行任务', detail: '系统记录子任务边界、依赖关系和每个 Agent 的责任范围。', status: 'active' },
      ],
    },
    {
      id: 'review-pass',
      title: 'Review Pass',
      description: '实现结果进入审查 Agent，检查风险、遗漏和接口一致性，再决定是否需要返工。',
      activeNodes: ['coder', 'reviewer'],
      activePaths: ['coder-reviewer'],
      packet: { from: 'coder', to: 'reviewer', label: 'diff' },
      traceEvents: [
        { id: 'review-started', type: 'tool-call', title: '提交审查', detail: '系统记录变更摘要、风险点和需要核对的接口契约。', status: 'active' },
      ],
    },
    {
      id: 'merge-findings',
      title: 'Merge Findings',
      description: '审查反馈和实现结果汇总，冲突结论被消解，形成一个统一交付面。',
      activeNodes: ['reviewer', 'merge'],
      activePaths: ['reviewer-merge'],
      packet: { from: 'reviewer', to: 'merge', label: 'notes' },
      traceEvents: [
        { id: 'findings-merged', type: 'repair', title: '汇总反馈', detail: '系统记录采纳的反馈、丢弃的重复项和仍需说明的风险。', status: 'active' },
      ],
    },
    {
      id: 'deliver-answer',
      title: 'Deliver Answer',
      description: '调度器输出最终结果，把多条工作流折叠成用户可理解、可执行的收敛答案。',
      activeNodes: ['merge', 'answer'],
      activePaths: ['merge-answer'],
      packet: { from: 'merge', to: 'answer', label: 'final' },
      traceEvents: [
        { id: 'answer-delivered', type: 'output', title: '交付结果', detail: '系统记录最终答案、贡献来源和被隐藏的协作过程。', status: 'active' },
      ],
    },
  ],
}
