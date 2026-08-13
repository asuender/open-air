import type { Storage } from "@storagesdk/core";
import { StorageRepository } from "../base.ts";
import { mapStorageErrors } from "../helpers.ts";
import { randomUUID } from "node:crypto";

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
    return mapStorageErrors(() =>
      listAllByPrefix(this.storage, `requirements/${id}/`),
    );
  }

  async getById(id: string) {
    return mapStorageErrors(() => this.storage.download(id));
  }

  async upload(
    requirementId: string,
    body: UploadBody,
    options?: UploadOptions,
  ) {
    return mapStorageErrors(() => {
      const path = `requirements/${requirementId}/${randomUUID()}`;
      return this.storage.upload(path, body, options);
    });
  }

  async delete(id: string) {
    return mapStorageErrors(async () => {
      const asset = await this.storage.head(id);
      await this.storage.delete(id);

      return asset;
    });
  }
}
