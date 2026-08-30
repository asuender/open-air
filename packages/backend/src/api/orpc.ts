import { ORPCError, os, type ORPCErrorCode } from "@orpc/server";

import {
  RepositoryError,
  type RepositoryErrorCode,
} from "../repository/errors.ts";
import { createRepositories } from "../repository/helpers.ts";

export type Context = ReturnType<typeof createRepositories>;

const base = os.$context<Context>();

const errorMiddleware = base.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (!(err instanceof RepositoryError)) {
      throw err;
    }

    const codes = {
      NotFound: "NOT_FOUND",
      NotSupported: "NOT_IMPLEMENTED",
      BadRequest: "BAD_REQUEST",
      Conflict: "CONFLICT",
      Unauthorized: "UNAUTHORIZED",
      Aborted: "CLIENT_CLOSED_REQUEST",
      Internal: "INTERNAL_SERVER_ERROR",
    } satisfies Record<RepositoryErrorCode, ORPCErrorCode>;

    throw new ORPCError(codes[err.code], {
      message: err.message,
      cause: err,
    });
  }
});

export const publicProcedure = base.use(errorMiddleware);
