import { inMemoryAdapter } from "@open-air/storage-adapter";
import { Storage } from "@storagesdk/core";
import { beforeEach, describe, expect, it } from "vitest";
import { AssetRepository } from "../src/repository/storage/assets.ts";

describe("AssetRepository.delete", () => {
  const assetPath = "requirements/req_001/00000000-0000-4000-8000-000000000001";

  let storage: Storage;
  let assetRepo: AssetRepository;

  beforeEach(() => {
    storage = new Storage({ adapter: inMemoryAdapter({}) });
    assetRepo = new AssetRepository(storage);
  });

  it("returns the deleted asset in strict mode", async () => {
    await storage.upload(assetPath, "asset contents");

    await expect(assetRepo.delete(assetPath)).resolves.toMatchObject({
      path: assetPath,
    });
    await expect(storage.head(assetPath)).rejects.toMatchObject({
      code: "NotFound",
    });
  });

  it("rejects when an asset is missing in strict mode", async () => {
    await expect(assetRepo.delete(assetPath)).rejects.toMatchObject({
      code: "NotFound",
    });
  });

  it("returns undefined when an ignored asset is missing", async () => {
    await expect(
      assetRepo.delete(assetPath, { ignoreMissing: true }),
    ).resolves.toBeUndefined();
  });

  it("returns the asset when ignoreMissing is enabled and it exists", async () => {
    await storage.upload(assetPath, "asset contents");

    await expect(
      assetRepo.delete(assetPath, { ignoreMissing: true }),
    ).resolves.toMatchObject({ path: assetPath });
  });

  it("can safely repeat an idempotent deletion", async () => {
    await storage.upload(assetPath, "asset contents");

    await expect(
      assetRepo.delete(assetPath, { ignoreMissing: true }),
    ).resolves.toMatchObject({ path: assetPath });
    await expect(
      assetRepo.delete(assetPath, { ignoreMissing: true }),
    ).resolves.toBeUndefined();
  });
});
