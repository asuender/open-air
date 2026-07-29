# open-air

Open source AI-assisted requirements management. Learning experiment for building a monorepo with TypeScript, tRPC, Vite + React, Drizzle/Prisma, Express and SST.

## Usage

```sh
pnpm i
pnpm dev

# or stark stack individually:
# pnpm dev:backend
# pnpm dev:web
```

## Components

This represents a monorepo bundling multiple packages:

- `@open-air/web`: Frontend, written in React + Vite
- `@open-air/backend`: Backend, written in Express.js and holding the tRPC router

## License

MIT
