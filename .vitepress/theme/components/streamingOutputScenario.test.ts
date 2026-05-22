import { describe, expect, test } from 'bun:test'

import { streamingOutputModes } from './streamingOutputScenario'

describe('streamingOutputModes', () => {
  test('覆盖非流式、正常流式和三种边界流式场景', () => {
    expect(streamingOutputModes.map((mode) => mode.id)).toEqual([
      'non-streaming',
      'streaming',
      'tool-args-chunks',
      'json-unclosed',
      'network-resume',
    ])
  })

  test('工具参数分片场景展示 tool_call buffer 累积', () => {
    const mode = streamingOutputModes.find((item) => item.id === 'tool-args-chunks')

    expect(mode?.events.some((event) => event.phase === 'tool-call' && event.buffer?.includes('"city"'))).toBe(true)
    expect(mode?.events.some((event) => event.log.includes('参数分片'))).toBe(true)
  })

  test('JSON 未闭合和网络恢复场景包含明确错误与恢复信号', () => {
    const jsonMode = streamingOutputModes.find((item) => item.id === 'json-unclosed')
    const resumeMode = streamingOutputModes.find((item) => item.id === 'network-resume')

    expect(jsonMode?.events.some((event) => event.output.includes('invalid_json'))).toBe(true)
    expect(resumeMode?.events.some((event) => event.log.includes('断流'))).toBe(true)
    expect(resumeMode?.events.some((event) => event.log.includes('恢复'))).toBe(true)
  })
})
