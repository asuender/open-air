import { initTRPC } from "@trpc/server";
import type { db } from "./db/index.ts";

type Context = { db: typeof db };

const t = initTRPC.context<Context>().create(); // Should be done only once per backend!

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
