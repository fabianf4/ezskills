# ezskills

TUI en TypeScript (Ink 5 + React 18) para instalar/desinstalar skills de OpenCode y OpenClaw. ESM estricto, Node >= 20, pnpm 11+ (pinned via `packageManager`).

## TDD

El proyecto se desarrolla con TDD estricto: **test rojo → implementación mínima → verde → refactor**. Cada cambio funcional debe llegar con su test primero, o un test que cubra el bug a la par del fix. No se aceptan PRs sin suite actualizada. Mocks:

- `memfs` para repositorios y providers (vía `FsAdapter`).
- `ink-testing-library` para vistas (la cobertura de componentes Ink con `useInput` no es fiable; por eso vistas quedan fuera del umbral).

## Comandos

pnpm es el package manager por defecto; npm funciona como drop-in replacement. Todos los scripts usan comandos shell puros, así que `npm run <script>` es equivalente a `pnpm <script>`.

| Acción | pnpm | npm |
|---|---|---|
| Dev (sin compilar) | `pnpm dev` | `npm run dev` |
| Regenerar `catalog/index.json` (sólo dev) | `pnpm build:index` | `npm run build:index` |
| Build (esbuild bundle → `dist/index.js`, +x) | `pnpm build` | `npm run build` |
| Start (requiere build) | `pnpm start` | `npm run start` |
| Test (suite completa) | `pnpm test` | `npm run test` |
| Test watch | `pnpm test:watch` | `npm run test:watch` |
| Coverage v8 (umbral 90%) | `pnpm test:coverage` | `npm run test:coverage` |
| Typecheck | `pnpm typecheck` | `npm run typecheck` |
| Install global del bin | `pnpm add -g .` | `npm install -g .` |

CLI flags: `ezskills --version` / `-v` imprime versión y sale con código 0; `ezskills --help` / `-h` imprime ayuda y sale con código 0; opción desconocida sale con código 2. Sin flags arranca la TUI.

No hay linter/formatter configurado. No ejecutar `lint` (con cualquier package manager).

## Arquitectura y entrypoints

- Entrada binaria: `src/index.ts` -> renderiza `src/app.tsx`.
- Composición de dependencias (DI manual): `src/config/dependencies.ts::buildDependencies`. Cualquier nuevo servicio o provider debe cablearse aquí.
- Capas:
  - `controllers/` — coordinan Modelo ↔ Vista, manejan keybindings (ver `controllers/keybindings.ts`).
  - `models/` — estado inmutable, transiciones puras.
  - `views/` — componentes Ink (sin lógica de negocio).
  - `services/providers/` — `OpenCodeProvider`, `OpenClawProvider` extienden `BaseFsProvider`.
  - `services/installer/` — orquesta install/uninstall multi-skill.
  - `services/indexer/` — **dev tool only**. Escanea `catalog/` y (re)genera `<catalog>/index.json`. NO se importa desde el runtime; sólo desde `scripts/build-index.ts` y los tests. Garantizado por `src/tests/runtime-immutability.test.ts`.
  - `services/search/` — búsqueda pura por tokens en name/description/technologies.
  - `repositories/` — `SkillRepository` (sólo lee `index.json`; nunca escribe), `InstalledSkillsRepository`.

## Convenciones

- **ESM NodeNext**: todos los imports relativos llevan sufijo `.js` aunque el archivo sea `.ts`.
- **Naming**: archivos en `kebab-case.ts`, clases en `PascalCase`, funciones en `camelCase`, constantes en `UPPER_SNAKE_CASE`.
- **Sin comentarios** salvo JSDoc en interfaces públicas.
- **Tests** (Vitest): mocks de fs con `memfs` vía `FsAdapter`; no se hace mock de `node:fs` directo.
- **Cobertura**: excluidos por diseño `src/index.ts`, `src/app.tsx`, `src/types/**`, `src/views/**`, `src/tests/**`, y `*.{test,spec}.ts(x)` (la cobertura de Ink con `useInput` no es fiable). El umbral 90% aplica al resto.
- **No commitear** en git: `node_modules/`, `dist/`, `coverage/`, `.ezskills/`. `dist/` se publica al paquete npm vía `files` en `package.json`, pero no se versiona. **`catalog/index.json` SÍ se commitea** (es input del runtime, lo regenera el dev con `pnpm build:index`).
- **TypeScript estricto**: `noUncheckedIndexedAccess`, `noUnusedLocals/Parameters`, `noImplicitReturns` activos. Evitar `any` salvo en el `FsAdapter` shim.
- **`engine-strict=true`** en `.npmrc` — usar Node 20+.

## UI

