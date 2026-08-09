# @open-air/backend

Backend of the `open-air` project, using Express.js, tRPC and Drizzle (on a PGlite database).

## Overview

The database schema is defined and exported from [`src/db/schema.ts`](./src/db/schema.ts). Use:

```sh
pnpm migrate        # runs `drizzle-kit push`
pnpm test           # runs `vitest` in watch mode
pnpm seed           # seeds the local database
```

[`src/router.ts`](./src/router.ts) defines and exports all tRPC procedures used by the client. They are being tested in [`test/router.test.ts`](./test/router.test.ts) using sample data from [`data/sample`](./data/sample/).

Exports to other packages in this monorepo are limited to types only (see `exports` field in [`package.json`](./package.json))
