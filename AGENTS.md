# Repository Guidelines

## Project Structure & Module Organization
- This repository is a `pnpm` workspace managed with `turbo`.
- Frontend lives in `apps/frontend` and is built with Vue 3 + Vite + TypeScript.
- Backend lives in `services/backend` and is built with NestJS + Drizzle + TypeScript.
- Shared engineering config lives in `packages/*`. Keep reusable tooling or config packages there; avoid moving app-only runtime code unless it is truly shared.
- Frontend source code is under `apps/frontend/src/`, with feature areas such as `views/`, `components/`, `api/`, `stores/`, `router/`, and `styles/`.
- Backend source code is under `services/backend/src/`, with domain modules in `src/app/system/*`, shared infrastructure in `src/app/library/*`, and cross-cutting code in `src/common/*`.
- Backend database files live in `services/backend/db/` and `services/backend/src/app/library/drizzle/`. Keep Drizzle schema, SQL migrations, and seed scripts there unless multiple services start sharing the same database layer.

## Build, Test, and Development Commands
- Install dependencies from the repository root with `pnpm install`.
- Start both apps with `pnpm dev`.
- Start one app with `pnpm dev:frontend` or `pnpm dev:backend`.
- Run workspace-wide checks from the root: `pnpm lint`, `pnpm lint:fix`, `pnpm type-check`, `pnpm build`, `pnpm format`.
- Run app-specific commands with filters, for example:
  - `pnpm --filter @casbin-admin/frontend lint`
  - `pnpm --filter @casbin-admin/backend build`
- Backend database commands are provided through the backend package scripts. Use `pnpm --filter @casbin-admin/backend db:generate`, `db:migrate`, and `db:seed` as needed.

## Dependency Management
- Prefer adding shared tooling versions to the workspace `catalog` in `pnpm-workspace.yaml`.
- Use `catalog:` for dependencies that should stay aligned across packages, especially TypeScript, ESLint, oxlint/oxfmt, `turbo`, `@types/node`, and other shared tooling.
- Keep framework/runtime dependencies local to each app unless there is a clear need to align them across packages.
- Do not create separate lockfiles inside apps or services. The repository uses the root `pnpm-lock.yaml` only.

## Coding Style & Naming Conventions
- Follow existing local formatter settings instead of forcing one style across all packages.
- Frontend formatting currently uses single quotes and no semicolons.
- Backend formatting currently uses single quotes and semicolons.
- Use PascalCase for Vue components and NestJS classes, camelCase for functions and variables, and kebab-case for filenames unless the framework strongly prefers another convention.
- Keep modules focused and organized by feature rather than by technical layer when adding new business code.
- In backend Drizzle queries, filter main tables with `withSoftDelete(...)` and filter joined soft-delete tables with `joinOnWithSoftDelete(...)`.
- In backend Drizzle schema, timestamp columns should default to `mode: 'string'`; prefer helper-managed `updatedAt` / `deletedAt` over manual per-service time handling.

## Linting & Quality Gates
- ESLint is standardized through `packages/eslint-config`; app-level `eslint.config.*` files should stay thin and only hold local overrides.
- Oxlint and ESLint both run as part of each app’s `lint` script.
- Minimum expected validation for frontend changes: `pnpm --filter @casbin-admin/frontend type-check && pnpm --filter @casbin-admin/frontend lint && pnpm --filter @casbin-admin/frontend build`.
- Minimum expected validation for backend changes: `pnpm --filter @casbin-admin/backend type-check && pnpm --filter @casbin-admin/backend lint && pnpm --filter @casbin-admin/backend build`.

## Testing Guidelines
- Frontend currently relies on type-checking, linting, and manual verification; no formal automated test suite is set up yet.
- Backend uses Jest for unit tests and e2e tests.
- Backend unit tests are colocated as `*.spec.ts`; e2e tests live under `services/backend/test/`.
- When changing backend behavior, prefer adding or updating tests near the changed module; add e2e coverage for API contract or permission-flow changes.

## Commit & Pull Request Guidelines
- Use concise Conventional Commit style messages such as `feat: add role filter`, `fix: handle prisma generate on install`, or `chore: align lint config`.
- Keep commits focused; avoid bundling unrelated frontend, backend, and tooling changes together unless the change is intentionally cross-cutting.
- PRs should include a summary, impacted areas, commands run for validation, config or migration impact, and screenshots for UI changes where relevant.

## Security & Configuration Tips
- Never commit secrets. Keep frontend environment values in app-local `.env.*` files and backend secrets in `services/backend/.env` or deployment environment config.
- Validate Drizzle schema and database changes through the migration workflow, not ad-hoc production edits.
- Be careful with changes to shared tooling packages, because they can affect multiple workspaces at once.
