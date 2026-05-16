<script setup lang="ts">
import { humanApprovalGateCanvas } from '../../data/animation-lab/human-approval-gate'
import FlowExperimentCanvas from './FlowExperimentCanvas.vue'
import type { ExperimentStep } from './type'

defineProps<{
  step: ExperimentStep
}>()
</script>

<template>
  <FlowExperimentCanvas :step="step" :config="humanApprovalGateCanvas" />
</template>
