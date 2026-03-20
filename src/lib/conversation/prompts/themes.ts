/**
 * Themes — transform a question-level schema into exploration directions.
 *
 * Instead of giving the AI 55 individual questions (which creates checklist
 * behavior), we compress each schema section into a brief theme description.
 * The AI then explores these themes conversationally.
 *
 * This module is per-survey — each survey schema produces different themes.
 */

import type { SurveySchema, SurveyContext } from '@/lib/survey/types';

export interface ThemeParams {
  schema: SurveySchema;
  context: SurveyContext;
  targetRounds: number;
}

export function buildThemes({ schema, context, targetRounds }: ThemeParams): string {
  const themeCount = schema.sections.length;
  const explorationGuide = formatExplorationGuide(schema);

  return `# 你要了解的事情

你心里有几个想聊的方向（下面列出来了），但这些是**你脑子里的地图，不是念给用户的清单**。你的工作是在自然对话中，把这些方向覆盖到。

**重点关注**：${context.focusAreas.join('、')}
**产品**：${context.product}｜**用户群体**：${context.targetUsers}${context.additionalContext ? `\n${context.additionalContext}` : ''}

大约 **${targetRounds} 轮对话**完成（一问一答 = 一轮），有 ${themeCount} 个方向要覆盖。不需要每个方向都深入——根据用户的情况，选最相关的深聊，其他的快速带过或跳过。

## 探索方向

${explorationGuide}`;
}

/**
 * Compress a full question-level schema into a brief theme guide.
 * Each section becomes one line: **Theme Name**: description.
 */
function formatExplorationGuide(schema: SurveySchema): string {
  const themes: string[] = [];

  for (const section of schema.sections) {
    themes.push(`**${section.title}**：${section.description}`);
  }

  return themes.join('\n\n');
}
