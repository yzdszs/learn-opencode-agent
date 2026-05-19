export type TraceEventType =
  | 'input'
  | 'thinking'
  | 'tool-call'
  | 'observation'
  | 'repair'
  | 'output'

export type TraceEventStatus = 'pending' | 'active' | 'done'

export type PacketKind = 'data' | 'success' | 'error' | 'control' | 'token'

export interface MotionPacket {
  from: string
  to: string
  label: string
  kind?: PacketKind
  delay?: number
  duration?: number
}

export interface TraceEvent {
  id: string
  type: TraceEventType
  title: string
  detail: string
  status: TraceEventStatus
}

export type NodeState = 'idle' | 'busy' | 'fail' | 'done'

export type AnnotationTone = 'info' | 'warn' | 'fail' | 'success'

export interface StepAnnotation {
  at: string
  text: string
  tone?: AnnotationTone
}

export interface ExperimentStep {
  id: string
  title: string
  description: string
  activeNodes: string[]
  activePaths: string[]
  packet?: MotionPacket
  packets?: MotionPacket[]
  nodeBadges?: Record<string, string>
  nodeStates?: Record<string, NodeState>
  annotations?: StepAnnotation[]
  traceEvents: TraceEvent[]
}

export interface Experiment {
  id: string
  title: string
  summary: string
  kind: ExperimentKind
  steps: ExperimentStep[]
}

export type ExperimentKind =
  | 'agent-loop'
  | 'context-memory-flow'
  | 'multi-agent-dispatch'
  | 'tool-permission-gate'
  | 'context-compaction'
  | 'error-recovery-loop'
  | 'provider-routing-fallback'
  | 'rag-retrieval-flow'
  | 'human-approval-gate'
  | 'structured-output-validation'
  | 'streaming-interrupt-control'
  | 'task-planning-queue'
  | 'file-diff-patch-flow'
  | 'test-failure-repair'
  | 'prompt-assembly-pipeline'
  | 'agent-collaboration-merge'
  | 'browser-automation-check'
  | 'safety-boundary-filter'
  | 'artifact-delivery-review'

export type ExperimentStatus = 'available' | 'coming-soon'

export interface ExperimentCatalogItem {
  id: string
  title: string
  summary: string
  status: ExperimentStatus
  experiment?: Experiment
  canvas?: FlowCanvasConfig
}

export interface CanvasNode {
  id: string
  label: string
  role: string
  badge?: string
  state?: NodeState
}

export interface CanvasPath {
  id: string
  from: string
  to: string
  d: string
}

export interface FlowCanvasNode extends CanvasNode {
  x: number
  y: number
  mobileX?: number
  mobileY?: number
}

export interface FlowCanvasConfig {
  ariaLabel: string
  nodes: FlowCanvasNode[]
  paths: CanvasPath[]
  accent: 'sky' | 'teal' | 'amber' | 'indigo' | 'rose'
  motion: FlowCanvasMotion
}

export type FlowCanvasMotion =
  | 'memory'
  | 'dispatch'
  | 'gate'
  | 'compact'
  | 'recover'
  | 'route'
  | 'stream'
  | 'validate'
  | 'merge'
  | 'diff'
