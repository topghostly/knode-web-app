import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const statusEnum = pgEnum("status_t", ["READY", "IN_PROGRESS", "COMPLETED", "ABANDONED"]);
export const answerTypeEnum = pgEnum("answer_type_t", ["TEXT", "CODE", "MULTIPLE_CHOICE"]);
export const experienceLevelEnum = pgEnum("experience_level_t", ["JUNIOR", "MID", "SENIOR", "STAFF"]);

export type RubricCriterion = { criterion: string; points: number };
export type RubricResultItem = { criterion: string; maxPoints: number; awardedPoints: number };
export type QuestionMetadata = { generatorModel?: string; cognitiveTask?: string };

const createdAt = timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp({ withTimezone: true })
  .notNull()
  .defaultNow()
  .$onUpdate(() => new Date());

export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  name: text().notNull(),
  firstName: varchar({ length: 100 }).notNull(),
  lastName: varchar({ length: 100 }).notNull(),
  imageUrl: text(),
  experienceLevel: experienceLevelEnum(),
  createdAt,
  updatedAt,
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text().notNull(),
    accountId: text().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt,
    updatedAt,
  },
  (t) => [
    unique("accounts_provider_id_account_id_unique").on(t.providerId, t.accountId),
    index("accounts_user_id_idx").on(t.userId),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text().notNull().unique(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    createdAt,
    updatedAt,
  },
  (t) => [index("auth_sessions_user_id_idx").on(t.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid().primaryKey().defaultRandom(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt,
    updatedAt,
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const technologies = pgTable(
  "technologies",
  {
    id: uuid().primaryKey().defaultRandom(),
    name: text().notNull().unique(),
    slug: text().notNull().unique(),
    category: varchar({ length: 255 }).notNull(),
    isActive: boolean().notNull().default(true),
    createdAt,
    updatedAt,
  },
  (t) => [index("technologies_is_active_idx").on(t.isActive)],
);

export const userTechnologies = pgTable(
  "user_technologies",
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    technologyId: uuid()
      .notNull()
      .references(() => technologies.id),
    createdAt,
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.technologyId] }),
    index("user_technologies_technology_id_idx").on(t.technologyId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: statusEnum().notNull().default("READY"),
    score: numeric({ precision: 5, scale: 2 }),
    generatorVersion: varchar({ length: 100 }),
    createdAt,
    startedAt: timestamp({ withTimezone: true }),
    completedAt: timestamp({ withTimezone: true }),
  },
  (t) => [
    index("sessions_user_id_status_idx").on(t.userId, t.status),
    index("sessions_user_id_created_at_idx").on(t.userId, t.createdAt),
    check(
      "sessions_completed_after_started",
      sql`${t.startedAt} IS NULL OR ${t.completedAt} IS NULL OR ${t.completedAt} >= ${t.startedAt}`,
    ),
  ],
);

export const sessionQuestions = pgTable(
  "session_questions",
  {
    id: uuid().primaryKey().defaultRandom(),
    sessionId: uuid()
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    technologyId: uuid()
      .notNull()
      .references(() => technologies.id),
    position: integer().notNull(),
    questionText: text().notNull(),
    answerType: answerTypeEnum().notNull(),
    gradingRubric: jsonb().$type<RubricCriterion[]>().notNull(),
    options: jsonb().$type<string[]>(),
    correctOption: text(),
    codeLanguage: varchar({ length: 255 }),
    topic: varchar({ length: 255 }).notNull(),
    metadata: jsonb().$type<QuestionMetadata>(),
    createdAt,
  },
  (t) => [
    unique("session_questions_session_id_position_unique").on(t.sessionId, t.position),
    index("session_questions_session_id_idx").on(t.sessionId),
    index("session_questions_technology_id_idx").on(t.technologyId),
    index("session_questions_topic_idx").on(t.topic),
    check("session_questions_position_range", sql`${t.position} BETWEEN 1 AND 10`),
    check(
      "session_questions_answer_type_fields",
      sql`CASE ${t.answerType}
        WHEN 'TEXT' THEN ${t.options} IS NULL AND ${t.correctOption} IS NULL AND ${t.codeLanguage} IS NULL
        WHEN 'CODE' THEN ${t.options} IS NULL AND ${t.correctOption} IS NULL AND ${t.codeLanguage} IS NOT NULL
        WHEN 'MULTIPLE_CHOICE' THEN jsonb_typeof(${t.options}) = 'array' AND jsonb_array_length(${t.options}) = 4 AND ${t.correctOption} IS NOT NULL AND ${t.codeLanguage} IS NULL
      END`,
    ),
  ],
);

export const answers = pgTable(
  "answers",
  {
    id: uuid().primaryKey().defaultRandom(),
    questionId: uuid()
      .notNull()
      .unique()
      .references(() => sessionQuestions.id, { onDelete: "cascade" }),
    userAnswer: text().notNull(),
    score: smallint(),
    rubricResult: jsonb().$type<RubricResultItem[]>(),
    feedback: text(),
    missingPoints: jsonb().$type<string[]>(),
    betterAnswer: text(),
    answeredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    gradedAt: timestamp({ withTimezone: true }),
    updatedAt,
  },
  (t) => [
    index("answers_graded_at_idx").on(t.gradedAt),
    check("answers_score_range", sql`${t.score} IS NULL OR ${t.score} BETWEEN 0 AND 10`),
  ],
);

export const usersRelations = relations(users, ({ many }) => ({
  technologies: many(userTechnologies),
  sessions: many(sessions),
  accounts: many(accounts),
  authSessions: many(authSessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.userId], references: [users.id] }),
}));

export const technologiesRelations = relations(technologies, ({ many }) => ({
  users: many(userTechnologies),
  questions: many(sessionQuestions),
}));

export const userTechnologiesRelations = relations(userTechnologies, ({ one }) => ({
  user: one(users, { fields: [userTechnologies.userId], references: [users.id] }),
  technology: one(technologies, {
    fields: [userTechnologies.technologyId],
    references: [technologies.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
  questions: many(sessionQuestions),
}));

export const sessionQuestionsRelations = relations(sessionQuestions, ({ one }) => ({
  session: one(sessions, { fields: [sessionQuestions.sessionId], references: [sessions.id] }),
  technology: one(technologies, {
    fields: [sessionQuestions.technologyId],
    references: [technologies.id],
  }),
  answer: one(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(sessionQuestions, {
    fields: [answers.questionId],
    references: [sessionQuestions.id],
  }),
}));

export type ExperienceLevel = (typeof experienceLevelEnum.enumValues)[number];
export type User = typeof users.$inferSelect;
export type Technology = typeof technologies.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type SessionQuestion = typeof sessionQuestions.$inferSelect;
export type Answer = typeof answers.$inferSelect;
