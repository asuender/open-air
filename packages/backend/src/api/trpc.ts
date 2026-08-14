import { initTRPC, TRPCError } from "@trpc/server";

import {
  RepositoryError,
  type RepositoryErrorCode,
} from "../repository/errors.ts";
import { createRepositories } from "../repository/helpers.ts";

type TRPCErrorCode = TRPCError["code"];

export type Context = ReturnType<typeof createRepositories>;

const t = initTRPC.context<Context>().create(); // Should be done only once per backend!

const errorMiddleware = t.middleware(async (opts) => {
  // result has to be fetched first
  // any errors from the underlying operations are stored in
  // `result.error`
  const result = await opts.next();

  // tRPC will first map any errors to a tRPC error (most probably `INTERNAL_SERVER_ERROR`)
  // our job is to check whether one of our custom exceptions caused this
  // and if it did, map to an appropriate tRPC error
  if (result.ok || !(result.error.cause instanceof RepositoryError)) {
    return result;
  }

  const err = result.error.cause;
  const codes = {
    NotFound: "NOT_FOUND",
    NotSupported: "NOT_IMPLEMENTED",
    BadRequest: "BAD_REQUEST",
    Conflict: "CONFLICT",
    Unauthorized: "UNAUTHORIZED",
    Aborted: "CLIENT_CLOSED_REQUEST",
    Internal: "INTERNAL_SERVER_ERROR",
  } satisfies Record<RepositoryErrorCode, TRPCErrorCode>;

  throw new TRPCError({
    code: codes[err.code],
    message: err.message,
    cause: err,
  });
});

export const router = t.router;
export const publicProcedure = t.procedure.use(errorMiddleware);
export const createCallerFactory = t.createCallerFactory;
