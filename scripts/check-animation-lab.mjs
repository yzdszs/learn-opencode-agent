import { readdir, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const repoRoot = resolve(import.meta.dirname, '..')
const dataPath = resolve(repoRoot, '.vitepress/theme/data/animation-lab-experiments.ts')
const dataDir = resolve(repoRoot, '.vitepress/theme/data/animation-lab')
const componentDir = resolve(repoRoot, '.vitepress/theme/components/animation-lab')
const indexPath = resolve(repoRoot, '.vitepress/theme/components/animation-lab/AnimationLabIndex.vue')
const configPath = resolve(repoRoot, '.vitepress/config.mts')
const practiceDir = resolve(repoRoot, 'docs/practice')
const maxAnimationLabFileLines = 500

const animationDataFiles = [
  ['agent-loop.ts', 'agentLoopExperiment'],
  ['context-memory-flow.ts', 'contextMemoryExperiment'],
  ['multi-agent-dispatch.ts', 'multiAgentDispatchExperiment'],
  ['tool-permission-gate.ts', 'toolPermissionGateExperiment'],
  ['context-compaction.ts', 'contextCompactionExperiment'],
  ['error-recovery-loop.ts', 'errorRecoveryLoopExperiment'],
  ['provider-routing-fallback.ts', 'providerRoutingFallbackExperiment'],
  ['rag-retrieval-flow.ts', 'ragRetrievalFlowExperiment'],
  ['human-approval-gate.ts', 'humanApprovalGateExperiment'],
  ['structured-output-validation.ts', 'structuredOutputValidationExperiment'],
  ['streaming-interrupt-control.ts', 'streamingInterruptControlExperiment'],
  ['task-planning-queue.ts', 'taskPlanningQueueExperiment'],
  ['file-diff-patch-flow.ts', 'fileDiffPatchFlowExperiment'],
  ['test-failure-repair.ts', 'testFailureRepairExperiment'],
  ['prompt-assembly-pipeline.ts', 'promptAssemblyPipelineExperiment'],
  ['agent-collaboration-merge.ts', 'agentCollaborationMergeExperiment'],
  ['browser-automation-check.ts', 'browserAutomationCheckExperiment'],
  ['safety-boundary-filter.ts', 'safetyBoundaryFilterExperiment'],
  ['artifact-delivery-review.ts', 'artifactDeliveryReviewExperiment'],
]

const [dataContent, indexContent, configContent, componentFileNames, ...animationFileContents] = await Promise.all([
  readFile(dataPath, 'utf8'),
  readFile(indexPath, 'utf8'),
  readFile(configPath, 'utf8'),
  readdir(componentDir),
  ...animationDataFiles.map(([fileName]) => readFile(resolve(dataDir, fileName), 'utf8').catch(() => '')),
])

const issues = []
const requiredExperimentIds = [
  'agent-loop',
  'context-memory-flow',
  'multi-agent-dispatch',
  'tool-permission-gate',
  'context-compaction',
  'error-recovery-loop',
  'provider-routing-fallback',
  'rag-retrieval-flow',
  'human-approval-gate',
  'structured-output-validation',
  'streaming-interrupt-control',
  'task-planning-queue',
  'file-diff-patch-flow',
  'test-failure-repair',
  'prompt-assembly-pipeline',
  'agent-collaboration-merge',
  'browser-automation-check',
  'safety-boundary-filter',
  'artifact-delivery-review',
]

const requiredSidebarGroups = [
  'Agent 基础机制',
  '上下文与知识',
  '输出与交互控制',
  '工程执行闭环',
  '安全与交付',
]

function getLayoutSignature(content) {
  const nodes = [...content.matchAll(/x: (\d+), y: (\d+), mobileX: (\d+), mobileY: (\d+)/g)]
    .map(([, x, y, mobileX, mobileY]) => `${x},${y},${mobileX},${mobileY}`)
    .join('|')

  const paths = [...content.matchAll(/\bd: '([^']+)'/g)]
    .map(([, d]) => d)
    .join('|')

  if (!nodes || !paths) {
    return ''
  }

  return `${nodes}::${paths}`
}

function extractQuotedValues(content, regex) {
  return [...content.matchAll(regex)].map(([, value]) => value)
}

function validateExperimentReferences(fileName, content) {
  const nodePattern = /\{ id: '([^']+)', label: '[^']+', role: '[^']+', x: \d+, y: \d+/g
  const nodeIds = new Set(extractQuotedValues(content, nodePattern))
  const pathIds = new Set(extractQuotedValues(content, /\{ id: '([^']+)', from: '[^']+', to: '[^']+', d:/g))
  const stepIds = extractQuotedValues(content, /^      id: '([^']+)',/gm)

  if (stepIds.length < 5) {
    issues.push(`${fileName} 至少需要 5 个步骤，当前为 ${stepIds.length}`)
  }

  if (new Set(stepIds).size !== stepIds.length) {
    issues.push(`${fileName} 存在重复步骤 id`)
  }

  for (const [, pathId, from, to] of content.matchAll(/\{ id: '([^']+)', from: '([^']+)', to: '([^']+)', d:/g)) {
    if (!nodeIds.has(from)) {
      issues.push(`${fileName} 路径 ${pathId} 引用了不存在的起点节点: ${from}`)
    }

    if (!nodeIds.has(to)) {
      issues.push(`${fileName} 路径 ${pathId} 引用了不存在的终点节点: ${to}`)
    }
  }

  for (const [, nodes] of content.matchAll(/activeNodes: \[([^\]]*)\]/g)) {
    for (const nodeId of extractQuotedValues(nodes, /'([^']+)'/g)) {
      if (!nodeIds.has(nodeId)) {
        issues.push(`${fileName} activeNodes 引用了不存在的节点: ${nodeId}`)
      }
    }
  }

  for (const [, paths] of content.matchAll(/activePaths: \[([^\]]*)\]/g)) {
    for (const pathId of extractQuotedValues(paths, /'([^']+)'/g)) {
      if (!pathIds.has(pathId)) {
        issues.push(`${fileName} activePaths 引用了不存在的路径: ${pathId}`)
      }
    }
  }

  for (const [, from, to] of content.matchAll(/\{ from: '([^']+)', to: '([^']+)', label:/g)) {
    if (!nodeIds.has(from)) {
      issues.push(`${fileName} packet 引用了不存在的起点节点: ${from}`)
    }

    if (!nodeIds.has(to)) {
      issues.push(`${fileName} packet 引用了不存在的终点节点: ${to}`)
    }
  }

  for (const [, at] of content.matchAll(/\{ at: '([^']+)', text:/g)) {
    if (!nodeIds.has(at)) {
      issues.push(`${fileName} annotation 引用了不存在的节点: ${at}`)
    }
  }
}

