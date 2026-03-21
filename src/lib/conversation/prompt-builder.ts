/**
 * Prompt Builder — the assembler.
 *
 * Composes the final system prompt from independent modules:
 *   soul     → who the agent is (stable)
 *   strategy → how to conduct the conversation (stable)
 *   themes   → what to explore (per-survey)
 *   context  → where we are right now (per-turn)
 *
 * Each module can be iterated independently. The builder just concatenates
 * them with the right separators and injects per-survey overrides.
 */

import type {
  SurveySchema,
  SurveyContext,
  SurveySettings,
  InterviewPromptTemplate,
  AgentBehaviorConfig,
  InteractiveSkillConfig,
} from '@/lib/survey/types';
import type { ConversationState, ExtractedField } from '@/lib/conversation/types';

import { buildSoul } from './prompts/soul';
import { buildStrategy } from './prompts/strategy';
import { buildThemes } from './prompts/themes';
import { buildContext } from './prompts/context';
import { buildGuardrails } from './prompts/guardrails';

interface BuildSystemPromptParams {
  survey: {
    title: string;
    description: string | null;
    context: SurveyContext;
    settings: SurveySettings;
    schema: SurveySchema;
  };
  state: ConversationState;
  extractedData: ExtractedField[];
  agentConfig?: {
    promptTemplate?: InterviewPromptTemplate;
    behavior?: AgentBehaviorConfig;
    interactiveSkills?: InteractiveSkillConfig[];
  };
  /** Number of messages in conversation history (for legacy compat, unused in new flow) */
  messageCount?: number;
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const { survey, state, agentConfig } = params;
  const { context, schema } = survey;

  const promptTemplate = agentConfig?.promptTemplate;
  const behavior = agentConfig?.behavior;

  const maxFollowUps = behavior?.maxFollowUpRounds ?? 2;
  const targetRounds = state.targetRounds;

  // --- Assemble modules ---

  const soul = buildSoul({
    persona: promptTemplate?.roleDescription,
    product: context.product,
  });

  const themes = buildThemes({
    schema,
    context,
    targetRounds,
  });

  const strategy = buildStrategy({
    maxFollowUps,
  });

  const dynamicContext = buildContext({
    state,
  });

  const guardrails = buildGuardrails({
    product: context.product,
  });

  // --- Per-survey overrides (from agent config) ---

  const overrides: string[] = [];

  if (promptTemplate?.openingMessage) {
    overrides.push(`Opening reference (adapt naturally, don't copy verbatim): ${promptTemplate.openingMessage}`);
  }
  if (promptTemplate?.closingMessage) {
    overrides.push(`Closing reference (adapt naturally): ${promptTemplate.closingMessage}`);
  }
  if (promptTemplate?.customRules && promptTemplate.customRules.length > 0) {
    overrides.push('Additional rules:\n' + promptTemplate.customRules.map((r) => `- ${r}`).join('\n'));
  }

  const overrideBlock = overrides.length > 0
    ? '\n# Additional Notes\n\n' + overrides.join('\n\n')
    : '';

  // --- Stable blocks ---

  const languageBlock = `# Language

Default to English. If the user writes in Chinese or another language → switch immediately, maintain that language throughout, including card text.`;

  const toolsBlock = `# Tools

- \`render_interactive\`: Interactive cards for NPS (0-10), ratings (1-5 stars), multiple choice, yes/no, etc.
- \`extract_data\`: Optional — conversation records are saved in full and analyzed automatically later
- \`conclude_interview\`: Call when the conversation naturally ends — must provide summary and key_insights
- Tool calls are invisible to the user`;

  const hasRespondentInfo = state.respondentInfo && Object.keys(state.respondentInfo).length > 0;

  const startBlock = `# Getting Started

Your first message (self-introduction):
1. Briefly introduce yourself and the purpose (2-3 sentences)
2. Mention language flexibility ("If you'd like to chat in another language, just let me know!")
3. They can skip any question or stop anytime${hasRespondentInfo ? '\n4. Naturally mention that you already know some background about them (refer to the "Known Information" section), so they feel valued' : ''}
5. Use render_interactive to provide a "Ready to begin?" button (yes_no card)
6. Do NOT ask any interview questions in the opening — wait for the user to click the button`;

  // --- Final assembly ---

  return [
    guardrails,
    soul,
    themes,
    strategy,
    dynamicContext,
    languageBlock,
    toolsBlock,
    overrideBlock,
    startBlock,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n');
}
