# Spec: Traze, web para aprender Dibujo Técnico (1º Bachillerato)

Oct 11, 2026 · @s7lver

## Resumen y visión

Traze es una web gratuita que enseña todo el Dibujo Técnico de 1º de Bachillerato construyendo cada trazado a la vista del alumno: un trazo, un instrumento y una razón por paso, sobre un papel que parece un cuaderno dibujado a lápiz.

La promesa al alumno cabe en una frase: «entiendo por qué funciona, lo dibujo yo con regla y compás, y la web me dice si me ha quedado perfecto».

- Lecciones animadas que se dibujan poco a poco, con control total del ritmo.
- Un lienzo de práctica donde el alumno traza con el ratón, el dedo o el lápiz digital y recibe corrección.
- Consejos de oficio en cada paso: cómo afilar, cómo pinchar el compás, qué grosor de línea usar.
- Todo el temario de 1º en una ruta ordenada, sin cuentas ni registro: es un recurso, no una academia.

El producto es una web (sin instalación) pensada primero para ordenador y tablet, y usable en móvil.

## Público y objetivos de aprendizaje

El usuario principal es el alumno de 1º de Bachillerato (16-17 años) que cursa Dibujo Técnico I y quiere entender los trazados en lugar de memorizarlos.

| Usuario | Qué necesita | Cómo lo resuelve la web |
| --- | --- | --- |
| Alumno que empieza | Ver cómo se traza antes de intentarlo | Lección animada paso a paso |
| Alumno que se atasca | Saber en qué paso falla | Práctica con corrección por pasos |
| Alumno que prepara un examen | Repasar rápido y cronometrarse | Modo repaso y modo examen |
| Profesor | Enseñar un trazado en clase | Enlace directo y pantalla completa en cada lección |

Objetivos de aprendizaje medibles:

1. Reproducir cada trazado del temario con regla, escuadra, cartabón y compás.
2. Justificar cada paso con la propiedad geométrica que lo sostiene.
3. Dibujar con limpieza: trazo fino de construcción, trazo grueso de resultado, puntos etiquetados.
4. Aplicar el trazado a un problema nuevo, no solo al ejemplo de la lección.

## Principios de producto

Cinco reglas deciden cualquier duda de diseño o de contenido.

1. Ver para entender: ninguna explicación larga sin un trazo que la acompañe.
2. Una razón por paso: cada trazo dice qué instrumento usa y qué propiedad lo justifica.
3. Exactitud geométrica: todo se calcula con geometría real, nunca a ojo. Un trazado incorrecto es peor que ninguno.
4. Hacer, no solo mirar: cada lección acaba con el alumno dibujando.
5. Calma de cuaderno: sin gamificación ruidosa. El progreso se muestra como un cuaderno que se va llenando.

## Estética lápiz

La web debe sentirse como una hoja de dibujo técnico real: papel crema, grafito y tinta azul de corrección, con detalles táctiles pero sin recargar.

| Elemento | Decisión |
| --- | --- |
| Fondo | Papel crema cálido con grano sutil y cuadrícula milimetrada muy tenue en el lienzo |
| Marco de lámina | Cajetín arriba a la derecha con título, tema, escala y número de lámina, como en un examen |
| Trazo de datos | Grafito 2H: gris oscuro, 2 px, ligeramente irregular al inicio y al final |
| Trazo de construcción | Grafito suave y fino (1 px) o azul pálido, para distinguirlo del resultado |
| Trazo de resultado | Grafito 2B: negro intenso, 3 px, con ligera variación de grosor |
| Puntos y etiquetas | Letras de caja alta tipo rotulación normalizada (A, B, T1) |
| Tipografía de interfaz | Una sans neutra para botones y texto; una fuente de rotulación técnica solo dentro del dibujo |
| Notas del profe | Anotaciones a mano alzada en margen, con subrayado de lápiz de color |
| Corrección | Marcas en rojo como un profesor: tic, cruz, círculo y comentario breve |
| Animación | Los trazos se dibujan con una punta que avanza; el compás gira de verdad |
| Sonido (opcional) | Raspado suave de lápiz y clic de compás, desactivado por defecto |
| Modo oscuro | Pizarra de grafito con tiza blanca para trabajar de noche |

