import { drizzle } from "drizzle-orm/libsql";
import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSampleAssets,
  sampleDocuments,
  sampleProjects,
  sampleRequirements,
} from "../src/db/sample-data.js";
import { seed } from "../src/db/seed.js";
import { appRouter } from "../src/router.js";
import { createCallerFactory } from "../src/trpc.js";

const db = drizzle("file:local.test.db");
const createCaller = createCallerFactory(appRouter);
const caller = createCaller({ db });
const sampleAssets = loadSampleAssets();

beforeEach(async () => {
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

  it("rejects deleting a project that contains documents", async () => {
    await expect(caller.projects.delete("proj_beta")).rejects.toMatchObject({
      code: "CONFLICT",
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

  it("rejects deleting a document that contains requirements", async () => {
    await expect(
      caller.documents.delete("doc_alpha_api"),
    ).rejects.toMatchObject({ code: "CONFLICT" });
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

  it("deletes a requirement", async () => {
    await expect(caller.requirements.delete("req_003")).resolves.toEqual(
      sampleRequirements[2],
    );
    await expect(caller.requirements.getById("req_003")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects deleting an unknown requirement", async () => {
    await expect(
      caller.requirements.delete("unknown_requirement"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("assets", () => {
  it("lists assets belonging to a requirement", async () => {
    await expect(caller.assets.listByRequirement("req_001")).resolves.toEqual([
      sampleAssets[0],
    ]);
  });

  it("returns an empty list for an unknown requirement", async () => {
    await expect(
      caller.assets.listByRequirement("unknown_requirement"),
    ).resolves.toEqual([]);
  });

  it("returns an asset by ID", async () => {
    await expect(caller.assets.getById("asset_001")).resolves.toEqual(
      sampleAssets[0],
    );
  });

  it("rejects an unknown asset ID", async () => {
    await expect(caller.assets.getById("unknown_asset")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("creates an asset under a requirement", async () => {
    const asset = {
      id: "asset_004",
      base64: "PHN2Zz48L3N2Zz4=",
      requirement: "req_003",
    };

    await expect(caller.assets.create(asset)).resolves.toEqual(asset);
    await expect(caller.assets.getById(asset.id)).resolves.toEqual(asset);
  });

  it("rejects an asset with empty base64 data", async () => {
    await expect(
      caller.assets.create({
        id: "asset_004",
        base64: "",
        requirement: "req_003",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rejects an asset with an unknown requirement", async () => {
    await expect(
      caller.assets.create({
        id: "asset_004",
        base64: "PHN2Zz48L3N2Zz4=",
        requirement: "unknown_requirement",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects a duplicate asset ID", async () => {
    await expect(
      caller.assets.create({
        id: "asset_001",
        base64: "PHN2Zz48L3N2Zz4=",
        requirement: "req_001",
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("deletes an asset", async () => {
    await expect(caller.assets.delete("asset_001")).resolves.toEqual(
      sampleAssets[0],
    );
    await expect(caller.assets.getById("asset_001")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("rejects deleting an unknown asset", async () => {
    await expect(caller.assets.delete("unknown_asset")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
