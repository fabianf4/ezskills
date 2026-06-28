# Changelog

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
