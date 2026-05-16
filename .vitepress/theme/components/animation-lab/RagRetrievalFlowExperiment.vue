<script setup lang="ts">
import { ragRetrievalFlowCanvas } from '../../data/animation-lab/rag-retrieval-flow'
import FlowExperimentCanvas from './FlowExperimentCanvas.vue'
import type { ExperimentStep } from './type'

defineProps<{
  step: ExperimentStep
}>()
</script>

<template>
  <FlowExperimentCanvas :step="step" :config="ragRetrievalFlowCanvas" />
</template>
