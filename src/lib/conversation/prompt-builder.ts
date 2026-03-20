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
  /** Number of messages in conversation history (for stage detection) */
  messageCount?: number;
}

export function buildSystemPrompt(params: BuildSystemPromptParams): string {
  const { survey, state, agentConfig, messageCount = 0 } = params;
  const { context, schema } = survey;

  const promptTemplate = agentConfig?.promptTemplate;
  const behavior = agentConfig?.behavior;

  const maxFollowUps = behavior?.maxFollowUpRounds ?? 2;
  const totalQuestions = schema.metadata?.totalQuestions
    ?? schema.sections.reduce((sum, s) => sum + s.questions.length, 0);
  const targetRounds = Math.min(Math.max(Math.ceil(totalQuestions * 0.6), 8), 20);

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
    schema,
    messageCount,
    targetRounds,
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
- \`update_progress\`：可选，标记某个方向已聊过
- 工具调用对用户不可见`;

  const startBlock = `# 开始

第一条消息：
1. 简短介绍自己和目的（2-3 句）
2. 提到可以换语言（If you'd like to chat in another language, just let me know!）
3. 随时可以跳过或停止
4. "准备好就发条消息，我们开始吧"
5. 开场不问问题——等用户回复`;

  // --- Final assembly ---

  return [
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