requiredExperimentIds.forEach((id, index) => {
  if (!animationFileContents[index]?.includes(`id: '${id}'`)) {
    issues.push(`动画实验缺少 catalog id: ${id}`)
  }
})

for (const group of requiredSidebarGroups) {
  if (!configContent.includes(`text: '${group}'`)) {
    issues.push(`动画实验室侧边栏缺少分组: ${group}`)
  }
}

for (const id of requiredExperimentIds) {
  if (!configContent.includes(`link: '/animation-lab/#${id}'`)) {
    issues.push(`动画实验室侧边栏缺少入口: ${id}`)
  }
}

if (dataContent.includes(`status: 'coming-soon'`)) {
  issues.push('动画实验室仍包含 coming-soon 状态')
}

const practiceLinks = [...dataContent.matchAll(/href: '(\/practice\/[^']+)'/g)].map(([, href]) => href)
if (practiceLinks.length < requiredExperimentIds.length) {
  issues.push(`动画实验室需要为每个实验归集至少一个实践入口，当前入口数为 ${practiceLinks.length}`)
}

for (const href of practiceLinks) {
  const practicePath = resolve(practiceDir, href.replace(/^\/practice\/?/, ''), 'index.md')

  try {
    await readFile(practicePath, 'utf8')
  } catch {
    issues.push(`动画实验室实践入口不存在: ${href}`)
  }
}

