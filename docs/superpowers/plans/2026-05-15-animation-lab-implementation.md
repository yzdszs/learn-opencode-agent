# Animation Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `/animation-lab/` module with a reusable system-motion experiment framework and the first flagship experiment, `Agent 运行闭环`.

**Architecture:** Add a small Vue component cluster under `.vitepress/theme/components/animation-lab/`, with typed experiment data in `.vitepress/theme/data/animation-lab-experiments.ts`. The generic `SystemMotionPlayer` owns step navigation and Trace collapse state, while `AgentLoopExperiment` owns the first experiment canvas and `TracePanel` owns runtime trace display.

**Tech Stack:** VitePress, Vue 3 SFC, TypeScript, CSS animations, existing `scripts/check-*.mjs`, Bun scripts

---

## Scope Check

The spec describes one module and one first experiment. It is small enough for one implementation plan.

Keep the first version focused:

- Create the reusable player, Trace panel, typed experiment data, and first Agent loop experiment
- Add `/animation-lab/` as an independent page and visible site entry
- Do not migrate existing animation components
- Do not add a new animation library
- Do not build an experiment editor, dynamic routing system, or 3D scene

Reference spec:

- `docs/superpowers/specs/2026-05-15-animation-lab-design.md`

## File Structure

### Create

- `.vitepress/theme/components/animation-lab/type.ts`
  - Shared type contract for experiments, steps, motion packets, trace events, and canvas nodes
- `.vitepress/theme/data/animation-lab-experiments.ts`
  - First typed experiment data object, `agentLoopExperiment`
- `.vitepress/theme/components/animation-lab/TracePanel.vue`
  - Collapsible runtime Trace panel
- `.vitepress/theme/components/animation-lab/SystemMotionPlayer.vue`
  - Generic step player with previous, next, reset, and Trace collapse controls
- `.vitepress/theme/components/animation-lab/AgentLoopExperiment.vue`
  - First experiment canvas for Agent runtime loop motion
- `.vitepress/theme/components/animation-lab/AnimationLabIndex.vue`
  - Page-level animation lab landing component
- `docs/animation-lab/index.md`
  - VitePress route for the animation lab

### Modify

- `.vitepress/theme/index.ts`
  - Register `AnimationLabIndex` as an async global component
- `.vitepress/config.mts`
  - Add top navigation and root sidebar entry for `/animation-lab/`
- `docs/index.md`
  - Add a home hero action for animation lab
- `.vitepress/theme/components/HomeExploreLinks.vue`
  - Add animation lab to the homepage exploration links
- `scripts/check-navigation-entry.mjs`
  - Extend navigation regression checks to cover animation lab

### Reference

- `.vitepress/theme/components/ToolCallingLifecycle.vue`
- `.vitepress/theme/components/ReActLoopDemo.vue`
- `.vitepress/theme/components/TraceSpanTimelineDemo.vue`
- `.vitepress/theme/components/HomeExploreLinks.vue`
- `.vitepress/theme/index.ts`
- `.vitepress/config.mts`
- `docs/index.md`

---

### Task 1: Add Experiment Types And Data

**Files:**
- Create: `.vitepress/theme/components/animation-lab/type.ts`
- Create: `.vitepress/theme/data/animation-lab-experiments.ts`
- Test: `bun run typecheck`

- [ ] **Step 1: Create the animation lab type contract**

Create `.vitepress/theme/components/animation-lab/type.ts`:

```ts
export type TraceEventType =
  | 'input'
  | 'thinking'
  | 'tool-call'
  | 'observation'
  | 'repair'
  | 'output'

export type TraceEventStatus = 'pending' | 'active' | 'done'

export interface MotionPacket {
  from: string
  to: string
  label: string
}

export interface TraceEvent {
  id: string
  type: TraceEventType
  title: string
  detail: string
  status: TraceEventStatus
}

export interface ExperimentStep {
  id: string
  title: string
  description: string
  activeNodes: string[]
  activePaths: string[]
  packet?: MotionPacket
  traceEvents: TraceEvent[]
}

export interface Experiment {
  id: string
  title: string
  summary: string
  steps: ExperimentStep[]
}

export interface CanvasNode {
  id: string
  label: string
  role: string
}

export interface CanvasPath {
  id: string
  from: string
  to: string
  d: string
}
```

- [ ] **Step 2: Create the first typed experiment data file**

Create `.vitepress/theme/data/animation-lab-experiments.ts`:

