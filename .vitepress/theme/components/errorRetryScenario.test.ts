import { describe, expect, test } from 'bun:test'

import { errorRetryModes } from './errorRetryScenario'

describe('errorRetryModes', () => {
  test('覆盖限流、5xx、不可重试参数错误、工具异常和 maxIterations', () => {
    expect(errorRetryModes.map((mode) => mode.id)).toEqual([
      'rate-limit',
      'server-error',
      'invalid-arguments',
      'tool-exception',
      'max-iterations',
    ])
  })

  test('可重试故障包含 backoff 与 retry 阶段', () => {
    const serverError = errorRetryModes.find((mode) => mode.id === 'server-error')

    expect(serverError?.steps.map((step) => step.phase)).toContain('backoff')
    expect(serverError?.steps.map((step) => step.phase)).toContain('retry')
  })

  test('不可重试参数错误和 maxIterations 给出结构化终止信号', () => {
    const invalidArguments = errorRetryModes.find((mode) => mode.id === 'invalid-arguments')
    const maxIterations = errorRetryModes.find((mode) => mode.id === 'max-iterations')

    expect(invalidArguments?.steps.some((step) => step.output?.includes('retryable: false'))).toBe(true)
    expect(maxIterations?.steps.some((step) => step.output?.includes('Max iterations exceeded'))).toBe(true)
  })
})
