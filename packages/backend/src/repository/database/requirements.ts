import { eq, inArray } from "drizzle-orm";

import {
  requirements,
  type NewRequirement,
  type Requirement,
} from "../../db/schema.ts";
import { DatabaseRepository } from "../base.ts";
import { RepositoryError } from "../errors.ts";
import { firstOrThrowNotFound, mapForeignKeyErrors } from "../helpers.ts";

export class RequirementRepository extends DatabaseRepository {
  async listByDocuments(ids: string | string[]): Promise<Requirement[]> {
    if (typeof ids === "string") {
      return this.db
        .select()
        .from(requirements)
        .where(eq(requirements.document, ids));
    } else {
      return this.db
        .select()
        .from(requirements)
        .where(inArray(requirements.document, ids));
    }
  }

  async getById(id: string): Promise<Requirement> {
    return firstOrThrowNotFound(
      await this.db.select().from(requirements).where(eq(requirements.id, id)),
      `Requirement with id = "${id}" does not exist.`,
    );
  }

  async create(requirement: NewRequirement): Promise<Requirement> {
    return mapForeignKeyErrors(async () => {
      const rows = await this.db
        .insert(requirements)
        .values(requirement)
        .onConflictDoNothing()
        .returning();

      if (rows.length === 0) {
        throw new RepositoryError({
          code: "Conflict",
          message: `Requirement with id = "${requirement.id}" already exists.`,
        });
      }

      return rows[0];
    });
  }

  async update(requirement: Requirement): Promise<Requirement> {
    const rows = await mapForeignKeyErrors(
      async () =>
        this.db
          .update(requirements)
          .set(requirement)
          .where(eq(requirements.id, requirement.id))
          .returning(),
      `Could not update requirement with id = "${requirement.id}" because the parent document with id = "${requirement.document}" does not exist.`,
    );

    return firstOrThrowNotFound(
      rows,
      `Could not update requirement with id = "${requirement.id}" as it does not exist.`,
    );
  }

  async delete(id: string): Promise<Requirement> {
    return firstOrThrowNotFound(
      await this.db
        .delete(requirements)
        .where(eq(requirements.id, id))
        .returning(),
      `Could not delete requirement with id = "${id}" as it does not exist.`,
    );
  }
}
