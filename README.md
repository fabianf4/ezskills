# ezskills

[![npm version](https://img.shields.io/npm/v/@fabianf4/ezskills.svg)](https://www.npmjs.com/package/@fabianf4/ezskills)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Node >= 20](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)
[![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-orange.svg)](https://pnpm.io)

A TUI to install and uninstall skills for [OpenCode](https://opencode.ai) and [OpenClaw](https://openclaw.dev).

## What is ezskills?

`ezskills` is a terminal interface that lists the skills available in a catalog, lets you pick the ones you want, and copies them into the right directory for the providers you have installed on your system. It also works in reverse: see what's installed, pick what to remove, get a clear report.

The catalog ships inside the package, so it works out of the box on any Linux machine with Node 20+. The published binary is a single self-contained ESM bundle — `node_modules` adjacent to the package are not required.

## Why

OpenCode and OpenClaw load skills from a directory on disk. Managing those directories by hand is tedious: clone a repo, find the right files, drop them in `~/.config/opencode/skills/`, `<project>/.opencode/skills/`, `~/.openclaw/skills/`, or `<project>/skills/`, and repeat for every skill, every scope, every provider. `ezskills` turns that into a couple of keystrokes.

## Features

- **Multi-provider**: install or uninstall across OpenCode and OpenClaw in one go.
- **Multi-select** with vim keybindings (`j`/`k`, `g`/`G`, `Space`, `Enter`).
- **Search** by name, description, and technology.
- **Global vs. local scope**, switchable with `Tab`.
- **Bundled catalog** included by default — works out of the box, no setup.
- **Already-installed skills** are dimmed and marked `✓ installed`; they cannot be re-selected.
- **Provider picker** auto-detects which providers are installed and pre-selects when there's exactly one.
- **Self-contained binary**: React, Ink, Chalk, Memfs, and Yaml are inlined with esbuild. Runs on any Linux with Node 20+.

## Requirements

- Node.js 20 or newer.
- At least one of the supported providers installed on the system (the picker only shows providers it can detect).

## Getting started

### Try it without installing

The fastest way to give it a spin:

```bash
npx -y @fabianf4/ezskills
```

`npx` downloads a temporary copy, runs the TUI, and cleans up after you exit. Great for a first look.

### Install globally with pnpm (recommended)

```bash
pnpm add -g @fabianf4/ezskills
ezskills --version
```

`pnpm` is the package manager this project is developed against. Use it for global installs when you can.

### Install globally with npm

```bash
npm install -g @fabianf4/ezskills
ezskills --version
```

`npm` works as a drop-in replacement for `pnpm add -g`. Pick whichever you have.

## Usage

```bash
ezskills                # launch the TUI
ezskills --version      # print version and exit
ezskills --help         # print help and exit
```

Without flags, the TUI walks you through:

1. **Main menu** — pick `Install Skills` or `Uninstall Skills`.
2. **Provider picker** — multi-select the tools you want to act on. The picker only shows providers that are actually installed on your system. If there is exactly one, it comes pre-selected. With zero or two or more, it starts empty; if you confirm with nothing marked, the picker stays put and shows `Select at least one tool`.
3. **Skill list** — for install: the full catalog, with already-installed skills dimmed and suffixed with `✓ installed`. For uninstall: only the skills currently installed for the selected providers. Search with `s`, toggle scope with `Tab`, mark with `Space`.
4. **Confirm** — a summary prints at the end with `installed`/`skipped`/`failed` (install) or `uninstalled`/`failed` (uninstall), per provider.

### Keybindings

| Key                    | Action                              |
| ---------------------- | ----------------------------------- |
| `↑` / `↓` or `j` / `k` | Move the cursor                     |
| `g` / `G`              | Jump to top / bottom of the list    |
| `Space`                | Toggle selection                    |
| `Enter`                | Confirm                             |
| `Esc`                  | Go back / cancel                    |
| `q`                    | Quit (from the main menu)           |
| `s`                    | Focus the search input              |
| `Tab`                  | Switch scope (global / local)       |

## Uninstalling

To remove the `ezskills` binary:

```bash
pnpm remove -g @fabianf4/ezskills
# or
npm uninstall -g @fabianf4/ezskills
```

To remove skills from your providers, the cleanest path is `Uninstall Skills` in the TUI itself. If you prefer, you can also delete skill folders directly from the target directory of each provider (the picker shows the tools, but paths are not exposed in the UI on purpose).

## Catalog origin

The skills in the bundled catalog are sourced from
[`midudev/autoskills`](https://github.com/midudev/autoskills/tree/main).
Thanks to midudev and the contributors of that project for curating and
maintaining them. `ezskills` is a thin installer over those `SKILL.md`
files.

## Contributing

Want to hack on the binary, add a provider, or curate new skills? See
[CONTRIBUTING.md](./CONTRIBUTING.md) for the architecture, conventions,
and the recipe to add new providers and skills. AI-agent specific notes
live in [AGENTS.md](./AGENTS.md).

## License

[MIT](./LICENSE)
