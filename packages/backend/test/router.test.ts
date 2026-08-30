import { PGlite } from "@electric-sql/pglite";
import { inMemoryAdapter } from "@open-air/storage-adapter";
import { createRouterClient } from "@orpc/server";
import { Storage } from "@storagesdk/core";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { fileURLToPath } from "node:url";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { appRouter } from "../src/api/router.ts";
import {
  sampleDocuments,
  sampleProjects,
  sampleRequirements,
} from "../src/db/sample-data.js";
import { seed } from "../src/db/seed.js";
import { createRepositories } from "../src/repository/helpers.ts";

const client = new PGlite(); // ommitted url creates in-memory db
const db = drizzle({ client });

let storage: Storage;
let caller: ReturnType<typeof createRouterClient<typeof appRouter>>;

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
  });
});

beforeEach(async () => {
  storage = new Storage({ adapter: inMemoryAdapter({}) });
  caller = createRouterClient(appRouter, {
    context: createRepositories(db, storage),
  });
  await seed(db);
});

describe("projects", () => {
  it("lists all projects", async () => {
    await expect(caller.projects.list()).resolves.toEqual(sampleProjects);
  });

  it("returns a project by ID", async () => {
    await expect(caller.projects.getById("proj_alpha")).resolves.toEqual(
      sampleProjects[0],
    );
  });

  it("rejects an unknown project ID", async () => {
    await expect(
      caller.projects.getById("unknown_project"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects an empty project ID", async () => {
    await expect(caller.projects.getById("")).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("creates a project", async () => {
    const project = { id: "proj_gamma", name: "Gamma Service" };

    await expect(caller.projects.create(project)).resolves.toEqual(project);
    await expect(caller.projects.getById(project.id)).resolves.toEqual(project);
  });

  it("rejects a project with an empty name", async () => {
    await expect(
      caller.projects.create({ id: "proj_gamma", name: "" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a duplicate project ID", async () => {
    await expect(
      caller.projects.create({ id: "proj_alpha", name: "Another Alpha" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("updates a project", async () => {
    const project = { id: "proj_alpha", name: "Alpha Platform 2" };

    await expect(caller.projects.update(project)).resolves.toEqual(project);
    await expect(caller.projects.getById(project.id)).resolves.toEqual(project);
  });

  it("rejects updating an unknown project", async () => {
    await expect(
      caller.projects.update({ id: "unknown_project", name: "Unknown" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deletes a project without documents", async () => {
    const project = { id: "proj_gamma", name: "Gamma Service" };
    await caller.projects.create(project);

    await expect(caller.projects.delete(project.id)).resolves.toEqual(project);
    await expect(caller.projects.getById(project.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes a project and its documents and requirements", async () => {
    await expect(caller.projects.delete("proj_beta")).resolves.toEqual(
      sampleProjects[1],
    );
    await expect(caller.projects.getById("proj_beta")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      caller.documents.getById("doc_beta_srs"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.requirements.getById("req_006")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes assets associated with a populated project", async () => {
    const associatedPath =
      "requirements/req_001/00000000-0000-4000-8000-000000000001";
    const unrelatedPath =
      "requirements/req_007/00000000-0000-4000-8000-000000000002";
    await storage.upload(associatedPath, "associated asset");
    await storage.upload(unrelatedPath, "unrelated asset");

    await caller.projects.delete("proj_alpha");

    await expect(storage.head(associatedPath)).rejects.toMatchObject({
      code: "NotFound",
    });
    await expect(storage.head(unrelatedPath)).resolves.toMatchObject({
      path: unrelatedPath,
    });
  });

  it("rejects deleting an unknown project", async () => {
    await expect(
      caller.projects.delete("unknown_project"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("documents", () => {
  it("lists documents belonging to a project", async () => {
    await expect(caller.documents.listByProject("proj_alpha")).resolves.toEqual(
      [sampleDocuments[0], sampleDocuments[1]],
    );
  });

  it("returns an empty list for an unknown project", async () => {
    await expect(
      caller.documents.listByProject("unknown_project"),
    ).resolves.toEqual([]);
  });

  it("returns a document by ID", async () => {
    await expect(caller.documents.getById("doc_alpha_api")).resolves.toEqual(
      sampleDocuments[1],
    );
  });

  it("rejects an unknown document ID", async () => {
    await expect(
      caller.documents.getById("unknown_document"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates a document under a project", async () => {
    const document = {
      id: "doc_beta_api",
      name: "Mobile API Contract",
      project: "proj_beta",
    };

    await expect(caller.documents.create(document)).resolves.toEqual(document);
    await expect(caller.documents.getById(document.id)).resolves.toEqual(
      document,
    );
  });

  it("rejects a document with an empty name", async () => {
    await expect(
      caller.documents.create({
        id: "doc_beta_api",
        name: "",
        project: "proj_beta",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a document with an unknown project", async () => {
    await expect(
      caller.documents.create({
        id: "doc_orphan",
        name: "Orphan Document",
        project: "unknown_project",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a duplicate document ID", async () => {
    await expect(
      caller.documents.create({
        id: "doc_alpha_api",
        name: "Duplicate API Contract",
        project: "proj_alpha",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("updates a document", async () => {
    const document = {
      id: "doc_alpha_api",
      name: "Public API Contract",
      project: "proj_alpha",
    };

    await expect(caller.documents.update(document)).resolves.toEqual(document);
    await expect(caller.documents.getById(document.id)).resolves.toEqual(
      document,
    );
  });

  it("rejects moving a document to an unknown project", async () => {
    await expect(
      caller.documents.update({
        id: "doc_alpha_api",
        name: "API Contract",
        project: "unknown_project",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects updating an unknown document", async () => {
    await expect(
      caller.documents.update({
        id: "unknown_document",
        name: "Unknown",
        project: "proj_alpha",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deletes a document without requirements", async () => {
    const document = {
      id: "doc_beta_api",
      name: "Mobile API Contract",
      project: "proj_beta",
    };
    await caller.documents.create(document);

    await expect(caller.documents.delete(document.id)).resolves.toEqual(
      document,
    );
    await expect(caller.documents.getById(document.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes a document and its requirements", async () => {
    await expect(caller.documents.delete("doc_alpha_api")).resolves.toEqual(
      sampleDocuments[1],
    );
    await expect(
      caller.documents.getById("doc_alpha_api"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.requirements.getById("req_004")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller.requirements.getById("req_005")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deletes assets associated with a populated document", async () => {
    const associatedPath =
      "requirements/req_004/00000000-0000-4000-8000-000000000001";
    const unrelatedPath =
      "requirements/req_003/00000000-0000-4000-8000-000000000002";
    await storage.upload(associatedPath, "associated asset");
    await storage.upload(unrelatedPath, "unrelated asset");

    await caller.documents.delete("doc_alpha_api");

    await expect(storage.head(associatedPath)).rejects.toMatchObject({
      code: "NotFound",
    });
    await expect(storage.head(unrelatedPath)).resolves.toMatchObject({
      path: unrelatedPath,
    });
  });

  it("rejects deleting an unknown document", async () => {
    await expect(
      caller.documents.delete("unknown_document"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("requirements", () => {
  it("lists requirements belonging to a document", async () => {
    await expect(
      caller.requirements.listByDocument("doc_alpha_api"),
    ).resolves.toEqual([sampleRequirements[3], sampleRequirements[4]]);
  });

  it("returns an empty list for an unknown document", async () => {
    await expect(
      caller.requirements.listByDocument("unknown_document"),
    ).resolves.toEqual([]);
  });

  it("returns a requirement by ID", async () => {
    await expect(caller.requirements.getById("req_001")).resolves.toEqual(
      sampleRequirements[0],
    );
  });

  it("rejects an unknown requirement ID", async () => {
    await expect(
      caller.requirements.getById("unknown_requirement"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("creates a requirement under a document", async () => {
    const requirement = {
      id: "req_009",
      level: "must" as const,
      type: "technical" as const,
      text: "The API shall expose a health endpoint.",
      document: "doc_alpha_api",
    };

    await expect(caller.requirements.create(requirement)).resolves.toEqual(
      requirement,
    );
    await expect(caller.requirements.getById(requirement.id)).resolves.toEqual(
      requirement,
    );
  });

  it("rejects an invalid requirement level", async () => {
    await expect(
      caller.requirements.create({
        id: "req_009",
        level: "urgent" as "must",
        type: "technical",
        text: "Invalid level",
        document: "doc_alpha_api",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an invalid requirement type", async () => {
    await expect(
      caller.requirements.create({
        id: "req_009",
        level: "must",
        type: "business" as "technical",
        text: "Invalid type",
        document: "doc_alpha_api",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a requirement with empty text", async () => {
    await expect(
      caller.requirements.create({
        id: "req_009",
        level: "must",
        type: "technical",
        text: "",
        document: "doc_alpha_api",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects a requirement with an unknown document", async () => {
    await expect(
      caller.requirements.create({
        id: "req_009",
        level: "must",
        type: "technical",
        text: "Orphan requirement",
        document: "unknown_document",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a duplicate requirement ID", async () => {
    await expect(
      caller.requirements.create({
        id: "req_001",
        level: "must",
        type: "technical",
        text: "Duplicate requirement",
        document: "doc_alpha_srs",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("updates a requirement", async () => {
    const requirement = {
      id: "req_001",
      level: "should" as const,
      type: "technical" as const,
      text: "The system should authenticate users with passkeys.",
      document: "doc_alpha_srs",
    };

    await expect(caller.requirements.update(requirement)).resolves.toEqual(
      requirement,
    );
    await expect(caller.requirements.getById(requirement.id)).resolves.toEqual(
      requirement,
    );
  });

  it("rejects moving a requirement to an unknown document", async () => {
    await expect(
      caller.requirements.update({
        id: "req_001",
        level: "must",
        type: "technical",
        text: "Authentication requirement",
        document: "unknown_document",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects updating an unknown requirement", async () => {
    await expect(
      caller.requirements.update({
        id: "unknown_requirement",
        level: "must",
        type: "technical",
        text: "Unknown requirement",
        document: "doc_alpha_srs",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deletes a requirement and its associated assets", async () => {
    const associatedPath =
      "requirements/req_003/00000000-0000-4000-8000-000000000001";
    const unrelatedPath =
      "requirements/req_004/00000000-0000-4000-8000-000000000002";
    await storage.upload(associatedPath, "associated asset");
    await storage.upload(unrelatedPath, "unrelated asset");

    await expect(caller.requirements.delete("req_003")).resolves.toEqual(
      sampleRequirements[2],
    );
    await expect(caller.requirements.getById("req_003")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(storage.head(associatedPath)).rejects.toMatchObject({
      code: "NotFound",
    });
    await expect(storage.head(unrelatedPath)).resolves.toMatchObject({
      path: unrelatedPath,
    });
  });

  it("deletes associated assets across multiple storage pages", async () => {
    const paths = Array.from(
      { length: 101 },
      (_, index) => `requirements/req_003/${index.toString().padStart(3, "0")}`,
    );
    const unrelatedPath = "requirements/req_004/unrelated";

    await Promise.all([
      ...paths.map((path) => storage.upload(path, "asset contents")),
      storage.upload(unrelatedPath, "unrelated asset"),
    ]);

    await caller.requirements.delete("req_003");

    await expect(
      Promise.all(paths.map((path) => storage.head(path))),
    ).rejects.toMatchObject({ code: "NotFound" });
    await expect(
      storage.list({ prefix: "requirements/req_003/" }),
    ).resolves.toEqual({ items: [] });
    await expect(storage.head(unrelatedPath)).resolves.toMatchObject({
      path: unrelatedPath,
    });
  });

  it("rejects deleting an unknown requirement", async () => {
    await expect(
      caller.requirements.delete("unknown_requirement"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("assets", () => {
  const assetPath = "requirements/req_001/00000000-0000-4000-8000-000000000001";
  const unknownAssetPath =
    "requirements/req_001/00000000-0000-4000-8000-000000000099";

  it("lists assets belonging to a requirement", async () => {
    const otherPath =
      "requirements/req_002/00000000-0000-4000-8000-000000000002";
    await storage.upload(assetPath, "asset contents");
    await storage.upload(otherPath, "other asset contents");

    await expect(caller.assets.listByRequirement("req_001")).resolves.toEqual([
      expect.objectContaining({ path: assetPath }),
    ]);
  });

  it("returns an empty list for an unknown requirement", async () => {
    await expect(
      caller.assets.listByRequirement("unknown_requirement"),
    ).resolves.toEqual([]);
  });

  it("uploads an asset under a requirement-prefixed UUID", async () => {
    const body = new TextEncoder().encode("<svg></svg>");
    const metadata = {
      contentType: "image/svg+xml",
      metadata: { filename: "diagram.svg" },
    };

    const asset = await caller.assets.upload({
      body,
      metadata,
      requirement: "req_003",
    });

    expect(asset).toMatchObject({
      path: expect.stringMatching(
        /^requirements\/req_003\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      ),
      ...metadata,
    });
    await expect(
      storage.download(asset.path, { as: "bytes" }),
    ).resolves.toEqual(body);
  });

  it("rejects an empty upload body", async () => {
    await expect(
      caller.assets.upload({
        body: new Uint8Array(),
        requirement: "req_003",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("does not store an object for an unknown requirement", async () => {
    await expect(
      caller.assets.upload({
        body: new TextEncoder().encode("<svg></svg>"),
        requirement: "unknown_requirement",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(storage.list()).resolves.toMatchObject({ items: [] });
  });

  it("returns the stored object by asset path", async () => {
    const body = new TextEncoder().encode("asset contents");
    await storage.upload(assetPath, body, { contentType: "image/svg+xml" });

    await expect(caller.assets.getById(assetPath)).resolves.toMatchObject({
      path: assetPath,
      body,
      contentType: "image/svg+xml",
    });
  });

  it("rejects an unknown asset path", async () => {
    await expect(caller.assets.getById(unknownAssetPath)).rejects.toMatchObject(
      {
        code: "NOT_FOUND",
      },
    );
  });

  it("deletes a stored asset", async () => {
    await storage.upload(assetPath, "asset contents");

    await expect(caller.assets.delete(assetPath)).resolves.toMatchObject({
      path: assetPath,
    });
    await expect(storage.head(assetPath)).rejects.toMatchObject({
      code: "NotFound",
    });
  });

  it("rejects deleting an unknown asset", async () => {
    await expect(caller.assets.delete(unknownAssetPath)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
