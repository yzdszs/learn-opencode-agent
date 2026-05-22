import type { FlowScenario } from './flowScenario'
import { sessionLoopLifecycleScenario } from './sessionLoopLifecycleScenario'

export type SessionLoopModeId = 'normal' | 'permission-wait' | 'resume' | 'context-compact' | 'doom-loop-stop'

export interface SessionLoopMode {
  id: SessionLoopModeId
  label: string
  scenario: FlowScenario
}

export const sessionLoopLifecycleModes: SessionLoopMode[] = [
  {
    id: 'normal',
    label: '正常循环',
    scenario: sessionLoopLifecycleScenario,
  },
  {
    id: 'permission-wait',
    label: '权限暂停',
    scenario: {
      title: 'Session 主循环：权限暂停',
      summary: '工具调用命中高风险权限，processor 写入 blocked 状态并暂停，等待用户确认。',
      lanes: sessionLoopLifecycleScenario.lanes,
      steps: [
        ...sessionLoopLifecycleScenario.steps.slice(0, 4),
        {
          id: 'permission-wait',
          title: 'permission_wait',
          detail: 'PermissionNext.ask 返回待确认状态，执行循环不继续调用工具。',
          lane: 'processor',
          codeLabel: 'blocked = PermissionNext.ask(...)',
          kind: 'warning',
        },
        {
          id: 'stop-for-approval',
          title: 'stop 等待确认',
          detail: '当前轮返回 stop，前端展示审批 UI，Session 保留可恢复上下文。',
          lane: 'result',
          codeLabel: 'return "stop"',
          kind: 'decision',
        },
      ],
      edges: [
        { from: 'prompt', to: 'processor' },
        { from: 'processor', to: 'stream' },
        { from: 'stream', to: 'tool-call' },
        { from: 'tool-call', to: 'permission-wait', label: 'ask' },
        { from: 'permission-wait', to: 'stop-for-approval', label: 'blocked' },
      ],
    },
  },
  {
    id: 'resume',
    label: '恢复继续',
    scenario: {
      title: 'Session 主循环：恢复继续',
      summary: '用户批准后把审批结果写回 tool_result，processor 从原 Session 上下文继续执行。',
      lanes: sessionLoopLifecycleScenario.lanes,
      steps: [
        {
          id: 'resume-from-approval',
          title: 'resume from approval',
          detail: '审批结果进入 Session，解除 blocked 状态。',
          lane: 'entry',
          codeLabel: 'session.resume(approved)',
          kind: 'commit',
        },
        {
          id: 'restore-tool-call',
          title: '恢复 tool_call',
          detail: '读取之前暂停的 ToolPart，继续执行或写入拒绝结果。',
          lane: 'parts',
          codeLabel: 'MessageV2.ToolPart',
        },
        {
          id: 'tool-result',
          title: '结果回写 Parts',
          detail: '工具结果进入消息流，前端和模型看到同一份状态。',
          lane: 'parts',
          codeLabel: 'role: tool / tool_result',
        },
        {
          id: 'stream',
          title: '继续 LLM Stream',
          detail: '模型基于审批后的工具结果继续生成最终回复。',
          lane: 'llm',
          codeLabel: 'LLM.stream(messages)',
        },
        {
          id: 'continue',
          title: 'continue',
          detail: '恢复后的处理完成，Session 回到正常可交互状态。',
          lane: 'result',
          kind: 'commit',
        },
      ],
      edges: [
        { from: 'resume-from-approval', to: 'restore-tool-call' },
        { from: 'restore-tool-call', to: 'tool-result' },
        { from: 'tool-result', to: 'stream' },
        { from: 'stream', to: 'continue' },
      ],
    },
  },
  {
    id: 'context-compact',
    label: '上下文压缩',
    scenario: {
      title: 'Session 主循环：上下文压缩',
      summary: '上下文接近上限时，processor 返回 compact，压缩旧消息后重新组装上下文继续。',
      lanes: sessionLoopLifecycleScenario.lanes,
      steps: [
        ...sessionLoopLifecycleScenario.steps.slice(0, 3),
        {
          id: 'needs-compaction',
          title: 'needsCompaction',
          detail: 'token 预算接近上限，当前轮不继续扩张上下文。',
          lane: 'processor',
          codeLabel: 'needsCompaction = true',
          kind: 'warning',
        },
        {
          id: 'session-compaction',
          title: 'SessionCompaction',
          detail: '压缩旧消息和工具输出，保留摘要与关键证据。',
          lane: 'result',
          codeLabel: 'SessionCompaction.run()',
          kind: 'decision',
        },
        {
          id: 'stream',
          title: '压缩后继续',
          detail: '重新组装 messages 后再次进入 LLM stream。',
          lane: 'llm',
          codeLabel: 'compact -> continue',
        },
      ],
      edges: [
        { from: 'prompt', to: 'processor' },
        { from: 'processor', to: 'stream' },
        { from: 'stream', to: 'needs-compaction' },
        { from: 'needs-compaction', to: 'session-compaction' },
        { from: 'session-compaction', to: 'stream', style: 'dashed', label: 'compressed context' },
      ],
    },
  },
  {
    id: 'doom-loop-stop',
    label: 'Doom loop',
    scenario: {
      title: 'Session 主循环：doom loop 截断',
      summary: '模型重复相同工具调用时，processor 触发循环防护并停止等待用户介入。',
      lanes: sessionLoopLifecycleScenario.lanes,
      steps: [
        ...sessionLoopLifecycleScenario.steps.slice(0, 4),
        {
          id: 'same-tool-call',
          title: '重复 tool_call',
          detail: '连续多次出现相同工具名和参数，说明模型没有吸收 Observation。',
          lane: 'parts',
          codeLabel: 'same tool + same args',
          kind: 'warning',
        },
        {
          id: 'doom-loop-stop',
          title: 'doom loop stop',
          detail: '达到阈值后停止继续调用工具，把控制权交还给用户。',
          lane: 'result',
          codeLabel: 'DOOM_LOOP_THRESHOLD / permission: "doom_loop"',
          kind: 'decision',
        },
      ],
      edges: [
        { from: 'prompt', to: 'processor' },
        { from: 'processor', to: 'stream' },
        { from: 'stream', to: 'tool-call' },
        { from: 'tool-call', to: 'same-tool-call' },
        { from: 'same-tool-call', to: 'doom-loop-stop', label: 'threshold exceeded' },
      ],
    },
  },
]