```ts
import type { CanvasNode, CanvasPath, Experiment } from '../components/animation-lab/type'

export const agentLoopNodes: CanvasNode[] = [
  { id: 'user', label: 'User', role: '输入' },
  { id: 'planner', label: 'Planner', role: '计划' },
  { id: 'llm', label: 'LLM', role: '推理' },
  { id: 'tool', label: 'Tool', role: '行动' },
  { id: 'observation', label: 'Observation', role: '观察' },
  { id: 'memory', label: 'Memory', role: '上下文' },
  { id: 'final', label: 'Final Answer', role: '输出' },
]

export const agentLoopPaths: CanvasPath[] = [
  { id: 'user-planner', from: 'user', to: 'planner', d: 'M120 260 C190 220 240 190 315 190' },
  { id: 'planner-llm', from: 'planner', to: 'llm', d: 'M350 190 C430 130 520 130 610 190' },
  { id: 'llm-tool', from: 'llm', to: 'tool', d: 'M640 210 C730 225 790 260 840 330' },
  { id: 'tool-observation', from: 'tool', to: 'observation', d: 'M820 360 C720 415 625 425 530 380' },
  { id: 'observation-memory', from: 'observation', to: 'memory', d: 'M500 395 C430 470 320 470 250 390' },
  { id: 'memory-llm', from: 'memory', to: 'llm', d: 'M265 365 C365 300 500 255 605 220' },
  { id: 'llm-final', from: 'llm', to: 'final', d: 'M640 180 C735 120 830 120 900 185' },
]

export const agentLoopExperiment: Experiment = {
  id: 'agent-loop',
  title: 'Agent 运行闭环',
  summary: '从输入、计划、工具调用、观察、修正到最终输出，观察一次 Agent 如何跑完任务。',
  steps: [
    {
      id: 'user-input',
      title: 'User Input',
      description: '用户目标进入系统，Agent 获得任务边界。',
      activeNodes: ['user', 'planner'],
      activePaths: ['user-planner'],
      packet: { from: 'user', to: 'planner', label: 'goal' },
      traceEvents: [
        { id: 'input-received', type: 'input', title: '接收目标', detail: '任务被写入当前运行上下文。', status: 'active' },
      ],
    },
    {
      id: 'plan',
      title: 'Plan',
      description: 'Planner 把目标拆成可执行的下一步。',
      activeNodes: ['planner', 'llm'],
      activePaths: ['planner-llm'],
      packet: { from: 'planner', to: 'llm', label: 'plan' },
      traceEvents: [
        { id: 'plan-created', type: 'thinking', title: '生成计划', detail: '模型选择先确认信息，再调用工具。', status: 'active' },
      ],
    },
    {
      id: 'tool-call',
      title: 'Tool Call',
      description: '模型把一段意图转成明确的工具调用。',
      activeNodes: ['llm', 'tool'],
      activePaths: ['llm-tool'],
      packet: { from: 'llm', to: 'tool', label: 'call' },
      traceEvents: [
        { id: 'tool-dispatched', type: 'tool-call', title: '调用工具', detail: '工具输入被结构化，等待执行结果。', status: 'active' },
      ],
    },
    {
      id: 'observation',
      title: 'Observation',
      description: '工具结果回填，Agent 获得外部世界的新证据。',
      activeNodes: ['tool', 'observation'],
      activePaths: ['tool-observation'],
      packet: { from: 'tool', to: 'observation', label: 'result' },
      traceEvents: [
        { id: 'observation-returned', type: 'observation', title: '观察结果', detail: '工具结果进入观察区，等待模型判断。', status: 'active' },
      ],
    },
    {
      id: 'repair',
      title: 'Repair / Refine',
      description: 'Agent 根据观察结果更新上下文，并修正下一步。',
      activeNodes: ['observation', 'memory', 'llm'],
      activePaths: ['observation-memory', 'memory-llm'],
      packet: { from: 'memory', to: 'llm', label: 'context' },
      traceEvents: [
        { id: 'context-refined', type: 'repair', title: '修正上下文', detail: '新证据改变下一步推理路径。', status: 'active' },
      ],
    },
    {
      id: 'final-answer',
      title: 'Final Answer',
      description: '模型基于最新上下文给出稳定输出。',
      activeNodes: ['llm', 'final'],
      activePaths: ['llm-final'],
      packet: { from: 'llm', to: 'final', label: 'answer' },
      traceEvents: [
        { id: 'answer-ready', type: 'output', title: '生成输出', detail: '最终答案写入响应通道。', status: 'active' },
      ],
    },
  ],
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS. If it fails because the import path is wrong, fix the relative path before continuing.

- [ ] **Step 4: Commit**

```bash
git add .vitepress/theme/components/animation-lab/type.ts .vitepress/theme/data/animation-lab-experiments.ts
git commit -m "feat(animation-lab): add experiment data contract"
```

---

### Task 2: Build The Collapsible Trace Panel

**Files:**
- Create: `.vitepress/theme/components/animation-lab/TracePanel.vue`
- Test: `bun run typecheck`

- [ ] **Step 1: Create `TracePanel.vue` with typed props and emits**

Use this contract:

```vue
<script setup lang="ts">
import type { ExperimentStep } from './type'

