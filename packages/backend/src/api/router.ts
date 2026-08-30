import { z } from "zod";

import { hasItems } from "../utils.ts";
import { publicProcedure, type Context } from "./orpc.ts";

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

async function deleteReqsAndAssets(
  docIds: string | string[],
  ctx: Context,
): Promise<void> {
  const { requirementRepo, assetRepo } = ctx;

  const reqs = await requirementRepo.listByDocuments(docIds);
  for (const req of reqs) {
    const assets = await assetRepo.listByRequirement(req.id);

    for (const asset of assets) {
      await assetRepo.delete(asset.path);
    }
  }
}

const projectsRouter = {
  list: publicProcedure.handler(async ({ context }) => {
    return context.projectRepo.list();
  }),
  getById: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.projectRepo.getById(input);
    }),
  create: publicProcedure
    .input(projectInput)
    .handler(async ({ input, context }) => {
      return context.projectRepo.create(input);
    }),
  update: publicProcedure
    .input(projectInput)
    .handler(async ({ input, context }) => {
      return context.projectRepo.update(input);
    }),
  delete: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      const { projectRepo, documentRepo } = context;

      const docs = await documentRepo.listByProject(input);
      if (hasItems(docs)) {
        await deleteReqsAndAssets(
          docs.map((doc) => doc.id),
          context,
        );
      }

      return projectRepo.delete(input);
    }),
};

const documentsRouter = {
  listByProject: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.documentRepo.listByProject(input);
    }),
  getById: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.documentRepo.getById(input);
    }),
  create: publicProcedure
    .input(documentInput)
    .handler(async ({ input, context }) => {
      return context.documentRepo.create(input);
    }),
  update: publicProcedure
    .input(documentInput)
    .handler(async ({ input, context }) => {
      return context.documentRepo.update(input);
    }),
  delete: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      await deleteReqsAndAssets(input, context);

      return context.documentRepo.delete(input);
    }),
};

const requirementsRouter = {
  listByDocument: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.requirementRepo.listByDocuments(input);
    }),
  getById: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.requirementRepo.getById(input);
    }),
  create: publicProcedure
    .input(requirementInput)
    .handler(async ({ input, context }) => {
      return context.requirementRepo.create(input);
    }),
  update: publicProcedure
    .input(requirementInput)
    .handler(async ({ input, context }) => {
      return context.requirementRepo.update(input);
    }),
  delete: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      const { requirementRepo, assetRepo } = context;

      const requirement = await requirementRepo.getById(input);
      const assets = await assetRepo.listByRequirement(requirement.id);

      for (const asset of assets) {
        await assetRepo.delete(asset.path);
      }

      return requirementRepo.delete(input);
    }),
};

const assetsRouter = {
  listByRequirement: publicProcedure
    .input(idSchema)
    .handler(async ({ input, context }) => {
      return context.assetRepo.listByRequirement(input);
    }),
  getById: publicProcedure
    .input(assetIdSchema)
    .handler(async ({ input, context }) => {
      return context.assetRepo.getById(input);
    }),
  upload: publicProcedure
    .input(assetUploadInput)
    .handler(async ({ input, context }) => {
      const { requirementRepo, assetRepo } = context;

      const requirement = await requirementRepo.getById(input.requirement);

      return assetRepo.upload(requirement.id, input.body, input.metadata);
    }),
  delete: publicProcedure
    .input(assetIdSchema)
    .handler(async ({ input, context }) => {
      return context.assetRepo.delete(input);
    }),
};

export const appRouter = {
  projects: projectsRouter,
  documents: documentsRouter,
  requirements: requirementsRouter,
  assets: assetsRouter,
};

export type AppRouter = typeof appRouter;
