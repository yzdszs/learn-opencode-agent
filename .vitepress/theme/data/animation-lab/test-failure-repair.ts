import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const testFailureRepairCanvas: FlowCanvasConfig = {
  ariaLabel: '测试失败定位与修复路径',
  accent: 'amber',
  motion: 'recover',
  nodes: [
    { id: 'test', label: 'Test Run', role: '测试', x: 18, y: 20, mobileX: 18, mobileY: 12 },
    { id: 'failure', label: 'Failure Log', role: '失败日志', x: 48, y: 18, mobileX: 54, mobileY: 20 },
    { id: 'cause', label: 'Root Cause', role: '根因', x: 78, y: 34, mobileX: 78, mobileY: 40 },
    { id: 'fix', label: 'Fix Patch', role: '修复', x: 68, y: 72, mobileX: 60, mobileY: 66 },
    { id: 'rerun', label: 'Rerun', role: '重跑', x: 36, y: 78, mobileX: 28, mobileY: 78 },
    { id: 'green', label: 'Green', role: '通过', x: 14, y: 54, mobileX: 18, mobileY: 92 },
  ],
  paths: [
    { id: 'test-failure', from: 'test', to: 'failure', d: 'M180 112 C275 82 390 82 480 101' },
    { id: 'failure-cause', from: 'failure', to: 'cause', d: 'M480 101 C600 118 710 160 780 190' },
    { id: 'cause-fix', from: 'cause', to: 'fix', d: 'M780 190 C790 310 742 392 680 403' },
    { id: 'fix-rerun', from: 'fix', to: 'rerun', d: 'M680 403 C570 464 450 468 360 437' },
    { id: 'rerun-green', from: 'rerun', to: 'green', d: 'M360 437 C260 405 168 342 140 302' },
    { id: 'rerun-failure', from: 'rerun', to: 'failure', d: 'M360 437 C310 300 360 172 480 101' },
  ],
}

export const testFailureRepairExperiment: Experiment = {
  id: 'test-failure-repair',
  title: '测试失败定位与修复',
  summary: '展示测试红灯如何被读取、定位、修复并重跑，直到失败信号变成可验证的绿灯。',
  kind: 'test-failure-repair',
  steps: [
    {
      id: 'test-started',
      title: 'Test Started',
      description: '测试命令启动，系统把当前修改放进可重复验证的执行环境里。',
      activeNodes: ['test', 'failure'],
      activePaths: ['test-failure'],
      packet: { from: 'test', to: 'failure', label: 'run' },
      traceEvents: [
        { id: 'test-command', type: 'tool-call', title: '运行测试', detail: '执行目标验证命令，等待退出码、失败用例和错误输出返回。', status: 'active' },
      ],
    },
    {
      id: 'failure-read',
      title: 'Failure Read',
      description: '失败日志被拆成用例、断言、堆栈和真实错误，避免只看最后一行。',
      activeNodes: ['failure', 'cause'],
      activePaths: ['failure-cause'],
      packet: { from: 'failure', to: 'cause', label: 'log' },
      traceEvents: [
        { id: 'failure-parsed', type: 'observation', title: '解析失败', detail: '读取失败用例、断言差异和堆栈位置，区分真实缺陷与环境噪声。', status: 'active' },
      ],
    },
    {
      id: 'cause-found',
      title: 'Cause Found',
      description: '系统沿错误路径回到代码，定位导致红灯的最小根因。',
      activeNodes: ['cause', 'fix'],
      activePaths: ['cause-fix'],
      packet: { from: 'cause', to: 'fix', label: 'cause' },
      traceEvents: [
        { id: 'root-cause', type: 'thinking', title: '定位根因', detail: '从失败信号反查代码路径，确认哪个判断、数据或接口契约导致测试失败。', status: 'active' },
      ],
    },
    {
      id: 'fix-applied',
      title: 'Fix Applied',
      description: '修复补丁只覆盖根因位置，不扩大到无关重构。',
      activeNodes: ['fix', 'rerun'],
      activePaths: ['fix-rerun'],
      packet: { from: 'fix', to: 'rerun', label: 'fix' },
      traceEvents: [
        { id: 'fix-written', type: 'repair', title: '写入修复', detail: '按根因写入最小修复，保持外部行为和原有接口兼容。', status: 'active' },
      ],
    },
    {
      id: 'rerun-tests',
      title: 'Rerun Tests',
      description: '同一条测试命令重跑，确认红灯是否真的被修复，而不是被绕开。',
      activeNodes: ['rerun', 'green'],
      activePaths: ['rerun-green'],
      packet: { from: 'rerun', to: 'green', label: 'pass' },
      traceEvents: [
        { id: 'tests-green', type: 'output', title: '确认绿灯', detail: '重跑原始验证命令，确认失败用例通过，并观察是否引入新的失败。', status: 'active' },
      ],
    },
  ],
}
