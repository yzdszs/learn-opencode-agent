<script setup lang="ts">
import { computed, ref } from 'vue'
import type { SecurityScenario, SecurityRule } from './types'
import { findMatchedSecurityRuleIds } from './securityBoundaryMatcher'

type SecurityStageKey = 'risk' | 'permission' | 'approval' | 'runtime'
type ApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected'

interface SecurityStageMeta {
  id: SecurityStageKey
  label: '风险分级' | '最小权限' | '确认机制' | '运行时校验'
  summary: string
  risk: string
}

const props = defineProps<{ scenarios: SecurityScenario[]; rules: SecurityRule[] }>()

const currentIdx = ref(0)
const isRunning = ref(false)
const verdict = ref<'allow' | 'block' | null>(null)
const matchedRules = ref<string[]>([])
const approvalStatus = ref<ApprovalStatus>('none')
const activeStage = ref<SecurityStageKey>('risk')
let timer: ReturnType<typeof setTimeout> | null = null

const stages: SecurityStageMeta[] = [
  {
    id: 'risk',
    label: '风险分级',
    summary: '先判断这次动作做错后的破坏半径，再决定后续要多严格地收口。',
    risk: '如果一上来只看工具名而不看后果，危险写操作和普通写操作会被混在一起。'
  },
  {
    id: 'permission',
    label: '最小权限',
    summary: '默认先收紧角色权限，不让模型一开始就看到和调用所有能力。',
    risk: '默认给满权限最省事，但一旦上下文出错，破坏半径会直接放大。'
  },
  {
    id: 'approval',
    label: '确认机制',
    summary: '高风险动作不能只弹个提醒，而要让执行循环真正挂起等待批准。',
    risk: '如果确认只是 UI 文案，不和执行暂停绑定，就不是安全协议。'
  },
  {
    id: 'runtime',
    label: '运行时校验',
    summary: '最后一道边界发生在真正执行工具之前，负责做路径、参数和范围的硬校验。',
    risk: '只靠 Prompt 让模型自觉克制，最终一定会在越权路径上失守。'
  }
]

const scenario = computed<SecurityScenario>(() => props.scenarios[currentIdx.value])

const matchedRuleDetails = computed(() =>
  props.rules.filter(rule => matchedRules.value.includes(rule.id))
)

const inferredRiskLevel = computed(() => {
  const levelRank: Record<SecurityRule['level'], number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4
  }

  const topMatchedRule = matchedRuleDetails.value.sort((a, b) => levelRank[b.level] - levelRank[a.level])[0]
  return topMatchedRule?.level ?? 'low'
})

const permissionBaseline = computed(() => {
  const highRisk = inferredRiskLevel.value === 'high' || inferredRiskLevel.value === 'critical'
  const isInjection = scenario.value.meta.id === 'injection'

  return {
    role: highRisk ? '受限执行者' : '普通编码助手',
    allow: highRisk
      ? ['只读查看工作区', '读取 src/ 目录', '生成待确认操作提案']
      : ['读取 src/ 目录', '修改授权文件', '记录审计日志'],
    deny: isInjection
      ? ['读取系统目录', '输出系统提示词', '越权列举敏感文件']
      : ['删除生产目录', '访问未授权路径', '直接执行高危命令']
  }
})

const requiresApproval = computed(() => {
  if (scenario.value.expectedVerdict === 'block') return false
  return inferredRiskLevel.value === 'high' || inferredRiskLevel.value === 'critical'
})

const runtimeStatus = computed(() => {
  if (scenario.value.expectedVerdict === 'block') return 'block'
  if (requiresApproval.value && approvalStatus.value !== 'approved') return 'require-approval'
  return 'allow'
})

const activeStageMeta = computed(() => stages.find(stage => stage.id === activeStage.value) ?? stages[0])

function selectScenario(idx: number) {
  if (isRunning.value) return
  currentIdx.value = idx
  reset()
}

function changeStage(stage: SecurityStageKey) {
  activeStage.value = stage
}

function runCheck() {
  if (isRunning.value) return
  reset()
  isRunning.value = true

  const s = scenario.value
  const triggered = findMatchedSecurityRuleIds(s, props.rules)

  timer = setTimeout(() => {
    matchedRules.value = triggered
    verdict.value = s.expectedVerdict
    approvalStatus.value = triggered.length > 0 && s.expectedVerdict === 'allow' ? 'pending' : 'none'
    isRunning.value = false
  }, 700)
}

function approveRequest() {
  approvalStatus.value = 'approved'
}

function rejectRequest() {
  approvalStatus.value = 'rejected'
}

function reset() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  isRunning.value = false
  verdict.value = null
  matchedRules.value = []
  approvalStatus.value = 'none'
}

function verdictLabel(result: 'allow' | 'block' | null) {
  if (result === 'allow') return '允许'
  if (result === 'block') return '拦截'
  return '—'
}

function riskTone(level: SecurityRule['level'] | 'low') {
  const map: Record<string, string> = {
    low: 'tone-low',
    medium: 'tone-medium',
    high: 'tone-high',
    critical: 'tone-critical'
  }
  return map[level]
}

function approvalLabel(status: ApprovalStatus) {
  const labels: Record<ApprovalStatus, string> = {
    none: '无需确认',
    pending: '等待批准',
    approved: '已批准',
    rejected: '已拒绝'
  }
  return labels[status]
}
</script>

