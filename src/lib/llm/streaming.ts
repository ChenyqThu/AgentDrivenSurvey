export type SSEEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; name: string; input: Record<string, unknown> }
  | { type: 'done' }

function encodeSSE(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

export function createSSEStream(
  stream: AsyncIterable<Record<string, unknown>>
): TransformStream<Uint8Array, Uint8Array> {
  const encoder = new TextEncoder()

  // Accumulate tool use block state keyed by index
  const toolBlocks: Record<
    number,
    { name: string; inputJson: string }
  > = {}

  let controller!: TransformStreamDefaultController<Uint8Array>

  const transformStream = new TransformStream<Uint8Array, Uint8Array>({
    start(c) {
      controller = c
    },
  })

  // Drive the async iterable into the transform stream
  ;(async () => {
    try {
      for await (const event of stream) {
        const type = event.type as string

        if (type === 'content_block_start') {
          const index = event.index as number
          const block = event.content_block as Record<string, unknown>
          if ((block.type as string) === 'tool_use') {
            toolBlocks[index] = {
              name: block.name as string,
              inputJson: '',
            }
          }
        } else if (type === 'content_block_delta') {
          const index = event.index as number
          const delta = event.delta as Record<string, unknown>
          const deltaType = delta.type as string

          if (deltaType === 'text_delta') {
            const text = delta.text as string
            const sseEvent: SSEEvent = { type: 'text', content: text }
            controller.enqueue(encoder.encode(encodeSSE(sseEvent)))
          } else if (deltaType === 'input_json_delta') {
            if (toolBlocks[index]) {
              toolBlocks[index].inputJson += delta.partial_json as string
            }
          }
        } else if (type === 'content_block_stop') {
          const index = event.index as number
          if (toolBlocks[index]) {
            const block = toolBlocks[index]
            let input: Record<string, unknown> = {}
            try {
              input = JSON.parse(block.inputJson || '{}')
            } catch {
              input = {}
            }
            const sseEvent: SSEEvent = {
              type: 'tool_use',
              name: block.name,
              input,
            }
            controller.enqueue(encoder.encode(encodeSSE(sseEvent)))
            delete toolBlocks[index]
          }
        } else if (type === 'message_stop') {
          const sseEvent: SSEEvent = { type: 'done' }
          controller.enqueue(encoder.encode(encodeSSE(sseEvent)))
        }
      }
    } catch (err) {
      controller.error(err)
      return
    }
    controller.terminate()
  })()

  return transformStream
}
