import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const browserAutomationCheckCanvas: FlowCanvasConfig = {
  ariaLabel: '浏览器自动化与截图校验路径',
  accent: 'teal',
  motion: 'diff',
  nodes: [
    { id: 'server', label: 'Dev Server', role: '服务', x: 14, y: 28, mobileX: 18, mobileY: 12 },
    { id: 'browser', label: 'Browser', role: '浏览器', x: 42, y: 18, mobileX: 50, mobileY: 18 },
    { id: 'action', label: 'Action', role: '交互', x: 72, y: 28, mobileX: 78, mobileY: 36 },
    { id: 'snapshot', label: 'Snapshot', role: '快照', x: 82, y: 66, mobileX: 72, mobileY: 62 },
    { id: 'assert', label: 'Assert', role: '断言', x: 50, y: 82, mobileX: 42, mobileY: 78 },
    { id: 'report', label: 'Report', role: '报告', x: 22, y: 64, mobileX: 18, mobileY: 92 },
  ],
  paths: [
    { id: 'server-browser', from: 'server', to: 'browser', d: 'M140 157 C230 96 340 78 420 101' },
    { id: 'browser-action', from: 'browser', to: 'action', d: 'M420 101 C535 105 650 135 720 157' },
    { id: 'action-snapshot', from: 'action', to: 'snapshot', d: 'M720 157 C820 250 850 320 820 370' },
    { id: 'snapshot-assert', from: 'snapshot', to: 'assert', d: 'M820 370 C700 465 590 486 500 459' },
    { id: 'assert-report', from: 'assert', to: 'report', d: 'M500 459 C390 430 285 385 220 358' },
    { id: 'report-browser', from: 'report', to: 'browser', d: 'M220 358 C260 230 320 125 420 101' },
  ],
}

export const browserAutomationCheckExperiment: Experiment = {
  id: 'browser-automation-check',
  title: '浏览器自动化与截图校验',
  summary: '展示本地页面如何被浏览器打开、执行交互、采集截图和 DOM 快照，并用断言生成可复盘的 UI 验证证据。',
  kind: 'browser-automation-check',
  steps: [
    {
      id: 'server-ready',
      title: 'Server Ready',
      description: '开发服务器启动后，浏览器拿到稳定 URL、目标 hash 和视口配置，准备进入真实页面。',
      activeNodes: ['server', 'browser'],
      activePaths: ['server-browser'],
      packet: { from: 'server', to: 'browser', label: 'url' },
      traceEvents: [
        { id: 'url-opened', type: 'input', title: '打开页面', detail: '确认本地服务地址可访问，把目标 URL、hash 路由和视口尺寸交给浏览器会话。', status: 'done' },
        { id: 'baseline-recorded', type: 'observation', title: '记录基线状态', detail: '记录初始标题、路由和关键容器是否存在，作为后续交互前的基线。', status: 'active' },
      ],
    },
    {
      id: 'interaction-run',
      title: 'Interaction Run',
      description: '浏览器执行点击、输入、滚动或 hash 跳转，让页面进入需要验证的状态，并等待交互副作用稳定。',
      activeNodes: ['browser', 'action'],
      activePaths: ['browser-action'],
      packet: { from: 'browser', to: 'action', label: 'click' },
      traceEvents: [
        { id: 'action-performed', type: 'tool-call', title: '执行交互', detail: '在真实浏览器中执行用户路径，触发需要检查的 UI 状态。', status: 'done' },
        { id: 'state-stabilized', type: 'observation', title: '等待状态稳定', detail: '等待路由、动画首帧或异步渲染稳定后再采集证据，避免截到中间态。', status: 'active' },
      ],
    },
    {
      id: 'snapshot-captured',
      title: 'Snapshot Captured',
      description: '页面状态稳定后采集截图、DOM 快照和可访问树，留下视觉、结构和可访问性证据。',
      activeNodes: ['action', 'snapshot'],
      activePaths: ['action-snapshot'],
      packet: { from: 'action', to: 'snapshot', label: 'shot' },
      traceEvents: [
        { id: 'snapshot-saved', type: 'observation', title: '采集快照', detail: '等待页面渲染稳定后采集截图、DOM 快照和节点结构，作为后续断言证据。', status: 'done' },
        { id: 'console-collected', type: 'observation', title: '收集控制台信号', detail: '同步记录 console error、资源 404 和运行时异常，避免视觉通过但页面实际报错。', status: 'active' },
      ],
    },
    {
      id: 'assertions-run',
      title: 'Assertions Run',
      description: '截图和结构结果被检查，确认关键文本、画布、交互控件和响应式布局没有丢失或重叠。',
      activeNodes: ['snapshot', 'assert'],
      activePaths: ['snapshot-assert'],
      packet: { from: 'snapshot', to: 'assert', label: 'check' },
      traceEvents: [
        { id: 'ui-asserted', type: 'thinking', title: '执行断言', detail: '检查关键元素、画布非空、文本不重叠、按钮状态和 hash 路由是否正确。', status: 'done' },
        { id: 'viewport-checked', type: 'thinking', title: '检查视口表现', detail: '对桌面和移动视口分别确认内容未溢出，避免只在当前屏幕尺寸上通过。', status: 'active' },
      ],
    },
    {
      id: 'report-written',
      title: 'Report Written',
      description: '断言结果被写成验证结论，包含通过项、失败项、截图证据和下一步定位入口。',
      activeNodes: ['assert', 'report'],
      activePaths: ['assert-report'],
      packet: { from: 'assert', to: 'report', label: 'result' },
      traceEvents: [
        { id: 'browser-report', type: 'output', title: '输出结论', detail: '汇总浏览器路径、截图证据和断言结果，明确通过项或剩余问题。', status: 'done' },
        { id: 'rerun-path-kept', type: 'output', title: '保留复查路径', detail: '记录 URL、视口和操作步骤，失败时可以复现同一浏览器状态继续定位。', status: 'active' },
      ],
    },
  ],
}
