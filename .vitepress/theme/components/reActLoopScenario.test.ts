import { describe, expect, test } from 'bun:test'

import { reActLoopModes } from './reActLoopScenario'

describe('reActLoopModes', () => {
  test('覆盖成功、Action 格式错误、空观察和重复 Action 四种轨迹', () => {
    expect(reActLoopModes.map((mode) => mode.id)).toEqual([
      'success',
      'action-format-error',
      'empty-observation',
      'repeated-action',
    ])
  })

  test('Action 格式错误轨迹包含 Parser 拦截和修复后的 Action', () => {
    const mode = reActLoopModes.find((item) => item.id === 'action-format-error')

    expect(mode?.steps.map((step) => step.phase)).toContain('parser')
    expect(mode?.steps.some((step) => step.observation?.includes('parse_error'))).toBe(true)
    expect(mode?.steps.at(-1)?.finalAnswer).toContain('北京')
  })

  test('重复 Action 轨迹以 loop guard 终止无意义重试', () => {
    const mode = reActLoopModes.find((item) => item.id === 'repeated-action')

    expect(mode?.steps.some((step) => step.observation?.includes('repeated_action'))).toBe(true)
    expect(mode?.completionLog).toContain('重复 Action')
  })
})
