import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { documents, projects, requirements } from "../db/schema.ts";
import { publicProcedure, router } from "./index.ts";
import {
  rethrowStorageErrorForTRPC,
  throwConflictIfForeignKeyViolation,
  throwNotFoundIfForeignKeyViolation,
} from "../db/errors.ts";
import { type Storage } from "@storagesdk/core";

const idSchema = z.string().min(1);
const assetIdSchema = z.string().startsWith("requirements/").min(1);

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

const assetUploadInput = z.object({
  body: z.instanceof(Uint8Array).refine((body) => body.byteLength > 0),
  requirement: idSchema,
  metadata: z
    .object({
      contentType: z.string().min(1).optional(),
      metadata: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
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

async function listAllByPrefix(storage: Storage, prefix: string) {
  const items = [];
  let cursor: string | undefined;

  do {
    const page = await storage.list({ prefix, cursor });
    items.push(...page.items);
    cursor = page.cursor;
  } while (cursor !== undefined);

  return items;
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
    const { db, storage } = ctx;

    try {
      const requirement = firstOrThrowNotFound(
        await db.select().from(requirements).where(eq(requirements.id, input)),
      );
      const assets = await listAllByPrefix(storage, `requirements/${input}/`);

      for (const asset of assets) {
        await storage.delete(asset.path);
      }
      await db.delete(requirements).where(eq(requirements.id, input));

      return requirement;
    } catch (err) {
      throwConflictIfForeignKeyViolation(err);
    }
  }),
});

const assetsRouter = router({
  listByRequirement: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;

    return await listAllByPrefix(ctx.storage, `requirements/${input}/`);
  }),
  getById: publicProcedure.input(assetIdSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { storage } = ctx;

    try {
      return await storage.download(input);
    } catch (err) {
      rethrowStorageErrorForTRPC(err);
    }
  }),
  upload: publicProcedure.input(assetUploadInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { db, storage } = ctx;
    const requirement = firstOrNullIfEmpty(
      await db
        .select()
        .from(requirements)
        .where(eq(requirements.id, input.requirement)),
    );

    if (requirement == null) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    const path = `requirements/${input.requirement}/${randomUUID()}`;

    return await storage.upload(path, input.body, input.metadata);
  }),
  delete: publicProcedure.input(assetIdSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { storage } = ctx;

    try {
      const asset = await storage.head(input);
      await storage.delete(input);

      return asset;
    } catch (err) {
      rethrowStorageErrorForTRPC(err);
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
