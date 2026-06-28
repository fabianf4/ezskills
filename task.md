# ezskills — Plan de tareas (TDD)

> TUI en TypeScript para instalar/desinstalar Skills en OpenCode y OpenClaw.
> Metodología: **TDD estricto** (test rojo → implementación mínima → verde → refactor).
> Stack: **Ink + React**, **Vitest**, **pnpm**, **TypeScript strict**.

---

## Convenciones del proyecto

- **Tipado estricto**: `"strict": true` en `tsconfig.json`. Nada de `any` salvo adaptadores externos.
- **Inyección de dependencias**: manual (constructor), sin frameworks.
- **Mocks de fs**: `memfs` para repositorios y providers; `ink-testing-library` para vistas.
- **Cobertura objetivo**: ≥ 90 % en `models/`, `services/`, `repositories/`, `controllers/`. Vistas ≥ 70 % (snapshot tests).
- **Naming**: archivos en `kebab-case.ts`, clases en `PascalCase`, funciones en `camelCase`, constantes en `UPPER_SNAKE_CASE`.
- **Sin comentarios** salvo JSDoc en interfaces públicas.

---

## Configuración global (paths)

| Concepto | Valor por defecto | Override |
|---|---|---|
| OpenCode global | `~/.config/opencode/skills/` | `EZSKILLS_OPENCODE_GLOBAL` |
| OpenCode local | `./.opencode/skills/` | `EZSKILLS_OPENCODE_LOCAL` |
| OpenClaw global | `~/.config/openclaw/skills/` | `EZSKILLS_OPENCLAW_GLOBAL` |
| OpenClaw local | `./.openclaw/skills/` | `EZSKILLS_OPENCLAW_LOCAL` |
| Skills source | `./skills/` (relativo a `cwd` o al binario) | `EZSKILLS_SKILLS_DIR` |
| Index file | `./.ezskills/index.json` (en dir de la app) | `EZSKILLS_INDEX_PATH` |

---

## T0 · Setup del proyecto

**Objetivo**: andamiaje mínimo, scripts y configuración base.

