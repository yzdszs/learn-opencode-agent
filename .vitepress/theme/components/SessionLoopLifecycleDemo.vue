<template>
  <div class="sll-root">
    <div class="sll-mode-row" aria-label="Session 主循环模式">
      <button
        v-for="mode in sessionLoopLifecycleModes"
        :key="mode.id"
        class="sll-mode-btn"
        :class="{ active: mode.id === activeModeId }"
        type="button"
        @click="activeModeId = mode.id"
      >
        {{ mode.label }}
      </button>
    </div>

    <FlowScenarioDemo
      :scenario="activeMode.scenario"
      variant="decision"
      :interval-ms="1550"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import FlowScenarioDemo from './FlowScenarioDemo.vue'
import { sessionLoopLifecycleModes, type SessionLoopModeId } from './sessionLoopLifecycleModes'

const activeModeId = ref<SessionLoopModeId>('normal')
const activeMode = computed(() => sessionLoopLifecycleModes.find((mode) => mode.id === activeModeId.value) ?? sessionLoopLifecycleModes[0])
</script>

<style scoped>
.sll-root {
  margin: 1.5rem 0;
}

.sll-mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: -0.5rem;
}

.sll-mode-btn {
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-2);
  cursor: pointer;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.35rem 0.7rem;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}

.sll-mode-btn:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-brand-2);
}

.sll-mode-btn.active {
  background: rgba(13, 148, 136, 0.1);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