const availableCount = dataContent.match(/^\s*entry\(/gm)?.length ?? 0
if (availableCount !== requiredExperimentIds.length) {
  issues.push(`可用实验数量应为 ${requiredExperimentIds.length}，当前为 ${availableCount}`)
}

animationDataFiles.forEach(([fileName, exportName], index) => {
  if (!animationFileContents[index]) {
    issues.push(`缺少独立动画数据文件: ${fileName}`)
    return
  }

  if (!animationFileContents[index].includes(`export const ${exportName}`)) {
    issues.push(`${fileName} 缺少导出: ${exportName}`)
  }

  validateExperimentReferences(fileName, animationFileContents[index])
})

for (const fileName of componentFileNames.filter((name) => name.endsWith('.vue') || name.endsWith('.css'))) {
  const content = await readFile(resolve(componentDir, fileName), 'utf8')
  const lineCount = content.split('\n').length

  if (lineCount > maxAnimationLabFileLines) {
    issues.push(`${fileName} 文件过长: ${lineCount} 行，需拆分到 ${maxAnimationLabFileLines} 行以内`)
  }
}

for (const exportName of [
  'contextMemoryExperiment',
  'multiAgentDispatchExperiment',
  'toolPermissionGateExperiment',
  'contextCompactionExperiment',
  'errorRecoveryLoopExperiment',
  'providerRoutingFallbackExperiment',
  'ragRetrievalFlowExperiment',
  'humanApprovalGateExperiment',
  'structuredOutputValidationExperiment',
  'streamingInterruptControlExperiment',
]) {
  if (dataContent.includes(`export const ${exportName}`)) {
    issues.push(`聚合文件不应直接管理动画数据: ${exportName}`)
  }
}

if (!indexContent.includes('FlowExperimentCanvas')) {
  issues.push('AnimationLabIndex 必须直接渲染 FlowExperimentCanvas 共享画布')
}

if (!indexContent.includes('practiceLinks')) {
  issues.push('AnimationLabIndex 需要展示实验关联的实践篇入口')
}

if (indexContent.includes('lab-sidebar') || indexContent.includes('lab-nav-item') || indexContent.includes('lab-switcher') || indexContent.includes('lab-chip')) {
  issues.push('动画实验室页面不应包含内置实验切换 UI，统一由 VitePress 左侧菜单经 URL hash 切换')
}

for (const motion of ['memory', 'dispatch', 'gate', 'compact', 'recover', 'route', 'stream', 'validate', 'merge', 'diff']) {
  if (!animationFileContents.some((content) => content.includes(`motion: '${motion}'`))) {
    issues.push(`缺少场景化动效配置: ${motion}`)
  }
}

const layoutOwners = new Map()
animationDataFiles.forEach(([fileName], index) => {
  const signature = getLayoutSignature(animationFileContents[index] ?? '')

  if (!signature) {
    return
  }

  const owner = layoutOwners.get(signature)
  if (owner) {
    issues.push(`动画实验复用了相同画布模板: ${owner} / ${fileName}`)
    return
  }

  layoutOwners.set(signature, fileName)
})

if (!indexContent.includes('lab-stage')) {
  issues.push('动画实验室需要保留右侧舞台 lab-stage')
}

if (issues.length === 0) {
  console.log('check:animation-lab 通过')
  process.exit(0)
}

console.error('发现 animation lab 问题：')
for (const issue of issues) {
  console.error(`- ${issue}`)
}

process.exit(1)
