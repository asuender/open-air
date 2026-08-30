import type { RouterClient } from "@orpc/server";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";

import type { AppRouter } from "./api/router.ts";

export type { AppRouter } from "./api/router.ts";
export type {
  Project,
  NewProject,
  Document,
  NewDocument,
  Requirement,
  NewRequirement,
} from "./db/schema.ts";

export function createClient(origin: string): RouterClient<AppRouter> {
  const link = new RPCLink({
    origin,
    url: "/rpc",
  });

  return createORPCClient(link);
}