Se consigue con SVG y filtros de ruido (`feTurbulence`) aplicados al trazo, no con imágenes pesadas. El aspecto «lápiz» nunca puede restar precisión: la geometría es exacta aunque el trazo parezca a mano.

## Temario y rutas

El temario se organiza en nueve bloques y unas 60 lecciones, con la geometría plana primero porque el resto la usa. Cada lección es un trazado concreto.

El temario sigue el currículo de Dibujo Técnico I de Castilla y León, pendiente de confirmar con el decreto vigente. Cada lección se etiqueta con su bloque oficial para poder reordenarla o regenerarla cuando se confirme.

| Bloque | Contenidos principales | Lecciones (aprox.) |
| --- | --- | --- |
| 0. Primeros pasos | Material, tipos de línea, uso de escuadra, cartabón y compás, rotulación, láminas | 5 |
| 1. Trazados fundamentales | Mediatriz, bisectriz, paralelas y perpendiculares, ángulos, división de segmentos (Thales), arco capaz, lugares geométricos | 8 |
| 2. Polígonos | Triángulos y puntos notables, cuadriláteros, polígonos regulares (método general y particulares), estrellados | 8 |
| 3. Proporcionalidad y escalas | Tercera, cuarta y media proporcional, sección áurea, escalas gráficas, escala volante | 5 |
| 4. Transformaciones | Traslación, giro, simetría, homotecia, semejanza, equivalencia, introducción a la inversión | 6 |
| 5. Tangencias y enlaces | Propiedades, rectas tangentes, circunferencias tangentes (Apolonio básico), enlaces, potencia, eje y centro radical | 9 |
| 6. Curvas técnicas y cónicas | Óvalo, ovoide, espirales, hélice, elipse, parábola, hipérbola | 6 |
| 7. Sistema diédrico | Punto, recta y plano, pertenencia, intersecciones, paralelismo, perpendicularidad, abatimientos | 10 |
| 8. Axonometría y caballera | Isométrica, dimétrica, caballera, circunferencia en axonometría, sólidos | 6 |
| 9. Normalización | Vistas, cortes y secciones, acotación UNE, croquis | 6 |

La ruta por defecto sigue ese orden. Una ruta de examen reordena por frecuencia en pruebas, y cada lección declara sus requisitos previos para sugerir un repaso si el alumno se atasca.

Cada bloque cierra con una lámina de síntesis: un problema que combina varios trazados.

## Anatomía de una lección

Toda lección sigue la misma plantilla, para que el alumno sepa siempre dónde está y qué toca.

1. Enunciado: datos y qué se pide, con el dibujo inicial.
2. Idea clave: la propiedad geométrica en una línea («la mediatriz es el lugar geométrico de los puntos que equidistan de A y B»).
3. Demostración animada: 6-10 pasos. Cada uno muestra el trazo, el instrumento y el porqué.
4. Pruébalo tú: el mismo trazado en el lienzo, con ayudas que se pueden ir quitando.
5. Datos modificables: puntos arrastrables y deslizadores para comprobar que funciona con cualquier dato.
6. Errores frecuentes: dos o tres, con ejemplo visual del fallo.
7. Reto final: variante del problema o 2-3 preguntas de autoevaluación.

Controles fijos en todas las lecciones: anterior y siguiente, reproducir y pausar, velocidad (0,5×, 1×, 2×), reiniciar, ocultar líneas de construcción y ver solución completa.

Una lección dura entre 8 y 15 minutos. Si pasa de 10 pasos se divide en dos.

## Lienzo y motor de dibujo