**Archivos a crear**:
- `package.json` (name: `ezskills`, type: `module`, bin: `ezskills`)
- `tsconfig.json` (`strict`, `target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `jsx: react-jsx`)
- `vitest.config.ts` (entorno `node`, alias, `coverage` con `v8`, umbrales 90/70)
- `.gitignore` (node_modules, dist, .ezskills, coverage, .DS_Store)
- `.npmrc` (`auto-install-peers=true`, `engine-strict=true`)
- `src/index.ts` (placeholder que falla con "not implemented")
- `src/tests/setup.ts` (vitest setup)
- `src/tests/smoke.test.ts` (sanity check)

**Dependencias**:
- runtime: `ink`, `react`, `yaml`, `memfs`, `chalk`
- dev: `vitest`, `@vitest/coverage-v8`, `@types/node`, `@types/react`, `ink-testing-library`, `react-test-renderer`, `@types/react-test-renderer`, `typescript`, `tsx`

**Tests**:
- `smoke.test.ts`: importa `vitest` y `node:fs`, verifica que el setup corre.

**Criterios de aceptación**:
- `pnpm install` instala sin warnings críticos.
- `pnpm test` ejecuta el smoke test en verde.
- `pnpm test:coverage` reporta 0 % (esperado, no hay código).
- `pnpm typecheck` (`tsc --noEmit`) pasa.

---

## T1 · Tipos e interfaces core

**Objetivo**: definir el vocabulario del dominio sin lógica.

**Archivos a crear**:
- `src/types/skill.ts` — `IndexedSkill`, `InstalledSkill`
- `src/types/scope.ts` — `Scope` enum/union: `'global' | 'local'`
- `src/types/provider.ts` — interface `SkillProvider`
- `src/types/detector.ts` — interface `Detector`, `DetectionResult`
- `src/types/index.ts` — barrel

**Definiciones clave**:
```ts
export type Scope = 'global' | 'local';

export interface IndexedSkill {
  name: string;
  description: string;
  technologies: string[];
  path: string;
}

export interface InstalledSkill {
  name: string;
  scope: Scope;
  providerId: string;
  path: string;
}

export interface SkillProvider {
  readonly id: string;
  getInstalledSkills(scope: Scope): Promise<InstalledSkill[]>;
  install(skill: IndexedSkill, scope: Scope): Promise<void>;
  uninstall(skill: InstalledSkill): Promise<void>;
}

export interface DetectionResult {
  technologies: string[];
  suggestedSkillNames: string[];
}

export interface Detector {
  detect(projectPath: string): Promise<DetectionResult>;
}
```

**Tests**:
- `src/types/__tests__/types.test.ts` — compilación y shape checks con `expectTypeOf` o `expect-type` (vitest).

**Criterios de aceptación**:
- Todos los tipos exportados.
- `pnpm typecheck` pasa.
- Test verde.

---

## T2 · SkillIndexer

**Objetivo**: escanear `skills/` y producir `index.json`.

**Archivos a crear**:
- `src/services/indexer/skill-indexer.ts` — clase `SkillIndexer`
- `src/services/indexer/frontmatter-parser.ts` — parser de frontmatter YAML simple
- `src/services/indexer/skill-indexer.test.ts`
- `src/services/indexer/frontmatter-parser.test.ts`

**Tests primero**:
1. `frontmatter-parser.test.ts`:
   - extrae `name` y `description` de frontmatter válido.
   - devuelve `null` si no hay frontmatter.
   - maneja `description` multilínea.
   - trim de espacios y saltos.
2. `skill-indexer.test.ts`:
   - con fs mockeado (`memfs`) con 2 skills válidas, genera índice con 2 entradas.
   - skill con `metadata.json` añade `technology` al array `technologies`.
   - skill sin `metadata.json` tiene `technologies: []`.
   - omite carpetas que no son directorios.
   - usa `description` del frontmatter como `description` final.
   - escribe el JSON resultante en la ruta indicada.

**Implementación mínima**:
- `SkillIndexer` recibe `{ skillsDir, indexPath, fs }` por DI.
- `run(): Promise<IndexedSkill[]>`:
  1. `readdir(skillsDir)`.
  2. para cada entrada, si es dir, parsea `SKILL.md`.
  3. opcionalmente lee `metadata.json` y mergea `technology` → `technologies[]`.
  4. acumula `IndexedSkill[]` con `path = join(skillsDir, name)`.
  5. `writeFile(indexPath, JSON.stringify(...))`.
  6. retorna el array.

**Criterios de aceptación**:
- Todos los tests verdes.
- `memfs` mockeado permite correr tests sin tocar disco.
- Función pura testeable sin I/O real.

---

## T3 · SkillRepository

**Objetivo**: leer `index.json` y exponer queries.

**Archivos a crear**:
- `src/repositories/skill-repository.ts`
- `src/repositories/skill-repository.test.ts`

**Tests primero**:
- lee el JSON, parsea y cachea en memoria.
- segunda llamada no relee el archivo (caché hit).
- `getAll()` devuelve copia (inmutable).
- `getByName(name)` exacto.
- `getByTechnology(tech)` filtra por pertenencia en `technologies`.
- `invalidate()` fuerza relectura.
- lanza error descriptivo si el archivo no existe o es inválido.

**Implementación**:
```ts
class SkillRepository {
  constructor(private readonly indexPath: string, private readonly fs: typeof import('node:fs')) {}
  private cache: IndexedSkill[] | null = null;
  async load(): Promise<IndexedSkill[]>;
  async getAll(): Promise<IndexedSkill[]>;
  async getByName(name: string): Promise<IndexedSkill | null>;
  async getByTechnology(tech: string): Promise<IndexedSkill[]>;
  invalidate(): void;
}
```

**Criterios de aceptación**: tests verdes, `tsc` pasa, sin acoplamiento a `SkillIndexer`.

---

## T4 · SearchService

**Objetivo**: búsqueda parcial case-insensitive multi-campo.

**Archivos a crear**:
- `src/services/search/search-service.ts`
- `src/services/search/search-service.test.ts`

**Tests primero**:
- input `"react"` matchea skill con name `React`.
- matchea skill con tech `react`.
- matchea skill con description que contiene `"React"`.
- `"next"` matchea `Next.js` (parcial).
- input vacío devuelve todas.
- case insensitive (`"REACT"` matchea `react`).
- sin matches devuelve `[]`.
- múltiples términos: AND lógico.
- no matchea campos ausentes.

**Implementación**:
```ts
class SearchService {
  search(skills: IndexedSkill[], query: string): IndexedSkill[];
}
```
- normaliza query (`toLowerCase().trim()`).
- parte en tokens por espacio.
- filtra donde: para cada token, **algún** campo (name|description|techs) lo contiene.

**Criterios de aceptación**: 100 % cobertura en `search-service.ts`.

---

## T5 · InstalledSkillsRepository

**Objetivo**: listar skills instaladas normalizadas, multi-provider, multi-scope.

**Archivos a crear**:
- `src/repositories/installed-skills-repository.ts`
- `src/repositories/installed-skills-repository.test.ts`

**Tests primero**:
- dado un `SkillProvider` mock con 2 skills globales, devuelve ambas con `scope: 'global'`.
- mismo provider con scope local devuelve distintas.
- agrega `providerId` a cada item.
- filtra por `scope`.
- filtra por `providerId`.
- deduplica por `name` (si dos providers reportan la misma, gana el primero o se reporta conflicto → test del comportamiento elegido).

**Implementación**:
```ts
class InstalledSkillsRepository {
  constructor(private readonly providers: SkillProvider[]) {}
  async listAll(): Promise<InstalledSkill[]>;
  async listByScope(scope: Scope): Promise<InstalledSkill[]>;
  async listByProvider(providerId: string): Promise<InstalledSkill[]>;
}
```

**Criterios de aceptación**: tests verdes, sin tocar fs directamente.

---

## T6 · OpenCodeProvider

**Objetivo**: implementación concreta de `SkillProvider` para OpenCode.

**Archivos a crear**:
- `src/services/providers/opencode-provider.ts`
- `src/services/providers/opencode-provider.test.ts`

**Tests primero** (usando `memfs` + mock de paths):
- `install` copia recursivamente `skill.path` al destino correcto.
- `install` falla si el destino ya existe (no sobreescribe).
- `uninstall` elimina el directorio de la skill.
- `uninstall` falla si no existe.
- `getInstalledSkills('global')` lee dir global y devuelve nombres.
- `getInstalledSkills('local')` lee dir local.
- `id === 'opencode'`.
- usa paths inyectados (testabilidad).

**Implementación**:
```ts
class OpenCodeProvider implements SkillProvider {
  readonly id = 'opencode';
  constructor(
    private readonly paths: { global: string; local: string },
    private readonly fs: FsAdapter,
  ) {}
  // implementa 3 métodos usando fs.cp, fs.rm, fs.readdir
}
```
- Usar `fs/promises.cp` (Node 22+) con `recursive: true`.
- Validar existencia antes de instalar.

**Criterios de aceptación**: tests verdes, sin acceso a fs real.

---

## T7 · OpenClawProvider

**Objetivo**: paralelo a T6 con paths de OpenClaw.

**Archivos a crear**:
- `src/services/providers/openclaw-provider.ts`
- `src/services/providers/openclaw-provider.test.ts`

**Tests**: idénticos a T6 pero con paths distintos, verificar que el destino es el de OpenClaw.

**Implementación**: extraer clase base abstracta `BaseFsProvider` para compartir lógica con T6 (refactor posterior aceptable, lo importante es TDD: tests → impl).

**Criterios de aceptación**: tests verdes; las dos implementaciones son intercambiables gracias a la interfaz.

---

## T8 · InstallerService

**Objetivo**: orquestar instalación con validaciones y soporte batch.

**Archivos a crear**:
- `src/services/installer/installer-service.ts`
- `src/services/installer/installer-service.ts`
- `src/services/installer/installer-service.test.ts`

**Tests primero**:
- instala una skill en scope dado, llamando al provider correcto.
- instala múltiples skills en orden.
- si una falla, las anteriores quedan instaladas (no rollback automático, pero se reporta el error — comportamiento explícito y testeado).
- rechaza skill ya instalada (`isInstalled` check antes).
- devuelve resumen `{ installed: string[], failed: Array<{ name: string, error: string }> }`.
- valida que el provider existe para el `providerId` solicitado.

**Implementación**:
```ts
class InstallerService {
  constructor(
    private readonly providers: Map<string, SkillProvider>,
    private readonly installedRepo: InstalledSkillsRepository,
  ) {}
  async installMany(
    skills: IndexedSkill[],
    scope: Scope,
    providerId: string,
  ): Promise<InstallResult>;
  async uninstallMany(
    skills: InstalledSkill[],
  ): Promise<UninstallResult>;
}
```

**Criterios de aceptación**: tests verdes, lógica pura testeable con mocks.

---

## T9 · Detector interface + Stub

**Objetivo**: dejar la puerta abierta a AutoSkills sin implementarlo.

**Archivos a crear**:
- `src/services/detector/stub-detector.ts`
- `src/services/detector/stub-detector.test.ts`
- `src/services/detector/detector.factory.ts`

**Tests primero**:
- `StubDetector.detect(cwd)` devuelve `{ technologies: [], suggestedSkillNames: [] }` determinista.
- `DetectorFactory.create('stub')` retorna un `StubDetector`.
- factory con id desconocido lanza error descriptivo.

**Implementación**: trivial, pero deja claro el contrato.

**Criterios de aceptación**: tests verdes. Documentar en `README` cómo añadir `AutoSkillsDetector` después.

---

## T10 · Modelos de estado

**Objetivo**: estados inmutables y transiciones puras.

**Archivos a crear**:
- `src/models/app-state.ts` — estado global de la app
- `src/models/menu-state.ts` — navegación del menú
- `src/models/install-state.ts` — estado de pantalla Install
- `src/models/uninstall-state.ts` — estado de pantalla Uninstall
- `src/models/*.test.ts`

**Tests primero**:
- `MenuState` con `current: 'main'`, transición a `'install'` válida.
- transición inválida lanza error.
- `InstallState` con `query`, `selected: Set<string>`, `confirmed`.
- `select(name)` agrega; `deselect(name)` quita; `clear()` vacía.
- `filter(query, skills)` aplica `SearchService`.
- `UninstallState` análogo.

**Implementación**: clases con métodos puros, sin React, sin Ink.

**Criterios de aceptación**: 100 % cobertura, transiciones exhaustivamente testeadas.

---

## T11 · View: componentes Ink base

**Objetivo**: primitives de UI reutilizables.

**Archivos a crear**:
- `src/views/components/box.tsx`
- `src/views/components/text.tsx`
- `src/views/components/selectable-list.tsx`
- `src/views/components/search-input.tsx`
- `src/views/components/confirm-dialog.tsx`
- `src/views/components/status-message.tsx`
- `src/views/components/*.test.tsx` (usando `ink-testing-library`)

**Tests primero**:
- `SelectableList` muestra items, resalta el activo.
- callback `onSelect(name)` al presionar Enter.
- callback `onToggle(name)` al presionar Space.
- navegación ↑↓ cambia índice activo, clamping en los extremos.
- `SearchInput` captura caracteres, callback `onChange(value)`.
- `ConfirmDialog` devuelve `true`/`false` según tecla.
- `StatusMessage` muestra tipo (`info`, `error`, `success`).

**Implementación**: componentes funcionales con hooks. Sin lógica de negocio, solo UI.

**Criterios de aceptación**: tests verdes, snapshot tests opcionales.

---

## T12 · View: pantalla Install

**Objetivo**: pantalla de instalación con búsqueda y multi-select.

**Archivos a crear**:
- `src/views/screens/install-screen.tsx`
- `src/views/screens/install-screen.test.tsx`

**Tests primero**:
- recibe props: `availableSkills`, `installedNames`, `onConfirm(skills, scope)`, `onBack`.
- NO muestra skills en `installedNames`.
- query filtra la lista visible.
- Enter en la pantalla llama `onConfirm` con las skills seleccionadas.
- tecla `Esc` llama `onBack`.
- `/` enfoca el `SearchInput`.
- muestra "No skills found" si el filtro queda vacío.

**Implementación**: orquesta T10 (state) + T11 (components) + T4 (search).

**Criterios de aceptación**: tests verdes, no llama directamente a `InstallerService` (eso lo hace el controller).

---

## T13 · View: pantalla Uninstall

**Objetivo**: pantalla de desinstalación con multi-select y confirmación.

**Archivos a crear**:
- `src/views/screens/uninstall-screen.tsx`
- `src/views/screens/uninstall-screen.test.tsx`

**Tests primero**:
- recibe props: `installedSkills`, `onConfirm(skills)`, `onBack`.
- muestra solo las instaladas (sin filtro, todas las del scope activo).
- Enter en lista abre `ConfirmDialog`.
- Confirm → `onConfirm(selected)`.
- Cancel → vuelve a la lista.
- Esc → `onBack`.

**Implementación**: análoga a T12, sin búsqueda.

**Criterios de aceptación**: tests verdes.

---

## T14 · View: pantalla MainMenu + Auto-detect

**Objetivo**: menú principal con 4 opciones navegables.

**Archivos a crear**:
- `src/views/screens/main-menu.tsx`
- `src/views/screens/auto-detect-screen.tsx`
- `src/views/screens/main-menu.test.tsx`
- `src/views/screens/auto-detect-screen.test.tsx`

**Tests primero**:
- `MainMenu` muestra 4 opciones:
  1. Detectar e instalar automáticamente
  2. Instalar Skills
  3. Desinstalar Skills
  4. Salir
- Enter en opción N llama `onSelect(N)`.
- ↑↓ navega.
- `AutoDetectScreen` muestra "Detectando..." → resultado → lista sugerida → Enter instala.
- mensaje claro si el detector no encuentra nada.

**Implementación**: componentes puros con props.

**Criterios de aceptación**: tests verdes.

---

## T15 · Controllers

**Objetivo**: coordinar Modelo, Vista y Servicios. Manejar keybindings y navegación.

**Archivos a crear**:
- `src/controllers/main-menu-controller.ts`
- `src/controllers/install-controller.ts`
- `src/controllers/uninstall-controller.ts`
- `src/controllers/auto-detect-controller.ts`
- `src/controllers/keybindings.ts` — constantes (`UP`, `DOWN`, `SPACE`, `ENTER`, `ESC`, `SLASH`)
- `src/controllers/*.test.ts`

**Tests primero**:
- `MainMenuController` con `onSelect('install')` cambia estado a Install.
- `onSelect('uninstall')` cambia a Uninstall.
- `onSelect('auto')` cambia a Auto.
- `onSelect('exit')` llama `onExit`.
- `InstallController` recibe lista de disponibles, filtra instaladas, renderiza `InstallScreen`, al confirmar llama `InstallerService.installMany`, al volver llama `onBack`.
- manejo de errores: muestra `StatusMessage` de tipo `error` si falla la instalación.
- `UninstallController` análogo con `uninstallMany`.
- `AutoDetectController` llama `Detector.detect(cwd)`, cruza con `SkillRepository.getByTechnology`, sugiere, llama `installMany`.

**Implementación**:
```ts
class MainMenuController {
  constructor(private readonly handlers: {
    onInstall: () => void;
    onUninstall: () => void;
    onAuto: () => void;
    onExit: () => void;
  }) {}
  handleSelect(index: number): void;
}
```
Cada controller recibe sus dependencias por constructor y expone un método `run()` o es consumido por un componente React.

**Criterios de aceptación**: tests verdes con mocks de servicios.

---

## T16 · Entry point & DI

**Objetivo**: `index.ts` que arranca la app, conecta todo y maneja signals.

**Archivos a crear/modificar**:
- `src/index.ts` — entrypoint
- `src/config/paths.ts` — resolución de paths con env vars + defaults
- `src/config/dependencies.ts` — factory de DI manual

**Contenido**:
```ts
// src/index.ts
import { render } from 'ink';
import { App } from './app.js';
import { buildDependencies } from './config/dependencies.js';

async function main() {
  const deps = await buildDependencies();
  const app = render(<App deps={deps} />);
  process.on('SIGINT', () => app.unmount());
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- `buildDependencies()`:
  1. crea `SkillIndexer`, corre si `index.json` no existe.
  2. crea `SkillRepository`, `SearchService`.
  3. crea providers (`OpenCodeProvider`, `OpenClawProvider`).
  4. crea `InstalledSkillsRepository`, `InstallerService`.
  5. crea `StubDetector`.
  6. crea controllers.
  7. retorna objeto.

- `App.tsx`: router simple que renderiza `MainMenu` o la pantalla activa según estado.

**Tests**:
- `dependencies.test.ts`: `buildDependencies` retorna todas las deps esperadas (mocks de fs).
- `app.test.tsx`: smoke test que monta `<App>` con deps mockeadas.

**Criterios de aceptación**: `pnpm start` arranca la TUI; `Ctrl+C` sale limpiamente.

---

## T17 · Cobertura y documentación

**Objetivo**: alcanzar ≥90 % de cobertura global y documentar el proyecto.

**Acciones**:
1. Correr `pnpm test:coverage`.
2. Identificar archivos < 90 % y añadir tests faltantes.
3. Escribir `README.md` con:
   - Instalación (`pnpm install`, `pnpm build`).
   - Uso (`pnpm start` o `npx ezskills`).
   - Keybindings (↑↓ Space Enter Esc /).
   - Variables de entorno para paths custom.
   - Cómo añadir un nuevo `SkillProvider` (ejemplo con `CursorProvider`).
   - Cómo reemplazar el `StubDetector` por uno real.
   - Estructura de tests y TDD workflow.
4. Crear `CHANGELOG.md` con v0.1.0.

**Tests adicionales si hace falta**:
- `tests/integration/cli.test.ts` — spawn del binario, verifica output inicial.

**Criterios de aceptación**:
- `pnpm test:coverage` ≥ 90 % statements, branches, functions, lines.
- `README.md` cubre todos los puntos.
- `pnpm build` produce `dist/` sin errores.

---

## Resumen de orden de ejecución

| Fase | Tareas | Acumulado |
|---|---|---|
| Setup | T0 | T0 |
| Fundamentos | T1 → T4 | T0–T4 |
| Proveedores | T5 → T8 | T0–T8 |
| Detección | T9 | T0–T9 |
| Estado y vistas | T10 → T14 | T0–T14 |
| Controllers y wiring | T15 → T16 | T0–T16 |
| Cierre | T17 | T0–T17 |

**Empezaremos por T0 cuando me indiques.**
