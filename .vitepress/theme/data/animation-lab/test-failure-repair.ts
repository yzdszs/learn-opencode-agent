import type { Experiment, FlowCanvasConfig } from '../../components/animation-lab/type'

export const testFailureRepairCanvas: FlowCanvasConfig = {
  ariaLabel: '测试失败定位与修复路径',
  accent: 'amber',
  motion: 'validate',
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
  summary: '展示测试红灯如何被复现、解析、定位、最小修复并用同一验证命令重跑，直到失败信号变成可信绿灯。',
  kind: 'test-failure-repair',
  steps: [
    {
      id: 'test-started',
      title: 'Test Started',
      description: '测试命令启动，系统把当前修改放进可重复验证的执行环境，并记录原始命令作为后续回归依据。',
      activeNodes: ['test', 'failure'],
      activePaths: ['test-failure'],
      packet: { from: 'test', to: 'failure', label: 'run' },
      traceEvents: [
        { id: 'test-command', type: 'tool-call', title: '运行测试', detail: '执行目标验证命令，等待退出码、失败用例和错误输出返回。', status: 'done' },
        { id: 'repro-command-kept', type: 'input', title: '保留复现命令', detail: '记录完整命令、工作目录和环境条件，确保修复后用同一路径确认红灯变绿。', status: 'active' },
      ],
    },
    {
      id: 'failure-read',
      title: 'Failure Read',
      description: '失败日志被拆成用例、断言差异、堆栈位置和真实错误，避免只看最后一行或误判环境噪声。',
      activeNodes: ['failure', 'cause'],
      activePaths: ['failure-cause'],
      packet: { from: 'failure', to: 'cause', label: 'log' },
      traceEvents: [
        { id: 'failure-parsed', type: 'observation', title: '解析失败', detail: '读取失败用例、断言差异和堆栈位置，区分真实缺陷与环境噪声。', status: 'done' },
        { id: 'noise-filtered', type: 'thinking', title: '过滤噪声', detail: '把无关警告、缓存输出和非阻塞日志排除，只保留导致退出码失败的核心信号。', status: 'active' },
      ],
    },
    {
      id: 'cause-found',
      title: 'Cause Found',
      description: '系统沿错误路径回到代码和数据契约，定位导致红灯的最小根因，而不是直接改测试绕过失败。',
      activeNodes: ['cause', 'fix'],
      activePaths: ['cause-fix'],
      packet: { from: 'cause', to: 'fix', label: 'cause' },
      traceEvents: [
        { id: 'root-cause', type: 'thinking', title: '定位根因', detail: '从失败信号反查代码路径，确认哪个判断、数据或接口契约导致测试失败。', status: 'done' },
        { id: 'test-not-bypassed', type: 'thinking', title: '拒绝绕过测试', detail: '确认修复应改变生产行为或测试输入契约，而不是删除断言或放宽失败条件。', status: 'active' },
      ],
    },
    {
      id: 'fix-applied',
      title: 'Fix Applied',
      description: '修复补丁只覆盖根因位置，保持外部接口兼容，不扩大到无关重构或格式化。',
      activeNodes: ['fix', 'rerun'],
      activePaths: ['fix-rerun'],
      packet: { from: 'fix', to: 'rerun', label: 'fix' },
      traceEvents: [
        { id: 'fix-written', type: 'repair', title: '写入修复', detail: '按根因写入最小修复，保持外部行为和原有接口兼容。', status: 'done' },
        { id: 'blast-radius-held', type: 'repair', title: '控制影响范围', detail: '避免借修复机会重构无关代码，降低引入新失败的概率。', status: 'active' },
      ],
    },
    {
      id: 'rerun-tests',
      title: 'Rerun Tests',
      description: '同一条测试命令重跑，确认红灯是否真的变绿，并观察是否引入新的失败或隐藏回归。',
      activeNodes: ['rerun', 'green'],
      activePaths: ['rerun-green'],
      packet: { from: 'rerun', to: 'green', label: 'pass' },
      traceEvents: [
        { id: 'tests-green', type: 'output', title: '确认绿灯', detail: '重跑原始验证命令，确认失败用例通过，并观察是否引入新的失败。', status: 'done' },
        { id: 'regression-noted', type: 'output', title: '记录验证证据', detail: '把命令、退出码和通过范围写入交付说明，避免只说看起来修好了。', status: 'active' },
      ],
    },
  ],
}
