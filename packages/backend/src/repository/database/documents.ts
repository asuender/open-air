import type { Document, NewDocument } from "../../db/schema.ts";
import { documents } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { DatabaseRepository } from "../base.ts";
import {
  firstOrThrowNotFound,
  throwNotFoundIfForeignKeyViolation,
} from "../helpers.ts";
import { RepositoryError } from "../errors.ts";

export class DocumentRepository extends DatabaseRepository {
  async listByProject(id: string): Promise<Document[]> {
    return await this.db
      .select()
      .from(documents)
      .where(eq(documents.project, id));
  }

  async getById(id: string): Promise<Document> {
    return firstOrThrowNotFound(
      await this.db.select().from(documents).where(eq(documents.id, id)),
      `Requirement with id = "${id} does not exist."`,
    );
  }

  async create(document: NewDocument): Promise<Document> {
    try {
      const rows = await this.db
        .insert(documents)
        .values(document)
        .onConflictDoNothing({ target: documents.id })
        .returning();

      if (rows.length === 0) {
        throw new RepositoryError({
          code: "Conflict",
          message: `Document with id = "${document.id}" already exists.`,
        });
      }

      return rows[0];
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }

  async update(document: Document): Promise<Document> {
    try {
      return firstOrThrowNotFound(
        await this.db
          .update(documents)
          .set(document)
          .where(eq(documents.id, document.id))
          .returning(),
        `Could not update document with id = "${document.id}" as it does not exist.`,
      );
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }

  async delete(id: string): Promise<Document> {
    return firstOrThrowNotFound(
      await this.db.delete(documents).where(eq(documents.id, id)).returning(),
      `Could not delete document with id = "${id}" as it does not exist.`,
    );
  }
}
