import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  integer,
  real,
  unique,
} from 'drizzle-orm/pg-core';

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const surveys = pgTable('surveys', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  rawInput: text('raw_input').notNull(),
  context: jsonb('context'),
  schema: jsonb('schema'),
  settings: jsonb('settings').notNull().default('{}'),
  status: text('status').notNull().default('draft'),
  createdBy: uuid('created_by')
    .references(() => adminUsers.id),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id),
  respondentId: text('respondent_id'),
  respondentInfo: jsonb('respondent_info').notNull().default('{}'),
  state: jsonb('state'),
  status: text('status').notNull().default('active'),
  startedAt: timestamp('started_at', { mode: 'date' }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { mode: 'date' }),
  lastActiveAt: timestamp('last_active_at', { mode: 'date' }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id')
    .notNull()
    .references(() => sessions.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  sequence: integer('sequence').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

export const extractedData = pgTable(
  'extracted_data',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id),
    surveyId: uuid('survey_id')
      .notNull()
      .references(() => surveys.id),
    sectionId: text('section_id').notNull(),
    fieldKey: text('field_key').notNull(),
    fieldValue: jsonb('field_value'),
    confidence: real('confidence'),
    sourceMessageId: uuid('source_message_id').references(() => messages.id),
    extractedAt: timestamp('extracted_at', { mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    sessionSectionFieldUnique: unique().on(table.sessionId, table.sectionId, table.fieldKey),
  }),
);

export const analysisReports = pgTable('analysis_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  surveyId: uuid('survey_id')
    .notNull()
    .references(() => surveys.id),
  type: text('type').notNull(),
  sessionId: uuid('session_id').references(() => sessions.id),
  content: jsonb('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});

// Type inference helpers
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type Survey = typeof surveys.$inferSelect;
export type NewSurvey = typeof surveys.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type ExtractedData = typeof extractedData.$inferSelect;
export type NewExtractedData = typeof extractedData.$inferInsert;

export type AnalysisReport = typeof analysisReports.$inferSelect;
export type NewAnalysisReport = typeof analysisReports.$inferInsert;
