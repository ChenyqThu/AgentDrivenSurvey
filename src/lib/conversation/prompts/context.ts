/**
 * Context — dynamic, per-turn context that changes as the conversation progresses.
 *
 * Rebuilt every turn from the conversation state. Provides the agent with:
 * - Round progress and stage guidance
 * - Theme coverage summary (derived from extractedData)
 * - Imported respondent info (if available)
 */

import type { ConversationState } from '@/lib/conversation/types';

export interface ContextParams {
  state: ConversationState;
}

type Stage = 'opening' | 'exploring' | 'closing';

function getStageGuidance(stage: Stage): string {
  switch (stage) {
    case 'opening':
      return `**Current Stage: Opening**
You've just started talking with the user. First, learn about their basic situation (how long they've used the product, what context, what role), and naturally build rapport. Don't rush into specific experiences — figure out who they are first.`;

    case 'exploring':
      return `**Current Stage: Deep Exploration**
You've learned the user's basic situation. Now pick the most relevant directions based on their profile and dig deeper. Prioritize pain points and experiences that have a story behind them.`;

    case 'closing':
      return `**Current Stage: Wrapping Up**
The conversation is nearing its end. Follow this closing sequence in order — check the conversation history to see which steps are already done, then pick up from where you left off:

1. **NPS** — if not yet collected, use render_interactive (nps card) to ask "How likely are you to recommend [product] to a friend or colleague?"
2. **Improvement suggestion** — ask one open-ended question: "One last thing — if you could change or improve one thing about [product], what would it be?"
3. **Summary + confirmation** — summarize the 2-3 core findings from the conversation, then ask the user to confirm: "Let me make sure I got this right: [summary]. Does that capture it?"
4. **Thank you + interview rating** — thank the user warmly, then use render_interactive (rating card, 1–5 stars) to ask: "Last thing — how would you rate this interview experience?" Do both in the same message.
5. **Conclude** — call the conclude_interview tool with a summary and key_insights (3–5 findings).`;
  }
}

function sanitizeValue(value: unknown): string | null {
  if (typeof value === 'object' || typeof value === 'function') return null;
  const str = String(value).slice(0, 200);
  const suspicious = /ignore|system\s*prompt|instructions|你的|提示词|指令/i;
  if (suspicious.test(str)) return '[filtered]';
  return str;
}

function buildRespondentInfoBlock(info: Record<string, unknown>): string | null {
  const entries = Object.entries(info).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  const lines = entries.flatMap(([key, value]) => {
    const sanitized = sanitizeValue(value);
    if (sanitized === null) return [];
    // Pretty-print the key: snake_case → readable
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return [`- ${label}: ${sanitized}`];
  });

  return `## Known Information (from questionnaire)

${lines.join('\n')}

Based on this information, you can skip basic questions and dive directly into the directions most relevant to the user.`;
}

export function buildContext({ state }: ContextParams): string {
  const { roundCount, targetRounds, stage, themesExplored, currentTopicDepth } = state;

  const stageGuidance = getStageGuidance(stage);

  const touchedThemes = themesExplored.filter((t) => t.touched);
  const untouchedThemes = themesExplored.filter((t) => !t.touched);

  const lines: string[] = [
    `# Current State`,
    '',
    `Conversation progress: Round ${roundCount} / ~${targetRounds} rounds`,
    '',
    stageGuidance,
  ];

  if (touchedThemes.length > 0) {
    const touchedSummary = touchedThemes
      .map((t) => `${t.sectionTitle} (${t.fieldsExtracted} data points)`)
      .join(', ');
    lines.push('', `Themes explored: ${touchedSummary}`);
  }

  if (untouchedThemes.length > 0) {
    lines.push(`Themes not yet explored: ${untouchedThemes.map((t) => t.sectionTitle).join(', ')}`);
  }

  if (currentTopicDepth > 0) {
    const depthHint = currentTopicDepth >= 3
      ? ' — you can keep digging or switch directions'
      : '';
    lines.push(`Current topic depth: ${currentTopicDepth} consecutive rounds${depthHint}`);
  }

  lines.push('', 'Reminder: You don\'t need to cover every theme. Going deep on 2-3 themes is better than going shallow on 7.');

  // Inject imported respondent info if available
  const infoBlock = buildRespondentInfoBlock(state.respondentInfo);
  if (infoBlock) {
    lines.push('', infoBlock);
  }

  return lines.join('\n');
}
