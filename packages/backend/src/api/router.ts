import { z } from "zod";
import { publicProcedure, router } from "./trpc.ts";
import { type Context } from "./trpc.ts";
import { hasItems } from "../utils.ts";

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

async function deleteReqsAndAssets(docIds: string | string[], ctx: Context) {
  const { requirementRepo, assetRepo } = ctx;

  const reqs = await requirementRepo.listByDocuments(docIds);
  for (const req of reqs) {
    const assets = await assetRepo.listByRequirement(req.id);

    for (const asset of assets) {
      await assetRepo.delete(asset.path);
    }
  }
}

const projectsRouter = router({
  list: publicProcedure.query(async (opts) => {
    const { projectRepo } = opts.ctx;

    return projectRepo.list();
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { projectRepo } = ctx;

    return projectRepo.getById(input);
  }),
  create: publicProcedure.input(projectInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { projectRepo } = ctx;

    return projectRepo.create(input);
  }),
  update: publicProcedure.input(projectInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { projectRepo } = ctx;

    return projectRepo.update(input);
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { projectRepo, documentRepo } = ctx;

    const docs = await documentRepo.listByProject(input);
    if (hasItems(docs)) {
      await deleteReqsAndAssets(
        docs.map((doc) => doc.id),
        ctx,
      );
    }

    return projectRepo.delete(input);
  }),
});

const documentsRouter = router({
  listByProject: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { documentRepo } = ctx;

    return documentRepo.listByProject(input);
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { documentRepo } = ctx;

    return documentRepo.getById(input);
  }),
  create: publicProcedure.input(documentInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { documentRepo } = ctx;

    return documentRepo.create(input);
  }),
  update: publicProcedure.input(documentInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { documentRepo } = ctx;

    return documentRepo.update(input);
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { documentRepo } = ctx;

    await deleteReqsAndAssets(input, ctx);

    return documentRepo.delete(input);
  }),
});

const requirementsRouter = router({
  listByDocument: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo } = ctx;

    return requirementRepo.listByDocuments(input);
  }),
  getById: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo } = ctx;

    return requirementRepo.getById(input);
  }),
  create: publicProcedure.input(requirementInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo } = ctx;

    return requirementRepo.create(input);
  }),
  update: publicProcedure.input(requirementInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo } = ctx;

    return requirementRepo.update(input);
  }),
  delete: publicProcedure.input(idSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo, assetRepo } = ctx;

    const requirement = await requirementRepo.getById(input);
    const assets = await assetRepo.listByRequirement(requirement.id);

    for (const asset of assets) {
      await assetRepo.delete(asset.path);
    }

    return requirementRepo.delete(input);
  }),
});

const assetsRouter = router({
  listByRequirement: publicProcedure.input(idSchema).query(async (opts) => {
    const { input, ctx } = opts;

    return ctx.assetRepo.listByRequirement(input);
  }),
  getById: publicProcedure.input(assetIdSchema).query(async (opts) => {
    const { input, ctx } = opts;
    const { assetRepo } = ctx;

    return assetRepo.getById(input);
  }),
  upload: publicProcedure.input(assetUploadInput).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { requirementRepo, assetRepo } = ctx;

    const requirement = await requirementRepo.getById(input.requirement);

    return assetRepo.upload(requirement.id, input.body, input.metadata);
  }),
  delete: publicProcedure.input(assetIdSchema).mutation(async (opts) => {
    const { input, ctx } = opts;
    const { assetRepo } = ctx;

    return assetRepo.delete(input);
  }),
});

export const appRouter = router({
  projects: projectsRouter,
  documents: documentsRouter,
  requirements: requirementsRouter,
  assets: assetsRouter,
});

export type AppRouter = typeof appRouter;
