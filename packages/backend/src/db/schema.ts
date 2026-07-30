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
    type: text(),
    text: text().notNull(),
    document: text("document").references(() => documents.id),
  },
  (table) => [
    check("check_type", sql`${table.type} in ('', 'must', 'should')`),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type Requirement = typeof requirements.$inferSelect;
export type NewRequirement = typeof requirements.$inferInsert;
