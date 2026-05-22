export type ToolCallingPhase = 'declare' | 'decide' | 'validate' | 'execute' | 'integrate' | 'error' | 'repair'

export type ToolCallingModeId = 'success' | 'argument-error' | 'tool-failure' | 'retry-repair'

export interface ToolCallingStep {
  phase: ToolCallingPhase
  title: string
  description: string
  code?: string
  output?: string
}

export interface ToolCallingMode {
  id: ToolCallingModeId
  label: string
  summary: string
  completionLog: string
  steps: ToolCallingStep[]
}

export const toolCallingModes: ToolCallingMode[] = [
  {
    id: 'success',
    label: '成功',
    summary: '标准路径：模型生成合法 tool_call，宿主代码执行工具，再把结果交还给模型整合。',
    completionLog: '工具调用完成',
    steps: [
      {
        phase: 'declare',
        title: '1. 声明工具',
        description: '告诉模型有哪些工具、每个工具的参数 Schema。',
        code: `const tools = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: '查询指定城市的当前天气',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' }
      },
      required: ['city']
    }
  }
}]`,
      },
      {
        phase: 'decide',
        title: '2. 模型决策',
        description: '模型根据用户问题，决定是否调用工具。',
        code: `// 用户: "北京今天天气怎么样？"
// 模型生成 tool_call`,
        output: `{
  "tool_calls": [{
    "function": {
      "name": "get_weather",
      "arguments": "{\\"city\\":\\"北京\\"}"
    }
  }]
}`,
      },
      {
        phase: 'execute',
        title: '3. 执行工具',
        description: '宿主代码接收到 tool_calls，调用真实函数并返回结果。',
        code: `const input = JSON.parse(args) as { city: string }
const result = get_weather(input.city)`,
        output: `"北京今天晴，25°C"`,
      },
      {
        phase: 'integrate',
        title: '4. 整合结果',
        description: '把工具结果放回对话，模型生成最终回复。',
        code: `messages.push({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: result
})`,
        output: `"北京今天天气不错，晴天，气温25°C，适合外出活动。"`,
      },
    ],
  },
  {
    id: 'argument-error',
    label: '参数错误',
    summary: '模型漏传必填参数，Validator 先拦截，再把结构化错误返回给模型修复。',
    completionLog: '参数修复后执行成功',
    steps: [
      {
        phase: 'decide',
        title: '1. 生成 tool_call',
        description: '模型选择了正确工具，但参数没有满足 Schema。',
        output: `{
  "name": "get_weather",
  "arguments": "{}"
}`,
      },
      {
        phase: 'validate',
        title: '2. Validator 拦截',
        description: '执行前校验参数，发现必填字段 city 缺失。',
        code: `const parsed = weatherSchema.safeParse(args)
if (!parsed.success) {
  return toToolError(parsed.error)
}`,
        output: `{
  "error": "invalid_arguments",
  "missing": ["city"]
}`,
      },
      {
        phase: 'repair',
        title: '3. 返回结构化错误',
        description: '错误作为 role: tool 消息回到模型，而不是直接抛异常中断循环。',
        code: `messages.push({
  role: 'tool',
  tool_call_id: toolCall.id,
  content: JSON.stringify(error)
})`,
      },
      {
        phase: 'decide',
        title: '4. 重新生成参数',
        description: '模型根据错误信息补齐 city 字段。',
        output: `{
  "name": "get_weather",
  "arguments": "{\\"city\\":\\"北京\\"}"
}`,
      },
      {
        phase: 'execute',
        title: '5. 工具执行成功',
        description: '参数合法后再执行真实工具。',
        output: `"北京今天晴，25°C"`,
      },
    ],
  },
  {
    id: 'tool-failure',
    label: '工具失败',
    summary: '工具存在且参数合法，但下游依赖失败。宿主代码把失败包装为可读的 tool 结果。',
    completionLog: '工具失败已被模型感知',
    steps: [
      {
        phase: 'decide',
        title: '1. 生成合法调用',
        description: '工具名和参数都通过校验。',
        output: `get_weather({ "city": "北京" })`,
      },
      {
        phase: 'execute',
        title: '2. 调用外部服务',
        description: '工具开始访问天气 API。',
        code: `const result = await weatherClient.current({
  city: input.city,
  timeout: 3000
})`,
      },
      {
        phase: 'error',
        title: '3. 工具超时',
        description: '下游服务没有及时返回，工具层捕获错误。',
        output: `ToolTimeoutError: get_weather exceeded 3000ms`,
      },
      {
        phase: 'repair',
        title: '4. 返回失败结果',
        description: '失败被写成结构化 tool 消息，模型可以降级回复或稍后重试。',
        code: `return {
  ok: false,
  error: 'tool_timeout',
  retryable: true
}`,
        output: `{ "ok": false, "error": "tool_timeout", "retryable": true }`,
      },
      {
        phase: 'integrate',
        title: '5. 降级回复',
        description: '模型解释暂时无法获取实时天气，而不是编造结果。',
        output: `"天气服务暂时超时，我无法确认实时天气。你可以稍后再试。"`,
      },
    ],
  },
  {
    id: 'retry-repair',
    label: '重试修复',
    summary: '模型连续重复无效调用时，循环防护介入，要求改写参数或停止。',
    completionLog: '重复调用被修正',
    steps: [
      {
        phase: 'decide',
        title: '1. 第一次调用',
        description: '模型使用了过于宽泛的城市名。',
        output: `get_weather({ "city": "附近" })`,
      },
      {
        phase: 'error',
        title: '2. 返回空结果',
        description: '工具没有查到可用数据，返回明确的 empty_result。',
        output: `{ "ok": false, "error": "empty_result" }`,
      },
      {
        phase: 'decide',
        title: '3. 重复错误调用',
        description: '模型没有利用错误信息，继续发起相同调用。',
        output: `get_weather({ "city": "附近" })`,
      },
      {
        phase: 'validate',
        title: '4. 循环防护拦截',
        description: '宿主检测到重复工具名和重复参数，阻止无意义重试。',
        code: `if (sameToolCallCount(toolCall) >= 2) {
  return { error: 'repeated_tool_call' }
}`,
      },
      {
        phase: 'repair',
        title: '5. 提醒模型修复',
        description: '结构化错误要求模型改问用户或改写参数。',
        output: `{ "error": "repeated_tool_call", "hint": "ask_for_city" }`,
      },
      {
        phase: 'integrate',
        title: '6. 转向澄清',
        description: '模型停止重复调用，向用户索要明确城市。',
        output: `"我需要一个明确城市名才能查询天气，比如北京、上海或广州。"`,
      },
    ],
  },
]
