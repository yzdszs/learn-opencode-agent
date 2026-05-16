<script setup lang="ts">
import { streamingInterruptControlCanvas } from '../../data/animation-lab/streaming-interrupt-control'
import FlowExperimentCanvas from './FlowExperimentCanvas.vue'
import type { ExperimentStep } from './type'

defineProps<{
  step: ExperimentStep
}>()
</script>

<template>
  <FlowExperimentCanvas :step="step" :config="streamingInterruptControlCanvas" />
</template>
