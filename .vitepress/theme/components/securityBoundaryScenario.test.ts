import { describe, expect, test } from 'bun:test'

import { securityBoundaryScenarios } from './securityBoundaryScenario'

describe('securityBoundaryScenarios', () => {
  test('覆盖正常请求、直接注入、间接注入、越权工具调用和输出泄露', () => {
    expect(securityBoundaryScenarios.scenarios.map((scenario) => scenario.meta.id)).toEqual([
      'normal',
      'direct-injection',
      'indirect-injection',
      'tool-escalation',
      'output-leak',
    ])
  })

  test('每类攻击都能命中至少一个防护规则', () => {
    const attackScenarios = securityBoundaryScenarios.scenarios.filter((scenario) => scenario.expectedVerdict === 'block')

    expect(attackScenarios.every((scenario) => scenario.attackVector && scenario.attackVector.length > 0)).toBe(true)
    expect(securityBoundaryScenarios.rules.map((rule) => rule.id)).toContain('system prompt')
    expect(securityBoundaryScenarios.rules.map((rule) => rule.id)).toContain('write_file')
  })
})
