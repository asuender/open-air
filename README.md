# open-air

> AI declaration: there is some AI-generated code here, but as stated in the [AGENTS.md](./AGENTS.md) file, it only affects raw UI related stuff as I find it boring. On the other hand, any logic is (and will be) handcrafted. Latter goes for any documentation as well.

> This is a learning project for exploring the tech stack used here, just so you know.

Open source AI-assisted requirements management. Learning experiment for building a monorepo with TypeScript, tRPC, Vite + React, Drizzle, Express and optionally, SST.

## Usage

```sh
pnpm i
pnpm migrate # runs `drizzle-kit push`
pnpm dev

# or stark stack individually:
# pnpm dev:backend
# pnpm dev:web
```

## Components

This represents a monorepo bundling multiple packages:

- `@open-air/web`: Frontend, written in React + Vite and Radix UI. See [`packages/web/README.md`](./packages/web/README.md) for more details.
- `@open-air/backend`: Backend, written in Express.js and holding the tRPC router. See [`packages/backend/README.md`](./packages/backend/README.md) for more details.

## License

MIT
