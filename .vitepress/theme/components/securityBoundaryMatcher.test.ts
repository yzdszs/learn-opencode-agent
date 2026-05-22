import { describe, expect, test } from 'bun:test'

import { findMatchedSecurityRuleIds } from './securityBoundaryMatcher'
import { securityBoundaryScenarios } from './securityBoundaryScenario'

describe('findMatchedSecurityRuleIds', () => {
  test('大小写不一致时仍能匹配 AI ASSISTANT 伪装规则', () => {
    const scenario = securityBoundaryScenarios.scenarios.find((item) => item.meta.id === 'indirect-injection')
    if (!scenario) throw new Error('missing indirect-injection scenario')

    expect(findMatchedSecurityRuleIds(scenario, securityBoundaryScenarios.rules)).toContain('AI ASSISTANT:')
  })
})
