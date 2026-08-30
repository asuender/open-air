import { StorageError } from "@storagesdk/core";
import { describe, expect, it } from "vitest";

import {
  type RepositoryErrorCode,
  type StorageErrorCode,
} from "../src/repository/errors.ts";
import {
  getPostgresCause,
  isForeignKeyViolation,
  isUniqueViolation,
  rethrowStorageErrorForRepository,
  throwConflictIfForeignKeyViolation,
  throwConflictIfUniqueViolation,
  throwNotFoundIfForeignKeyViolation,
} from "../src/repository/helpers.ts";

const storageErrorMappings = [
  ["NotFound", "NotFound"],
  ["NotSupported", "NotSupported"],
  ["Conflict", "Conflict"],
  ["Unauthorized", "Unauthorized"],
  ["InvalidArgument", "BadRequest"],
  ["Aborted", "Aborted"],
  ["Provider", "Internal"],
] as const satisfies ReadonlyArray<
  readonly [StorageErrorCode, RepositoryErrorCode]
>;

describe("storage error mapping", () => {
  it.each(storageErrorMappings)("maps %s to %s", (storageCode, repoCode) => {
    const error = new StorageError({ code: storageCode });

    expect(() => rethrowStorageErrorForRepository(error)).toThrow(
      expect.objectContaining({
        name: "RepositoryError",
        code: repoCode,
        message: error.message,
      }),
    );
  });

  it("uses an explicit repository message", () => {
    expect(() =>
      rethrowStorageErrorForRepository(
        new StorageError({ code: "NotFound" }),
        "Asset does not exist.",
      ),
    ).toThrow(
      expect.objectContaining({
        code: "NotFound",
        message: "Asset does not exist.",
      }),
    );
  });

  it("passes through non-storage errors", () => {
    const error = new Error("unexpected");

    expect(() => rethrowStorageErrorForRepository(error)).toThrow(error);
  });
});

describe("PostgreSQL error mapping", () => {
  it("finds PostgreSQL codes through nested causes", () => {
    const cause = { code: "23505" };
    const error = new Error("query failed", {
      cause: new Error("driver failed", { cause }),
    });

    expect(getPostgresCause(error)).toBe(cause);
    expect(isUniqueViolation(error)).toBe(true);
    expect(isForeignKeyViolation(error)).toBe(false);
  });

  it("maps a unique violation to Conflict", () => {
    expect(() => throwConflictIfUniqueViolation({ code: "23505" })).toThrow(
      expect.objectContaining({ code: "Conflict" }),
    );
  });

  it("maps a foreign-key violation according to the operation", () => {
    expect(() =>
      throwNotFoundIfForeignKeyViolation({ code: "23503" }, "Missing parent"),
    ).toThrow(
      expect.objectContaining({ code: "NotFound", message: "Missing parent" }),
    );

    expect(() =>
      throwConflictIfForeignKeyViolation({ code: "23503" }, "Has children"),
    ).toThrow(
      expect.objectContaining({ code: "Conflict", message: "Has children" }),
    );
  });

  it("passes through unrecognized database errors", () => {
    const error = { code: "99999" };

    expect(() => throwConflictIfUniqueViolation(error)).toThrow(error);
    expect(() => throwNotFoundIfForeignKeyViolation(error)).toThrow(error);
    expect(() => throwConflictIfForeignKeyViolation(error)).toThrow(error);
  });
});
