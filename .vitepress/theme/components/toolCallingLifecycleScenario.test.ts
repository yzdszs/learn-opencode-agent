import { describe, expect, test } from 'bun:test'

import { toolCallingModes } from './toolCallingLifecycleScenario'

describe('toolCallingModes', () => {
  test('提供成功、参数错误、工具失败和重试修复四种模式', () => {
    expect(toolCallingModes.map((mode) => mode.id)).toEqual([
      'success',
      'argument-error',
      'tool-failure',
      'retry-repair',
    ])
  })

  test('参数错误模式覆盖 Validator 拦截与模型修复链路', () => {
    const argumentError = toolCallingModes.find((mode) => mode.id === 'argument-error')

    expect(argumentError?.steps.map((step) => step.phase)).toEqual([
      'decide',
      'validate',
      'repair',
      'decide',
      'execute',
    ])
    expect(argumentError?.steps[1].output).toContain('missing')
    expect(argumentError?.steps[3].output).toContain('city')
  })

  test('失败与重试模式包含生产场景中的结构化错误信号', () => {
    const toolFailure = toolCallingModes.find((mode) => mode.id === 'tool-failure')
    const retryRepair = toolCallingModes.find((mode) => mode.id === 'retry-repair')

    expect(toolFailure?.steps.some((step) => step.output?.includes('tool_timeout'))).toBe(true)
    expect(retryRepair?.steps.some((step) => step.output?.includes('repeated_tool_call'))).toBe(true)
    expect(retryRepair?.steps.at(-1)?.output).toContain('明确城市名')
  })
})
