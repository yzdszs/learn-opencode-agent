import type { Experiment, ExperimentCatalogItem, FlowCanvasConfig } from '../components/animation-lab/type'
import { agentLoopCanvas, agentLoopExperiment } from './animation-lab/agent-loop'
import { contextMemoryCanvas, contextMemoryExperiment } from './animation-lab/context-memory-flow'
import { multiAgentDispatchCanvas, multiAgentDispatchExperiment } from './animation-lab/multi-agent-dispatch'
import { toolPermissionGateCanvas, toolPermissionGateExperiment } from './animation-lab/tool-permission-gate'
import { contextCompactionCanvas, contextCompactionExperiment } from './animation-lab/context-compaction'
import { errorRecoveryLoopCanvas, errorRecoveryLoopExperiment } from './animation-lab/error-recovery-loop'
import {
  providerRoutingFallbackCanvas,
  providerRoutingFallbackExperiment,
} from './animation-lab/provider-routing-fallback'
import { ragRetrievalFlowCanvas, ragRetrievalFlowExperiment } from './animation-lab/rag-retrieval-flow'
import { humanApprovalGateCanvas, humanApprovalGateExperiment } from './animation-lab/human-approval-gate'
import {
  structuredOutputValidationCanvas,
  structuredOutputValidationExperiment,
} from './animation-lab/structured-output-validation'
import {
  streamingInterruptControlCanvas,
  streamingInterruptControlExperiment,
} from './animation-lab/streaming-interrupt-control'
import { taskPlanningQueueCanvas, taskPlanningQueueExperiment } from './animation-lab/task-planning-queue'
import { fileDiffPatchFlowCanvas, fileDiffPatchFlowExperiment } from './animation-lab/file-diff-patch-flow'
import { testFailureRepairCanvas, testFailureRepairExperiment } from './animation-lab/test-failure-repair'
import {
  promptAssemblyPipelineCanvas,
  promptAssemblyPipelineExperiment,
} from './animation-lab/prompt-assembly-pipeline'
import {
  agentCollaborationMergeCanvas,
  agentCollaborationMergeExperiment,
} from './animation-lab/agent-collaboration-merge'
import {
  browserAutomationCheckCanvas,
  browserAutomationCheckExperiment,
} from './animation-lab/browser-automation-check'
import { safetyBoundaryFilterCanvas, safetyBoundaryFilterExperiment } from './animation-lab/safety-boundary-filter'
import {
  artifactDeliveryReviewCanvas,
  artifactDeliveryReviewExperiment,
} from './animation-lab/artifact-delivery-review'

function entry(experiment: Experiment, canvas: FlowCanvasConfig): ExperimentCatalogItem {
  return {
    id: experiment.id,
    title: experiment.title,
    summary: experiment.summary,
    status: 'available',
    experiment,
    canvas,
  }
}

export const animationLabExperiments: ExperimentCatalogItem[] = [
  entry(agentLoopExperiment, agentLoopCanvas),
  entry(toolPermissionGateExperiment, toolPermissionGateCanvas),
  entry(errorRecoveryLoopExperiment, errorRecoveryLoopCanvas),
  entry(contextMemoryExperiment, contextMemoryCanvas),
  entry(contextCompactionExperiment, contextCompactionCanvas),
  entry(providerRoutingFallbackExperiment, providerRoutingFallbackCanvas),
  entry(multiAgentDispatchExperiment, multiAgentDispatchCanvas),
  entry(ragRetrievalFlowExperiment, ragRetrievalFlowCanvas),
  entry(humanApprovalGateExperiment, humanApprovalGateCanvas),
  entry(structuredOutputValidationExperiment, structuredOutputValidationCanvas),
  entry(streamingInterruptControlExperiment, streamingInterruptControlCanvas),
  entry(taskPlanningQueueExperiment, taskPlanningQueueCanvas),
  entry(fileDiffPatchFlowExperiment, fileDiffPatchFlowCanvas),
  entry(testFailureRepairExperiment, testFailureRepairCanvas),
  entry(promptAssemblyPipelineExperiment, promptAssemblyPipelineCanvas),
  entry(agentCollaborationMergeExperiment, agentCollaborationMergeCanvas),
  entry(browserAutomationCheckExperiment, browserAutomationCheckCanvas),
  entry(safetyBoundaryFilterExperiment, safetyBoundaryFilterCanvas),
  entry(artifactDeliveryReviewExperiment, artifactDeliveryReviewCanvas),
]
