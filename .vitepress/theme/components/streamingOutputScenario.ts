export type StreamingModeId = 'non-streaming' | 'streaming' | 'tool-args-chunks' | 'json-unclosed' | 'network-resume'
export type StreamingPhase = 'idle' | 'text' | 'tool-call' | 'error' | 'completed'
export type StreamingLogType = 'info' | 'success' | 'warning'

export interface StreamingEvent {
  phase: StreamingPhase
  output: string
  log: string
  logType: StreamingLogType
  buffer?: string
  chunkCount?: number
}

export interface StreamingOutputMode {
  id: StreamingModeId
  label: string
  summary: string
  isStreaming: boolean
  events: StreamingEvent[]
}

const finalText = '根据查询结果，北京今天天气晴朗，气温 22°C，东南风 3 级，非常适合户外活动。'

export const streamingOutputModes: StreamingOutputMode[] = [
  {
    id: 'non-streaming',
    label: '非流式',
    summary: '等待完整响应后一次性显示，用户只能看到最终结果。',
    isStreaming: false,
    events: [
      { phase: 'idle', output: '', log: '发送请求，等待完整响应...', logType: 'warning', chunkCount: 0 },
      { phase: 'completed', output: `好的，我来帮你查询北京的天气。\n\n${finalText}`, log: '收到完整响应', logType: 'success', chunkCount: 1 },
    ],
  },
  {
    id: 'streaming',
    label: '正常流式',
    summary: '文本 chunk 逐步到达；遇到工具调用时暂停文本流，工具完成后继续。',
    isStreaming: true,
    events: [
      { phase: 'text', output: '好的，我来帮你查询北京的天气。', log: '收到文本 chunk', logType: 'success', chunkCount: 1 },
      { phase: 'tool-call', output: '\n[工具调用: get_weather(city="北京")]', log: '检测到工具调用，暂停文本流', logType: 'warning', chunkCount: 2 },
      { phase: 'text', output: `\n\n${finalText}`, log: '工具调用完成，继续文本流', logType: 'success', chunkCount: 3 },
      { phase: 'completed', output: '', log: '流式输出完成', logType: 'success', chunkCount: 4 },
    ],
  },
  {
    id: 'tool-args-chunks',
    label: '参数分片',
    summary: 'tool_call 参数按 delta 分片到达，宿主必须累积 buffer，不能边到边执行。',
    isStreaming: true,
    events: [
      { phase: 'text', output: '我需要查询天气。', log: '收到文本 chunk', logType: 'success', chunkCount: 1 },
      { phase: 'tool-call', output: '', log: '收到工具参数分片 1', logType: 'warning', buffer: '{"city"', chunkCount: 2 },
      { phase: 'tool-call', output: '', log: '收到工具参数分片 2', logType: 'warning', buffer: '{"city":"北', chunkCount: 3 },
      { phase: 'tool-call', output: '[工具调用: get_weather({"city":"北京"})]', log: '参数分片累积完成，开始执行工具', logType: 'success', buffer: '{"city":"北京"}', chunkCount: 4 },
      { phase: 'completed', output: `\n${finalText}`, log: '工具结果回写完成', logType: 'success', chunkCount: 5 },
    ],
  },
  {
    id: 'json-unclosed',
    label: 'JSON 未闭合',
    summary: '流结束时 tool_call 参数仍不是合法 JSON，宿主返回结构化错误而不是执行工具。',
    isStreaming: true,
    events: [
      { phase: 'text', output: '我来查天气。', log: '收到文本 chunk', logType: 'success', chunkCount: 1 },
      { phase: 'tool-call', output: '', log: '开始累积 tool_call 参数', logType: 'warning', buffer: '{"city":"北京"', chunkCount: 2 },
      { phase: 'error', output: '{"error":"invalid_json","message":"tool_call arguments not closed"}', log: '流结束但 JSON 未闭合', logType: 'warning', buffer: '{"city":"北京"', chunkCount: 3 },
      { phase: 'completed', output: '\n模型需要重新生成合法参数。', log: '错误作为 tool 消息返回模型', logType: 'success', chunkCount: 4 },
    ],
  },
  {
    id: 'network-resume',
    label: '断流恢复',
    summary: '网络断流后保留已接收内容，重连后从最后事件继续恢复。',
    isStreaming: true,
    events: [
      { phase: 'text', output: '好的，我来帮你查询', log: '收到前半段文本', logType: 'success', chunkCount: 1 },
      { phase: 'error', output: '\n[stream disconnected]', log: '网络断流，记录 last_event_id', logType: 'warning', chunkCount: 2 },
      { phase: 'text', output: '北京的天气。', log: '连接恢复，继续接收', logType: 'success', chunkCount: 3 },
      { phase: 'completed', output: `\n${finalText}`, log: '恢复后流式输出完成', logType: 'success', chunkCount: 4 },
    ],
  },
]
