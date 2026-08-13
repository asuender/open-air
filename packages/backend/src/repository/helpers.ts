import type { Storage } from "@storagesdk/core";
import { StorageError } from "@storagesdk/core";
import type { db as database } from "../db/drizzle.ts";
import { RepositoryError } from "./errors.ts";
import { ProjectRepository } from "./database/projects.ts";
import { DocumentRepository } from "./database/documents.ts";
import { RequirementRepository } from "./database/requirements.ts";
import { AssetRepository } from "./storage/assets.ts";
import type { StorageErrorCode, RepositoryErrorCode } from "./errors.ts";
import { mapErrors } from "../utils.ts";

type PostgresCause = {
  code?: string;
};

const storageErrorCodes = {
  NotFound: "NotFound",
  NotSupported: "NotSupported",
  Conflict: "Conflict",
  Unauthorized: "Unauthorized",
  InvalidArgument: "BadRequest",
  Aborted: "Aborted",
  Provider: "Internal",
} satisfies Record<StorageErrorCode, RepositoryErrorCode>;

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

export function firstOrThrowNotFound<T>(rows: T[], message: string): T {
  if (rows.length === 0) {
    throw new RepositoryError({ code: "NotFound", message });
  }

  return rows[0];
}

export function throwConflictIfUniqueViolation(err: unknown): never {
  if (isUniqueViolation(err)) {
    throw new RepositoryError({ code: "Conflict", message: "" });
  }
  throw err;
}

/** FK failure on insert/update usually means the referenced parent row is missing. */
export function throwNotFoundIfForeignKeyViolation(err: unknown): never {
  if (isForeignKeyViolation(err)) {
    throw new RepositoryError({ code: "NotFound", message: "" });
  }
  throw err;
}

/** FK failure on delete usually means dependent child rows still exist. */
export function throwConflictIfForeignKeyViolation(err: unknown): never {
  if (isForeignKeyViolation(err)) {
    throw new RepositoryError({ code: "Conflict", message: "" });
  }
  throw err;
}

export function rethrowStorageErrorForRepository(err: unknown): never {
  if (!(err instanceof StorageError)) {
    throw err;
  }

  throw new RepositoryError({
    code: storageErrorCodes[err.code],
    message: err.message,
  });
}

export const mapStorageErrors = <T>(operation: () => Promise<T>): Promise<T> =>
  mapErrors(operation, rethrowStorageErrorForRepository);

export const mapForeignKeyErrors = <T>(
  operation: () => Promise<T>,
): Promise<T> => mapErrors(operation, throwNotFoundIfForeignKeyViolation);

export type Repositories = {
  projectRepo: ProjectRepository;
  documentRepo: DocumentRepository;
  requirementRepo: RequirementRepository;
  assetRepo: AssetRepository;
};

export function createRepositories(
  db: typeof database,
  storage: Storage,
): Repositories {
  return {
    projectRepo: new ProjectRepository(db),
    documentRepo: new DocumentRepository(db),
    requirementRepo: new RequirementRepository(db),
    assetRepo: new AssetRepository(storage),
  };
}
