export interface ConversationState {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  followUpDepth: number;
  questionStates: QuestionState[];
  respondentInfo: Record<string, unknown>;
  startedAt: string;
  lastActiveAt: string;
}

export interface QuestionState {
  sectionId: string;
  questionId: string;
  status: 'pending' | 'in_progress' | 'answered' | 'skipped';
  followUpCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sequence: number;
  createdAt: Date;
}

export interface ExtractedField {
  sectionId: string;
  fieldKey: string;
  value: unknown;
  confidence: number;
  sourceMessageId?: string;
}

export interface ProgressUpdate {
  questionId: string;
  sectionId: string;
  status: 'answered' | 'skipped';
}
