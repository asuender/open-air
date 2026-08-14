import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";

import { appRouter } from "./api/router.ts";
import { db } from "./db/drizzle.ts";
import { createRepositories } from "./repository/helpers.ts";
import { storage } from "./storage.ts";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(
  cors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  }),
);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({ ...createRepositories(db, storage) }),
  }),
);

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});
