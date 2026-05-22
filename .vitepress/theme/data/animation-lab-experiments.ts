import type { Experiment, ExperimentCatalogItem, FlowCanvasConfig, PracticeLink } from '../components/animation-lab/type'
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

const practiceLinksByExperimentId: Record<string, PracticeLink[]> = {
  'agent-loop': [
    { title: 'P01 最小 Agent', href: '/practice/p01-minimal-agent/' },
    { title: 'P10 ReAct Loop', href: '/practice/p10-react-loop/' },
  ],
  'tool-permission-gate': [
    { title: 'P01 工具调用生命周期', href: '/practice/p01-minimal-agent/' },
    { title: 'P19 安全边界', href: '/practice/p19-security/' },
  ],
  'error-recovery-loop': [
    { title: 'P04 错误处理', href: '/practice/p04-error-handling/' },
    { title: 'P27 代码执行', href: '/practice/p27-code-execution/' },
  ],
  'context-memory-flow': [
    { title: 'P02 多轮对话', href: '/practice/p02-multi-turn/' },
    { title: 'P06 记忆检索', href: '/practice/p06-memory-retrieval/' },
  ],
  'context-compaction': [
    { title: 'P25 长上下文', href: '/practice/p25-long-context/' },
    { title: 'P02 上下文窗口', href: '/practice/p02-multi-turn/' },
  ],
  'provider-routing-fallback': [
    { title: 'P18 模型路由', href: '/practice/p18-model-routing/' },
  ],
  'multi-agent-dispatch': [
    { title: 'P15 多 Agent 协作', href: '/practice/p15-multi-agent/' },
    { title: 'P16 子 Agent', href: '/practice/p16-subagent/' },
  ],
  'rag-retrieval-flow': [
    { title: 'P07 RAG 基础', href: '/practice/p07-rag-basics/' },
    { title: 'P09 混合检索', href: '/practice/p09-hybrid-retrieval/' },
  ],
  'human-approval-gate': [
    { title: 'P28 Human-in-the-Loop', href: '/practice/p28-human-in-loop/' },
    { title: 'P19 安全边界', href: '/practice/p19-security/' },
  ],
  'structured-output-validation': [
    { title: 'P26 结构化输出', href: '/practice/p26-structured-output/' },
  ],
  'streaming-interrupt-control': [
    { title: 'P03 流式输出', href: '/practice/p03-streaming/' },
  ],
  'task-planning-queue': [
    { title: 'P11 Planning', href: '/practice/p11-planning/' },
  ],
  'file-diff-patch-flow': [
    { title: 'P22 完整项目', href: '/practice/p22-project/' },
  ],
  'test-failure-repair': [
    { title: 'P21 评估', href: '/practice/p21-evaluation/' },
    { title: 'P27 代码执行', href: '/practice/p27-code-execution/' },
  ],
  'prompt-assembly-pipeline': [
    { title: 'P24 Prompt 工程', href: '/practice/p24-prompt-engineering/' },
    { title: 'P13 多模态', href: '/practice/p13-multimodal/' },
  ],
  'agent-collaboration-merge': [
    { title: 'P16 子 Agent', href: '/practice/p16-subagent/' },
    { title: 'P17 Agent 通信', href: '/practice/p17-agent-comm/' },
  ],
  'browser-automation-check': [
    { title: 'P22 完整项目', href: '/practice/p22-project/' },
  ],
  'safety-boundary-filter': [
    { title: 'P19 安全边界', href: '/practice/p19-security/' },
  ],
  'artifact-delivery-review': [
    { title: 'P20 可观测性', href: '/practice/p20-observability/' },
    { title: 'P23 生产部署', href: '/practice/p23-production/' },
  ],
}

function entry(experiment: Experiment, canvas: FlowCanvasConfig): ExperimentCatalogItem {
  return {
    id: experiment.id,
    title: experiment.title,
    summary: experiment.summary,
    status: 'available',
    practiceLinks: practiceLinksByExperimentId[experiment.id] ?? [],
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
