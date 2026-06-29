# ezskills

A TUI to install and uninstall skills for [OpenCode](https://opencode.ai) and [OpenClaw](https://openclaw.dev) without manually copying files around.

## Why

Both OpenCode and OpenClaw load skills from a directory on disk. Managing those
directories by hand is tedious: clone a repo, find the right files, drop them in
`~/.config/opencode/skills/` or `<project>/.opencode/skills/`, repeat for every
skill, every scope, every provider. `ezskills` is a terminal interface that:

- Scans a catalog of skills (shipped with the package, or your own).
- Lets you pick which ones to install and which providers to target.
- Installs globally (`~/.config/...`) or locally (`<project>/.opencode/...`).
- Does the same in reverse for uninstall, with a clear report of what changed.

## Features

- Multi-provider: install or uninstall across OpenCode and OpenClaw in one go.
- Multi-select with vim keybindings (`j`/`k`, `g`/`G`, `Space`, `Enter`).
- Search by name, description, and technology.
- Global vs. local scope, switchable with `Tab`.
- Bundled catalog included by default — works out of the box, no setup.
- Already-installed skills are dimmed and marked `✓ installed`.
- One tool, one binary: `ezskills`.

## Demo

```
┌─ ezskills ──────────────────────────────────────────┐
│ > Install Skills                                    │
│   Uninstall Skills                                  │
│   Quit                                              │
└─────────────────────────────────────────────────────┘
  j/k move  enter select  q quit

┌─ Select tools ──────────────────────┐
│ > [x] OpenCode                      │
│   [ ] OpenClaw                      │
└─────────────────────────────────────┘
  space toggle  enter confirm  esc back

┌─ Install skills ────────────────────────────────────┐
│   react                                              │
│     React UI library best practices                  │
│   python                                             │
│     Pythonic patterns and idioms                     │
│ > typescript                                         │
│     TypeScript language best practices  ✓ installed  │
└─────────────────────────────────────────────────────┘
  j/k move  s search  tab scope  space toggle  enter confirm  esc back
```

## Requirements

- Node.js 20 or newer.
- One or more of the supported providers installed on the system
  (the picker only shows providers it can detect).

## Installation

### From the repository (recommended while we don't ship to npm yet)

```bash
git clone https://github.com/fabianf4/ezskills.git
cd ezskills
pnpm install
pnpm build
npm install -g .
ezskills --version
```

`pnpm add -g .` is equivalent but fails on some systems because of a PATH
sanity check in pnpm 9.15.4 — use `npm install -g .` if that happens.

### From npm (once published)

```bash
npm install -g @fabianf4/ezskills
ezskills --version
```

## Usage

```bash
ezskills                # launch the TUI
ezskills --version      # print version and exit
ezskills --help         # print help and exit
```

Without flags, the TUI walks you through:

1. Pick an action from the main menu (Install or Uninstall).
2. Select the providers you want to act on. The picker only shows providers
   that are actually installed on your system, and pre-selects the only one
   if there is exactly one. With two or more, you mark them with `Space`.
3. Pick the skills (or the installed skills, for Uninstall).
4. Confirm. A summary prints at the end with `installed`, `skipped`, and
   `failed` per provider.

### Keybindings

| Key                    | Action                            |
| ---------------------- | --------------------------------- |
| `↑` / `↓` or `j` / `k` | Move the cursor                   |
| `g` / `G`              | Jump to top / bottom of the list  |
| `Space`                | Toggle selection                  |
| `Enter`                | Confirm                           |
| `Esc`                  | Go back / cancel                  |
| `q`                    | Quit (from the main menu)         |
| `s`                    | Focus the search input            |
| `Tab`                  | Switch scope (global / local)     |

## Skill format

A skill is a folder with a `SKILL.md` file. The frontmatter is what gets
indexed; the body is what gets installed.

```yaml
---
name: react
description: React UI library best practices
---
# React skill content goes here
```

Optionally a `metadata.json` next to `SKILL.md` adds tags for the search:

```json
{
  "technology": "React",
  "category": "Frontend"
}
```

The default catalog ships inside the package at `dist/catalog/`. To use your
own, point `EZSKILLS_SKILLS_DIR` at it (see below) or create a `catalog/`
folder in the directory you launch `ezskills` from.

### Catalog origin

Skills in the bundled catalog are sourced from
[midudev/autoskills](https://github.com/midudev/autoskills/tree/main). Thanks
to midudev and the contributors of that project for curating and maintaining
them. `ezskills` is a thin installer over those `SKILL.md` files.

## Environment variables

| Variable                  | Default                                      | Description            |
| ------------------------- | -------------------------------------------- | ---------------------- |
| `EZSKILLS_SKILLS_DIR`     | the bundled catalog                          | Source of skills       |
| `EZSKILLS_OPENCODE_GLOBAL`| `~/.config/opencode/skills`                  | OpenCode global target |
| `EZSKILLS_OPENCODE_LOCAL` | `<cwd>/.opencode/skills`                     | OpenCode local target  |
| `EZSKILLS_OPENCLAW_GLOBAL`| `~/.openclaw/skills`                         | OpenClaw global target |
| `EZSKILLS_OPENCLAW_LOCAL` | `<cwd>/skills`                               | OpenClaw local target  |

`EZSKILLS_SKILLS_DIR` is resolved with this cascade:

1. The environment variable, if set.
2. The catalog bundled inside the package, so `ezskills` works the moment
   you install it without any local setup.

The index cache is written inside the catalog as `<catalog>/index.json`. Delete
it to force a regen on next run.

## Detection

A provider is considered "installed" if its config directory exists:

- OpenCode: `~/.config/opencode/`
- OpenClaw: `~/.openclaw/`

The picker only lists providers that pass this check.

## Contributing

Development, architecture, adding new providers, and the test suite live in
[AGENTS.md](./AGENTS.md).

## License

[MIT](./LICENSE)
