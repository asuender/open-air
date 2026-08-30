# @open-air/backend

Backend of the `open-air` project, using Express.js, oRPC and Drizzle (on a PGlite database).

## Overview

The database schema is defined and exported from [`src/db/schema.ts`](./src/db/schema.ts). Use:

```sh
pnpm migrate        # runs `drizzle-kit push`
pnpm test           # runs `vitest` in watch mode
pnpm seed           # seeds the local database
```

[`src/router.ts`](./src/router.ts) defines and exports the canonical app router. It is being tested in [`test/router.test.ts`](./test/router.test.ts) using sample data from [`data/sample`](./data/sample/).

The backend exports a client factory in [`src/client.ts`](./src/client.ts) as advertised in the [oRPC docs](https://orpc.dev/docs/getting-started) so no server code ends up in the client and to avoid additional oRPC dependencies in the frontend.

Exports to other packages in this monorepo are limited to types only (see `exports` field in [`package.json`](./package.json))

## Architectual patterns

As a learning experience, I baked the following patterns into the backend:

- Repository pattern (where each database table / storage bucket represents a single repository)
