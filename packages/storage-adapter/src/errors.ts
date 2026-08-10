import {
  isAbortError,
  StorageError,
  type StorageErrorCode,
} from "@storagesdk/core";

export function asStorageError(
  err: unknown,
  fallback: StorageErrorCode = "Provider",
): StorageError {
  if (err instanceof StorageError) return err;

  const cause = err instanceof Error ? err : undefined;
  if (isAbortError(err)) {
    return new StorageError({ code: "Aborted", cause });
  }

  return new StorageError({ code: fallback, cause });
}
