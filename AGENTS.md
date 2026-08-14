# Agent instructions

Open source AI-assisted requirements management. Learning experiment for building a monorepo with TypeScript, tRPC, Vite + React, Drizzle, Express and optionally, SST.

Read the (root project!) README file.

**Important**: do not add any logic. You may only add bare minimal starter code with a comment like `// logic goes here`, just enough to make the code compile.

**Important**: For the UI package, instructions are similar. You may freely edit the UI (this includes components, styles etc.), but leave the connecting logic to the user.

This is a learning project for exploring the technologies used here, just so you know.

Some scripts in the individual package's `package.json` are wired through the global `package.json`.

## Development

Test-driven development is encouraged. Based on the note above, optimal development would be (1) the user defining interfaces, types, functions etc. and filling them with placeholders to make the code compile and (2) you writing high-quality tests, which the user will iterate on.

Tests are respectively located in `test` folders, i.e. `packages/backend/test/`.
