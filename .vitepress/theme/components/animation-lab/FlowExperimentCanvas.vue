<script setup lang="ts">
import { computed } from 'vue'
import type { ExperimentStep, FlowCanvasConfig, MotionPacket, NodeState } from './type'

const props = defineProps<{
  step: ExperimentStep
  config: FlowCanvasConfig
}>()

const nodeStyleById = computed(() => {
  return props.config.nodes.reduce<Record<string, Record<string, string>>>((styles, node) => {
    styles[node.id] = {
      '--node-x': `${node.x}%`,
      '--node-y': `${node.y}%`,
      '--node-mobile-x': `${node.mobileX ?? node.x}%`,
      '--node-mobile-y': `${node.mobileY ?? node.y}%`,
    }

    return styles
  }, {})
})

const packets = computed<MotionPacket[]>(() => {
  if (props.step.packets?.length) {
    return props.step.packets
  }

  return props.step.packet ? [props.step.packet] : []
})

function packetStyle(packet: MotionPacket) {
  const from = props.config.nodes.find((node) => node.id === packet.from)
  const to = props.config.nodes.find((node) => node.id === packet.to)

  if (!from || !to) {
    return undefined
  }

  return {
    '--packet-start-x': `${from.x}%`,
    '--packet-start-y': `${from.y}%`,
    '--packet-end-x': `${to.x}%`,
    '--packet-end-y': `${to.y}%`,
    '--packet-mobile-start-x': `${from.mobileX ?? from.x}%`,
    '--packet-mobile-start-y': `${from.mobileY ?? from.y}%`,
    '--packet-mobile-end-x': `${to.mobileX ?? to.x}%`,
    '--packet-mobile-end-y': `${to.mobileY ?? to.y}%`,
    '--packet-delay': `${packet.delay ?? 0}ms`,
    '--packet-duration': `${packet.duration ?? 1450}ms`,
  }
}

function annotationStyle(at: string) {
  const node = props.config.nodes.find((n) => n.id === at)
  if (!node) {
    return undefined
  }

  return {
    '--ann-x': `${node.x}%`,
    '--ann-y': `${node.y}%`,
    '--ann-mobile-x': `${node.mobileX ?? node.x}%`,
    '--ann-mobile-y': `${node.mobileY ?? node.y}%`,
  }
}

function nodeState(id: string, fallback?: NodeState) {
  return props.step.nodeStates?.[id] ?? fallback ?? 'idle'
}

function nodeBadge(id: string, fallback?: string) {
  return props.step.nodeBadges?.[id] ?? fallback
}

function isNodeActive(id: string) {
  return props.step.activeNodes.includes(id)
}

function isPathActive(id: string) {
  return props.step.activePaths.includes(id)
}
</script>

<template>
  <div :class="['flow-experiment-canvas', `accent-${config.accent}`, `motion-${config.motion}`]">
    <div class="flow-scene">
      <div class="flow-grid" aria-hidden="true"></div>
      <div class="scene-effect" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <svg class="flow-paths" viewBox="0 0 1000 560" role="img" :aria-label="config.ariaLabel">
        <path
          v-for="path in config.paths"
          :key="path.id"
          :class="{ active: isPathActive(path.id) }"
          :d="path.d"
        />
      </svg>

      <div
        v-for="node in config.nodes"
        :key="node.id"
        :class="[
          'flow-node',
          `state-${nodeState(node.id, node.state)}`,
          { active: isNodeActive(node.id) },
        ]"
        :style="nodeStyleById[node.id]"
      >
        <span>{{ node.role }}</span>
        <strong>{{ node.label }}</strong>
        <em v-if="nodeBadge(node.id, node.badge)" class="node-badge">
          {{ nodeBadge(node.id, node.badge) }}
        </em>
      </div>

      <div
        v-for="(packet, index) in packets"
        :key="`${step.id}-packet-${index}`"
        :class="['flow-packet', `packet-kind-${packet.kind ?? 'data'}`]"
        :style="packetStyle(packet)"
      >
        {{ packet.label }}
      </div>

      <div
        v-for="(ann, index) in step.annotations ?? []"
        :key="`${step.id}-ann-${index}`"
        :class="['flow-annotation', `tone-${ann.tone ?? 'info'}`]"
        :style="annotationStyle(ann.at)"
      >
        {{ ann.text }}
      </div>
    </div>

    <div class="flow-step-summary">
      <span>{{ step.title }}</span>
      <p>{{ step.description }}</p>
    </div>
  </div>
</template>

<style scoped src="./FlowExperimentCanvas.css"></style>
