import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const streamingInterruptControlCanvas: FlowCanvasConfig = {
  ariaLabel: '流式输出与中断控制路径',
  accent: 'sky',
  motion: 'route',
  nodes: [
    { id: 'request', label: 'Request', role: '请求', x: 12, y: 48, mobileX: 20, mobileY: 18 },
    { id: 'stream', label: 'Model Stream', role: '模型流', x: 34, y: 28, mobileX: 56, mobileY: 20 },
    { id: 'buffer', label: 'Token Buffer', role: '缓冲区', x: 58, y: 28, mobileX: 82, mobileY: 40 },
    { id: 'ui', label: 'UI Render', role: '渲染', x: 76, y: 58, mobileX: 62, mobileY: 62 },
    { id: 'interrupt', label: 'Interrupt', role: '中断', x: 48, y: 76, mobileX: 28, mobileY: 64 },
    { id: 'state', label: 'Saved State', role: '状态保存', x: 88, y: 40, mobileX: 50, mobileY: 86 },
  ],
  paths: [
    { id: 'request-stream', from: 'request', to: 'stream', d: 'M120 270 C190 205 265 160 340 155' },
    { id: 'stream-buffer', from: 'stream', to: 'buffer', d: 'M350 155 C425 120 520 120 580 155' },
    { id: 'buffer-ui', from: 'buffer', to: 'ui', d: 'M590 165 C680 230 735 300 760 325' },
    { id: 'ui-interrupt', from: 'ui', to: 'interrupt', d: 'M750 340 C650 430 555 445 480 425' },
    { id: 'interrupt-state', from: 'interrupt', to: 'state', d: 'M490 420 C630 455 785 340 880 225' },
  ],
}

export const streamingInterruptControlExperiment: Experiment = {
  id: 'streaming-interrupt-control',
  title: '流式输出与中断控制',
  summary: '展示 Token 流如何进入 UI，用户中断后系统如何取消生成、保存状态并支持后续恢复。',
  kind: 'streaming-interrupt-control',
  steps: [
    {
      id: 'stream-starts',
      title: 'Stream Starts',
      description: '请求进入模型，输出不必等完整答案生成完才返回，首批 Token 会先被推送。',
      activeNodes: ['request', 'stream'],
      activePaths: ['request-stream'],
      packet: { from: 'request', to: 'stream', label: 'req' },
      traceEvents: [
        { id: 'stream-opened', type: 'input', title: '打开流', detail: '系统记录请求参数、流连接和首包等待状态。', status: 'active' },
      ],
    },
    {
      id: 'token-buffering',
      title: 'Token Buffering',
      description: 'Token 持续进入缓冲区，系统按片段聚合后再推送给 UI。',
      activeNodes: ['stream', 'buffer'],
      activePaths: ['stream-buffer'],
      packet: { from: 'stream', to: 'buffer', label: 'tok' },
      traceEvents: [
        { id: 'tokens-buffered', type: 'observation', title: '缓冲 Token', detail: '系统记录 token 批次、缓冲长度和推送节奏。', status: 'active' },
      ],
    },
    {
      id: 'ui-rendering',
      title: 'UI Rendering',
      description: '界面逐步渲染内容，同时保留当前生成状态，用户能看到答案正在形成。',
      activeNodes: ['buffer', 'ui'],
      activePaths: ['buffer-ui'],
      packet: { from: 'buffer', to: 'ui', label: 'paint' },
      traceEvents: [
        { id: 'ui-updated', type: 'tool-call', title: '增量渲染', detail: '系统记录已渲染文本、光标位置和当前流状态。', status: 'active' },
      ],
    },
    {
      id: 'user-interrupts',
      title: 'User Interrupts',
      description: '用户中断生成，系统发送取消信号，并停止继续消费后续 Token。',
      activeNodes: ['ui', 'interrupt'],
      activePaths: ['ui-interrupt'],
      packet: { from: 'ui', to: 'interrupt', label: 'stop' },
      traceEvents: [
        { id: 'stream-cancelled', type: 'repair', title: '取消生成', detail: '系统记录取消来源、停止位置和是否还有未消费片段。', status: 'active' },
      ],
    },
    {
      id: 'state-saved',
      title: 'State Saved',
      description: '当前上下文和已生成内容被保存，后续可以恢复、重写或重新发起请求。',
      activeNodes: ['interrupt', 'state'],
      activePaths: ['interrupt-state'],
      packet: { from: 'interrupt', to: 'state', label: 'save' },
      traceEvents: [
        { id: 'partial-saved', type: 'output', title: '保存状态', detail: '系统记录已生成内容、上下文快照和下一次恢复入口。', status: 'active' },
      ],
    },
  ],
}
