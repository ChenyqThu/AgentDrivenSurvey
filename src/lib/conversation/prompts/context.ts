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
      return `**当前阶段：开场**
你刚开始和用户聊。先了解一下对方的基本情况（用了多久、什么场景、什么角色），自然地建立联系。不要急着深入具体体验——先搞清楚对方是谁。`;

    case 'exploring':
      return `**当前阶段：深入探索**
你已经了解了用户的基本情况。现在根据他的画像，挑最相关的方向深入聊。优先追痛点和有故事的经历。`;

    case 'closing':
      return `**当前阶段：收尾**
对话快结束了。如果还没收集 NPS 评分，现在用 render_interactive 工具发一张评分卡片。然后问一个开放性的改进建议，最后感谢并结束。对话自然结束时，调用 conclude_interview 工具。`;
  }
}

function buildRespondentInfoBlock(info: Record<string, unknown>): string | null {
  const entries = Object.entries(info).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return null;

  const lines = entries.map(([key, value]) => {
    // Pretty-print the key: snake_case → readable
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return `- ${label}：${String(value)}`;
  });

  return `## 已知信息（来自问卷）

${lines.join('\n')}

基于这些信息，你可以跳过基础问题，直接深入用户最关心的方向。`;
}

export function buildContext({ state }: ContextParams): string {
  const { roundCount, targetRounds, stage, themesExplored, currentTopicDepth } = state;

  const stageGuidance = getStageGuidance(stage);

  const touchedThemes = themesExplored.filter((t) => t.touched);
  const untouchedThemes = themesExplored.filter((t) => !t.touched);

  const lines: string[] = [
    `# 当前状态`,
    '',
    `对话进度：第 ${roundCount} 轮 / 约 ${targetRounds} 轮`,
    '',
    stageGuidance,
  ];

  if (touchedThemes.length > 0) {
    const touchedSummary = touchedThemes
      .map((t) => `${t.sectionTitle}（${t.fieldsExtracted} 个数据点）`)
      .join('、');
    lines.push('', `已触及的方向：${touchedSummary}`);
  }

  if (untouchedThemes.length > 0) {
    lines.push(`还没聊到的方向：${untouchedThemes.map((t) => t.sectionTitle).join('、')}`);
  }

  if (currentTopicDepth > 0) {
    const depthHint = currentTopicDepth >= 3
      ? '——可以继续深挖，也可以换方向'
      : '';
    lines.push(`当前话题深度：连续 ${currentTopicDepth} 轮${depthHint}`);
  }

  lines.push('', '提示：你不需要覆盖所有方向。有 2-3 个方向聊深比 7 个方向都浅好。');

  // Inject imported respondent info if available
  const infoBlock = buildRespondentInfoBlock(state.respondentInfo);
  if (infoBlock) {
    lines.push('', infoBlock);
  }

  return lines.join('\n');
}
