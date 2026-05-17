import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const fileDiffPatchFlowCanvas: FlowCanvasConfig = {
  ariaLabel: '文件 Diff 与 Patch 应用路径',
  accent: 'indigo',
  motion: 'route',
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
  summary: '拆解一次代码修改如何从源文件和修改意图生成 diff，应用 patch，再通过复查确认工作区状态。',
  kind: 'file-diff-patch-flow',
  steps: [
    {
      id: 'source-read',
      title: 'Source Read',
      description: '系统先读取目标文件和相邻上下文，确认修改位置和现有代码风格。',
      activeNodes: ['source', 'intent'],
      activePaths: ['source-intent'],
      packet: { from: 'source', to: 'intent', label: 'ctx' },
      traceEvents: [
        { id: 'context-loaded', type: 'input', title: '读取上下文', detail: '加载目标文件片段、附近类型和调用方式，确认修改意图能落到稳定位置。', status: 'active' },
      ],
    },
    {
      id: 'diff-built',
      title: 'Diff Built',
      description: '修改意图被转换成最小 diff，只覆盖必要行，避免顺手改动无关代码。',
      activeNodes: ['intent', 'diff'],
      activePaths: ['intent-diff'],
      packet: { from: 'intent', to: 'diff', label: 'edit' },
      traceEvents: [
        { id: 'diff-prepared', type: 'thinking', title: '生成差异', detail: '根据修改目标生成最小补丁，保留原有风格和缩进，不夹带无关重构。', status: 'active' },
      ],
    },
    {
      id: 'patch-applied',
      title: 'Patch Applied',
      description: '补丁应用到工作区，文件内容发生真实变化，等待后续检查确认。',
      activeNodes: ['diff', 'patch'],
      activePaths: ['diff-patch'],
      packet: { from: 'diff', to: 'patch', label: 'patch' },
      traceEvents: [
        { id: 'patch-written', type: 'tool-call', title: '应用补丁', detail: '把 diff 写入目标文件，依赖上下文匹配来避免应用到错误位置。', status: 'active' },
      ],
    },
    {
      id: 'diff-reviewed',
      title: 'Diff Reviewed',
      description: '系统重新查看 diff，确认新增和删除行都符合当前任务边界。',
      activeNodes: ['patch', 'review'],
      activePaths: ['patch-review'],
      packet: { from: 'patch', to: 'review', label: 'diff' },
      traceEvents: [
        { id: 'diff-checked', type: 'observation', title: '复查差异', detail: '检查实际 diff，确认没有格式噪声、无关文件和意外的大范围改动。', status: 'active' },
      ],
    },
    {
      id: 'workspace-staged',
      title: 'Workspace State',
      description: '复查后的变更留在工作区，后续验证会围绕这些文件展开。',
      activeNodes: ['review', 'workspace'],
      activePaths: ['review-workspace'],
      packet: { from: 'review', to: 'workspace', label: 'state' },
      traceEvents: [
        { id: 'workspace-updated', type: 'output', title: '更新工作区', detail: '工作区记录本次修改范围，后续测试和提交都以这组文件为准。', status: 'active' },
      ],
    },
  ],
}
