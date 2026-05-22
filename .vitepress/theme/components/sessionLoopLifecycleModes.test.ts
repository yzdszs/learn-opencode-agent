import { describe, expect, test } from 'bun:test'

import { sessionLoopLifecycleModes } from './sessionLoopLifecycleModes'

describe('sessionLoopLifecycleModes', () => {
  test('覆盖正常循环、权限暂停、恢复继续、上下文压缩和 doom loop 截断', () => {
    expect(sessionLoopLifecycleModes.map((mode) => mode.id)).toEqual([
      'normal',
      'permission-wait',
      'resume',
      'context-compact',
      'doom-loop-stop',
    ])
  })

  test('权限暂停和恢复继续保留 pause/resume 关键状态', () => {
    const wait = sessionLoopLifecycleModes.find((mode) => mode.id === 'permission-wait')
    const resume = sessionLoopLifecycleModes.find((mode) => mode.id === 'resume')

    expect(wait?.scenario.steps.some((step) => step.id === 'permission-wait')).toBe(true)
    expect(resume?.scenario.steps.some((step) => step.id === 'resume-from-approval')).toBe(true)
  })

  test('压缩和 doom loop 场景包含对应返回分支信号', () => {
    const compact = sessionLoopLifecycleModes.find((mode) => mode.id === 'context-compact')
    const doom = sessionLoopLifecycleModes.find((mode) => mode.id === 'doom-loop-stop')

    expect(compact?.scenario.steps.some((step) => step.codeLabel?.includes('SessionCompaction'))).toBe(true)
    expect(doom?.scenario.steps.some((step) => step.codeLabel?.includes('DOOM_LOOP_THRESHOLD'))).toBe(true)
  })
})
