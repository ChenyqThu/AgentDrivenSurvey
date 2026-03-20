// --- New deep-interview-oriented state ---

export interface ConversationState {
  roundCount: number;            // server-side increment each turn, 100% reliable
  targetRounds: number;          // computed at creation, frozen
  stage: 'opening' | 'exploring' | 'closing';

  themesExplored: ThemeProgress[];  // derived from extractedData
  currentTopicDepth: number;        // consecutive depth on current topic

  respondentInfo: Record<string, unknown>;  // preserved, extended for import
  startedAt: string;
  lastActiveAt: string;
  completionReason?: 'rounds_reached' | 'ai_concluded' | 'user_ended' | 'timeout';
}

export interface ThemeProgress {
  sectionId: string;
  sectionTitle: string;
  fieldsExtracted: number;   // extractedData rows for this section
  totalFields: number;
  touched: boolean;
}

// --- Legacy state (for migration) ---

export interface LegacyConversationState {
  currentSectionIndex: number;
  currentQuestionIndex: number;
  followUpDepth: number;
  questionStates: LegacyQuestionState[];
  respondentInfo: Record<string, unknown>;
  startedAt: string;
  lastActiveAt: string;
}

export interface LegacyQuestionState {
  sectionId: string;
  questionId: string;
  status: 'pending' | 'in_progress' | 'answered' | 'skipped';
  followUpCount: number;
}

// --- Shared types ---

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