El motor tiene dos modos sobre la misma base geométrica: reproducir una construcción animada y dejar que el alumno la dibuje con herramientas virtuales.

### Motor de geometría

- Módulo puro (TypeScript, sin interfaz) con puntos, rectas, circunferencias e intersecciones calculadas en coordenadas reales: circunferencia con circunferencia, circunferencia con recta, perpendiculares, paralelas, giros y homotecias.
- Cada lección es una lista declarativa de pasos; el motor calcula las posiciones, así que cambiar un dato recalcula toda la construcción.
- Tests automáticos por lección: el resultado debe cumplir la propiedad (tangente perpendicular al radio, distancias iguales, etc.) con tolerancia numérica.

### Animación de pasos

| Primitiva | Animación |
| --- | --- |
| Línea o recta | Se traza de un extremo a otro con una punta de lápiz que avanza |
| Arco de compás | Se barre de un ángulo a otro y se muestra el radio girando desde el pivote |
| Circunferencia | Arco de 0 a 360° |
| Punto | Aparece con un pequeño pulso y su etiqueta |
| Marcas (ángulo recto, igualdad) | Aparecen al final del trazo |
| Cota | Líneas de referencia, línea de cota, flechas y valor |

Estado de reproducción: paso actual y progreso (0-1). Anterior, siguiente, saltar y reiniciar son funciones puras de ese estado, lo que evita errores al cambiar velocidad o datos.

### Lienzo de práctica

- Herramientas virtuales: regla, escuadra, cartabón y compás con apertura ajustable y pinchazo en un punto.
- Imán a puntos de interés (extremos, intersecciones, centros) con un radio de captura de 12 px, desactivable.
- Deshacer y rehacer ilimitados, borrado de un trazo y limpieza total.
- Capas: datos, construcción y resultado, con el grosor de cada una ya predefinido.
- Entrada con ratón, táctil y lápiz digital (Pointer Events, con presión si el dispositivo la da).
- Comprobación: el motor compara el trazado del alumno con la solución exacta y devuelve la tolerancia, paso a paso.

## Consejos para hacerlo perfecto

Los consejos son parte de la lección, no un anexo: aparecen en el momento exacto en que sirven, como una nota a lápiz en el margen del cuaderno.

| Tipo | Cuándo aparece | Ejemplo |
| --- | --- | --- |
| Material | Bloque 0 y al empezar cada lámina | Lápiz 2H para construcción, HB para resultado; mina afilada en bisel |
| Técnica de instrumento | En el paso que usa el instrumento | Pinchar el compás con firmeza y girar con una sola mano desde la cabeza |
| Precisión | En pasos con riesgo de error | Cortes de arcos a ángulo abierto: evita arcos casi tangentes porque el punto sale impreciso |
| Limpieza | Al cerrar el trazado | Resultado en trazo grueso, construcción fina; no borrar las líneas auxiliares en examen |
| Atajo mental | Idea clave | «Dos arcos con el mismo radio desde cada extremo: equidistan, luego son mediatriz» |
| Error típico | Tras el último paso | Radio menor que la mitad del segmento: los arcos no se cortan |

Formas de ofrecerlos:

- Nota a mano alzada en el margen del paso, con un icono de lápiz que se puede desplegar.
- Modo «ojo de profe»: superpone sobre el dibujo del alumno una guía de qué mirar (tangencia, perpendicularidad, grosor).
- Lista de comprobación final por lámina: etiquetas, grosores, puntos de tangencia marcados, cajetín completo.
- Biblioteca de consejos consultable por tema, con buscador.

Tono: breve, de profesor cercano, accionable. Cada consejo cabe en dos líneas y se puede reproducir en el cuaderno.

## Práctica, corrección y progreso

La práctica es lo que convierte ver en saber hacer: cada lección tiene un ejercicio guiado y, al dominarla, un ejercicio libre.

### Niveles de práctica

