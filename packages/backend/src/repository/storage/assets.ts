import type { Storage } from "@storagesdk/core";
import { StorageRepository } from "../base.ts";
import { rethrowStorageErrorForRepository } from "../helpers.ts";
import { randomUUID } from "crypto";

type UploadBody = Parameters<Storage["upload"]>[1];
type UploadOptions = Parameters<Storage["upload"]>[2];

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

export class AssetRepository extends StorageRepository {
  async listByRequirement(id: string) {
    try {
      return await listAllByPrefix(this.storage, `requirements/${id}/`);
    } catch (err) {
      rethrowStorageErrorForRepository(err);
    }
  }

  async getById(id: string) {
    try {
      return await this.storage.download(id);
    } catch (err) {
      rethrowStorageErrorForRepository(err);
    }
  }

  async upload(
    requirementId: string,
    body: UploadBody,
    options?: UploadOptions,
  ) {
    const path = `requirements/${requirementId}/${randomUUID()}`;

    try {
      return await this.storage.upload(path, body, options);
    } catch (err) {
      rethrowStorageErrorForRepository(err);
    }
  }

  async delete(id: string) {
    try {
      const asset = await this.storage.head(id);
      await this.storage.delete(id);

      return asset;
    } catch (err) {
      rethrowStorageErrorForRepository(err);
    }
  }
}
