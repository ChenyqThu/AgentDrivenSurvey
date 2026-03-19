import type { SurveySchema, SurveySection, SurveyQuestion } from '@/lib/survey/types';
import type { ConversationState, QuestionState } from '@/lib/conversation/types';

export function createInitialState(schema: SurveySchema): ConversationState {
  const now = new Date().toISOString();
  const questionStates: QuestionState[] = [];

  for (const section of schema.sections) {
    for (const question of section.questions) {
      questionStates.push({
        sectionId: section.id,
        questionId: question.id,
        status: 'pending',
        followUpCount: 0,
      });
    }
  }

  return {
    currentSectionIndex: 0,
    currentQuestionIndex: 0,
    followUpDepth: 0,
    questionStates,
    respondentInfo: {},
    startedAt: now,
    lastActiveAt: now,
  };
}

export function getNextQuestion(
  state: ConversationState,
  schema: SurveySchema
): { section: SurveySection; question: SurveyQuestion } | null {
  // Walk sections and questions in order to find next pending or in_progress
  for (let si = 0; si < schema.sections.length; si++) {
    const section = schema.sections[si];
    for (let qi = 0; qi < section.questions.length; qi++) {
      const question = section.questions[qi];
      const qs = state.questionStates.find(
        (q) => q.sectionId === section.id && q.questionId === question.id
      );
      const status = qs?.status ?? 'pending';
      if (status === 'pending' || status === 'in_progress') {
        return { section, question };
      }
    }
  }
  return null;
}

export function updateQuestionState(
  state: ConversationState,
  sectionId: string,
  questionId: string,
  status: 'answered' | 'skipped' | 'in_progress'
): ConversationState {
  const questionStates = state.questionStates.map((qs) => {
    if (qs.sectionId === sectionId && qs.questionId === questionId) {
      return { ...qs, status };
    }
    return qs;
  });

  // Advance currentSectionIndex / currentQuestionIndex to the next pending/in_progress question
  // by scanning the updated list in schema order (we don't have schema here, so use questionStates order)
  let currentSectionIndex = state.currentSectionIndex;
  let currentQuestionIndex = state.currentQuestionIndex;

  if (status === 'answered' || status === 'skipped') {
    // Find the first pending question after the current one in list order
    const currentPos = questionStates.findIndex(
      (qs) => qs.sectionId === sectionId && qs.questionId === questionId
    );
    let nextPendingPos = -1;
    for (let i = currentPos + 1; i < questionStates.length; i++) {
      if (questionStates[i].status === 'pending' || questionStates[i].status === 'in_progress') {
        nextPendingPos = i;
        break;
      }
    }

    if (nextPendingPos !== -1) {
      // Count section index by scanning unique sectionIds in order
      const sectionIds: string[] = [];
      for (const qs of questionStates) {
        if (!sectionIds.includes(qs.sectionId)) {
          sectionIds.push(qs.sectionId);
        }
      }
      const nextSectionId = questionStates[nextPendingPos].sectionId;
      const nextSectionIndex = sectionIds.indexOf(nextSectionId);
      // Count question index within that section
      const questionsInSection = questionStates.filter((qs) => qs.sectionId === nextSectionId);
      const nextQuestionIndex = questionsInSection.findIndex(
        (qs) => qs.questionId === questionStates[nextPendingPos].questionId
      );
      currentSectionIndex = nextSectionIndex >= 0 ? nextSectionIndex : currentSectionIndex;
      currentQuestionIndex = nextQuestionIndex >= 0 ? nextQuestionIndex : currentQuestionIndex;
    }
  }

  return {
    ...state,
    questionStates,
    currentSectionIndex,
    currentQuestionIndex,
    lastActiveAt: new Date().toISOString(),
  };
}

export function getProgress(state: ConversationState): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = state.questionStates.length;
  const completed = state.questionStates.filter(
    (qs) => qs.status === 'answered' || qs.status === 'skipped'
  ).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function isComplete(state: ConversationState): boolean {
  return state.questionStates.every(
    (qs) => qs.status === 'answered' || qs.status === 'skipped'
  );
}
