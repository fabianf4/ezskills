# Contributing to ezskills

Thanks for your interest in `ezskills`. This document covers everything a
human contributor needs to get productive: the tech stack, the project
layout, the architecture, and the recipes for adding a new provider or
new skills to the catalog. AI-agent specific notes live in
[AGENTS.md](./AGENTS.md).

## What is ezskills?

A TUI built with [Ink 5](https://github.com/vadimdemedes/ink) and
[React 18](https://react.dev) that installs and uninstalls skills for
[OpenCode](https://opencode.ai) and [OpenClaw](https://openclaw.dev).
The published binary is a single self-contained ESM bundle produced
with [esbuild](https://esbuild.github.io), so it runs on any Linux with
Node 20+ without needing an adjacent `node_modules`.

## Tech stack

- **Runtime**: Node.js ≥ 20, ESM (`"type": "module"`, `NodeNext`).
- **TUI**: Ink 5 + React 18.
- **Build**: esbuild (single bundle, `--platform=node --target=node20`).
- **Tests**: [Vitest](https://vitest.dev) with v8 coverage.
- **Mocks**: [`memfs`](https://github.com/streamich/memfs) injected
  through an `FsAdapter` shim.
- **YAML**: [`yaml`](https://eemeli.org/yaml/) for skill frontmatter.
- **Package manager**: pnpm 11+ (`packageManager` field is pinned).

## Quick start

```bash
git clone https://github.com/fabianf4/ezskills.git
cd ezskills
corepack enable            # only the first time, if pnpm isn't installed
pnpm install               # dev deps
pnpm dev                   # runs the TUI directly from src/, no build needed
```

| Action                | Command            | Notes                                         |
| --------------------- | ------------------ | --------------------------------------------- |
| Run from source       | `pnpm dev`         | TUI in your terminal, hot reload by re-running|
| Regenerate index      | `pnpm build:index` | Only after editing `catalog/`                 |
| Build the bundle      | `pnpm build`       | Produces `dist/index.js` + `.map`             |
| Start the built bin   | `pnpm start`       | Requires `pnpm build` first                   |
| Test (full suite)     | `pnpm test`        |                                               |
| Test watch            | `pnpm test:watch`  |                                               |
| Coverage (90% gate)   | `pnpm test:coverage` | Business code only; views excluded          |
| Typecheck             | `pnpm typecheck`   | `tsc --noEmit` over the strict config         |

`npm` works as a drop-in replacement for `pnpm` in every command above.

## Project layout

```
src/
  index.ts                       # CLI entry; parses args, renders <App>
  app.tsx                        # screen router (main / pickProvider / install / uninstall)
  cli/                           # args parser, --version / --help output
  config/
    paths.ts                     # resolves EZSKILLS_* env vars, bundled skills dir
    dependencies.ts              # manual DI: buildDependencies() wires everything
    fs-promises-adapter.ts       # FsAdapter shim over node:fs/promises
  controllers/                   # coordinate model ↔ view, handle keybindings
    main-menu-controller.ts
    install-controller.ts
    uninstall-controller.ts
    keybindings.ts               # KEY_* constants shared by views
  repositories/                  # data access; pure IO
    skill-repository.ts          # reads <catalog>/index.json (read-only at runtime)
    installed-skills-repository.ts
  services/
    indexer/                     # DEV ONLY — never imported by runtime
      frontmatter-parser.ts      # parses SKILL.md YAML frontmatter
      skill-indexer.ts           # scans catalog/, writes index.json
    installer/
      installer-service.ts       # batch install / uninstall per provider
    providers/                   # SkillProvider implementations
      base-fs-provider.ts        # shared install/uninstall/list behavior
      opencode-provider.ts
      openclaw-provider.ts
    search/
      search-service.ts          # pure token AND-search over name/desc/tech
  views/                         # Ink components; no business logic
    screens/                     # main-menu, install, uninstall, provider-picker
    components/                  # selectable-list, search-input, confirm-dialog, status-message
    hooks/                       # use-skill-search
  types/                         # public contracts (SkillProvider, IndexedSkill, ...)
  tests/                         # cross-cutting tests (runtime immutability, bundle integration)
scripts/
  build-index.ts                 # CLI wrapper around SkillIndexer.run()
catalog/                         # bundled skills + committed index.json
```

## Architecture

Dependency injection is manual and lives in
[`src/config/dependencies.ts`](./src/config/dependencies.ts). The shape:

```
buildDependencies(cwd)
  ├─ resolvePaths(cwd)                        // env + bundled catalog
  ├─ assertIndexExists(paths.indexPath)       // hard-fail if index is missing
  ├─ SkillRepository(paths.indexPath, fs)     // reads index.json
  ├─ SearchService()
  ├─ OpenCodeProvider, OpenClawProvider       // extend BaseFsProvider
  ├─ InstalledSkillsRepository([opencode, openclaw])
  └─ InstallerService(providers, installedRepo)
```

The flow of a single install operation:

```
User keystrokes (Ink)
        │
        ▼
   views/screens/install-screen.tsx
        │  onConfirm(skills)
        ▼
controllers/install-controller.ts        ── loadInstalledNames(), confirm()
        │  installer.installMany(skills, scope, providerId)
        ▼
services/installer/installer-service.ts ── iterates, accumulates {installed, skipped, failed}
        │  provider.install(skill, scope)
        ▼
services/providers/base-fs-provider.ts  ── fs.cp(skill.path, destination, recursive)
        │
        ▼
      node:fs (via FsAdapter)
```

Layer rules:

- **Views** never import from `controllers/`, `services/`, or
  `repositories/`. They receive data and callbacks as props.
- **Controllers** own no UI; they call services and translate results
  into callbacks.
- **Services** are stateless and pure where possible; they depend on
  abstractions (`FsAdapter`, `SkillProvider`), not on `node:fs`.
- **Repositories** are the only layer that touches files for read paths.
- The runtime **never** imports from `services/indexer/`. That module
  is dev-only and only reachable from `scripts/build-index.ts`.

## Conventions

- **ESM NodeNext**: every relative import carries a `.js` suffix, even
  if the source file is `.ts`.
- **Naming**: files in `kebab-case.ts` / `kebab-case.tsx`, classes in
  `PascalCase`, functions in `camelCase`, constants in
  `UPPER_SNAKE_CASE`.
- **No comments** in source code, except JSDoc on public interfaces.
- **Strict TypeScript**: `noUncheckedIndexedAccess`,
  `noUnusedLocals/Parameters`, `noImplicitReturns` are on. Avoid `any`
  outside the `FsAdapter` shim, where it bridges a dynamic API.
- **Mocks**: tests inject `FsAdapter` (using `memfs`). Never mock
  `node:fs` directly.
- **Coverage**: 90% statements / branches / functions / lines over
  business code. `src/index.ts`, `src/app.tsx`, `src/types/**`,
  `src/views/**`, `src/tests/**`, and `*.{test,spec}.ts(x)` are excluded
  by design (Ink components with `useInput` are unreliable to cover).

## Skill format

A skill is a folder under `catalog/` containing a `SKILL.md`. The
frontmatter is what gets indexed; the body is what gets installed.

```yaml
---
name: react
description: React UI library best practices
---
# React skill content goes here
```

Optional `metadata.json` next to `SKILL.md` adds tags for the search:

```json
{
  "technology": "React",
  "category": "Frontend"
}
```

| Field          | Required | Notes                                              |
| -------------- | -------- | -------------------------------------------------- |
| `name`         | yes      | Folder name. Must be unique within the catalog.    |
| `description`  | yes      | Searchable. Shown in the TUI under the skill name. |
| `technology`   | no       | Searchable tag (e.g. `React`, `TypeScript`).       |
| `category`     | no       | Searchable tag (e.g. `Frontend`, `Backend`).       |

## Catalog and index

The catalog lives at `catalog/` (sibling of `package.json` and `dist/`).
A committed `catalog/index.json` ships with the package and is the only
thing the runtime reads at startup. It is **never** generated, modified,
or deleted by the binary.

If the index is missing, the app exits with an actionable error pointing
at `pnpm build:index`. This invariant is enforced by
[`src/tests/runtime-immutability.test.ts`](./src/tests/runtime-immutability.test.ts),
which statically asserts that no runtime code outside
`src/services/indexer/` imports the indexer, calls
`SkillIndexer.run()`, or writes to a path matching
`catalog/index.json`.

### Adding skills to the catalog

1. Drop a folder under `catalog/<name>/` with a `SKILL.md` (and
   optional `metadata.json`).
2. Run `pnpm build:index` to regenerate `catalog/index.json`.
3. Commit both the new folder and the updated `index.json`.

The catalog in the repo is sourced from
[`midudev/autoskills`](https://github.com/midudev/autoskills/tree/main).
When upstream adds or updates a skill, copy the folder across and
re-run `pnpm build:index`.

## Adding a provider

The recipe to add a new provider (the example below adds `cursor`):

1. **Create the provider** at
   `src/services/providers/cursor-provider.ts`:

   ```ts
   import { dirname } from 'node:path';
   import { BaseFsProvider, type ProviderPaths } from './base-fs-provider.js';
   import type { FsAdapter } from '../../types/index.js';

   export class CursorProvider extends BaseFsProvider {
     readonly id = 'cursor';
     readonly label = 'Cursor';

     constructor(paths: ProviderPaths, fs: FsAdapter) {
       // The installMarker is the path whose existence signals
       // "this tool is installed on the system". Default to the parent
       // of the global skills dir, but you can pass any path that
       // uniquely identifies the tool's config directory.
       super(paths, fs, dirname(paths.global));
     }
   }
   ```

2. **Add the paths** to [`src/config/paths.ts`](./src/config/paths.ts)
   and wire their `EZSKILLS_CURSOR_GLOBAL` / `EZSKILLS_CURSOR_LOCAL`
   env vars with `envOr(...)`.

3. **Register the provider** in
   [`src/config/dependencies.ts`](./src/config/dependencies.ts): add
   the constructor call, include it in the `providers` `Map`, and pass
   it to `InstalledSkillsRepository`.

4. **Add tests** under
   `src/services/providers/__tests__/cursor-provider.test.ts`. Follow
   the `opencode-provider.test.ts` / `openclaw-provider.test.ts`
   pattern using `memfs` and `FsAdapter`. Cover `isInstalled` with and
   without the marker path present.

## Build and release

- `pnpm build` runs esbuild and produces `dist/index.js` (a single
  self-contained ESM bundle) plus its source map. The file is
  `chmod +x`'d so it can be invoked directly.
- `prepublishOnly` runs `pnpm test && pnpm typecheck && pnpm
  build:index && pnpm build`, so the shipped `index.json` is always in
  sync with the catalog.
- `package.json#files` decides what goes into the npm tarball:
  `dist/index.js`, `dist/index.js.map`, `catalog`, the READMEs, the
  changelog, and the license. `node_modules/`, the dev-only
  `scripts/`, and the test suite are excluded.

## Testing

- Run the suite: `pnpm test`.
- Watch mode: `pnpm test:watch`.
- Coverage: `pnpm test:coverage` (90% threshold on business code;
  views are excluded by `vitest.config.ts`).
- Mocks always go through `FsAdapter` so the runtime code path is
  exercised with an in-memory filesystem.
- View components are rendered with `ink-testing-library` when
  practical. Coverage on Ink components that use `useInput` is
  unreliable and intentionally excluded from the threshold.

### The "works on any Linux" guarantee

[`src/tests/bundle-integration.test.ts`](./src/tests/bundle-integration.test.ts)
copies `dist/index.js` and the `catalog/` into a tmpdir with **no**
`node_modules`, runs `node <tmp>/dist/index.js --version` and
`--help`, and asserts the exit codes and output. It is the test of
record for the self-contained-bundle promise. Run it after any
`pnpm build` change:

```bash
pnpm build
pnpm test
```

## PR checklist

Before opening a pull request, make sure:

- [ ] The full test suite is green (`pnpm test`).
- [ ] `pnpm typecheck` is green.
- [ ] New behavior is covered by tests (TDD: red → green → refactor).
- [ ] If you touched `catalog/`, `catalog/index.json` is regenerated
      and committed.
- [ ] If you added a provider, it is wired in
      `buildDependencies` and `InstalledSkillsRepository`, and tested
      with `memfs` (including `isInstalled` both ways).
- [ ] No new files use relative imports without the `.js` suffix.
- [ ] Commit message describes the why, not just the what.

## License

[MIT](./LICENSE). By contributing, you agree your contributions are
licensed under the same terms.