1. Calca: sigue la construcción sobre la guía, con cada paso resaltado.
2. Con pistas: solo se muestra el paso actual y el alumno decide el trazo.
3. Libre: enunciado nuevo, sin ayudas; se corrige al final.
4. Examen: tiempo limitado, datos aleatorios y calificación sobre 10.

### Corrección

- Se evalúa cada paso con tolerancia (por ejemplo, ±1,5 mm de la solución exacta) y con criterios de limpieza: grosores, etiquetas y marcas de tangencia.
- Marcas de profesor en rojo sobre el dibujo y un comentario breve («el arco no corta: abre más el compás»).
- Nota desglosada: exactitud, método, limpieza y presentación.

### Progreso

- Cuaderno personal en el navegador: cada lección completada deja su lámina firmada y fechada.
- Mapa del temario con tres estados por lección: vista, practicada y dominada.
- Repaso espaciado: la web vuelve a proponer trazados que el alumno falló o no ha repasado en 2-3 semanas.
- Exportación de láminas a PDF e imagen para entregar o imprimir.

Sin racha diaria ni puntos. El incentivo es el cuaderno lleno.

## Funcionalidades por fases

El producto sale en tres fases: el MVP enseña, la V1 deja practicar con corrección y la V2 completa el temario y abre el uso en clase.

&#91;embedded content: hoja de ruta · 3 fases, 2 puertas\]

Cada fase termina en una puerta: no se avanza hasta que los trazados y la corrección son fiables.

## Arquitectura técnica y stack

La arquitectura se apoya en un único motor de geometría que usan por igual el reproductor y el lienzo, y en lecciones que son datos y no código.

&#91;embedded content: arquitectura · 3 capas\]

| Capa | Elección recomendada | Motivo |
| --- | --- | --- |
| Aplicación web | Next.js con React y TypeScript | Páginas estáticas por lección: SEO y carga rápida |
| Dibujo | SVG con animación por `requestAnimationFrame` | Nítido en cualquier pantalla y fácil de dar aspecto de lápiz |
| Motor de geometría | Paquete TypeScript sin dependencias de interfaz | Se prueba con tests y se reutiliza en lienzo y reproductor |
| Contenido | JSON o MDX en el repositorio | Versionado y revisable, sin base de datos |
| Progreso | `localStorage` con exportación e importación a archivo | Sin cuentas ni servidor de usuarios: gratis de mantener |
| Pruebas | Vitest para el motor, Playwright para el lienzo | Una construcción errónea no llega a producción |
| Despliegue | Hosting con CDN y PWA | Rapidez y uso sin conexión |

## Formato de contenido y modelo de datos

Las lecciones son datos, no código: un archivo declarativo por lección que el motor interpreta. Así añadir un trazado no exige tocar la aplicación.

```json
{
  "id": "mediatriz-segmento",
  "bloque": 1,
  "titulo": "Mediatriz de un segmento",
  "requisitos": ["compas-basico"],
  "datos": { "A": [210, 235], "B": [440, 185], "k": 0.75 },
  "pasos": [
    {
      "titulo": "Arcos con centro en A",
      "texto": "Pincha en A y ábrelo más de la mitad de AB.",
      "porque": "Todos los puntos de un arco equidistan de su centro.",
      "consejo": "Gira el compás desde la cabeza con una sola mano.",
      "dibujo": [{ "tipo": "arco", "centro": "A", "radio": "k*AB", "hacia": "M", "estilo": "construccion" }]
    }
  ],
  "comprobaciones": ["dist(P,A)==dist(P,B)"]
}
```

Entidades principales:

| Entidad | Campos clave |
| --- | --- |
| Lección | id, bloque, título, requisitos, pasos, comprobaciones, errores frecuentes |
| Paso | título, texto, porqué, consejo, lista de primitivas |
| Intento | lección, nivel, trazos, nota, fecha |
| Progreso | lección, estado (vista, practicada, dominada), próximo repaso |
| Lámina | lección, imagen SVG, cajetín, fecha |

