# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code.
- `src/views/` holds page-level Vue views (for example `system/`, `dashboard/`, `result/`).
- `src/components/` stores shared UI, including `ui/` primitives and feature components like `Icon/` and `Upload/`.
- `src/api/` centralizes HTTP API modules; keep one domain per file (for example `user.ts`, `role.ts`).
- `src/stores/` contains Pinia stores, `src/router/` manages route modules and guards, and `src/styles/` contains global SCSS/Tailwind styles.
- Static assets live in `public/` and `src/assets/`. Utility scripts are in `scripts/`.

## Build, Test, and Development Commands
- `pnpm dev`: start Vite dev server in development mode.
- `pnpm build`: run type checking, then production build pipeline.
- `pnpm build-only`: run Vite build only (without `vue-tsc`).
- `pnpm preview`: preview the built app locally.
- `pnpm type-check`: run `vue-tsc --build`.
- `pnpm lint`: run oxlint + ESLint autofix.
- `pnpm format`: run `oxfmt` on `src/`.

## Coding Style & Naming Conventions
- Follow `.editorconfig`: UTF-8, LF, 2-space indent, max line length 100.
- Formatting: no semicolons, single quotes (`.oxfmtrc.json`).
- Linting: Vue + TypeScript rules via `eslint.config.ts` and `.oxlintrc.json`.
- Use `PascalCase` for Vue components (`UserDialog.vue`), `camelCase` for composables/utilities (`useDict.ts`, `treeBuilder.ts`), and kebab/lowercase directory names grouped by feature.

## Testing Guidelines
- No automated test suite is configured yet (no `test` script or test files present).
- Minimum quality gate for changes: `pnpm type-check && pnpm lint && pnpm build`.
- When adding tests, prefer colocated `*.spec.ts` files near the module or under a dedicated `tests/` directory.

## Commit & Pull Request Guidelines
- Current history uses a prefix style (example: `init: first commit`). Continue with concise, scoped messages like `feat: add role filter` or `fix: handle token refresh`.
- Keep commits focused; avoid mixing refactors with behavior changes.
- PRs should include: purpose summary, impacted paths, validation steps (commands run), linked issue, and UI screenshots/GIFs for visual changes.

## Security & Configuration Tips
- Do not commit secrets. Keep local values in `.env.development`; production values belong in deployment environment config.
- Validate API base URLs and auth-related config in `src/utils/request/` before release.
