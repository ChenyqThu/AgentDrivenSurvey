import type { SurveySchema } from '@/lib/survey/types';
import type {
  ConversationState,
  ThemeProgress,
  LegacyConversationState,
  ExtractedField,
} from '@/lib/conversation/types';

/**
 * Compute targetRounds from schema: 60% of total questions, clamped to [8, 20].
 */
export function computeTargetRounds(schema: SurveySchema): number {
  const totalQuestions = schema.metadata?.totalQuestions
    ?? schema.sections.reduce((sum, s) => sum + s.questions.length, 0);
  return Math.min(Math.max(Math.ceil(totalQuestions * 0.6), 8), 20);
}

/**
 * Build initial ThemeProgress[] from schema sections.
 */
function buildThemesFromSchema(schema: SurveySchema): ThemeProgress[] {
  return schema.sections.map((section) => ({
    sectionId: section.id,
    sectionTitle: section.title,
    fieldsExtracted: 0,
    totalFields: section.questions.length,
    touched: false,
  }));
}

/**
 * Create initial conversation state for a new session.
 */
export function createInitialState(
  schema: SurveySchema,
  targetRounds?: number,
  respondentInfo?: Record<string, unknown>,
): ConversationState {
  const now = new Date().toISOString();
  return {
    roundCount: 0,
    targetRounds: targetRounds ?? computeTargetRounds(schema),
    stage: 'opening',
    themesExplored: buildThemesFromSchema(schema),
    currentTopicDepth: 0,
    respondentInfo: respondentInfo ?? {},
    startedAt: now,
    lastActiveAt: now,
  };
}

/**
 * Detect conversation stage from round progress.
 */
function detectStage(roundCount: number, targetRounds: number): 'opening' | 'exploring' | 'closing' {
  if (roundCount <= 1) return 'opening';
  if (roundCount >= targetRounds - 3) return 'closing';
  return 'exploring';
}

/**
 * Recompute themesExplored from extractedData + schema.
 */
function recomputeThemes(
  themes: ThemeProgress[],
  extractedFields: ExtractedField[],
): ThemeProgress[] {
  return themes.map((theme) => {
    const count = extractedFields.filter((f) => f.sectionId === theme.sectionId).length;
    return {
      ...theme,
      fieldsExtracted: count,
      touched: count > 0,
    };
  });
}

/**
 * Advance one round. Called server-side BEFORE each LLM call.
 */
export function advanceRound(
  state: ConversationState,
  extractedFields: ExtractedField[],
): ConversationState {
  const roundCount = state.roundCount + 1;
  const stage = detectStage(roundCount, state.targetRounds);
  const themesExplored = recomputeThemes(state.themesExplored, extractedFields);

  return {
    ...state,
    roundCount,
    stage,
    themesExplored,
    lastActiveAt: new Date().toISOString(),
  };
}

/**
 * Check if conversation is complete.
 */
export function isComplete(state: ConversationState): boolean {
  if (state.completionReason) return true;
  if (state.roundCount >= state.targetRounds) return true;
  return false;
}

/**
 * Check if conversation should be force-completed (hard ceiling).
 */
export function shouldForceComplete(state: ConversationState): boolean {
  return state.roundCount >= state.targetRounds + 3;
}

/**
 * Get progress summary for display / context injection.
 */
export function getProgress(state: ConversationState): {
  roundCount: number;
  targetRounds: number;
  stage: string;
  themesTouched: number;
  totalThemes: number;
} {
  const themesTouched = state.themesExplored.filter((t) => t.touched).length;
  return {
    roundCount: state.roundCount,
    targetRounds: state.targetRounds,
    stage: state.stage,
    themesTouched,
    totalThemes: state.themesExplored.length,
  };
}

/**
 * Migrate legacy questionStates-based state to the new round-based state.
 */
export function migrateFromLegacy(
  raw: LegacyConversationState,
  schema: SurveySchema,
  messageCount: number,
  extractedFields: ExtractedField[],
): ConversationState {
  const targetRounds = computeTargetRounds(schema);
  // Estimate roundCount from message history (each round = 1 user + 1 assistant)
  const roundCount = Math.floor(messageCount / 2);
  const stage = detectStage(roundCount, targetRounds);
  const themes = recomputeThemes(buildThemesFromSchema(schema), extractedFields);

  return {
    roundCount,
    targetRounds,
    stage,
    themesExplored: themes,
    currentTopicDepth: 0,
    respondentInfo: raw.respondentInfo ?? {},
    startedAt: raw.startedAt,
    lastActiveAt: raw.lastActiveAt,
  };
}

/**
 * Detect whether a raw state object is legacy format.
 */
export function isLegacyState(raw: unknown): raw is LegacyConversationState {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    'questionStates' in raw &&
    Array.isArray((raw as LegacyConversationState).questionStates)
  );
}