El contenido vive en el repositorio (versionado y revisable) y el progreso del alumno vive solo en su navegador (`localStorage`), sin cuentas ni servidor de usuarios. Para cambiar de dispositivo, el alumno exporta e importa su cuaderno como archivo.

### Generación del contenido con IA

Las lecciones se generan con IA y solo se publican si pasan los controles:

1. La skill `dibujo-tecnico` produce el borrador de la lección en el formato anterior: pasos, porqué, consejo y errores frecuentes.
2. Tests numéricos automáticos comprueban cada propiedad geométrica de la construcción con tolerancia.
3. Un renderizado automático verifica que no hay etiquetas solapadas ni trazos fuera del lienzo.
4. Una revisión humana de muestra, con prioridad en tangencias y diédrico, antes de publicar.
5. Cada lección guarda su versión para poder regenerarla si cambia el currículo.

## Accesibilidad, rendimiento, móvil y SEO

La web debe cargar rápido, funcionar sin ratón y poder estudiarse desde el móvil.

- Accesibilidad: contraste mínimo AA, navegación completa con teclado en los controles de la lección, texto alternativo del dibujo («segmento AB con dos arcos que se cortan en M y N») y respeto de `prefers-reduced-motion` (los pasos saltan sin animar).
- Rendimiento: lecciones en SVG ligero, sin librerías pesadas, y carga diferida por bloque. Objetivo: primera lección interactiva en menos de 2,5 s en una conexión 4G.
- Móvil y tablet: lienzo con gestos de zoom y desplazamiento, botones de al menos 44 px, y el modo de práctica pensado para lápiz digital en tablet.
- Offline: PWA con las lecciones ya vistas disponibles sin conexión, útil para estudiar sin datos.
- SEO: una URL por lección con título y descripción propios («Cómo trazar la mediatriz de un segmento paso a paso») y los pasos escritos en HTML para que los buscadores los indexen.
- Idioma: español de España; terminología del currículo de Castilla y León de 1º de Bachillerato, por confirmar.
- Privacidad: sin publicidad y sin rastreo de terceros y sin cuentas: el progreso se queda en el navegador.

## Métricas, riesgos y preguntas abiertas

### Métricas de éxito

| Métrica | Objetivo inicial |
| --- | --- |
| Lecciones completadas hasta el último paso | Más del 60 % de las iniciadas |
| Alumnos que pasan de «vista» a «practicada» | Más del 40 % |
| Nota media en ejercicios libres tras la lección | Al menos 6,5 sobre 10 |
| Alumnos que vuelven en 7 días | Más del 30 % |

Todas se miden con analítica agregada y sin cookies, coherente con un recurso sin cuentas.

### Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La IA genera un trazado mal calculado y enseña un error | Tests numéricos obligatorios, renderizado automático y revisión humana de muestra |
| Volumen de contenido: 60 lecciones animadas | Formato declarativo y una skill de Claude que genera los borradores |
| La corrección del trazo a mano es difícil | Empezar por imán a puntos y tolerancias generosas; afinar con datos reales |
| El aspecto lápiz perjudica el rendimiento | Filtros SVG ligeros y un modo «sencillo» sin ruido |
| Currículo de Castilla y León sin confirmar | Etiquetar cada lección con su bloque oficial y regenerar cuando se confirme |

### Decisiones y preguntas abiertas

Decididas:

- Traze es un recurso gratuito, no una academia: sin cuentas.
- El currículo de referencia es el de Castilla y León.
- El contenido se genera con IA y se revisa antes de publicar.

Por resolver:

- [ ] Confirmar con el currículo oficial vigente de Castilla y León qué lecciones entran en 1º.
- [ ] Elegir un hosting gratuito o de bajo coste para el sitio.
- [ ] Definir quién hace la revisión humana de muestra del contenido generado.
