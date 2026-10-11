# Generar lecciones de Traze con Claude

Las lecciones las escribe Claude y el repositorio las valida. No hace falta clave de API: sirve una sesión de Claude Code o un chat de una cuenta gratuita.

Antes de empezar, ejecuta `pnpm install` una vez.

## Modo A: Claude Code (con la skill)

1. Instala la skill `dibujo-tecnico` a partir de `generacion/skill/dibujo-tecnico/SKILL.md` (por ejemplo, en `.claude/skills/dibujo-tecnico/SKILL.md` dentro de este repositorio).
2. En una sesión de Claude Code abierta en el repositorio, pide la lección: «Genera la lección "Mediatriz de un segmento" del bloque 1».
3. Claude guarda el borrador en `generacion/borradores/<id>.json`, ejecuta `pnpm comprobar` y corrige hasta que el informe diga CORRECTO.
4. Tú ejecutas `pnpm promover generacion/borradores/<id>.json`.

## Modo B: chat de una cuenta gratuita

1. Abre un chat nuevo y pega el contenido de `generacion/prompt-leccion.md`. Claude responde «Listo».
2. Pide una sola lección por chat: «Bisectriz de un ángulo, bloque 1».
3. Copia la respuesta entera (vale con la prosa y el bloque de código) y guárdala en `generacion/borradores/<id>.json`. También puedes enviarla por la entrada estándar: `pnpm comprobar -`.
4. Ejecuta `pnpm comprobar generacion/borradores/<id>.json`.
   - Si dice CORRECTO, sigue en «Promover».
   - Si dice CORREGIR, copia el informe entero, pégalo en el mismo chat y guarda la nueva respuesta. Repite.
5. Si Claude responde `VOCABULARIO_INSUFICIENTE`, el trazado necesita algo que Traze todavía no sabe dibujar: mira «Ampliar el vocabulario».

## Promover, revisar y consultar el estado

- `pnpm comprobar <archivo>`: valida un borrador (esquema, construcción, comprobaciones numéricas y render) y escribe el informe.
- `pnpm promover <archivo>`: si no hay errores, lo copia a `contenido/bloque-N-nombre/` con `meta.version` 1 y la revisión pendiente, y borra el borrador.
- `pnpm promover <archivo> --reemplazar`: regenera una lección que ya existe. Sube la versión y vuelve a dejar la revisión pendiente.
- `pnpm revisar <id> --por <nombre>`: anota que una persona ha revisado la lección a mano (con la fecha de hoy).
- `pnpm estado`: lista las lecciones. Las marcadas con ⚑ son del bloque 5 (tangencias) o del 7 (diédrico) y están pendientes de revisión: se revisan primero.
- `pnpm validar`: valida todo `contenido/`.

Una lección solo está lista para publicar cuando aparece como revisada en `pnpm estado`.

## Ampliar el vocabulario

Cuando una lección necesita algo nuevo (por ejemplo, la bisectriz o una tangente):

1. Añade la variante al esquema en `packages/lecciones/src/esquema.ts` (primitiva, derivado o comprobación).
2. Enséñale al intérprete a resolverla en `packages/lecciones/src/interpretar.ts` y al lienzo a dibujarla (`apps/web`), con tests.
3. Añade su entrada, con descripción y ejemplo, en `packages/lecciones/src/vocabulario.ts`. Hasta que lo hagas, `pnpm test` falla: es la señal de que prompt y esquema se han desincronizado.
4. Ejecuta `pnpm prompt` para regenerar el prompt maestro y la skill, y vuelve a instalar la skill.

## Reglas que no se saltan

- Los borradores nunca se escriben a mano en `contenido/`.
- La clave `meta` solo la escriben `promover` y `revisar`.
- Si una comprobación falla, se corrige la construcción; nunca se quita ni se debilita la comprobación.
