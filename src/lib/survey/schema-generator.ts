import { generateWithTools } from '@/lib/llm/client';
import type { ToolDefinition } from '@/lib/llm/provider';
import type { SurveySchema, SurveyContext } from '@/lib/survey/types';

const SCHEMA_TOOL: ToolDefinition = {
  name: 'create_survey_schema',
  description:
    'Create a structured survey schema from a raw questionnaire and background context.',
  input_schema: {
    type: 'object',
    properties: {
      version: {
        type: 'string',
        description: 'Schema version identifier, e.g. "1.0"',
      },
      sections: {
        type: 'array',
        description: 'Ordered list of survey sections',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique section identifier' },
            title: { type: 'string', description: 'Section title' },
            description: { type: 'string', description: 'Section description' },
            order: { type: 'number', description: 'Display order (1-based)' },
            questions: {
              type: 'array',
              description: 'Questions within this section',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Unique question identifier' },
                  text: { type: 'string', description: 'Question text shown to respondent' },
                  type: {
                    type: 'string',
                    enum: ['open_ended', 'rating', 'multiple_choice', 'yes_no'],
                    description: 'Question type',
                  },
                  required: { type: 'boolean', description: 'Whether the question is required' },
                  followUpRules: {
                    type: 'array',
                    description: 'Rules for generating follow-up questions',
                    items: {
                      type: 'object',
                      properties: {
                        condition: {
                          type: 'string',
                          description: 'Natural language condition that triggers the follow-up',
                        },
                        question: {
                          type: 'string',
                          description: 'Follow-up question text',
                        },
                        maxDepth: {
                          type: 'number',
                          description: 'Maximum follow-up rounds (default 2)',
                        },
                      },
                      required: ['condition', 'question', 'maxDepth'],
                    },
                  },
                  extractionFields: {
                    type: 'array',
                    description: 'Data fields to extract from the answer',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string', description: 'Field key used in storage' },
                        type: {
                          type: 'string',
                          enum: ['string', 'number', 'boolean', 'string[]', 'object'],
                          description: 'Data type of the extracted value',
                        },
                        description: {
                          type: 'string',
                          description: 'What this field captures',
                        },
                      },
                      required: ['key', 'type', 'description'],
                    },
                  },
                },
                required: ['id', 'text', 'type', 'required', 'followUpRules', 'extractionFields'],
              },
            },
          },
          required: ['id', 'title', 'description', 'order', 'questions'],
        },
      },
      metadata: {
        type: 'object',
        description: 'High-level survey metadata',
        properties: {
          estimatedDuration: {
            type: 'number',
            description: 'Estimated completion time in minutes',
          },
          totalQuestions: { type: 'number', description: 'Total number of questions across all sections' },
          language: { type: 'string', description: 'Primary language of the survey, e.g. "en" or "zh"' },
        },
        required: ['estimatedDuration', 'totalQuestions', 'language'],
      },
    },
    required: ['version', 'sections', 'metadata'],
  },
};

const SYSTEM_PROMPT =
  'You are a survey design expert. Analyze the raw questionnaire and background context. ' +
  'Structure it into a SurveySchema with logical sections, well-defined questions, follow-up rules, ' +
  'and data extraction fields. Generate IDs in snake_case format (e.g., "section_demographics", "q_overall_satisfaction"). ' +
  'Write extraction field descriptions clearly so the extraction model knows what to look for. ' +
  'Follow-up rules should target genuinely interesting responses worth exploring. ' +
  'The language of generated content should match the questionnaire language.';

export async function generateSurveySchema(
  rawInput: string,
  context: SurveyContext
): Promise<SurveySchema> {
  const userMessage = [
    '## Raw Questionnaire',
    rawInput,
    '',
    '## Survey Context',
    `Product: ${context.product}`,
    `Target Users: ${context.targetUsers}`,
    `Focus Areas: ${context.focusAreas.join(', ')}`,
    context.additionalContext ? `Additional Context: ${context.additionalContext}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await generateWithTools(
    'claude-opus-4-20250514',
    SYSTEM_PROMPT,
    [{ role: 'user', content: userMessage }],
    [SCHEMA_TOOL]
  );

  const toolUse = response.content.find(
    (block): block is { type: 'tool_use'; name: string; input: Record<string, unknown> } =>
      block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('generateSurveySchema: LLM did not return a tool_use block');
  }

  return toolUse.input as unknown as SurveySchema;
}
