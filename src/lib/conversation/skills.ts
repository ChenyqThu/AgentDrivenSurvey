import type { ToolDefinition } from '@/lib/llm/provider';

// Card types for survey interactions
export type CardType =
  | 'nps'             // Net Promoter Score 0-10
  | 'rating'          // Star rating 1-5
  | 'multiple_choice' // Select one from options
  | 'multi_select'    // Select multiple from options
  | 'yes_no'          // Binary choice
  | 'likert'          // Strongly disagree to Strongly agree (5-7 point)
  | 'slider'          // Numeric range slider

export interface CardConfig {
  nps: { question: string; lowLabel?: string; highLabel?: string }
  rating: { question: string; maxStars?: number; labels?: string[] }
  multiple_choice: { question: string; options: string[] }
  multi_select: { question: string; options: string[]; minSelect?: number; maxSelect?: number }
  yes_no: { question: string; yesLabel?: string; noLabel?: string }
  likert: { question: string; points?: number; labels?: string[] }
  slider: { question: string; min: number; max: number; step?: number; unit?: string }
}

export interface InteractiveCard<T extends CardType = CardType> {
  id: string
  type: T
  config: CardConfig[T]
}

export interface CardInteractionResult {
  cardId: string
  cardType: CardType
  value: unknown
  timestamp: string
}

// The tool definition for render_interactive
export const renderInteractiveTool: ToolDefinition = {
  name: 'render_interactive',
  description:
    'Render an interactive UI card for the user to provide structured input. Use this for rating scales, NPS scores, multiple choice questions, yes/no questions, and other structured inputs. The user will see a visual card and can interact with it directly. Do NOT ask the same question as text - the card IS the question.',
  input_schema: {
    type: 'object',
    properties: {
      card_type: {
        type: 'string',
        enum: ['nps', 'rating', 'multiple_choice', 'multi_select', 'yes_no', 'likert', 'slider'],
        description: 'Type of interactive card to render',
      },
      question: {
        type: 'string',
        description: 'The question text displayed on the card',
      },
      options: {
        type: 'array',
        items: { type: 'string' },
        description: 'Options for multiple_choice or multi_select cards',
      },
      config: {
        type: 'object',
        description:
          'Additional configuration. For nps: {lowLabel, highLabel}. For rating: {maxStars}. For slider: {min, max, step, unit}. For likert: {points, labels}. For yes_no: {yesLabel, noLabel}.',
      },
    },
    required: ['card_type', 'question'],
  },
}
