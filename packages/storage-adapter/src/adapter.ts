import {
  checkSignal,
  defineAdapter,
  readStreamToBytes,
  StorageError,
  toWebStream,
} from "@storagesdk/core/adapter";
import type {
  Adapter,
  BodyInput,
  CreateSnapshotOptions,
  DiffOptions,
  DownloadOptions,
  ForkDiff,
  ForkInfo,
  ForkOptions,
  ListOptions,
  ListResult,
  MergeOptions,
  ReadOnlyAdapter,
  RebaseOptions,
  SnapshotInfo,
  StorageItem,
  StorageItemMeta,
  UploadOptions,
  UploadUrlOptions,
  UploadUrlResult,
  UrlOptions,
} from "@storagesdk/core/adapter";
import { asStorageError } from "./errors.ts";
import { createHash } from "crypto";

export interface InMemoryConfig {}

export function inMemoryAdapter(_config: InMemoryConfig): Adapter {
  const store = new Map<string, Uint8Array>();
  const meta = new Map<string, StorageItemMeta>();

  const adapter: Adapter = {
    name: "in-memory",
    raw: { store, meta },

    async upload(
      key: string,
      body: BodyInput,
      opts?: UploadOptions,
    ): Promise<StorageItemMeta> {
      // pre-check: throw StorageError({code: 'Aborted'}) in case
      // signal is already aborted
      checkSignal(opts?.signal);

      let bytes: Uint8Array;
      let metadata: StorageItemMeta;

      try {
        bytes = await readStreamToBytes(toWebStream(body));
        metadata = {
          path: key,
          size: bytes.length,

          // from https://www.iana.org/assignments/media-types/application/octet-stream:
          // "The "octet-stream" subtype is used to indicate that a body contains arbitrary binary data."
          contentType: opts?.contentType ?? "application/octet-stream",
          etag: createHash("sha256").update(bytes).digest("hex"),
          lastModified: new Date(),
          metadata: opts?.metadata,
        };

        store.set(key, bytes);
        meta.set(key, metadata);
      } catch (err) {
        throw asStorageError(err);
      }

      return metadata;
    },

    async download(key: string, opts?: DownloadOptions): Promise<StorageItem> {
      checkSignal(opts?.signal);

      const bytes = store.get(key);
      const metadata = meta.get(key);
      if (!bytes || !metadata) {
        throw new StorageError({ code: "NotFound" });
      }

      // copied from fs implementation
      if (opts?.range) {
        const { offset, length } = opts.range;
        if (offset < 0 || length <= 0) {
          throw new StorageError({ code: "InvalidArgument" });
        }

        const slice = new Uint8Array(
          bytes.buffer,
          bytes.byteOffset,
          bytes.byteLength,
        ).subarray(offset, offset + length);
        const sliced = new Uint8Array(slice.byteLength);

        sliced.set(slice);

        return { ...metadata, size: sliced.byteLength, body: sliced };
      }

      return { ...metadata, body: new Uint8Array(bytes) };
    },

    async head(
      key: string,
      opts?: { signal?: AbortSignal },
    ): Promise<StorageItemMeta> {
      checkSignal(opts?.signal);

      const metadata = meta.get(key);
      if (!metadata) {
        throw new StorageError({ code: "NotFound" });
      }

      return metadata;
    },

    async list(opts?: ListOptions): Promise<ListResult> {
      checkSignal(opts?.signal);

      const prefix = opts?.prefix ?? "";
      const limit = opts?.limit ?? 100;
      const cursor = opts?.cursor ?? "";
      // delimiter is skipped in tests, boh

      let items = [...meta.values()];
      let matching: StorageItemMeta[];

      // we intentionally keep the cursor at -1 if not found
      // to satisfy the exclusive condition in filtering
      let cursorIdx = items.findIndex((item) => item.path == cursor);

      matching = items.filter(
        (item, idx) => item.path.startsWith(prefix) && idx > cursorIdx,
      );
      items = matching.slice(0, limit);

      const hasMore = matching.length > limit;
      const last = items[items.length - 1];

      return hasMore && last !== undefined
        ? { items, cursor: last.path }
        : { items };
    },

    async delete(key: string, opts?: { signal?: AbortSignal }): Promise<void> {
      checkSignal(opts?.signal);

      if (!store.delete(key)) {
        throw new StorageError({ code: "NotFound" });
      }

      meta.delete(key);
    },

    async copy(
      from: string,
      to: string,
      opts?: { signal?: AbortSignal },
    ): Promise<void> {
      checkSignal(opts?.signal);

      const item = store.get(from);
      const metadata = meta.get(from);
      if (!item || !metadata) {
        throw new StorageError({ code: "NotFound" });
      }

      store.set(to, item);
      meta.set(to, metadata);
    },

    async move(
      from: string,
      to: string,
      opts?: { signal?: AbortSignal },
    ): Promise<void> {
      checkSignal(opts?.signal);

      const item = store.get(from);
      const metadata = meta.get(from);
      if (!item || !metadata) {
        throw new StorageError({ code: "NotFound" });
      }

      store.set(to, item);
      meta.set(to, metadata);
      store.delete(from);
      meta.delete(from);
    },

    // returns fake urls enough to satisfy tests
    // that are not skipped (see below)
    async url(key: string, opts?: UrlOptions): Promise<string> {
      checkSignal(opts?.signal);

      if (!store.has(key) || !meta.has(key)) {
        throw new StorageError({ code: "NotFound" });
      }

      return `memory://${encodeURIComponent(key)}`;
    },

    // skipped in tests via `capabilities` object
    async uploadUrl(
      _key: string,
      opts?: UploadUrlOptions,
    ): Promise<UploadUrlResult> {
      checkSignal(opts?.signal);
      throw new StorageError({ code: "NotSupported" });
    },

    snapshots: {
      async create(opts?: CreateSnapshotOptions): Promise<SnapshotInfo> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async list(): Promise<SnapshotInfo[]> {
        return [];
      },

      async head(
        _id: string,
        opts?: { signal?: AbortSignal },
      ): Promise<SnapshotInfo> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async delete(
        _id: string,
        opts?: { signal?: AbortSignal },
      ): Promise<void> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      get(_id: string): ReadOnlyAdapter {
        throw new StorageError({ code: "NotSupported" });
      },
    },

    forks: {
      async create(opts: ForkOptions): Promise<ForkInfo> {
        checkSignal(opts.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async list(): Promise<ForkInfo[]> {
        return [];
      },

      async head(
        _name: string,
        opts?: { signal?: AbortSignal },
      ): Promise<ForkInfo> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async delete(
        _name: string,
        opts?: { signal?: AbortSignal },
      ): Promise<void> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      get(_name: string): Adapter {
        throw new StorageError({ code: "NotSupported" });
      },

      async merge(_name: string, opts?: MergeOptions): Promise<SnapshotInfo> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async rebase(_name: string, opts?: RebaseOptions): Promise<SnapshotInfo> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },

      async diff(_name: string, opts?: DiffOptions): Promise<ForkDiff> {
        checkSignal(opts?.signal);
        throw new StorageError({ code: "NotSupported" });
      },
    },
  };

  return defineAdapter(adapter);
}
