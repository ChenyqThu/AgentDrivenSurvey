/**
 * Context — dynamic, per-turn context that changes as the conversation progresses.
 *
 * This module builds stage-aware context: what phase we're in, what's been
 * covered, what the user profile looks like so far. It's rebuilt every turn.
 *
 * This is the "working memory" of the agent — it knows where it is in the
 * conversation and adapts accordingly.
 */

import type { ConversationState } from '@/lib/conversation/types';
import type { SurveySchema } from '@/lib/survey/types';

export interface ContextParams {
  state: ConversationState;
  schema: SurveySchema;
  messageCount: number;
  targetRounds: number;
}

type Stage = 'opening' | 'exploring' | 'closing';

function detectStage(messageCount: number, targetRounds: number): Stage {
  // messageCount = number of messages in history (both user + assistant)
  // rough round count = messageCount / 2
  const rounds = Math.floor(messageCount / 2);

  if (rounds <= 1) return 'opening';
  if (rounds >= targetRounds - 3) return 'closing';
  return 'exploring';
}

function getStageGuidance(stage: Stage): string {
  switch (stage) {
    case 'opening':
      return `**当前阶段：开场**
你刚开始和用户聊。先了解一下对方的基本情况（用了多久、什么场景、什么角色），自然地建立联系。不要急着深入具体体验——先搞清楚对方是谁。`;

    case 'exploring':
      return `**当前阶段：深入探索**
你已经了解了用户的基本情况。现在根据他的画像，挑最相关的方向深入聊。优先追痛点和有故事的经历。`;

    case 'closing':
      return `**当前阶段：收尾**
对话快结束了。如果还没收集 NPS 评分，现在用 render_interactive 工具发一张评分卡片。然后问一个开放性的改进建议，最后感谢并结束。`;
  }
}

function getCoveredThemes(state: ConversationState, schema: SurveySchema): string[] {
  const covered: string[] = [];
  for (const section of schema.sections) {
    const sectionQuestions = state.questionStates.filter(
      (qs) => qs.sectionId === section.id
    );
    const answeredCount = sectionQuestions.filter(
      (qs) => qs.status === 'answered' || qs.status === 'skipped'
    ).length;
    // Consider a theme "covered" if at least half its questions are answered/skipped
    if (answeredCount > 0 && answeredCount >= sectionQuestions.length / 2) {
      covered.push(section.title);
    }
  }
  return covered;
}

export function buildContext({ state, schema, messageCount, targetRounds }: ContextParams): string {
  const stage = detectStage(messageCount, targetRounds);
  const stageGuidance = getStageGuidance(stage);
  const coveredThemes = getCoveredThemes(state, schema);
  const rounds = Math.floor(messageCount / 2);

  const lines: string[] = [
    `# 当前状态`,
    '',
    `对话进度：第 ${rounds} 轮 / 约 ${targetRounds} 轮`,
    '',
    stageGuidance,
  ];

  if (coveredThemes.length > 0) {
    lines.push('', `已聊过的方向：${coveredThemes.join('、')}`);
  }

  return lines.join('\n');
}