defineProps<{
  step: ExperimentStep
  stepIndex: number
  totalSteps: number
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
}>()
</script>
```

- [ ] **Step 2: Implement the expanded and collapsed templates**

Template requirements:

```vue
<template>
  <aside class="trace-panel" :class="{ collapsed }">
    <button class="trace-toggle" type="button" @click="emit('toggle')" :aria-expanded="!collapsed">
      {{ collapsed ? '展开 Trace' : '收起 Trace' }}
    </button>

    <div v-if="collapsed" class="trace-rail">
      <span>{{ stepIndex + 1 }}/{{ totalSteps }}</span>
      <strong>{{ step.title }}</strong>
    </div>

    <div v-else class="trace-body">
      <p class="trace-kicker">TRACE {{ stepIndex + 1 }} / {{ totalSteps }}</p>
      <h3>{{ step.title }}</h3>
      <p>{{ step.description }}</p>
      <ol class="trace-events">
        <li
          v-for="event in step.traceEvents"
          :key="event.id"
          :class="['trace-event', event.type, event.status]"
        >
          <span>{{ event.type }}</span>
          <strong>{{ event.title }}</strong>
          <p>{{ event.detail }}</p>
        </li>
      </ol>
    </div>
  </aside>
</template>
```

- [ ] **Step 3: Add scoped styles**

Style requirements:

- Expanded panel uses a dark runtime surface
- Collapsed rail is narrow on desktop and one-line on mobile
- No text overlap at mobile widths
- Button has visible focus state
- Use 8px or smaller radius for controls where practical

Use class names prefixed with `trace-` to avoid leaking styles.

- [ ] **Step 4: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .vitepress/theme/components/animation-lab/TracePanel.vue
git commit -m "feat(animation-lab): add trace panel"
```

---

### Task 3: Build The Generic System Motion Player

**Files:**
- Create: `.vitepress/theme/components/animation-lab/SystemMotionPlayer.vue`
- Test: `bun run typecheck`

- [ ] **Step 1: Create the player shell**

Create `.vitepress/theme/components/animation-lab/SystemMotionPlayer.vue` with this script shape:

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import TracePanel from './TracePanel.vue'
import type { Experiment } from './type'

const props = defineProps<{
  experiment: Experiment
}>()

const currentStepIndex = ref(0)
const isTraceCollapsed = ref(false)

const currentStep = computed(() => props.experiment.steps[currentStepIndex.value])
const isFirstStep = computed(() => currentStepIndex.value === 0)
const isLastStep = computed(() => currentStepIndex.value === props.experiment.steps.length - 1)

function previousStep() {
  currentStepIndex.value = Math.max(0, currentStepIndex.value - 1)
}

function nextStep() {
  currentStepIndex.value = Math.min(props.experiment.steps.length - 1, currentStepIndex.value + 1)
}

function resetSteps() {
  currentStepIndex.value = 0
}

function toggleTrace() {
  isTraceCollapsed.value = !isTraceCollapsed.value
}
</script>
```

- [ ] **Step 2: Add slot-based layout**

Template requirements:

```vue
<template>
  <section class="system-motion-player" :class="{ 'trace-collapsed': isTraceCollapsed }">
    <header class="player-header">
      <div>
        <p class="player-kicker">Animation Lab</p>
        <h2>{{ experiment.title }}</h2>
        <p>{{ experiment.summary }}</p>
      </div>
      <div class="player-step-count">{{ currentStepIndex + 1 }} / {{ experiment.steps.length }}</div>
    </header>

    <div class="player-shell">
      <div class="player-canvas">
        <slot
          :step="currentStep"
          :step-index="currentStepIndex"
          :total-steps="experiment.steps.length"
          :trace-collapsed="isTraceCollapsed"
        />
      </div>

      <TracePanel
        :step="currentStep"
        :step-index="currentStepIndex"
        :total-steps="experiment.steps.length"
        :collapsed="isTraceCollapsed"
        @toggle="toggleTrace"
      />
    </div>

    <footer class="player-controls">
      <button type="button" :disabled="isFirstStep" @click="previousStep">上一步</button>
      <button type="button" @click="resetSteps">重置</button>
      <button type="button" :disabled="isLastStep" @click="nextStep">下一步</button>
    </footer>
  </section>
