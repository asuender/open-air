import { router } from './trpc.ts';

export const appRouter = router({
  // add procedures here
});

export type AppRouter = typeof appRouter;