<template>
  <div class="sbd-root">
    <div class="sbd-header">
      <div class="sbd-title-row">
        <span class="sbd-title">安全协议状态机</span>
        <span class="sbd-badge">Ch31 · Security</span>
      </div>
      <div class="sbd-actions">
        <button class="sbd-btn-primary" :disabled="isRunning" @click="runCheck">
          {{ isRunning ? '检查中…' : '执行安全检查' }}
        </button>
        <button class="sbd-btn-ghost" @click="reset">重置</button>
      </div>
    </div>

    <div class="sbd-stage-tabs" role="tablist" aria-label="安全协议阶段切换">
      <button
        v-for="stage in stages"
        :key="stage.id"
        type="button"
        class="sbd-stage-tab"
        :class="{ active: activeStage === stage.id }"
        :aria-selected="activeStage === stage.id"
        @click="changeStage(stage.id)"
      >
        <span>{{ stage.label }}</span>
      </button>
    </div>

    <div class="sbd-tabs">
      <button
        v-for="(s, i) in scenarios"
        :key="s.meta.id"
        class="sbd-tab"
        :class="{ active: currentIdx === i, [s.meta.tone]: true }"
        @click="selectScenario(i)"
      >
        {{ s.meta.label }}
      </button>
    </div>

    <div class="sbd-body">
      <div class="sbd-panel">
        <div class="sbd-panel-header">当前请求</div>
        <div class="sbd-input-box">{{ scenario.input }}</div>
        <div v-if="scenario.attackVector" class="sbd-attack-label">
          攻击向量: <code>{{ scenario.attackVector }}</code>
        </div>
      </div>

      <Transition name="sbd-stage-fade" mode="out-in">
        <div :key="activeStage" class="sbd-panel sbd-protocol-panel">
          <div class="sbd-panel-header">{{ activeStageMeta.label }}</div>

          <div v-if="activeStage === 'risk'" class="sbd-stage-card">
            <div class="sbd-risk-pill" :class="riskTone(inferredRiskLevel)">
              风险等级：{{ inferredRiskLevel.toUpperCase() }}
            </div>
            <p>{{ activeStageMeta.summary }}</p>
            <div class="sbd-rule-list">
              <div
                v-for="rule in rules"
                :key="rule.id"
                class="sbd-rule"
                :class="{
                  triggered: matchedRules.includes(rule.id),
                  scanning: isRunning
                }"
              >
                <div class="sbd-rule-top">
                  <span class="sbd-rule-name">{{ rule.name }}</span>
                  <span class="sbd-rule-level" :class="rule.level">{{ rule.level }}</span>
                </div>
                <div class="sbd-rule-desc">{{ rule.description }}</div>
              </div>
            </div>
          </div>

          <div v-else-if="activeStage === 'permission'" class="sbd-stage-card">
            <div class="sbd-permission-role">{{ permissionBaseline.role }}</div>
            <div class="sbd-permission-grid">
              <div class="sbd-permission-block">
                <h5>默认允许</h5>
                <ul>
                  <li v-for="item in permissionBaseline.allow" :key="item">{{ item }}</li>
                </ul>
              </div>
              <div class="sbd-permission-block deny">
                <h5>默认禁止</h5>
                <ul>
                  <li v-for="item in permissionBaseline.deny" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-else-if="activeStage === 'approval'" class="sbd-stage-card">
            <div class="sbd-approval-pill" :class="approvalStatus">
              {{ requiresApproval ? '需要人工确认' : '无需人工确认' }}
            </div>
            <p>{{ activeStageMeta.summary }}</p>
            <div class="sbd-approval-status">
              当前状态：<strong>{{ approvalLabel(approvalStatus) }}</strong>
            </div>
            <div v-if="requiresApproval" class="sbd-approval-actions">
              <button class="sbd-btn-primary" @click="approveRequest">批准执行</button>
              <button class="sbd-btn-ghost" @click="rejectRequest">拒绝执行</button>
            </div>
          </div>

          <div v-else class="sbd-stage-card">
            <div class="sbd-runtime-line">
              <span>规则命中</span>
              <strong>{{ matchedRules.length > 0 ? matchedRules.join(', ') : '无' }}</strong>
            </div>
            <div class="sbd-runtime-line">
              <span>权限基线</span>
              <strong>{{ permissionBaseline.role }}</strong>
            </div>
            <div class="sbd-runtime-line">
              <span>确认状态</span>
              <strong>{{ approvalLabel(approvalStatus) }}</strong>
            </div>
            <div class="sbd-runtime-line">
              <span>最终执行状态</span>
              <strong>{{ runtimeStatus }}</strong>
            </div>
            <div class="sbd-verdict" :class="runtimeStatus === 'allow' ? 'allow' : 'block'">
              <div class="sbd-verdict-label">{{ verdictLabel(verdict) }}</div>
              <div class="sbd-verdict-reason">{{ scenario.reason }}</div>
            </div>
          </div>
        </div>
      </Transition>

      <div class="sbd-panel">
        <div class="sbd-panel-header">当前阶段说明</div>
        <div class="sbd-side-block">
          <h5>{{ activeStageMeta.label }}</h5>
          <p>{{ activeStageMeta.summary }}</p>
        </div>
        <div class="sbd-side-block risk">
          <h5>最容易犯的错</h5>
          <p>{{ activeStageMeta.risk }}</p>
        </div>
        <div v-if="scenario.recommendation" class="sbd-side-block">
          <h5>建议</h5>
          <p>{{ scenario.recommendation }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./SecurityBoundaryDemo.css"></style>