</template>
```

- [ ] **Step 3: Add responsive and reduced-motion styles**

Style requirements:

- Desktop: two columns, canvas expands when Trace collapses
- Mobile: stacked layout, Trace below canvas
- Use CSS grid for the shell
- Use `@media (prefers-reduced-motion: reduce)` to disable transitions
- Keep controls stable so button labels do not resize the layout

- [ ] **Step 4: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .vitepress/theme/components/animation-lab/SystemMotionPlayer.vue
git commit -m "feat(animation-lab): add system motion player"
```

---

### Task 4: Build The Agent Loop Experiment Canvas

**Files:**
- Create: `.vitepress/theme/components/animation-lab/AgentLoopExperiment.vue`
- Test: `bun run typecheck`

- [ ] **Step 1: Create typed props and data imports**

Create `.vitepress/theme/components/animation-lab/AgentLoopExperiment.vue`:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { agentLoopNodes, agentLoopPaths } from '../../data/animation-lab-experiments'
import type { ExperimentStep } from './type'

const props = defineProps<{
  step: ExperimentStep
}>()

const packetClass = computed(() => props.step.packet ? `packet-${props.step.packet.from}-${props.step.packet.to}` : '')

function isNodeActive(id: string) {
  return props.step.activeNodes.includes(id)
}

function isPathActive(id: string) {
  return props.step.activePaths.includes(id)
}
</script>
```

- [ ] **Step 2: Render nodes, paths, packet, and status**

Template requirements:

```vue
<template>
  <div class="agent-loop-canvas">
    <div class="runtime-grid" aria-hidden="true"></div>

    <svg class="runtime-paths" viewBox="0 0 1000 560" role="img" aria-label="Agent 运行闭环路径">
      <path
        v-for="path in agentLoopPaths"
        :key="path.id"
        :class="{ active: isPathActive(path.id) }"
        :data-path="path.id"
        :d="path.d"
      />
    </svg>

    <div
      v-for="node in agentLoopNodes"
      :key="node.id"
      :class="['runtime-node', `node-${node.id}`, { active: isNodeActive(node.id) }]"
    >
      <span>{{ node.role }}</span>
      <strong>{{ node.label }}</strong>
    </div>

    <div v-if="step.packet" :class="['motion-packet', packetClass]">
      {{ step.packet.label }}
    </div>

    <div class="canvas-step-summary">
      <span>{{ step.title }}</span>
      <p>{{ step.description }}</p>
    </div>
  </div>
</template>
```

Use explicit SVG `d` values for each path. Do not generate geometry with complex runtime calculations in the first version.

- [ ] **Step 3: Add visual motion styles**

Style requirements:

- Dark runtime canvas
- Nodes positioned with stable percentages or grid areas
- Active node gets stronger border and glow
- Active path gets visible stroke and subtle dash motion
- Packet moves only for the current step
- Reduced motion disables packet travel and dash animation
- No decorative blobs or unrelated background ornaments

- [ ] **Step 4: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .vitepress/theme/components/animation-lab/AgentLoopExperiment.vue
git commit -m "feat(animation-lab): add agent loop canvas"
```

---

### Task 5: Compose The Animation Lab Page

**Files:**
- Create: `.vitepress/theme/components/animation-lab/AnimationLabIndex.vue`
- Create: `docs/animation-lab/index.md`
- Modify: `.vitepress/theme/index.ts`
- Test: `bun run typecheck`

- [ ] **Step 1: Register a failing global component import**

Modify `.vitepress/theme/index.ts` in `asyncGlobalComponents`:

```ts
['AnimationLabIndex', asyncComponent(() => import('./components/animation-lab/AnimationLabIndex.vue'))],
```

Run:

```bash
bun run typecheck
```

Expected: FAIL if `AnimationLabIndex.vue` has not been created yet.

- [ ] **Step 2: Create `AnimationLabIndex.vue`**

Use this composition:

