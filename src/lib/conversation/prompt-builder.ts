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
    overrides.push(`开场参考（自然演绎，不要照搬）：${promptTemplate.openingMessage}`);
  }
  if (promptTemplate?.closingMessage) {
    overrides.push(`收尾参考（自然演绎）：${promptTemplate.closingMessage}`);
  }
  if (promptTemplate?.customRules && promptTemplate.customRules.length > 0) {
    overrides.push('额外规则：\n' + promptTemplate.customRules.map((r) => `- ${r}`).join('\n'));
  }

  const overrideBlock = overrides.length > 0
    ? '\n# 补充说明\n\n' + overrides.join('\n\n')
    : '';

  // --- Stable blocks ---

  const languageBlock = `# 语言

默认英文。用户用中文或其他语言 → 立刻切换，全程保持，包括卡片文字。`;

  const toolsBlock = `# 工具

- \`render_interactive\`：NPS 评分（0-10）和满意度评分（1-5 星）卡片
- \`extract_data\`：可选，对话记录会完整保存，后续自动分析
- \`conclude_interview\`：对话自然结束时调用，必须提供 summary 和 key_insights
- 工具调用对用户不可见`;

  const hasRespondentInfo = state.respondentInfo && Object.keys(state.respondentInfo).length > 0;

  const startBlock = `# 开始

第一条消息（你的自我介绍）：
1. 简短介绍自己和目的（2-3 句）
2. 提到可以换语言（If you'd like to chat in another language, just let me know!）
3. 随时可以跳过或停止${hasRespondentInfo ? '\n4. 自然地提及你已经了解一些对方的背景（参考"已知信息"段落），让用户感到被重视' : ''}
5. "准备好就发条消息，我们开始吧"
6. 开场不问问题——等用户回复`;

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
