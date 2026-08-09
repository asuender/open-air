import { sql } from "drizzle-orm";
import { check, pgTable, text } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: text().primaryKey(),
  name: text().notNull(),
});

export const documents = pgTable("documents", {
  id: text().primaryKey(),
  name: text().notNull(),
  project: text().references(() => projects.id),
});

export const requirements = pgTable(
  "requirements",
  {
    id: text().primaryKey(),
    level: text(),
    type: text().notNull(),
    text: text().notNull(),
    document: text().references(() => documents.id),
  },
  (table) => [
    check("check_level", sql`${table.level} in ('', 'must', 'should', 'info')`),
    check(
      "check_type",
      sql`${table.type} in ('', 'technical', 'non-technical')`,
    ),
  ],
);

// Assets store relevant images such as explanatory diagrams etc.
// as base64 strings (I know, not optimal).
export const assets = pgTable("assets", {
  id: text().primaryKey(),
  base64: text(),
  requirement: text().references(() => requirements.id),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Requirement = typeof requirements.$inferSelect;
export type NewRequirement = typeof requirements.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
