# Changelog

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
