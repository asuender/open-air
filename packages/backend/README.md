# @open-air/backend

Backend of the `open-air` project, using Express.js, tRPC and Drizzle.

## Overview

The database schema is defined and exported from [`src/db/schema.ts`](./src/db/schema.ts). Use:

```sh
pnpm migrate # runs `drizzle-kit push`
```

[`src/router.ts`](./src/router.ts) defines and exports all tRPC procedures used by the client.

Exports to other packages in this monorepo are limited to types only (see `exports` field in [`package.json`](./package.json))
