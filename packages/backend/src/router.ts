import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { assets, documents, projects, requirements } from "./db/schema.ts";
import { publicProcedure, router } from "./trpc.ts";
import {
  throwConflictIfForeignKeyViolation,
  throwNotFoundIfForeignKeyViolation,
} from "./db/errors.ts";

const idSchema = z.string().min(1);

const projectInput = z.object({
  id: idSchema,
  name: z.string().min(1),
});

const documentInput = z.object({
  id: idSchema,
  name: z.string().min(1),
  project: idSchema,
});

const requirementInput = z.object({
  id: idSchema,
  level: z.enum(["", "must", "should", "info"]),
  type: z.enum(["", "technical", "non-technical"]),
  text: z.string().min(1),
  document: idSchema,
});

const assetInput = z.object({
  id: idSchema,
  base64: z.string().min(1),
  requirement: idSchema,
});

function firstOrNullIfEmpty<T>(array: T[]): T | null {
  if (array.length == 0) {
    return null;
  }
  return array[0];
}

function firstOrThrowNotFound<T>(array: T[] | null): T {
  if (array == null || array.length == 0) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  return array[0];
}

const projectsRouter = router({
  list: publicProcedure.query(async (opts) => {
    const db = opts.ctx.db;

    return await db.select().from(projects);
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    return firstOrThrowNotFound(
      await db.select().from(projects).where(eq(projects.id, input)),
    );
  }),
  create: publicProcedure.input(projectInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    const rows = await db
      .insert(projects)
      .values({ ...input })
      .onConflictDoNothing({ target: projects.id })
      .returning();

    if (rows.length === 0) {
      throw new TRPCError({ code: "CONFLICT" });
    }

    return rows[0];
  }),
  update: publicProcedure.input(projectInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    return firstOrThrowNotFound(
      await db
        .update(projects)
        .set({ ...input })
        .where(eq(projects.id, input.id))
        .returning(),
    );
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db.delete(projects).where(eq(projects.id, input)).returning(),
      );
    } catch (err) {
      throwConflictIfForeignKeyViolation(err);
    }
  }),
});

const documentsRouter = router({
  listByProject: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    const project = firstOrNullIfEmpty(
      await db.select().from(projects).where(eq(projects.id, input)),
    );

    if (project == null) {
      return [];
    }

    return await db
      .select()
      .from(documents)
      .where(eq(documents.project, project.id));
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    return firstOrThrowNotFound(
      await db.select().from(documents).where(eq(documents.id, input)),
    );
  }),
  create: publicProcedure.input(documentInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      const rows = await db
        .insert(documents)
        .values({ ...input })
        .onConflictDoNothing({ target: documents.id })
        .returning();

      if (rows.length === 0) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      return rows[0];
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }),
  update: publicProcedure.input(documentInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db
          .update(documents)
          .set(input)
          .where(eq(documents.id, input.id))
          .returning(),
      );
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db.delete(documents).where(eq(documents.id, input)).returning(),
      );
    } catch (err) {
      throwConflictIfForeignKeyViolation(err);
    }
  }),
});

const requirementsRouter = router({
  listByDocument: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    const document = firstOrNullIfEmpty(
      await db.select().from(documents).where(eq(documents.id, input)),
    );

    if (document == null) {
      return [];
    }

    return await db
      .select()
      .from(requirements)
      .where(eq(requirements.document, document.id));
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    return firstOrThrowNotFound(
      await db.select().from(requirements).where(eq(requirements.id, input)),
    );
  }),
  create: publicProcedure.input(requirementInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      const rows = await db
        .insert(requirements)
        .values(input)
        .onConflictDoNothing()
        .returning();

      if (rows.length == 0) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      return rows[0];
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }),
  update: publicProcedure.input(requirementInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db
          .update(requirements)
          .set(input)
          .where(eq(requirements.id, input.id))
          .returning(),
      );
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db
          .delete(requirements)
          .where(eq(requirements.id, input))
          .returning(),
      );
    } catch (err) {
      throwConflictIfForeignKeyViolation(err);
    }
  }),
});

const assetsRouter = router({
  listByRequirement: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    const requirement = firstOrNullIfEmpty(
      await db.select().from(requirements).where(eq(requirements.id, input)),
    );

    if (requirement == null) {
      return [];
    }

    return await db.select().from(assets).where(eq(assets.requirement, input));
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    return firstOrThrowNotFound(
      await db.select().from(assets).where(eq(assets.id, input)),
    );
  }),
  create: publicProcedure.input(assetInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      const rows = await db
        .insert(assets)
        .values(input)
        .onConflictDoNothing({ target: assets.id })
        .returning();

      if (rows.length == 0) {
        throw new TRPCError({ code: "CONFLICT" });
      }

      return rows[0];
    } catch (err) {
      throwNotFoundIfForeignKeyViolation(err);
    }
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db } = ctx;

    try {
      return firstOrThrowNotFound(
        await db.delete(assets).where(eq(assets.id, input)).returning(),
      );
    } catch (err) {
      throwConflictIfForeignKeyViolation(err);
    }
  }),
});

export const appRouter = router({
  projects: projectsRouter,
  documents: documentsRouter,
  requirements: requirementsRouter,
  assets: assetsRouter,
});

export type AppRouter = typeof appRouter;
