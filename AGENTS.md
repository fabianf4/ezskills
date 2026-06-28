# ezskills

TUI en TypeScript (Ink 5 + React 18) para instalar/desinstalar skills de OpenCode y OpenClaw. ESM estricto, Node >= 20, pnpm.

## TDD

El proyecto se desarrolla con TDD estricto: **test rojo → implementación mínima → verde → refactor**. Cada cambio funcional debe llegar con su test primero, o un test que cubra el bug a la par del fix. No se aceptan PRs sin suite actualizada. Mocks:

- `memfs` para repositorios y providers (vía `FsAdapter`).
- `ink-testing-library` para vistas (la cobertura de componentes Ink con `useInput` no es fiable; por eso vistas quedan fuera del umbral).

## Comandos

- `pnpm dev`           — corre con `tsx src/index.ts` (sin compilar).
- `pnpm build`         — `tsc -p tsconfig.build.json` -> `dist/`.
- `pnpm start`         — `node dist/index.js` (requiere `build` previo).
- `pnpm test`          — `vitest run` (suite completa, ~185 tests).
- `pnpm test:watch`    — `vitest` en watch.
- `pnpm test:coverage` — reporte v8; umbral 90% (aplica a lógica de negocio).
- `pnpm typecheck`     — `tsc --noEmit -p tsconfig.typecheck.json`.

No hay linter/formatter configurado. No ejecutar `pnpm lint`.

## Arquitectura y entrypoints

- Entrada binaria: `src/index.ts` -> renderiza `src/app.tsx`.
- Composición de dependencias (DI manual): `src/config/dependencies.ts::buildDependencies`. Cualquier nuevo servicio o provider debe cablearse aquí.
- Capas:
  - `controllers/` — coordinan Modelo ↔ Vista, manejan keybindings (ver `controllers/keybindings.ts`).
  - `models/` — estado inmutable, transiciones puras.
  - `views/` — componentes Ink (sin lógica de negocio).
  - `services/providers/` — `OpenCodeProvider`, `OpenClawProvider` extienden `BaseFsProvider`.
  - `services/installer/` — orquesta install/uninstall multi-skill.
  - `services/indexer/` — escanea `skills/` y genera `.ezskills/index.json`.
  - `services/detector/` — `StubDetector` activo; sustituir por `AutoSkillsDetector` cuando se integre.
  - `services/search/` — búsqueda pura por tokens en name/description/technologies.
  - `repositories/` — `SkillRepository` (lee `index.json` cacheado), `InstalledSkillsRepository`.

## Convenciones

- **ESM NodeNext**: todos los imports relativos llevan sufijo `.js` aunque el archivo sea `.ts`.
- **Naming**: archivos en `kebab-case.ts`, clases en `PascalCase`, funciones en `camelCase`, constantes en `UPPER_SNAKE_CASE`.
- **Sin comentarios** salvo JSDoc en interfaces públicas.
- **Tests** (Vitest): mocks de fs con `memfs` vía `FsAdapter`; no se hace mock de `node:fs` directo.
- **Cobertura**: excluidos por diseño `src/index.ts`, `src/app.tsx`, `src/types/**`, `src/views/**`, `src/tests/**`, y `*.{test,spec}.ts(x)` (la cobertura de Ink con `useInput` no es fiable). El umbral 90% aplica al resto.
- **No commitear** en git: `node_modules/`, `dist/`, `coverage/`, `.ezskills/`. `dist/` se publica al paquete npm vía `files` en `package.json`, pero no se versiona.
- **TypeScript estricto**: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns` activos. Evitar `any` salvo en el `FsAdapter` shim.
- **`engine-strict=true`** en `.npmrc` — usar Node 20+.

## UI

- Cada skill se muestra como **Nombre** en una línea y **descripción corta** en la siguiente. No se exponen paths, technologies, IDs de provider ni scopes al usuario.
- `UninstallScreen` lista solo las instaladas del scope activo (`global` o `local`).
- Keybindings: `↑`/`↓` o `j`/`k` navega, `g`/`G` inicio/final de lista, `Space` selecciona/deselecciona, `Enter` confirma, `Esc` vuelve/cancela, `q` sale (menú principal), `s` enfoca el input de búsqueda, `Tab` alterna scope global/local.

## Skills (formato de datos)

Cada carpeta en `skills/` debe contener `SKILL.md` con frontmatter YAML:

```yaml
---
name: react
description: React UI library best practices
---
```

Opcional `metadata.json` con `technology` y/o `category` (alimentan la búsqueda).

Al arrancar, si `.ezskills/index.json` no existe, se regenera automáticamente desde `skills/`. Para regenerar: borrar `.ezskills/index.json` y relanzar la TUI, o invocar `SkillIndexer.run()` directamente.

## Variables de entorno

`EZSKILLS_SKILLS_DIR` (default `<cwd>/catalog`), `EZSKILLS_INDEX_PATH` (`<cwd>/.ezskills/index.json`), `EZSKILLS_OPENCODE_GLOBAL` (`~/.config/opencode/skills`), `EZSKILLS_OPENCODE_LOCAL` (`<cwd>/.opencode/skills`), `EZSKILLS_OPENCLAW_GLOBAL` (`~/.openclaw/skills`), `EZSKILLS_OPENCLAW_LOCAL` (`<cwd>/skills`).

## Contratos clave

- **`SearchService.search(skills, query)`** — case-insensitive, coincidencia parcial (substring), AND lógico entre tokens. Query vacía devuelve copia de la lista. Sin match → `[]`.
- **`InstallerService.installMany(skills, scope, providerId)`** — **no hace rollback** ante fallos parciales: las skills ya instaladas antes del error permanecen. Devuelve `{ installed: string[]; skipped: string[]; failed: Array<{ name; error }> }`. `skipped` son las que ya estaban instaladas según `InstalledSkillsRepository`.
- **`InstallerService.uninstallMany(skills)`** — mismo principio: errores por skill no abortan el lote, se acumulan en `failed`.
- **`InstalledSkillsRepository`** — agrega resultados de todos los providers. Si dos providers reportan la misma `name`, gana el primero y se omite el duplicado.
- **`StubDetector.detect(_projectPath)`** — siempre `{ technologies: [], suggestedSkillNames: [] }` (determinista, hasta que se integre `AutoSkillsDetector`).
- **`SkillRepository`** — cachea en memoria el `index.json`; `invalidate()` fuerza relectura. Devuelve copias defensivas de los `IndexedSkill`.

## Añadir un provider (ej. Cursor)

1. Crear `src/services/providers/cursor-provider.ts` extendiendo `BaseFsProvider` con `readonly id = 'cursor'`.
2. Añadir rutas en `src/config/paths.ts` y variables `EZSKILLS_CURSOR_*`.
3. Registrar en el `Map` de `buildDependencies()` y, si aplica, en `InstalledSkillsRepository`.
4. Añadir tests en `src/services/providers/__tests__/` siguiendo el patrón de `opencode-provider.test.ts` / `openclaw-provider.test.ts` (memfs).

## Sustituir StubDetector por AutoSkills

1. Implementar `Detector` en `src/services/detector/autoskills-detector.ts`.
2. Cambiar la instanciación en `buildDependencies()` (no se usa `DetectorFactory` todavía).
