# Changelog

## 0.3.0 (2026-06-28)

The runtime no longer regenerates `catalog/index.json`, and the published
package is now a single self-contained ESM bundle. These two changes
together fix the "Cannot find package 'react'" failure seen on some Linux
setups where the package manager's `NODE_PATH` shim does not point at the
right `node_modules` tree.

### Behavior changes

- The `catalog/index.json` file is now committed to the repo and shipped
  inside the published tarball. It is no longer auto-generated at runtime
  by `SkillIndexer`. The dev regenerates it with `pnpm build:index`. The
  file is never created, modified, or deleted by the running binary; if
  it is missing the app exits with an actionable error pointing at
  `pnpm build:index`.
- The published binary is a single bundled `dist/index.js` produced with
  esbuild. It contains React, Ink, Chalk, Memfs, Yaml and all transitive
  deps inlined, so `node_modules` adjacent to the package are no longer
  required for `ezskills` to run. `ezskills` works on any Linux machine
  with Node 20+ and no other setup.

### Build

- New script: `pnpm build:index` (calls `scripts/build-index.ts` which
  uses `SkillIndexer` to (re)generate `catalog/index.json`).
- New devDependency: `esbuild@^0.24`.
- `pnpm build` now produces a single ESM bundle (was: many files under
  `dist/`). `dist/index.js` and `dist/index.js.map` are the only outputs.
- `prepublishOnly` runs `pnpm build:index` before `pnpm build` so the
  shipped index is always in sync with the catalog.
- `package.json#files` was simplified to ship the bundle, the source map,
  and the catalog (with its committed `index.json`).

### Internal

- `getPackageRoot()` (new) walks up from the call site to find the
  nearest `package.json`, with a memoized cache and a `resetPackageRootCache()`
  hook for tests. `getBundledSkillsDir()` and `getPackageVersion()` now
  both derive from it, so the path resolution works the same from
  `dist/index.js` (bundled) and from `src/index.ts` (dev) without any
  counting of `..` segments.
- `src/config/dependencies.ts` no longer auto-generates the index. It
  asserts that the index exists at startup; otherwise it throws with
  an actionable message. The dev-only indexer is reachable from the
  runtime only via the new `scripts/build-index.ts` entry point.
- New test `src/tests/runtime-immutability.test.ts` asserts (statically)
  that no runtime code outside `src/services/indexer/` imports the
  indexer, calls `SkillIndexer.run()`, or writes to a path matching
  `catalog/index.json`. This is the long-term safety net for the
  "runtime never touches the index" invariant.
- New test `src/tests/bundle-integration.test.ts` copies `dist/index.js`
  and the catalog into a tmpdir with no `node_modules` and runs
  `node <tmp>/dist/index.js --version` and `--help` to prove the
  bundle is self-contained. This is the test of record for the
  "works on any Linux" guarantee.
- The legacy `.ezskills/` runtime artifact directory is no longer
  produced by the app. It remains in `.gitignore` as a safety net.

## 0.2.0 (2026-06-28)

Catalog and orchestration rework after the 0.1.0 cut. No new features, but a
number of behavior and contract changes documented below. 264 tests, 99,68%
statement coverage on business logic.

### Behavior changes

- The skill index cache now lives inside the catalog as `<catalog>/index.json`
  (was `<cwd>/.ezskills/index.json`). Delete that file to force a regen on next
  run.
- The `<cwd>/catalog` fallback and the `EZSKILLS_INDEX_PATH` environment
  variable are gone. The catalog resolves in cascade: `EZSKILLS_SKILLS_DIR` if
  set, otherwise the bundled catalog inside the package.
- Search is now AND-logic between tokens (e.g. `react zod` matches only skills
  that contain both tokens). It was whole-string substring before.
- `UninstallScreen` shows the catalog description of each installed skill, not
  the provider id.
- The list of installed skills refreshes every time the install screen is
  entered — previously a just-installed skill could be re-selected on re-entry
  because the installed set was stale.
- The `fsPromisesAdapter` now uses static imports; no per-op dynamic `import()`
  cost.
- The bundled catalog ships with `catalog/index.json` excluded from the npm
  tarball via `package.json#files`, so the package stays small.

### Internal

- The `MenuState`, `AppState`, `UninstallState`, and `InstallState` model
  classes were removed; selection and scope state live in the views or in
  `App` now. `UninstallController.confirm(skills)` and
  `InstallController.confirm(skills, scope)` take their inputs as parameters
  instead of mirroring them internally.
- `.gitignore` now covers all runtime artifacts: `.ezskills/`,
  `catalog/index.json`, `.opencode/`, `skills/`.

### Credits

The bundled catalog of skills is sourced from
[midudev/autoskills](https://github.com/midudev/autoskills/tree/main). Thanks
to midudev and the contributors of that project for curating and maintaining
them. `ezskills` is a thin installer over those `SKILL.md` files.

## 0.1.0 (2026-06-28)

Initial release.

- TUI built with Ink + React for managing skills for OpenCode and OpenClaw
- Multi-provider install and uninstall (OpenCode, OpenClaw)
- Multi-select with vim keybindings and search
- Bundled catalog ships inside the package — works out of the box
- Global vs. local scope, switchable per session
- 268 tests, ~99% statement coverage on business logic (controllers, services, repositories, models)
- Catalog resolves in cascade: `EZSKILLS_SKILLS_DIR` → `<cwd>/catalog` → bundled
- CLI flags: `--version`, `--help` (and short forms `-v`, `-h`)
- Installs as a global binary: `npm install -g .`
