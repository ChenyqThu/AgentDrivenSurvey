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
    name: 'update_progress',
    description:
      'Updates the completion status of a specific question in the survey. Call this after a question has been answered or when the user explicitly skips it.',
    input_schema: {
      type: 'object',
      properties: {
        section_id: {
          type: 'string',
          description: 'The identifier of the survey section containing the question.',
        },
        question_id: {
          type: 'string',
          description: 'The identifier of the question whose status is being updated.',
        },
        status: {
          type: 'string',
          enum: ['answered', 'skipped'],
          description: "The new status of the question: 'answered' or 'skipped'.",
        },
      },
      required: ['section_id', 'question_id', 'status'],
    },
  },
  renderInteractiveTool,
]
