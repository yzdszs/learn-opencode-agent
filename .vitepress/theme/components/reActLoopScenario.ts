export type ReActPhase = 'thought' | 'action' | 'parser' | 'observation' | 'final'

export type ReActModeId = 'success' | 'action-format-error' | 'empty-observation' | 'repeated-action'

export interface ReActStep {
  phase: ReActPhase
  title: string
  description: string
  thought?: string
  action?: string
  actionInput?: string
  observation?: string
  finalAnswer?: string
}

export interface ReActMode {
  id: ReActModeId
  label: string
  summary: string
  completionLog: string
  steps: ReActStep[]
}

export const reActLoopModes: ReActMode[] = [
  {
    id: 'success',
    label: '成功',
    summary: '标准 ReAct：先解释为什么需要工具，再执行 Action，用 Observation 得出最终回答。',
    completionLog: 'ReAct 推理链完成',
    steps: [
      {
        phase: 'thought',
        title: '1. Thought — 推理阶段',
        description: '模型先写出推理过程，解释为什么需要采取行动。',
        thought: '用户问北京今天适合跑步吗？我需要查询北京的实时天气数据才能判断。',
      },
      {
        phase: 'action',
        title: '2. Action — 行动决策',
        description: '基于推理，决定调用哪个工具和传入什么参数。',
        action: 'get_weather',
        actionInput: '{"city": "北京"}',
      },
      {
        phase: 'observation',
        title: '3. Observation — 观察结果',
        description: '工具执行后返回真实数据，作为下一步推理的依据。',
        observation: '晴，22°C，东南风 3 级，空气质量良',
      },
      {
        phase: 'thought',
        title: '4. Thought — 再次推理',
        description: '基于观察结果，继续推理下一步行动或得出结论。',
        thought: '22°C 晴天，风力不大，空气质量良好，这是非常适合户外运动的天气条件。',
      },
      {
        phase: 'final',
        title: '5. Final Answer — 最终回复',
        description: '推理链完成，给出最终答案。',
        finalAnswer: '今天北京非常适合跑步。天气晴朗，温度 22°C，风力不大，空气质量良好。',
      },
    ],
  },
  {
    id: 'action-format-error',
    label: 'Action 格式错误',
    summary: '模型想调用正确工具，但 Action Input 不是合法 JSON，Parser 拦截后要求模型修复。',
    completionLog: 'Action 格式错误已修复',
    steps: [
      {
        phase: 'thought',
        title: '1. Thought — 需要查询天气',
        description: '推理方向正确，确实需要工具。',
        thought: '我需要查询北京天气，再判断是否适合跑步。',
      },
      {
        phase: 'action',
        title: '2. Action — 输出格式错误',
        description: '工具名正确，但参数不是合法 JSON。',
        action: 'get_weather',
        actionInput: 'city=北京',
      },
      {
        phase: 'parser',
        title: '3. Parser — 拦截',
        description: '执行前解析 Action Input，发现格式不符合约定。',
        observation: '{"error":"parse_error","expected":"JSON object","received":"city=北京"}',
      },
      {
        phase: 'thought',
        title: '4. Thought — 修复格式',
        description: '模型读取结构化错误后，保持原目标，只修复参数格式。',
        thought: '上一次参数格式错误。我应该用 JSON object 重新调用同一个工具。',
      },
      {
        phase: 'action',
        title: '5. Action — 重新调用',
        description: '修复后的 Action Input 可以被 Parser 接受。',
        action: 'get_weather',
        actionInput: '{"city": "北京"}',
      },
      {
        phase: 'final',
        title: '6. Final Answer — 正常收敛',
        description: '格式错误没有中断任务，模型完成修复并回答。',
        finalAnswer: '北京今天适合跑步，天气晴朗、温度舒适，建议避开正午时段。',
      },
    ],
  },
  {
    id: 'empty-observation',
    label: 'Observation 空结果',
    summary: '工具执行成功但没有结果，模型需要改变查询策略，而不是继续编造答案。',
    completionLog: '空结果已转为澄清',
    steps: [
      {
        phase: 'thought',
        title: '1. Thought — 查询附近天气',
        description: '用户说法不够明确，模型仍尝试调用工具。',
        thought: '用户问附近是否适合跑步，我需要查询天气。',
      },
      {
        phase: 'action',
        title: '2. Action — 参数过宽',
        description: '参数没有明确城市，工具无法定位。',
        action: 'get_weather',
        actionInput: '{"city": "附近"}',
      },
      {
        phase: 'observation',
        title: '3. Observation — 空结果',
        description: '工具没有失败，但也没有可用数据。',
        observation: '{"ok":false,"error":"empty_result","hint":"city_required"}',
      },
      {
        phase: 'thought',
        title: '4. Thought — 改变策略',
        description: '模型不能编造天气，应改为向用户澄清。',
        thought: '我没有明确城市，不能给出天气判断。应该要求用户提供城市。',
      },
      {
        phase: 'final',
        title: '5. Final Answer — 请求澄清',
        description: '用可执行的下一步替代无依据回答。',
        finalAnswer: '我需要一个明确城市才能判断是否适合跑步，比如北京、上海或广州。',
      },
    ],
  },
  {
    id: 'repeated-action',
    label: '重复 Action',
    summary: '模型忽略错误信号并重复同一个 Action，Loop Guard 介入阻止无意义循环。',
    completionLog: '重复 Action 被 loop guard 截断',
    steps: [
      {
        phase: 'thought',
        title: '1. Thought — 初次尝试',
        description: '模型尝试用宽泛参数调用工具。',
        thought: '我先查询附近天气。',
      },
      {
        phase: 'action',
        title: '2. Action — 第一次调用',
        description: 'Action 参数无法被工具定位。',
        action: 'get_weather',
        actionInput: '{"city": "附近"}',
      },
      {
        phase: 'observation',
        title: '3. Observation — 空结果',
        description: '工具提示需要明确城市。',
        observation: '{"ok":false,"error":"empty_result","hint":"city_required"}',
      },
      {
        phase: 'action',
        title: '4. Action — 重复调用',
        description: '模型没有吸收 Observation，重复相同参数。',
        action: 'get_weather',
        actionInput: '{"city": "附近"}',
      },
      {
        phase: 'parser',
        title: '5. Loop Guard — 截断',
        description: '宿主检测到重复工具名和重复参数，返回结构化错误。',
        observation: '{"error":"repeated_action","hint":"ask_user_for_city"}',
      },
      {
        phase: 'final',
        title: '6. Final Answer — 停止循环',
        description: '模型转为澄清问题，避免继续消耗轮次。',
        finalAnswer: '我需要你提供明确城市名，才能继续查询天气。',
      },
    ],
  },
]
