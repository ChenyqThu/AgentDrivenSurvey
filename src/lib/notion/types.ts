// Re-export NotionConfig from the canonical location
export type { NotionConfig } from '@/lib/survey/types';

export interface NotionSyncResult {
  success: boolean;
  databaseId: string;
  syncedCount: number;
  errors: { sessionId: string; error: string }[];
}
