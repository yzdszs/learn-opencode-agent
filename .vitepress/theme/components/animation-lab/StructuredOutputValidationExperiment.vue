<script setup lang="ts">
import { structuredOutputValidationCanvas } from '../../data/animation-lab/structured-output-validation'
import FlowExperimentCanvas from './FlowExperimentCanvas.vue'
import type { ExperimentStep } from './type'

defineProps<{
  step: ExperimentStep
}>()
</script>

<template>
  <FlowExperimentCanvas :step="step" :config="structuredOutputValidationCanvas" />
</template>
