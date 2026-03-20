import type { ToolDefinition } from '@/lib/llm/provider';
import { renderInteractiveTool } from './skills'

export const interviewTools: ToolDefinition[] = [
  {
    name: 'extract_data',
    description:
      'Extracts structured data from the conversation and stores it against a specific section and field. Use this when the user provides a clear answer that should be recorded.',
    input_schema: {
      type: 'object',
      properties: {
        section_id: {
          type: 'string',
          description: 'The identifier of the survey section this data belongs to.',
        },
        field_key: {
          type: 'string',
          description: 'The key of the field within the section to populate.',
        },
        value: {
          description: 'The extracted value from the conversation. Can be any JSON-compatible type.',
        },
        confidence: {
          type: 'number',
          minimum: 0,
          maximum: 1,
          description: 'Confidence score between 0 and 1 indicating how certain the extraction is.',
        },
      },
      required: ['section_id', 'field_key', 'value', 'confidence'],
    },
  },
  {
    name: 'conclude_interview',
    description:
      'Call this when the interview has reached a natural conclusion — the user wants to stop, you have gathered enough insights, or the conversation has wound down. This marks the session as complete.',
    input_schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Why the interview is concluding, e.g. "user requested to stop", "covered key topics thoroughly", "natural end of conversation".',
        },
        summary: {
          type: 'string',
          description: 'Optional brief summary of key insights gathered during the interview.',
        },
      },
      required: ['reason'],
    },
  },
  renderInteractiveTool,
]
