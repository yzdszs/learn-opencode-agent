export type ErrorRetryPhase = 'call' | 'error' | 'backoff' | 'retry' | 'tool_error' | 'guard'
export type ErrorRetryModeId = 'rate-limit' | 'server-error' | 'invalid-arguments' | 'tool-exception' | 'max-iterations'

export interface ErrorRetryStep {
  phase: ErrorRetryPhase
  title: string
  description: string
  code?: string
  output?: string
}

export interface GuardLayer {
  phase: ErrorRetryPhase
  name: string
  desc: string
}

export interface ErrorRetryMode {
  id: ErrorRetryModeId
  label: string
  summary: string
  completionLog: string
  steps: ErrorRetryStep[]
}

export const errorRetryModes: ErrorRetryMode[] = [
  {
    id: 'rate-limit',
    label: '429 限流',
    summary: 'API 返回 rate_limit_error，使用指数退避后重试。',
    completionLog: '限流重试完成',
    steps: [
      { phase: 'call', title: '1. 发起 API 调用', description: 'Agent 发起模型请求。', code: `await client.chat.completions.create({ model, messages })` },
      { phase: 'error', title: '2. 429 限流', description: 'API 返回可重试限流错误。', output: `APIError: 429 rate_limit_error\nretryable: true` },
      { phase: 'backoff', title: '3. 指数退避', description: '等待后再重试，避免立即放大流量。', code: `await sleep(baseDelay * 2 ** attempt + jitter)` },
      { phase: 'retry', title: '4. 重试成功', description: '下一次请求正常返回。', output: `{ "finish_reason": "tool_calls" }` },
    ],
  },
  {
    id: 'server-error',
    label: '5xx 重试',
    summary: '服务端短暂失败，保留上下文并按可重试错误处理。',
    completionLog: '5xx 重试完成',
    steps: [
      { phase: 'call', title: '1. 发起 API 调用', description: 'Agent 发起模型请求。', code: `await callModel(messages)` },
      { phase: 'error', title: '2. 502 网关错误', description: '上游服务临时不可用。', output: `APIError: 502 bad_gateway\nretryable: true` },
      { phase: 'backoff', title: '3. 等待恢复', description: '按退避策略等待，不修改 messages。', code: `messages = previousMessages\nawait sleep(delay)` },
      { phase: 'retry', title: '4. 重试成功', description: '模型返回最终响应。', output: `{ "finish_reason": "stop" }` },
    ],
  },
  {
    id: 'invalid-arguments',
    label: '参数不可重试',
    summary: '请求参数本身错误，继续重试没有意义，应立即返回结构化错误。',
    completionLog: '参数错误已终止',
    steps: [
      { phase: 'call', title: '1. 发起工具调用', description: '模型生成工具参数。', output: `get_weather({})` },
      { phase: 'error', title: '2. 参数校验失败', description: '缺少必填字段 city。', output: `{ error: "invalid_arguments", retryable: false }` },
      { phase: 'guard', title: '3. 不进入重试', description: '不可重试错误直接回写给模型或用户。', code: `if (!error.retryable) return toToolMessage(error)` },
    ],
  },
  {
    id: 'tool-exception',
    label: '工具异常',
    summary: '工具函数抛出异常，宿主把异常包装成 tool message，而不是让进程崩溃。',
    completionLog: '工具异常已包装',
    steps: [
      { phase: 'call', title: '1. 执行工具', description: '工具收到合法参数。', code: `await executeTool(toolCall)` },
      { phase: 'tool_error', title: '2. 工具抛错', description: '下游服务或本地函数异常。', output: `WeatherProviderError: upstream timeout` },
      { phase: 'guard', title: '3. 包装为 tool 消息', description: '异常进入对话历史，模型可以解释或降级。', code: `return { role: 'tool', content: 'Error: upstream timeout' }` },
    ],
  },
  {
    id: 'max-iterations',
    label: 'maxIterations',
    summary: '模型持续工具循环时，用轮次上限终止，防止无限调用。',
    completionLog: 'maxIterations 已终止循环',
    steps: [
      { phase: 'call', title: '1. 第 49 轮', description: 'Agent 仍在继续调用工具。', output: `iteration = 49` },
      { phase: 'error', title: '2. 第 50 轮仍未停止', description: '超过正常 Agent 任务的可接受轮次。', output: `iteration = 50` },
      { phase: 'guard', title: '3. 主动终止', description: '抛出明确错误，交给上层处理。', output: `Max iterations exceeded`, code: `if (iterations >= maxIterations) throw new Error('Max iterations exceeded')` },
    ],
  },
]

export const errorRetryGuardLayers: GuardLayer[] = [
  { phase: 'error', name: 'API 错误层', desc: '区分可重试与不可重试错误。' },
  { phase: 'backoff', name: '退避层', desc: '可重试错误先等待，再重发。' },
  { phase: 'tool_error', name: '工具错误层', desc: '捕获异常并包装为 tool 消息。' },
  { phase: 'guard', name: '循环防护层', desc: 'maxIterations 或不可重试错误主动终止。' },
]