```vue
<script setup lang="ts">
import SystemMotionPlayer from './SystemMotionPlayer.vue'
import AgentLoopExperiment from './AgentLoopExperiment.vue'
import { agentLoopExperiment } from '../../data/animation-lab-experiments'
</script>

<template>
  <section class="animation-lab-index">
    <header class="lab-hero">
      <p class="lab-eyebrow">Animation Lab</p>
      <h1>动画实验室</h1>
      <p>用系统运动展示 Agent 概念，把抽象机制拆成可观察、可暂停、可复盘的运行轨迹。</p>
    </header>

    <SystemMotionPlayer :experiment="agentLoopExperiment">
      <template #default="{ step }">
        <AgentLoopExperiment :step="step" />
      </template>
    </SystemMotionPlayer>

    <section class="lab-upcoming">
      <p class="lab-eyebrow">Next Experiments</p>
      <h2>后续实验方向</h2>
      <div class="lab-upcoming-grid">
        <article>上下文与记忆流</article>
        <article>多 Agent 调度</article>
        <article>工具调用与权限门</article>
      </div>
    </section>
  </section>
</template>
```

- [ ] **Step 3: Create the VitePress route**

Create `docs/animation-lab/index.md`:

```md
---
title: 动画实验室
description: 用系统运动感展示 AI Agent 概念的互动实验室，从 Agent 运行闭环开始理解输入、计划、工具调用、观察、修正与输出。
---

<AnimationLabIndex />
```

- [ ] **Step 4: Add page-level styles**

In `AnimationLabIndex.vue`, style:

- Hero should be content-focused, not a marketing landing page
- No large gradient hero background
- Experimental component should be the first major viewport signal
- Upcoming cards should be compact and subordinate to the flagship experiment

- [ ] **Step 5: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .vitepress/theme/index.ts .vitepress/theme/components/animation-lab/AnimationLabIndex.vue docs/animation-lab/index.md
git commit -m "feat(animation-lab): add lab page"
```

---

### Task 6: Add Navigation And Regression Checks

**Files:**
- Modify: `.vitepress/config.mts`
- Modify: `docs/index.md`
- Modify: `.vitepress/theme/components/HomeExploreLinks.vue`
- Modify: `scripts/check-navigation-entry.mjs`
- Test: `bun run check:navigation-entry`
- Test: `bun run check:homepage-entry`

- [ ] **Step 1: Add top navigation and root sidebar entries**

Modify `.vitepress/config.mts`:

```ts
themeConfig: {
  nav: [
    { text: '实践篇', link: '/practice/', activeMatch: '/practice/' },
    { text: '中级篇', link: '/intermediate/', activeMatch: '/intermediate/' },
    { text: '动画实验室', link: '/animation-lab/', activeMatch: '/animation-lab/' },
    { text: '面试题专区', link: '/interview/', activeMatch: '/interview/' },
    ...
  ],
  sidebar: {
    '/animation-lab/': [
      { text: '← 返回首页', link: '/' },
      { text: '实验室首页', link: '/animation-lab/' },
      { text: '回到实践篇', link: '/practice/' },
      { text: '进入中级篇', link: '/intermediate/' },
    ],
    '/': [
      { text: '发现中心', link: '/discover/' },
      { text: '动画实验室', link: '/animation-lab/' },
      ...
    ],
  }
}
```

Keep the existing order stable except for inserting animation lab near learning-oriented entries.

- [ ] **Step 2: Add home page entry**

Modify `docs/index.md` hero actions:

```yaml
    - theme: alt
      text: 动画实验室
      link: /animation-lab/
