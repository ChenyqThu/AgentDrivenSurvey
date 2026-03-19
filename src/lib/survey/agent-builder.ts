import { generateWithTools } from '@/lib/llm/client';
import type { ToolDefinition } from '@/lib/llm/provider';
import type {
  SurveySchema,
  SurveyContext,
  InterviewPromptTemplate,
  InteractiveSkillConfig,
  AgentBehaviorConfig,
} from '@/lib/survey/types';

// ─── Agent Config type (without schema) ─────────────────────────────────────

export interface AgentConfig {
  promptTemplate: InterviewPromptTemplate;
  interactiveSkills: InteractiveSkillConfig[];
  behavior: AgentBehaviorConfig;
}

// ─── Tool Definition ─────────────────────────────────────────────────────────

const BUILD_AGENT_CONFIG_TOOL: ToolDefinition = {
  name: 'build_agent_config',
  description:
    'Build the interview agent configuration from an existing survey schema and context. ' +
    'This includes the interview prompt template, interactive skill definitions, ' +
    'and behavior configuration. The schema is already generated separately.',
  input_schema: {
    type: 'object' as const,
    properties: {
      promptTemplate: {
        type: 'object',
        description: 'Interview prompt template for the agent',
        properties: {
          roleDescription: {
            type: 'string',
            description:
              'A rich description of the interviewer role, tailored to the product and context. ' +
              'Example: "You are a friendly product researcher helping gather insights about [product] from [target users]."',
          },
          openingMessage: {
            type: 'string',
            description:
              'The greeting message to start the conversation. Should be warm, set expectations, ' +
              'and mention the estimated duration.',
          },
          closingMessage: {
            type: 'string',
            description:
              'The thank-you message for when the survey is complete. Should summarize key themes and express gratitude.',
          },
          customRules: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Custom behavior rules specific to this survey. ' +
              'Examples: "Always ask about pricing in the context of value", ' +
              '"If the user mentions a competitor, explore what they like about it"',
          },
        },
        required: ['roleDescription', 'openingMessage', 'closingMessage', 'customRules'],
      },
      interactiveSkills: {
        type: 'array',
        description:
          'Which questions should use interactive cards instead of text-based answers. ' +
          'Use cards for: NPS scores, satisfaction ratings, yes/no questions, multiple choice with fixed options. ' +
          'Do NOT use cards for: open-ended questions, exploratory questions that benefit from free-form answers.',
        items: {
          type: 'object',
          properties: {
            questionId: { type: 'string' },
            sectionId: { type: 'string' },
            cardType: {
              type: 'string',
              enum: ['nps', 'rating', 'multiple_choice', 'multi_select', 'yes_no', 'likert', 'slider'],
            },
            cardConfig: {
              type: 'object',
              description:
                'Card-specific config. For nps: {lowLabel, highLabel}. For rating: {maxStars}. ' +
                'For multiple_choice/multi_select: {options: string[]}. For likert: {points, labels}. ' +
                'For slider: {min, max, step, unit}. For yes_no: {yesLabel, noLabel}.',
            },
          },
          required: ['questionId', 'sectionId', 'cardType', 'cardConfig'],
        },
      },
      behavior: {
        type: 'object',
        description: 'Behavior configuration for the interview agent',
        properties: {
          maxFollowUpRounds: {
            type: 'number',
            description: 'Maximum follow-up rounds per question (default 2)',
          },
          detectImpatience: {
            type: 'boolean',
            description: 'Whether to detect user impatience and accelerate',
          },
          allowSkipping: {
            type: 'boolean',
            description: 'Whether users can skip questions',
          },
          adaptiveDepth: {
            type: 'boolean',
            description: 'Adjust follow-up depth based on response quality',
          },
          transitionStyle: {
            type: 'string',
            enum: ['smooth', 'direct'],
            description: 'How to transition between sections',
          },
        },
        required: [
          'maxFollowUpRounds',
          'detectImpatience',
          'allowSkipping',
          'adaptiveDepth',
          'transitionStyle',
        ],
      },
    },
    required: ['promptTemplate', 'interactiveSkills', 'behavior'],
  },
};

// ─── System Prompt ───────────────────────────────────────────────────────────

const AGENT_CONFIG_PROMPT = `You are an expert interview agent designer. Given a structured survey schema and its context, generate the interview agent configuration.

The survey schema (questions, sections, extraction fields) has already been created. Your job is to design HOW the interview should be conducted.

## Your Tasks

1. **Prompt Template**: Create a tailored interview persona and conversation templates:
   - roleDescription: A specific persona matching the product/context (not generic)
   - openingMessage: Warm greeting that sets expectations and mentions duration
   - closingMessage: Grateful wrap-up that references what was discussed
   - customRules: 3-5 domain-specific behavior rules

2. **Interactive Skills**: Identify which questions are best served by UI cards vs free-form text:
   - NPS questions → nps card
   - Satisfaction/rating questions → rating card
   - Yes/No questions → yes_no card
   - Questions with fixed options → multiple_choice or multi_select card
   - Scale questions → likert or slider card
   - Open-ended, exploratory questions → NO card (let them answer freely)

3. **Behavior Config**: Set appropriate behavior based on the survey type:
   - Quick feedback surveys → fewer follow-ups, direct transitions
   - Deep research interviews → more follow-ups, smooth transitions
   - Always detect impatience and allow skipping

## Guidelines
- The language of the prompt template should match the survey language
- When the questionnaire is in Chinese, generate Chinese prompt templates and card labels
- Reference question IDs and section IDs from the provided schema exactly`;

// ─── Builder Function ────────────────────────────────────────────────────────

export async function buildAgentConfig(
  schema: SurveySchema,
  context: SurveyContext
): Promise<AgentConfig> {
  const schemaOverview = schema.sections
    .map((s) => {
      const questions = s.questions
        .map((q) => `    - [${q.id}] ${q.text} (${q.type}${q.required ? ', required' : ''})`)
        .join('\n');
      return `  Section: ${s.title} (${s.id})\n${questions}`;
    })
    .join('\n\n');

  const userMessage = [
    '## Survey Schema',
    `Language: ${schema.metadata.language}`,
    `Total Questions: ${schema.metadata.totalQuestions}`,
    `Estimated Duration: ${schema.metadata.estimatedDuration} minutes`,
    '',
    schemaOverview,
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
    AGENT_CONFIG_PROMPT,
    [{ role: 'user', content: userMessage }],
    [BUILD_AGENT_CONFIG_TOOL]
  );

  const toolUse = response.content.find(
    (block): block is { type: 'tool_use'; name: string; input: Record<string, unknown> } =>
      block.type === 'tool_use'
  );

  if (!toolUse) {
    throw new Error('buildAgentConfig: LLM did not return a tool_use block');
  }

  const input = toolUse.input as unknown as {
    promptTemplate: InterviewPromptTemplate;
    interactiveSkills: InteractiveSkillConfig[];
    behavior: AgentBehaviorConfig;
  };

  return {
    promptTemplate: input.promptTemplate,
    interactiveSkills: input.interactiveSkills,
    behavior: input.behavior,
  };
}
