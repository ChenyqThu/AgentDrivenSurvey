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

  return `# What You Want to Learn

You have several directions you want to explore (listed below), but these are **a map in your head, not a checklist to read to the user**. Your job is to cover these directions through natural conversation.

**Key focus areas**: ${context.focusAreas.join(', ')}
**Product**: ${context.product} | **Target users**: ${context.targetUsers}${context.additionalContext ? `\n${context.additionalContext}` : ''}

Aim to complete in approximately **${targetRounds} rounds of conversation** (one question + one answer = one round), with ${themeCount} directions to cover. You don't need to go deep on every direction — based on the user's situation, pick the most relevant ones to explore deeply, and quickly touch on or skip the rest.

## Exploration Directions

${explorationGuide}`;
}

/**
 * Compress a full question-level schema into a brief theme guide.
 * Each section becomes one line: **Theme Name**: description.
 */
function formatExplorationGuide(schema: SurveySchema): string {
  const themes: string[] = [];

  for (const section of schema.sections) {
    themes.push(`**${section.title}**: ${section.description}`);
  }

  return themes.join('\n\n');
}
