# Project Tracking

Project Tracking convierte la documentación Markdown de un proyecto en una
experiencia de lectura navegable e interactiva: capítulos, tablas, estados y
referencias cruzadas. Es un único archivo HTML autocontenido, funciona sin conexión
y nunca escribe en los documentos que lee.

![Panel de Project Tracking](assets/project-tracking.png)

**Descargo de responsabilidad:** Este visor es una herramienta de referencia. Los
resultados generados mediante IA deben ser revisados, validados y probados antes de
su utilización o despliegue en entornos reales. La responsabilidad sobre las
decisiones técnicas, la seguridad, el cumplimiento normativo y la puesta en
producción corresponde a quien desarrolla y despliega el proyecto.

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

## Uso

Abre `dist/index.html` en Chrome o Edge y elige la carpeta del proyecto.

## Compilar

```bash
npm ci
npm run build
```

El resultado es `dist/index.html`.

## Licencia

[ISC](https://opensource.org/licenses/ISC): uso, copia, modificación y distribución
libres, incluido el uso comercial, conservando el aviso de copyright y el texto de
la licencia.

Copyright (c) 2026 [sanju-es](https://github.com/sanju-es)

El visor incluye software de terceros: Svelte, marked y Tailwind CSS bajo MIT;
Lucide bajo ISC; y la fuente Inter bajo SIL OFL 1.1. Los avisos completos están en
[`NOTICE`](NOTICE) y también dentro de `dist/index.html`.

Versión publicada: 0.1.0
