import { StorageError } from "@storagesdk/core";
import { TRPCError } from "@trpc/server";

type PostgresCause = {
  code?: string;
};

type StorageErrorCode = StorageError["code"];
type TRPCErrorCode = TRPCError["code"];

const storageErrorCodes = {
  NotFound: "NOT_FOUND",
  NotSupported: "METHOD_NOT_SUPPORTED",
  Conflict: "CONFLICT",
  Unauthorized: "UNAUTHORIZED",
  InvalidArgument: "BAD_REQUEST",
  Aborted: "CLIENT_CLOSED_REQUEST",
  Provider: "INTERNAL_SERVER_ERROR",
} satisfies Record<StorageErrorCode, TRPCErrorCode>;

export function getPostgresCause(err: unknown): PostgresCause | undefined {
  let current: unknown = err;
  for (let i = 0; i < 3 && current; i++) {
    if (typeof current === "object" && current !== null && "code" in current) {
      return current as PostgresCause;
    }
    current = (current as { cause?: unknown }).cause;
  }
}

export function isUniqueViolation(err: unknown): boolean {
  return getPostgresCause(err)?.code === "23505";
}

export function isForeignKeyViolation(err: unknown): boolean {
  return getPostgresCause(err)?.code === "23503";
}

export function throwConflictIfUniqueViolation(err: unknown): never {
  if (isUniqueViolation(err)) {
    throw new TRPCError({ code: "CONFLICT" });
  }
  throw err;
}

/** FK failure on insert/update usually means the referenced parent row is missing. */
export function throwNotFoundIfForeignKeyViolation(err: unknown): never {
  if (isForeignKeyViolation(err)) {
    throw new TRPCError({ code: "NOT_FOUND" });
  }
  throw err;
}

/** FK failure on delete usually means dependent child rows still exist. */
export function throwConflictIfForeignKeyViolation(err: unknown): never {
  if (isForeignKeyViolation(err)) {
    throw new TRPCError({ code: "CONFLICT" });
  }
  throw err;
}

export function rethrowStorageErrorForTRPC(err: unknown): never {
  if (!(err instanceof StorageError)) {
    throw err;
  }

  throw new TRPCError({
    code: storageErrorCodes[err.code],
    cause: err,
  });
}