```

Place it after `中级篇` or before `Star 支持本书`.

- [ ] **Step 3: Add homepage exploration card**

Modify `.vitepress/theme/components/HomeExploreLinks.vue`:

```ts
const navLinks = [
  { href: '/discover/', title: '发现中心', desc: '了解站点结构、技术栈和学习收益' },
  { href: '/learning-paths/', title: '学习路径', desc: '按目标选择完整学习路线' },
  { href: '/animation-lab/', title: '动画实验室', desc: '用系统运动观察 Agent 概念如何运行' },
  { href: '/reading-map', title: '阅读地图', desc: '按主题或难度选择阅读顺序' },
]
```

- [ ] **Step 4: Extend navigation regression checks**

Modify `scripts/check-navigation-entry.mjs`:

```js
const requiredNavTexts = ['实践篇', '中级篇', '动画实验室', '面试题专区', '专栏', '本书仓库']
const rootSidebarLinks = ['/discover/', '/animation-lab/', '/practice/', '/intermediate/', '/interview/']
```

Add a homepage entry check:

```js
if (!configContent.includes(`link: '/animation-lab/'`)) {
  issues.push('导航配置缺少动画实验室入口')
}
```

Do not add broad checks that force animation lab into learning paths.

- [ ] **Step 5: Run targeted checks**

Run:

```bash
bun run check:navigation-entry
bun run check:homepage-entry
```

Expected: both commands pass.

- [ ] **Step 6: Commit**

```bash
git add .vitepress/config.mts docs/index.md .vitepress/theme/components/HomeExploreLinks.vue scripts/check-navigation-entry.mjs
git commit -m "feat(animation-lab): add site entry points"
```

---

### Task 7: Polish Responsive Behavior And Motion Safety

**Files:**
- Modify: `.vitepress/theme/components/animation-lab/TracePanel.vue`
- Modify: `.vitepress/theme/components/animation-lab/SystemMotionPlayer.vue`
- Modify: `.vitepress/theme/components/animation-lab/AgentLoopExperiment.vue`
- Test: `bun run typecheck`
- Test: browser validation

- [ ] **Step 1: Verify desktop layout manually in code**

Check these CSS conditions:

- `SystemMotionPlayer` uses two-column grid above tablet width
- `.trace-collapsed` changes the grid so canvas receives more width
- `TracePanel` collapsed rail remains clickable
- `AgentLoopExperiment` canvas has stable min-height and aspect behavior

- [ ] **Step 2: Verify mobile layout manually in code**

Check these CSS conditions:

- Under the mobile breakpoint, canvas and Trace stack vertically
- Node labels do not overlap
- Control buttons wrap cleanly
- Collapsed Trace becomes a horizontal status row

- [ ] **Step 3: Verify reduced motion in code**

Add or confirm this pattern in each animated component:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms;
    animation-iteration-count: 1;
    transition-duration: 0.01ms;
  }
}
```

If a scoped universal selector is too broad inside a component, replace it with explicit animated class selectors.

- [ ] **Step 4: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 5: Start the dev server**

Run:

```bash
bun run dev -- --host 127.0.0.1
```

Expected: VitePress starts and prints a local URL, commonly `http://127.0.0.1:5173/`.

- [ ] **Step 6: Validate in Browser**

Use the Browser plugin against the local dev URL:

- Open `/animation-lab/`
- Capture desktop screenshot
- Click `下一步` through all 6 steps
- Click `收起 Trace`
- Confirm canvas expands and status rail remains visible
- Switch to mobile viewport
- Confirm Trace stacks below canvas and text does not overlap
- Check browser console logs for errors

- [ ] **Step 7: Commit**

```bash
git add .vitepress/theme/components/animation-lab/TracePanel.vue .vitepress/theme/components/animation-lab/SystemMotionPlayer.vue .vitepress/theme/components/animation-lab/AgentLoopExperiment.vue
git commit -m "fix(animation-lab): polish responsive motion behavior"
```

If no file changes are needed during this task, skip the commit and record that no polish patch was required.

---

### Task 8: Run Full Validation

**Files:**
- Potentially modify files from prior tasks only if validation exposes real issues
- Test: `bun run typecheck`
- Test: `bun run build:strict`

- [ ] **Step 1: Run typecheck**

Run:

```bash
bun run typecheck
```

Expected: PASS.

- [ ] **Step 2: Run strict build pipeline**

Run:

```bash
bun run build:strict
```

Expected: PASS.

- [ ] **Step 3: Inspect git status**

Run:

```bash
git status --short
```

Expected: no untracked temporary browser artifacts. If only intended source files changed, continue.

- [ ] **Step 4: Fix validation issues if any**

If a validation issue appears:

- Fix the smallest related file
- Re-run the failing command
- Re-run `bun run build:strict` before claiming success

- [ ] **Step 5: Final commit if validation fixes were needed**

If validation caused additional source changes:

```bash
git add <changed-files>
git commit -m "fix(animation-lab): satisfy validation checks"
```

If no extra changes were needed, skip this commit.

---

## Completion Checklist

- [ ] `/animation-lab/` renders
- [ ] Agent loop has 6 steps
- [ ] Previous, next, and reset controls work
- [ ] Trace panel expands and collapses
- [ ] Canvas expands when Trace collapses
- [ ] Desktop layout is readable
- [ ] Mobile layout is readable
- [ ] Reduced motion remains understandable
- [ ] `bun run typecheck` passes
- [ ] `bun run build:strict` passes
- [ ] Browser console has no relevant runtime errors