- Cada skill se muestra como **Nombre** en una línea y **descripción corta** en la siguiente. No se exponen paths, technologies, IDs de provider ni scopes al usuario.
- En `InstallScreen`, las skills ya instaladas (en cualquiera de los providers seleccionados) se muestran con la fila atenuada y un sufijo `✓ installed`; no se pueden seleccionar (`Space` no las togglea).
- Menú principal: `Install Skills`, `Uninstall Skills`. Sin opción de auto-detección.
- Antes de cada acción (install/uninstall) aparece `ProviderPicker`: pantalla multi-select que lista **solo los providers que el usuario tiene instalados en su sistema**. Si hay exactamente uno, viene **preseleccionado**; con 0 o ≥2 arranca con ninguno. Al confirmar, si la selección está vacía, el picker no avanza y muestra `Select at least one tool`; el mensaje se limpia en cuanto el usuario marca algo con `Space`. Permite instalar/desinstalar en uno o varios providers a la vez.
- Detección de "instalado" por provider: cada provider expone `readonly isInstalled: boolean` (computed en el constructor a partir de un `installMarker`, normalmente el directorio de configuración del tool — p. ej. `~/.config/opencode/` para OpenCode, `~/.openclaw/` para OpenClaw). `AppDependencies.listInstalledProviders()` filtra por esa señal.
- `UninstallScreen` lista solo las instaladas del scope activo y de los providers seleccionados en el picker.
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

Al arrancar, la app **lee** `<catalog>/index.json` y **nunca** lo crea, modifica ni borra. Si el archivo falta, `buildDependencies` falla con un error que apunta a `pnpm build:index`. Para regenerar (sólo el dev, nunca el usuario final): `pnpm build:index` (corre `scripts/build-index.ts` → `SkillIndexer.run()`). `<catalog>` es el `EZSKILLS_SKILLS_DIR` si está set, o el catálogo bundled junto a `dist/`.

### Origen del catálogo

Las skills del catálogo bundled provienen de
[midudev/autoskills](https://github.com/midudev/autoskills/tree/main).
Gracias a midudev y a quienes contribuyen a ese proyecto por curarlas y
mantenerlas. `ezskills` es una capa delgada de instalación sobre esos
`SKILL.md`.

## Variables de entorno

`EZSKILLS_SKILLS_DIR` (cascada: env si está set → `catalog/` empaquetado dentro del paquete, calculado vía `getBundledSkillsDir()` desde `import.meta.url`), `EZSKILLS_OPENCODE_GLOBAL` (`~/.config/opencode/skills`), `EZSKILLS_OPENCODE_LOCAL` (`<cwd>/.opencode/skills`), `EZSKILLS_OPENCLAW_GLOBAL` (`~/.openclaw/skills`), `EZSKILLS_OPENCLAW_LOCAL` (`<cwd>/skills`). El `index.json` se commitea en `catalog/` y se distribuye con el paquete; el runtime sólo lo lee.

## Contratos clave

- **`SearchService.search(skills, query)`** — case-insensitive, coincidencia parcial (substring), AND lógico entre tokens. Query vacía devuelve copia de la lista. Sin match → `[]`.
- **`InstallerService.installMany(skills, scope, providerId)`** — **no hace rollback** ante fallos parciales: las skills ya instaladas antes del error permanecen. Devuelve `{ installed: string[]; skipped: string[]; failed: Array<{ name; error }> }`. `skipped` son las que ya estaban instaladas según `InstalledSkillsRepository`. Se invoca una vez por `providerId`.
- **`InstallerService.uninstallMany(skills)`** — mismo principio: errores por skill no abortan el lote, se acumulan en `failed`. Routea per-skill según `InstalledSkill.providerId`.
- **`InstallController`** — recibe `providerIds: ReadonlySet<string>` (uno o varios). `loadInstalledNames` une los nombres de todos los providers del set. `confirm` itera `installer.installMany` por cada id y agrega `installed`/`skipped`/`failed`. Set vacío → `onError('No provider selected')`.
- **`SkillProvider.isInstalled`** — boolean síncrono. Cada provider concreto decide su marker (default: `dirname(paths.global)`). En `dependencies.ts` se filtra con `listInstalledProviders()`; el picker se nutre de esa lista, no de `listProviders()`.
- **`UninstallController`** — recibe `providerIds?: ReadonlySet<string>`. Si está presente, `loadInstalled` filtra `s.providerId ∈ providerIds`; si no, agrega todos los providers.
- **`InstalledSkillsRepository`** — agrega resultados de todos los providers. Si dos providers reportan la misma `name`, gana el primero y se omite el duplicado.
- **`SkillRepository`** — cachea en memoria el `index.json`; `invalidate()` fuerza relectura. Devuelve copias defensivas de los `IndexedSkill`.

## Añadir un provider (ej. Cursor)

1. Crear `src/services/providers/cursor-provider.ts` extendiendo `BaseFsProvider` con `readonly id = 'cursor'` y `readonly label = 'Cursor'`. El `installMarker` se pasa al `super` (3er arg del constructor de `BaseFsProvider`); usar el directorio de configuración del tool, p. ej. `join(homedir(), '.config', 'cursor')` o `dirname(paths.global)`.
2. Añadir rutas en `src/config/paths.ts` y variables `EZSKILLS_CURSOR_*`.
3. Registrar en el `Map` de `buildDependencies()` y, si aplica, en `InstalledSkillsRepository`.
4. Añadir tests en `src/services/providers/__tests__/` siguiendo el patrón de `opencode-provider.test.ts` / `openclaw-provider.test.ts` (memfs), incluyendo un test de `isInstalled` con y sin marker.
