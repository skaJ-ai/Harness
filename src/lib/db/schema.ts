import { sql } from 'drizzle-orm';
import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

type DeliverableSectionConfidence = 'high' | 'medium' | 'low';
type DeliverableStatus = 'draft' | 'final' | 'promoted_asset';
type MessageMetadata = Record<string, unknown>;
type MessageRole = 'assistant' | 'system' | 'user';
type SessionChecklist = Record<string, boolean>;
type SessionStatus = 'completed' | 'in_progress';
type SourceType = 'data' | 'table' | 'text';
type TemplateType = 'policy_review' | 'training_summary' | 'weekly_report';
type UserRole = 'admin' | 'user';

interface DeliverableSection {
  cited: boolean;
  confidence: DeliverableSectionConfidence;
  content: string;
  name: string;
}

const usersTable = pgTable('users', {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  employeeNumber: text('employee_number').notNull().unique(),
  id: uuid('id').defaultRandom().primaryKey(),
  knoxId: text('knox_id').notNull().unique(),
  loginId: text('login_id').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').$type<UserRole>().default('user').notNull(),
});

const workspacesTable = pgTable(
  'workspaces',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    ownerIndex: index('idx_workspaces_owner_id').on(table.ownerId),
  }),
);

const sessionsTable = pgTable(
  'sessions',
  {
    checklist: jsonb('checklist').$type<SessionChecklist>().default({}).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    status: text('status').$type<SessionStatus>().default('in_progress').notNull(),
    templateType: text('template_type').$type<TemplateType>().notNull(),
    title: text('title'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    templateIndex: index('idx_sessions_template_type').on(table.templateType),
    workspaceIndex: index('idx_sessions_workspace_id').on(table.workspaceId),
  }),
);

const messagesTable = pgTable(
  'messages',
  {
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    metadata: jsonb('metadata').$type<MessageMetadata>().default({}).notNull(),
    role: text('role').$type<MessageRole>().notNull(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessionsTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    messagesFtsIndex: index('idx_messages_fts').using(
      'gin',
      sql`to_tsvector('simple', ${table.content})`,
    ),
    sessionIndex: index('idx_messages_session_id').on(table.sessionId),
  }),
);

const sourcesTable = pgTable(
  'sources',
  {
    content: text('content').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    label: text('label'),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessionsTable.id, { onDelete: 'cascade' }),
    type: text('type').$type<SourceType>(),
  },
  (table) => ({
    sessionIndex: index('idx_sources_session_id').on(table.sessionId),
  }),
);

const deliverablesTable = pgTable(
  'deliverables',
  {
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    id: uuid('id').defaultRandom().primaryKey(),
    sections: jsonb('sections').$type<DeliverableSection[]>().notNull(),
    sessionId: uuid('session_id').references(() => sessionsTable.id, { onDelete: 'set null' }),
    status: text('status').$type<DeliverableStatus>().default('draft').notNull(),
    templateType: text('template_type').$type<TemplateType>().notNull(),
    title: text('title').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    version: integer('version').default(1).notNull(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspacesTable.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    deliverablesFtsIndex: index('idx_deliverables_fts').using(
      'gin',
      sql`to_tsvector('simple', ${table.title} || ' ' || ${table.sections}::text)`,
    ),
    sessionIndex: index('idx_deliverables_session_id').on(table.sessionId),
    workspaceIndex: index('idx_deliverables_workspace_id').on(table.workspaceId),
  }),
);

export {
  deliverablesTable,
  messagesTable,
  sessionsTable,
  sourcesTable,
  usersTable,
  workspacesTable,
};
export type {
  DeliverableSection,
  DeliverableStatus,
  SessionChecklist,
  SessionStatus,
  SourceType,
  TemplateType,
  UserRole,
};
