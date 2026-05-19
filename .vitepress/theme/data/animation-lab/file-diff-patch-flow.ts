import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const fileDiffPatchFlowCanvas: FlowCanvasConfig = {
  ariaLabel: '文件 Diff 与 Patch 应用路径',
  accent: 'indigo',
  motion: 'diff',
  nodes: [
    { id: 'source', label: 'Source File', role: '源文件', x: 14, y: 48, mobileX: 20, mobileY: 16 },
    { id: 'intent', label: 'Edit Intent', role: '修改意图', x: 34, y: 24, mobileX: 54, mobileY: 16 },
    { id: 'diff', label: 'Diff Builder', role: '差异生成', x: 58, y: 32, mobileX: 78, mobileY: 34 },
    { id: 'patch', label: 'Patch Apply', role: '应用', x: 80, y: 54, mobileX: 72, mobileY: 58 },
    { id: 'review', label: 'Review Diff', role: '复查', x: 52, y: 78, mobileX: 42, mobileY: 76 },
    { id: 'workspace', label: 'Workspace', role: '工作区', x: 26, y: 72, mobileX: 18, mobileY: 88 },
  ],
  paths: [
    { id: 'source-intent', from: 'source', to: 'intent', d: 'M140 269 C190 170 270 128 340 134' },
    { id: 'intent-diff', from: 'intent', to: 'diff', d: 'M340 134 C420 150 520 166 580 179' },
    { id: 'diff-patch', from: 'diff', to: 'patch', d: 'M580 179 C690 224 765 272 800 302' },
    { id: 'patch-review', from: 'patch', to: 'review', d: 'M800 302 C720 404 620 440 520 437' },
    { id: 'review-workspace', from: 'review', to: 'workspace', d: 'M520 437 C420 430 315 410 260 403' },
    { id: 'workspace-source', from: 'workspace', to: 'source', d: 'M260 403 C170 360 120 310 140 269' },
  ],
}

export const fileDiffPatchFlowExperiment: Experiment = {
  id: 'file-diff-patch-flow',
  title: '文件 Diff 与 Patch 应用',
  summary: '拆解一次代码修改如何读取上下文、生成最小 diff、匹配 hunk、应用 patch，并通过复查确认工作区只包含预期变更。',
  kind: 'file-diff-patch-flow',
  steps: [
    {
      id: 'source-read',
      title: 'Source Read',
      description: '系统先读取目标文件、相邻上下文和现有代码风格，确认修改意图能落到稳定位置。',
      activeNodes: ['source', 'intent'],
      activePaths: ['source-intent'],
      packet: { from: 'source', to: 'intent', label: 'ctx' },
      traceEvents: [
        { id: 'context-loaded', type: 'input', title: '读取上下文', detail: '加载目标文件片段、附近类型和调用方式，确认修改意图能落到稳定位置。', status: 'done' },
        { id: 'style-detected', type: 'observation', title: '识别局部风格', detail: '记录缩进、命名、导入顺序和相邻抽象，避免补丁引入风格噪声。', status: 'active' },
      ],
    },
    {
      id: 'diff-built',
      title: 'Diff Built',
      description: '修改意图被转换成最小 diff，只覆盖必要行，并保留足够上下文给 patch 匹配。',
      activeNodes: ['intent', 'diff'],
      activePaths: ['intent-diff'],
      packet: { from: 'intent', to: 'diff', label: 'edit' },
      traceEvents: [
        { id: 'diff-prepared', type: 'thinking', title: '生成差异', detail: '根据修改目标生成最小补丁，保留原有风格和缩进，不夹带无关重构。', status: 'done' },
        { id: 'hunk-scoped', type: 'thinking', title: '限定 hunk 范围', detail: '只让 hunk 覆盖真实修改附近的上下文，降低应用到错误位置的概率。', status: 'active' },
      ],
    },
    {
      id: 'patch-applied',
      title: 'Patch Applied',
      description: '补丁通过上下文匹配应用到工作区；如果 hunk 匹配失败，应停止并重新读取文件，而不是猜测位置。',
      activeNodes: ['diff', 'patch'],
      activePaths: ['diff-patch'],
      packet: { from: 'diff', to: 'patch', label: 'patch' },
      traceEvents: [
        { id: 'patch-written', type: 'tool-call', title: '应用补丁', detail: '把 diff 写入目标文件，依赖上下文匹配来避免应用到错误位置。', status: 'done' },
        { id: 'patch-failure-boundary', type: 'observation', title: '处理匹配失败', detail: '若上下文不匹配则停止应用，重新读取文件后再生成补丁，避免覆盖用户已有改动。', status: 'active' },
      ],
    },
    {
      id: 'diff-reviewed',
      title: 'Diff Reviewed',
      description: '系统重新查看实际 diff，确认新增和删除行都符合当前任务边界，没有格式噪声或无关文件。',
      activeNodes: ['patch', 'review'],
      activePaths: ['patch-review'],
      packet: { from: 'patch', to: 'review', label: 'diff' },
      traceEvents: [
        { id: 'diff-checked', type: 'observation', title: '复查差异', detail: '检查实际 diff，确认没有格式噪声、无关文件和意外的大范围改动。', status: 'done' },
        { id: 'whitespace-checked', type: 'observation', title: '检查空白噪声', detail: '确认没有尾随空格、整文件格式化或无意义换行，保持 diff 可审查。', status: 'active' },
      ],
    },
    {
      id: 'workspace-staged',
      title: 'Workspace State',
      description: '复查后的变更留在工作区，后续测试、构建和提交都围绕这组文件展开。',
      activeNodes: ['review', 'workspace'],
      activePaths: ['review-workspace'],
      packet: { from: 'review', to: 'workspace', label: 'state' },
      traceEvents: [
        { id: 'workspace-updated', type: 'output', title: '更新工作区', detail: '工作区记录本次修改范围，后续测试和提交都以这组文件为准。', status: 'done' },
        { id: 'verification-scope-set', type: 'output', title: '锁定验证范围', detail: '把变更文件映射到需要运行的检查，避免遗漏受影响的验证路径。', status: 'active' },
      ],
    },
  ],
}
