import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const streamingInterruptControlCanvas: FlowCanvasConfig = {
  ariaLabel: '流式输出与中断控制路径',
  accent: 'sky',
  motion: 'stream',
  nodes: [
    { id: 'request', label: 'Request', role: '请求', x: 16, y: 28, mobileX: 18, mobileY: 15 },
    { id: 'stream', label: 'Model Stream', role: '模型流', x: 46, y: 18, mobileX: 44, mobileY: 20 },
    { id: 'buffer', label: 'Token Buffer', role: '缓冲区', x: 76, y: 28, mobileX: 72, mobileY: 30 },
    { id: 'ui', label: 'UI Render', role: '渲染', x: 80, y: 56, mobileX: 84, mobileY: 50 },
    { id: 'interrupt', label: 'Interrupt', role: '中断', x: 54, y: 78, mobileX: 42, mobileY: 68 },
    { id: 'state', label: 'Saved State', role: '状态保存', x: 82, y: 82, mobileX: 72, mobileY: 88 },
  ],
  paths: [
    { id: 'request-stream', from: 'request', to: 'stream', d: 'M160 157 C250 84 365 84 460 101' },
    { id: 'stream-buffer', from: 'stream', to: 'buffer', d: 'M470 104 C580 72 700 94 760 157' },
    { id: 'buffer-ui', from: 'buffer', to: 'ui', d: 'M770 164 C835 220 830 270 800 314' },
    { id: 'ui-interrupt', from: 'ui', to: 'interrupt', d: 'M790 322 C720 415 625 452 540 438' },
    { id: 'interrupt-state', from: 'interrupt', to: 'state', d: 'M550 438 C650 488 770 488 820 460' },
  ],
}

export const streamingInterruptControlExperiment: Experiment = {
  id: 'streaming-interrupt-control',
  title: '流式输出与中断控制',
  summary: '展示 Token 流如何分批进入缓冲区和 UI，用户中断后系统如何取消生成、确认停止、保存局部状态并支持恢复。',
  kind: 'streaming-interrupt-control',
  steps: [
    {
      id: 'stream-starts',
      title: 'Stream Starts',
      description: '请求进入模型后打开流连接，输出不必等完整答案生成完才返回；首批 Token 会带着流 ID 和起始偏移被推送。',
      activeNodes: ['request', 'stream'],
      activePaths: ['request-stream'],
      packet: { from: 'request', to: 'stream', label: 'req' },
      traceEvents: [
        { id: 'stream-opened', type: 'input', title: '打开流', detail: '发起流式请求，建立流连接，记录 streamId、起始 offset 和当前上下文快照。', status: 'done' },
        { id: 'first-token-waiting', type: 'observation', title: '等待首批 Token', detail: '系统进入可中断状态，即使答案还不完整，也能开始接收和展示模型增量输出。', status: 'active' },
      ],
    },
    {
      id: 'token-buffering',
      title: 'Token Buffering',
      description: 'Token 持续进入缓冲区，系统按批次长度、刷新间隔和 UI 承载能力聚合后再推送，避免逐字抖动。',
      activeNodes: ['stream', 'buffer'],
      activePaths: ['stream-buffer'],
      packet: { from: 'stream', to: 'buffer', label: 'tok' },
      traceEvents: [
        { id: 'tokens-buffered', type: 'observation', title: '缓冲 Token', detail: 'Token 持续写入缓冲区，记录 batch size、flush interval 和当前消费 offset。', status: 'done' },
        { id: 'backpressure-checked', type: 'thinking', title: '检查背压', detail: '如果 UI 渲染或网络消费变慢，系统会放缓刷新节奏，避免缓冲区无限增长。', status: 'active' },
      ],
    },
    {
      id: 'ui-rendering',
      title: 'UI Rendering',
      description: '界面按片段逐步渲染内容，同时保留光标、已消费 offset 和生成状态，让用户能看见答案正在形成。',
      activeNodes: ['buffer', 'ui'],
      activePaths: ['buffer-ui'],
      packet: { from: 'buffer', to: 'ui', label: 'paint' },
      traceEvents: [
        { id: 'ui-updated', type: 'tool-call', title: '增量渲染', detail: '把缓冲片段写入 UI，追踪已渲染文本、光标位置和当前生成状态。', status: 'done' },
        { id: 'partial-visible', type: 'observation', title: '展示局部答案', detail: '局部内容对用户可见，但仍处于未完成状态，不应被当作最终输出写入交付结论。', status: 'active' },
      ],
    },
    {
      id: 'user-interrupts',
      title: 'User Interrupts',
      description: '用户中断生成后，系统发送取消信号，停止继续消费后续 Token，并等待模型侧确认流已经关闭。',
      activeNodes: ['ui', 'interrupt'],
      activePaths: ['ui-interrupt'],
      packet: { from: 'ui', to: 'interrupt', label: 'stop' },
      traceEvents: [
        { id: 'cancel-sent', type: 'repair', title: '发送取消信号', detail: '接收用户中断，向模型连接发送 cancel，记录最后消费 offset 和未消费片段范围。', status: 'done' },
        { id: 'cancel-ack', type: 'observation', title: '确认流停止', detail: '等待模型侧或传输层确认停止，清理连接，避免取消后仍继续把 Token 写入 UI。', status: 'active' },
      ],
    },
    {
      id: 'state-saved',
      title: 'State Saved',
      description: '当前上下文、已生成内容、停止位置和用户中断意图被保存，后续可以恢复、重写或重新发起请求。',
      activeNodes: ['interrupt', 'state'],
      activePaths: ['interrupt-state'],
      packet: { from: 'interrupt', to: 'state', label: 'save' },
      traceEvents: [
        { id: 'partial-saved', type: 'output', title: '保存状态', detail: '保存已生成内容、上下文快照、停止 offset 和中断原因，形成可恢复的局部状态。', status: 'done' },
        { id: 'resume-offered', type: 'output', title: '提供恢复入口', detail: '输出继续生成、重写回答或重新发起请求的入口，让用户决定后续路径。', status: 'active' },
      ],
    },
  ],
}
