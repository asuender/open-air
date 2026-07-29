import { initTRPC } from '@trpc/server';

const t = initTRPC.create(); // Should be done only once per backend!

export const router = t.router;
export const publicProcedure = t.procedure;
