# Project Tracking

> Un lector portátil de la documentación Markdown de un proyecto: sin instalación y sin conexión.

![Panel de Project Tracking](docs/assets/project-tracking.png)

Project Tracking convierte la documentación Markdown de un proyecto en una
experiencia de lectura navegable e interactiva: capítulos, tablas, estados y
referencias cruzadas. Es un único archivo HTML autocontenido, funciona sin conexión
y nunca escribe en los documentos que lee.

## Qué puedes hacer

- **Leer** capítulos y secciones con una barra lateral fija y encabezados anclados.
- **Trabajar con tablas**: reconocer estados, filtrar, ordenar y abrir una fila
  completa en un modal.
- **Seguir referencias** entre documentos y desde cualquier identificador conocido
  hasta el elemento que lo define.
- **Ver el proyecto de un vistazo** con el panel de módulos, el tablero de backlog,
  el catálogo de requisitos y una cronología filtrable de cambios.
- **Buscar en todo** con `Ctrl+K` o la lupa del banner, con extractos y saltos a la
  sección de origen.
- **Leer sin conexión**; los iconos y la tipografía son opcionales y recurren a
  glifos y a la fuente del sistema.

## Empezar

Abre `dist/index.html` en Chrome o Edge y elige la carpeta del proyecto. No hace
falta servidor, instalación ni compilación para leer un proyecto.

## Documentación

- [PROJECT_STATE.md](PROJECT_STATE.md) — índice del proyecto, módulos y próximos pasos.
- [docs/WORKFLOW.md](docs/WORKFLOW.md) — ciclo de módulos, estados y definición de terminado.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — organización del código y operaciones.
- [docs/DECISIONS.md](docs/DECISIONS.md) — decisiones aprobadas y preguntas abiertas.
- [AGENTS.md](AGENTS.md) — reglas de incorporación para agentes de IA.

La arquitectura, las operaciones y los comandos están en
[`docs/ARCHITECTURE.md` §9](docs/ARCHITECTURE.md#9-environments-and-operations) y
[`PROJECT_STATE.md` §2](PROJECT_STATE.md#2-stack-and-environment).

> El lector solo está en inglés, solo tiene tema claro y es de solo lectura.
> La documentación técnica del proyecto se mantiene en inglés.
