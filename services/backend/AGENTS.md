# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains NestJS application code.
- `src/app/system/*` holds domain modules (for example `user`, `role`, `permission`, `auth`). Keep controller/service/dto/entity files grouped inside each module.
- `src/app/library/*` contains shared infrastructure (Prisma, CASL, Redis, logger, data-scope).
- `src/common/*` is cross-cutting code (decorators, filters, interceptors, base utilities).
- `prisma/` includes `schema.prisma`, migrations, and seed scripts.
- `config/*.yaml` stores environment-specific app config.
- `test/` contains e2e tests; unit tests are colocated as `*.spec.ts` in `src/`.

## Build, Test, and Development Commands
- `pnpm install` installs dependencies.
- `pnpm start:dev` (or `pnpm dev`) runs the API with watch mode.
- `pnpm build` compiles to `dist/`; `pnpm start:prod` runs compiled output.
- `pnpm lint` runs `oxlint` + `eslint` autofixes.
- `pnpm format` applies `oxfmt`; `pnpm format:check` validates formatting in CI.
- `pnpm test`, `pnpm test:cov`, `pnpm test:e2e` run unit, coverage, and e2e suites.
- DB helpers: `pnpm db:check-indexes`, `pnpm db:maintenance`, `pnpm db:reset-sequences`.

## Coding Style & Naming Conventions
- Language: TypeScript (NestJS). Use 2-space indentation and follow `eslint.config.mjs` + `.oxlintrc.json`.
- Filenames use kebab-case (`user.service.ts`, `create-user.dto.ts`).
- Classes and decorators use PascalCase; methods/variables use camelCase; constants use UPPER_SNAKE_CASE.
- Prefer small, focused modules and keep DTOs in each module’s `dto/` directory.

## Testing Guidelines
- Framework: Jest (`*.spec.ts`), with e2e config at `test/jest-e2e.json`.
- Add/adjust unit tests for service logic and guards; add e2e tests for endpoint behavior changes.
- Run `pnpm test:cov` before opening a PR. No strict threshold is enforced, but changed code should be meaningfully covered.

## Commit & Pull Request Guidelines
- Follow `type: short summary` style seen in history (example: `init: first commit`). Recommended types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
- Keep commits scoped and atomic.
- PRs should include: purpose, key changes, migration/config impact, test evidence (`pnpm test` output), and linked issue/ticket.
- For schema changes, include the new Prisma migration and note deployment/rollback considerations.

## Security & Configuration Tips
- Never commit secrets. Use `.env` locally and keep `config/production.yaml` free of sensitive inline values.
- Validate DB changes with Prisma migrations instead of manual production edits.
