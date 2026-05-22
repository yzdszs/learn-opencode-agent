<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import SystemMotionPlayer from './SystemMotionPlayer.vue'
import FlowExperimentCanvas from './FlowExperimentCanvas.vue'
import { animationLabExperiments } from '../../data/animation-lab-experiments'

const selectedId = ref(animationLabExperiments[0]?.id ?? '')
const selected = computed(
  () => animationLabExperiments.find((item) => item.id === selectedId.value) ?? animationLabExperiments[0]
)

function sync() {
  if (typeof window === 'undefined') {
    return
  }

  const hash = decodeURIComponent(window.location.hash.replace(/^#/, ''))
  if (animationLabExperiments.some((item) => item.id === hash)) {
    selectedId.value = hash
  }
}

onMounted(() => {
  sync()
  window.addEventListener('hashchange', sync)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', sync)
})
</script>

<template>
  <section class="animation-lab-index">
    <header class="lab-hero">
      <p class="lab-eyebrow">Animation Lab</p>
      <h1>动画实验室</h1>
      <p>用系统运动展示 Agent 运行闭环、工程执行、上下文管理、RAG、结构化输出、流式控制、模型路由与多 Agent 协作，把抽象机制拆成可观察、可暂停、可复盘的轨迹。</p>
    </header>

    <section class="lab-workspace" aria-label="动画实验库">
      <div class="lab-stage">
        <template v-if="selected?.experiment && selected.canvas">
          <SystemMotionPlayer
            :key="selected.id"
            :experiment="selected.experiment"
          >
            <template #default="{ step }">
              <FlowExperimentCanvas :step="step" :config="selected.canvas" />
            </template>
          </SystemMotionPlayer>

          <section v-if="selected.practiceLinks.length" class="lab-practice-links" aria-label="关联实践">
            <div>
              <p class="lab-eyebrow">Practice Links</p>
              <h2>对应实践动画</h2>
              <p>这里归集了实践篇里和当前机制最接近的章节演示。实验室看机制，实践篇看完整代码。</p>
            </div>
            <div class="practice-link-list">
              <a
                v-for="link in selected.practiceLinks"
                :key="link.href"
                :href="link.href"
                class="practice-link"
              >
                {{ link.title }}
              </a>
            </div>
          </section>
        </template>

        <div v-else class="lab-placeholder">
          <p class="lab-eyebrow">No Experiment</p>
          <h2>{{ selected?.title ?? '尚未选择' }}</h2>
          <p>{{ selected?.summary }}</p>
        </div>
      </div>
    </section>
  </section>
</template>

<style scoped>
.animation-lab-index {
  display: grid;
  gap: 22px;
  min-width: 0;
  padding: 10px 0 30px;
}

.lab-hero {
  display: grid;
  gap: 8px;
  max-width: 720px;
  min-width: 0;
  padding-top: 8px;
}

.lab-eyebrow {
  margin: 0;
  color: #0284c7;
  font-family: var(--vp-font-family-mono);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.3;
  text-transform: uppercase;
}

.lab-hero h1 {
  margin: 0;
  border: none;
  color: var(--vp-c-text-1);
  font-size: clamp(2rem, 5vw, 3rem);
  line-height: 1.12;
  text-wrap: balance;
}

.lab-hero p:last-child {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 1rem;
  line-height: 1.8;
  text-wrap: pretty;
}

.lab-workspace {
  min-width: 0;
}

.lab-stage {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.lab-placeholder {
  display: grid;
  gap: 10px;
  min-height: 360px;
  min-width: 0;
  align-content: center;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 30%),
    #0f172a;
  color: #e5edf7;
}

.lab-placeholder h2 {
  margin: 0;
  border: none;
  color: #f8fafc;
  font-size: 1.28rem;
  line-height: 1.3;
}

.lab-placeholder p:not(.lab-eyebrow) {
  margin: 0;
  color: #b6c3d1;
  font-size: 0.9rem;
  line-height: 1.7;
}

.lab-practice-links {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, auto);
  gap: 18px;
  align-items: center;
  min-width: 0;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 8px;
  background: #0f172a;
  color: #e5edf7;
}

.lab-practice-links h2 {
  margin: 0;
  border: none;
  color: #f8fafc;
  font-size: 1rem;
  line-height: 1.35;
}

.lab-practice-links p:not(.lab-eyebrow) {
  margin: 6px 0 0;
  color: #b6c3d1;
  font-size: 0.86rem;
  line-height: 1.65;
}

.practice-link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  min-width: 0;
}

.practice-link {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 11px;
  border: 1px solid rgba(125, 211, 252, 0.28);
  border-radius: 8px;
  background: rgba(14, 165, 233, 0.1);
  color: #dff7ff;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1.25;
  text-decoration: none;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;
}

.practice-link:hover {
  border-color: rgba(125, 211, 252, 0.66);
  background: rgba(14, 165, 233, 0.2);
  color: #ffffff;
}

@media (max-width: 820px) {
  .animation-lab-index {
    gap: 18px;
    padding-top: 2px;
  }

  .lab-practice-links {
    grid-template-columns: 1fr;
  }

  .practice-link-list {
    justify-content: flex-start;
  }
}
</style>
