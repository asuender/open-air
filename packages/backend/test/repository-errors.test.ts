import { StorageError } from "@storagesdk/core";
import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import {
  getPostgresCause,
  isForeignKeyViolation,
  isUniqueViolation,
  rethrowStorageErrorForRepository,
  throwConflictIfForeignKeyViolation,
  throwConflictIfUniqueViolation,
  throwNotFoundIfForeignKeyViolation,
} from "../src/repository/helpers.ts";
import {
  RepositoryError,
  type RepositoryErrorCode,
  type StorageErrorCode,
} from "../src/repository/errors.ts";
import {
  createCallerFactory,
  publicProcedure,
  router,
  type Context,
} from "../src/api/trpc.ts";

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

const trpcErrorMappings = [
  ["NotFound", "NOT_FOUND"],
  ["NotSupported", "NOT_IMPLEMENTED"],
  ["BadRequest", "BAD_REQUEST"],
  ["Conflict", "CONFLICT"],
  ["Unauthorized", "UNAUTHORIZED"],
  ["Aborted", "CLIENT_CLOSED_REQUEST"],
  ["Internal", "INTERNAL_SERVER_ERROR"],
] as const satisfies ReadonlyArray<
  readonly [RepositoryErrorCode, TRPCError["code"]]
>;

let procedureError: Error;
const testRouter = router({
  fail: publicProcedure.query(() => {
    throw procedureError;
  }),
});
const createTestCaller = createCallerFactory(testRouter);
const unusedContext = null as unknown as Context;

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

describe("tRPC repository error mapping", () => {
  it.each(trpcErrorMappings)("maps %s to %s", async (repoCode, trpcCode) => {
    const cause = new RepositoryError({
      code: repoCode,
      message: `${repoCode} repository error`,
    });
    procedureError = cause;
    const caller = createTestCaller(unusedContext);

    await expect(caller.fail()).rejects.toMatchObject({
      code: trpcCode,
      message: cause.message,
      cause,
    });
  });

  it("does not remap non-repository errors", async () => {
    const cause = new Error("unexpected");
    procedureError = cause;
    const caller = createTestCaller(unusedContext);

    await expect(caller.fail()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      cause,
    });
  });
});
