# ezskills

## Objetivo

Quiero desarrollar una aplicación de terminal (TUI) para instalar y desinstalar **Skills** de forma sencilla en **OpenCode** y **OpenClaw**.

Las skills disponibles ya existen dentro de la carpeta:

```
skills/
```

La aplicación únicamente administra su instalación y desinstalación.

---

# Tecnologías

- TypeScript
- Node.js
- Arquitectura MVC
- Test-Driven Development (TDD)
- Pruebas unitarias para todos los componentes
- Código modular y desacoplado

El proyecto debe ser fácilmente extensible para soportar nuevos gestores de skills en el futuro.

---

# Funcionalidades

## Instalación de Skills

El usuario debe poder:

- Instalar skills globalmente.
- Instalar skills localmente (por proyecto).
- Seleccionar una o múltiples skills.
- Buscar skills antes de seleccionarlas.
- No mostrar skills que ya estén instaladas.

---

## Desinstalación de Skills

El usuario debe poder:

- Ver las skills instaladas.
- Elegir entre instalaciones globales o locales.
- Seleccionar una o múltiples skills.
- Desinstalarlas fácilmente.

---

## Búsqueda

La búsqueda debe realizarse simultáneamente sobre:

- Nombre
- Descripción
- Tecnologías

Debe funcionar con coincidencias parciales.

Ejemplo:

```
react
```

Debe encontrar:

```
React
Next.js
React Native
Frontend React
```

si cualquiera contiene "react".

---

# Menú principal

```
Detectar e instalar automáticamente
(Utiliza AutoSkills de Midudev)

Instalar Skills
    Globalmente (No recomendado)
        Lista de skills disponibles

    Localmente (Proyecto)
        Lista de skills disponibles

Desinstalar Skills
    Globalmente
        Lista de skills instaladas

    Localmente (Proyecto)
        Lista de skills instaladas
```

---

# Navegación

La TUI debe permitir:

- ↑ ↓ para navegar
- Espacio para seleccionar una skill
- Enter para confirmar
- Esc para regresar
- "/" para iniciar una búsqueda (si la librería utilizada lo permite)

Debe ser posible seleccionar múltiples skills antes de confirmar.

---

# Visualización

Cada skill debe mostrarse como:

```
React Expert
Optimiza proyectos React modernos.
```

Es decir:

```
Nombre
Descripción corta
```

No mostrar rutas ni información técnica al usuario.

---

# Indexado de Skills

La aplicación debe inspeccionar automáticamente cada carpeta dentro de `skills/`.

Debe generar un índice JSON con la siguiente información:

```json
{
  "name": "",
  "description": "",
  "technologies": [],
  "path": ""
}
```

La descripción corta deberá obtenerse leyendo el contenido de la skill (por ejemplo README.md o archivos equivalentes).

Este índice servirá para realizar búsquedas rápidas sin volver a analizar todas las carpetas.

---

# Detección automática

Debe existir una opción llamada:

```
Detectar e instalar automáticamente
```

Esta opción utilizará AutoSkills de Midudev para detectar las tecnologías utilizadas en el proyecto y sugerir las skills correspondientes.

El diseño debe permitir reemplazar fácilmente el motor de detección en el futuro.

---

# Arquitectura

Utilizar MVC.

## Modelo

Responsabilidades:

- Leer el índice JSON.
- Detectar skills instaladas.
- Detectar skills disponibles.
- Instalar.
- Desinstalar.
- Indexar nuevas skills.

No debe contener lógica de interfaz.

---

## Vista

Responsabilidades:

- Dibujar la interfaz.
- Mostrar listas.
- Mostrar errores.
- Mostrar estados de instalación.
- Mostrar confirmaciones.

No debe contener lógica de negocio.

---

## Controlador

Responsabilidades:

- Gestionar navegación.
- Coordinar Modelo y Vista.
- Ejecutar acciones del usuario.
- Gestionar filtros y búsquedas.

---

# Abstracción de Gestores

No acoplar la aplicación directamente a OpenCode u OpenClaw.

Crear una interfaz similar a:

```ts
interface SkillProvider {
  getInstalledSkills(scope): Promise<Skill[]>;
  install(skill, scope): Promise<void>;
  uninstall(skill, scope): Promise<void>;
}
```

Implementaciones:

- OpenCodeProvider
- OpenClawProvider

Esto permitirá añadir nuevos proveedores en el futuro.

---

# Estructura sugerida

```
src/
│
├── controllers/
│
├── models/
│
├── views/
│
├── services/
│   ├── providers/
│   ├── installer/
│   ├── indexer/
│   ├── detector/
│   └── search/
│
├── repositories/
│
├── types/
│
├── utils/
│
├── config/
│
├── tests/
│   ├── controllers/
│   ├── models/
│   ├── views/
│   ├── services/
│   └── repositories/
│
└── index.ts
```

---

# Calidad del código

- Principios SOLID.
- Funciones pequeñas.
- Evitar duplicación.
- Uso correcto de interfaces.
- Inyección de dependencias cuando sea posible.
- Tipado estricto (`strict: true`).

---

# Testing

El proyecto debe desarrollarse siguiendo TDD.

Para cada funcionalidad:

1. Escribir la prueba.
2. Ver la prueba fallar.
3. Implementar el mínimo código necesario.
4. Refactorizar.

Cada componente del MVC debe tener pruebas unitarias.

Objetivo de cobertura:

- ≥90%.

---

# Criterios de aceptación

La aplicación estará terminada cuando sea posible:

- Detectar todas las skills disponibles.
- Generar automáticamente el índice JSON.
- Buscar por nombre, descripción y tecnologías.
- Instalar múltiples skills globalmente.
- Instalar múltiples skills localmente.
- No mostrar skills ya instaladas.
- Mostrar únicamente las skills instaladas al desinstalar.
- Desinstalar múltiples skills.
- Utilizar AutoSkills para sugerencias automáticas.
- Tener una arquitectura desacoplada y fácilmente extensible.
- Contar con pruebas unitarias para toda la lógica de negocio.
