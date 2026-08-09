import { sql } from "drizzle-orm";
import { check, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text().primaryKey(),
  name: text().notNull(),
});

export const documents = sqliteTable("documents", {
  id: text().primaryKey(),
  name: text().notNull(),
  project: text("project").references(() => projects.id),
});

export const requirements = sqliteTable(
  "requirements",
  {
    id: text().primaryKey(),
    level: text(),
    type: text().notNull(),
    text: text().notNull(),
    document: text("document").references(() => documents.id),
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
export const assets = sqliteTable("assets", {
  id: text().primaryKey(),
  base64: text(),
  requirement: text("requirement").references(() => requirements.id),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Requirement = typeof requirements.$inferSelect;
export type NewRequirement = typeof requirements.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
