import { eq } from "drizzle-orm";

import { projects, type NewProject, type Project } from "../../db/schema.ts";
import { DatabaseRepository } from "../base.ts";
import { RepositoryError } from "../errors.ts";
import { firstOrThrowNotFound } from "../helpers.ts";

export class ProjectRepository extends DatabaseRepository {
  async list(): Promise<Project[]> {
    return this.db.select().from(projects);
  }

  async getById(id: string): Promise<Project> {
    return firstOrThrowNotFound(
      await this.db.select().from(projects).where(eq(projects.id, id)),
      `Project with id = "${id}" does not exist.`,
    );
  }

  async create(project: NewProject): Promise<Project> {
    const rows = await this.db
      .insert(projects)
      .values(project)
      .onConflictDoNothing({ target: projects.id })
      .returning();

    if (rows.length === 0) {
      throw new RepositoryError({
        code: "Conflict",
        message: `Project with id = "${project.id}" already exists.`,
      });
    }

    return rows[0];
  }

  async update(project: Project): Promise<Project> {
    return firstOrThrowNotFound(
      await this.db
        .update(projects)
        .set(project)
        .where(eq(projects.id, project.id))
        .returning(),
      `Could not update project with id = "${project.id}" as it does not exist.`,
    );
  }

  async delete(id: string): Promise<Project> {
    return firstOrThrowNotFound(
      await this.db.delete(projects).where(eq(projects.id, id)).returning(),
      `Could not delete project with id = "${id}" as it does not exist.`,
    );
  }
}
