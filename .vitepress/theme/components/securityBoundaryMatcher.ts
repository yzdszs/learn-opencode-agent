import type { SecurityScenario, SecurityRule } from './types'

export function findMatchedSecurityRuleIds(scenario: SecurityScenario, rules: SecurityRule[]): string[] {
  const attackVector = scenario.attackVector?.toLowerCase() ?? ''
  const input = scenario.input.toLowerCase()

  return rules
    .filter((rule) => {
      const ruleId = rule.id.toLowerCase()
      const triggerKeyword = rule.triggerKeyword?.toLowerCase() ?? ''
      return attackVector.includes(ruleId) || (triggerKeyword.length > 0 && input.includes(triggerKeyword))
    })
    .map((rule) => rule.id)
}
