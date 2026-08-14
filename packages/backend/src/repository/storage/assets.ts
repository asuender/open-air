import type { Storage } from "@storagesdk/core";
import type {
  BodyInput,
  StorageItem,
  StorageItemMeta,
  UploadOptions,
} from "@storagesdk/core/adapter";

import { randomUUID } from "node:crypto";

import { StorageRepository } from "../base.ts";
import { isNotFound, mapStorageErrors } from "../helpers.ts";

async function listAllByPrefix(
  storage: Storage,
  prefix: string,
): Promise<StorageItemMeta[]> {
  const items: StorageItemMeta[] = [];
  let cursor: string | undefined;

  do {
    const page = await storage.list({ prefix, cursor });
    items.push(...page.items);
    cursor = page.cursor;
  } while (cursor !== undefined);

  return items;
}

export class AssetRepository extends StorageRepository {
  async listByRequirement(id: string): Promise<StorageItemMeta[]> {
    return mapStorageErrors(() =>
      listAllByPrefix(this.storage, `requirements/${id}/`),
    );
  }

  async getById(id: string): Promise<StorageItem> {
    return mapStorageErrors(() => this.storage.download(id));
  }

  async upload(
    requirementId: string,
    body: BodyInput,
    options?: UploadOptions,
  ): Promise<StorageItemMeta> {
    return mapStorageErrors(() => {
      const path = `requirements/${requirementId}/${randomUUID()}`;
      return this.storage.upload(path, body, options);
    });
  }

  delete(id: string): Promise<StorageItemMeta>;
  delete(
    id: string,
    options: { ignoreMissing?: false },
  ): Promise<StorageItemMeta>;
  delete(
    id: string,
    options: { ignoreMissing: true },
  ): Promise<StorageItemMeta | undefined>;
  async delete(
    id: string,
    options: { ignoreMissing?: boolean } = {},
  ): Promise<StorageItemMeta | undefined> {
    try {
      return await mapStorageErrors(async () => {
        const asset = await this.storage.head(id);
        await this.storage.delete(id);

        return asset;
      });
    } catch (err) {
      if (options.ignoreMissing && isNotFound(err)) {
        return undefined;
      }

      throw err;
    }
  }
}
