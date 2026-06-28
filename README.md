# ezskills

TUI en TypeScript para instalar y desinstalar **Skills** de forma sencilla en **OpenCode** y **OpenClaw**.

## Instalación

```bash
pnpm install
pnpm build
```

Para desarrollo:

```bash
pnpm dev
```

## Uso

```bash
pnpm start
# o, después de build:
node dist/index.js
```

### Keybindings

| Tecla | Acción |
|---|---|
| `↑` / `↓` o `j` / `k` | Navegar |
| `g` / `G` | Inicio / final de lista |
| `Space` | Seleccionar / deseleccionar |
| `Enter` | Confirmar |
| `Esc` | Volver / cancelar |
| `q` | Salir (en menú principal) |
| `s` | Enfocar búsqueda (en install) |
| `Tab` | Cambiar scope global / local |

## Estructura del menú

```
Detectar e instalar automáticamente   (AutoSkills - stub por ahora)
Instalar Skills
  → Globalmente
  → Localmente
Desinstalar Skills
  → Globalmente
  → Localmente
Salir
```

## Variables de entorno

| Variable | Default | Descripción |
|---|---|---|
| `EZSKILLS_SKILLS_DIR` | `<cwd>/catalog` | Source directory of skills |
| `EZSKILLS_INDEX_PATH` | `<cwd>/.ezskills/index.json` | Generated index |
| `EZSKILLS_OPENCODE_GLOBAL` | `~/.config/opencode/skills` | OpenCode global |
| `EZSKILLS_OPENCODE_LOCAL` | `<cwd>/.opencode/skills` | OpenCode local |
| `EZSKILLS_OPENCLAW_GLOBAL` | `~/.openclaw/skills` | OpenClaw global |
| `EZSKILLS_OPENCLAW_LOCAL` | `<cwd>/skills` | OpenClaw local |

## Formato de una skill

Cada carpeta dentro de `skills/` debe contener un `SKILL.md` con frontmatter YAML:

```yaml
---
name: react
description: React UI library best practices
---
# React skill content...
```

Opcionalmente un `metadata.json`:

```json
{
  "technology": "React",
  "category": "Frontend"
}
```

Al arrancar, ezskills escanea `skills/` y genera `index.json`. Las búsquedas usan `name`, `description` y `technologies` (de `metadata.json`).

## Comandos

```bash
pnpm test          # Ejecuta la suite completa
pnpm test:watch    # Modo watch
pnpm test:coverage # Reporte de cobertura
pnpm typecheck     # tsc --noEmit
pnpm build         # Compila a dist/
pnpm dev           # Ejecuta con tsx
```

## Arquitectura

```
src/
├── controllers/   # Coordinan Modelo ↔ Vista, manejan keybindings
├── models/        # Estado inmutable y transiciones puras
├── views/         # Componentes Ink (sin lógica de negocio)
│   ├── components/  # Box, SelectableList, SearchInput, ConfirmDialog, StatusMessage
│   └── screens/     # MainMenu, InstallScreen, UninstallScreen, AutoDetectResult
├── services/
│   ├── providers/   # OpenCodeProvider, OpenClawProvider (SkillProvider)
│   ├── installer/   # InstallerService (orquesta install/uninstall)
│   ├── indexer/     # SkillIndexer (genera index.json)
│   ├── detector/    # StubDetector + DetectorFactory
│   └── search/      # SearchService (búsqueda pura)
├── repositories/  # SkillRepository, InstalledSkillsRepository
├── types/         # Tipos e interfaces (Scope, SkillProvider, IndexedSkill...)
├── config/        # paths, dependencies (DI manual)
└── app.tsx        # Componente raíz de la TUI
```

### Principios aplicados

- **MVC** con separación estricta: la vista no contiene lógica de negocio.
- **SOLID**: cada clase tiene una responsabilidad, dependencias inyectadas.
- **Inyección de dependencias manual** (constructores), sin frameworks.
- **TDD**: cada componente tiene tests escritos antes de la implementación.
- **FsAdapter**: abstracción mínima de `node:fs/promises` para testabilidad con `memfs`.

## Extensibilidad

### Añadir un nuevo provider (ej. Cursor)

1. Crea `src/services/providers/cursor-provider.ts`:

```ts
import { BaseFsProvider, type ProviderPaths } from './base-fs-provider.js';
import type { FsAdapter } from '../../types/index.js';

export class CursorProvider extends BaseFsProvider {
  readonly id = 'cursor';
  constructor(paths: ProviderPaths, fs: FsAdapter) {
    super(paths, fs);
  }
}
```

2. Añádelo al `Map` de providers en `src/config/dependencies.ts`:

```ts
const cursor = new CursorProvider(paths.cursor, fsPromisesAdapter());
const providers = new Map([
  [opencode.id, opencode],
  [openclaw.id, openclaw],
  [cursor.id, cursor],
]);
const installedRepo = new InstalledSkillsRepository([opencode, openclaw, cursor]);
```

3. Añade las rutas en `src/config/paths.ts` y las variables de entorno.

### Reemplazar el StubDetector por AutoSkills

1. Crea `src/services/detector/autoskills-detector.ts` implementando `Detector`:

```ts
import type { Detector, DetectionResult } from '../../types/index.js';

export class AutoSkillsDetector implements Detector {
  async detect(projectPath: string): Promise<DetectionResult> {
    // ... usa AutoSkills de midudev
  }
}
```

2. Añade el case en `DetectorFactory.create()`:

```ts
case 'autoskills':
  return new AutoSkillsDetector();
```

3. Selecciónalo en `buildDependencies()` cambiando la instanciación de `detector`.

## Cobertura de tests

```bash
pnpm test:coverage
```

| Métrica | Umbral | Actual |
|---|---|---|
| Statements | ≥ 90% | 99.45% |
| Branches | ≥ 90% | 99.59% |
| Functions | ≥ 90% | 97.27% |
| Lines | ≥ 90% | 99.45% |

**Nota**: las vistas (`src/views/**`) y el entry point (`src/index.ts`, `src/app.tsx`) se excluyen del threshold porque la cobertura de componentes Ink con `useInput` no es fiable en `ink-testing-library` 4 + Ink 5. La lógica de negocio (modelos, servicios, repositorios, controllers) está al 100% de cobertura.

## Estado del proyecto

- ✅ Detección de skills disponibles
- ✅ Generación automática de `index.json`
- ✅ Búsqueda por nombre, descripción y tecnologías
- ✅ Instalación global y local
- ✅ Desinstalación global y local
- ✅ Multi-selección antes de confirmar
- ✅ Filtro de skills ya instaladas
- ✅ Arquitectura MVC + DI
- ✅ Pruebas unitarias (TDD)
- ⏳ AutoSkills de midudev (stub; sustituir cuando se integre)

## Licencia

MIT
