# Motor de texto original de Verbo

Estado: corpus original completo e Interlineal Verbo funcional, pendiente de
revisión editorial de las alineaciones automáticas.

## Decisión y fuentes evaluadas

El piloto usa los datasets **TAHOT** (Translators Amalgamated Hebrew OT) y
**TAGNT** (Translators Amalgamated Greek NT), creados por STEPBible/Tyndale
House y distribuidos como **CC BY 4.0**. La copia fuente usada por el importador
es el repositorio local `STEPBible-Data-master`; los datos publicados por Verbo
incluyen atribución, nombre exacto del dataset, revisión Git de la fuente y la
fecha del import.

- TAHOT: texto basado en el Códice de Leningrado, con Qere y otras lecturas
  identificadas por la fuente, transliteración, lema/Strong extendido y
  morfología derivada de ETCBC en códigos compatibles con Open Scriptures.
- TAGNT: texto griego amalgamado que identifica la presencia de cada token en
  varias ediciones. El piloto conserva la lectura marcada `N` por la propia
  fuente, sus acentos, transliteración, lema, Strong y morfología Robinson
  ampliada. No se presenta como NA28, UBS5 ni como reproducción de una edición
  crítica comercial.
- Open Scriptures Hebrew Bible (OSHB): candidato sólido; WLC es dominio
  público y lema/morfología son CC BY 4.0. No se mezcla en el piloto porque
  TAHOT ya integra esos antecedentes y ofrece transliteración y Strong en una
  sola tokenización trazable.
- SBLGNT oficial: actualmente CC BY 4.0 y apto potencialmente. MorphGNT añade
  lemas/morfología bajo CC BY-SA, por lo que no se adoptó ni mezcló sin una
  revisión específica de compatibilidad y obligaciones ShareAlike.
- NA28/UBS5: no se incorporan. Su condición de ediciones conocidas no concede
  permiso de redistribución.

Procedencia oficial consultada: `https://github.com/STEPBible/STEPBible-Data`,
`https://github.com/openscriptures/morphhb` y
`https://github.com/LogosBible/SBLGNT`.

## Arquitectura encontrada y encaje

Verbo usa IDs canónicos de tres caracteres (`GEN`, `JHN`, etc.), manifests
estáticos y carga diferida desde `module-loader.js`. Biblia Verbo guarda el
texto por libro/capítulo/versículo. La capa Strong provisional guarda segmentos
españoles con estados propios y el popup Strong consulta un diccionario
independiente. El panel derecho `diccionario` es por tanto el punto natural para
evolucionar hacia **Idiomas bíblicos**, sin modificar la Biblia ni la revisión
Strong activa.

El nuevo módulo vive en `biblia/modules/original-languages/`. Sus archivos de
capítulo se cargan solamente al abrir Texto original. El texto original y la
alineación con Biblia Verbo son datasets distintos.

## Formato del texto original

Cada capítulo contiene metadatos de fuente y versículos. Cada token conserva:

- ID estable de Verbo: `LIBRO.capítulo.versículo.tposición`;
- `surface`, exactamente como se presenta, incluidos vocales/acentos;
- `normalized`, adicional para búsquedas, nunca sustitutivo de `surface`;
- lema y transliteración suministrados por la fuente;
- código morfológico y nombre de su esquema;
- Strong clásico cuando la fuente ofrece una asociación explícita;
- Strong extendido original, cuando difiere del clásico;
- tipo de lectura de la fuente.

Los tokens permanecen en orden lógico. El hebreo se presenta con `dir="rtl"`;
transliteración, Strong, morfología y español se aíslan como LTR.

## Morfología

TAHOT usa códigos hebreos ETCBC/Open Scriptures ampliados; TAGNT usa Robinson
ampliado por STEPBible/Tyndale. Se conserva siempre el código fuente. Una capa
de presentación separada explica de forma prudente las categorías más comunes
del piloto; un código desconocido permanece visible y se etiqueta como tal, no
se interpreta por conjetura. Los documentos normativos de la fuente son TEHMC
y TEGMC, ambos CC BY 4.0.

## Strong y futuros léxicos

Strong procede exclusivamente de las columnas explícitas de TAHOT/TAGNT. Los
sufijos de desambiguación de STEPBible se conservan en `extendedStrong`, y el
número clásico normalizado se usa para consultar el diccionario ya existente.
No se crean asociaciones por traducción ni similitud. El contrato genérico es
`token → lema/Strong → recursos léxicos`, de modo que BDB u otros léxicos podrán
registrarse después sin hardcodearlos ahora.

## Alineación editorial independiente

La alineación piloto se almacena aparte de originales y de Biblia Verbo. Cada
archivo define segmentos destino estables para un versículo y relaciones con:

- `originalTokens` y `verboSegments` (arreglos, por lo que admiten 1:1, 1:N y
  N:1, además de segmentos discontinuos);
- `relation`;
- `status`: `automatic`, `reviewed`, `approved`, `ambiguous` o `unresolved`;
- confianza solo cuando procede y una nota editorial.

Nada automático se presenta como aprobado. El piloto de Génesis 1:1 y Juan
1:1 es deliberadamente pequeño y contiene relaciones claras, agrupaciones y
casos ambiguos/no resueltos para probar el modelo, no para aparentar cobertura.

## Versificación, alcance y límites

El importador usa un mapping explícito STEPBible → Verbo y valida los 66 IDs.
TAHOT/TAGNT señalan diferencias de versificación respecto del sistema inglés;
el piloto se limita a Génesis 1:1–5 y Juan 1:1–5, donde las referencias usadas
coinciden. Una discrepancia futura debe detener ese caso o registrarse
explícitamente: nunca se desplaza en silencio.

TAGNT conserva variantes en su dataset fuente. El piloto selecciona registros
que contienen la marca `N`; no ofrece aparato crítico ni afirma resolver el
texto original. TAHOT puede contener tokens compuestos con prefijos separados
por `/`; se conservan como un token ortográfico con varios análisis/Strong.

## Política textual TAGNT completa

TAGNT marca cada fila con las familias `N`, `K` y `O`, más paréntesis y
minúsculas para diferencias secundarias. Verbo aplica esta regla reproducible:

1. en un versículo con familia `N`, muestra sus tokens `N` como lectura base;
2. si un versículo tradicional presente en Biblia Verbo no posee familia `N`,
   usa el suplemento `K` (o `O` como último recurso) y marca cada token como
   `TAGNT-traditional-supplement`;
3. conserva en metadata la marca de lectura, ediciones y nota de variante;
4. no mezcla simultáneamente variantes rivales en la línea de lectura;
5. no denomina el resultado NA28, UBS5 ni edición crítica de Verbo.

Esta excepción es necesaria, por ejemplo, para que Marcos 16:9–20 y Juan
7:53–8:11 puedan acompañar el texto de Biblia Verbo sin ocultarlos. La interfaz
puede mostrar la metadata de fuente al tocar el token.

## Alineador completo

`tools/build_original_language_alignments.py` genera dos capas independientes
por capítulo:

- `alignments/rv-verbo/`: original ↔ Biblia Verbo. La señal admitida es una
  coincidencia Strong explícita entre el token TAHOT/TAGNT y un segmento de
  `rv-verbo-strong-provisional`. La capa española se identifica expresamente
  como evidencia auxiliar provisional.
- `alignments/bsb/`: original ↔ Berean Standard Bible. Segmenta el texto BSB
  local sin modificarlo y propone únicamente coincidencias exactas con la glosa
  inglesa explícita de STEPBible. No usa ASV, NASB ni la Biblia seleccionada por
  el usuario.

En ambas capas:

- una coincidencia inequívoca produce `automatic`, nunca `approved`;
- repeticiones del mismo Strong en ambos lados producen `ambiguous`;
- originales y segmentos españoles sin coincidencia fiable se agrupan como
  `unresolved`;
- cada relación guarda método, confianza y evidencia.

El sistema deliberadamente no usa similitud de glosas para aumentar cobertura.
La nueva infraestructura puede servir posteriormente para auditar Strong
español en dirección inversa, pero esta fase no altera esa capa.

## Revisión editorial local

Ejecutar:

```bash
python3 tools/review_original_language_alignments.py --port 8766
```

y abrir `http://127.0.0.1:8766/`. El editor selecciona primero Biblia Verbo o
BSB y luego libro/capítulo, ve
original, segmentos de Biblia Verbo y relaciones, y puede guardar los estados
`automatic`, `reviewed`, `approved`, `ambiguous` o `unresolved`. La herramienta
es local y no llama servicios externos.

Al regenerar, el alineador conserva las decisiones creadas por el editor local
cuando el conjunto de tokens originales y segmentos destino sigue siendo el
mismo. Una relación cuya segmentación cambió se vuelve a proponer y debe
revisarse nuevamente, en vez de heredar una aprobación obsoleta.

## Rendimiento, caché y próximos pasos

El registry carga solo el manifest pequeño. Cada capítulo se obtiene bajo
demanda y queda en la caché normal de módulos; abrir Verbo sin usar Texto
original no descarga los capítulos. Los archivos son estáticos y funcionan sin
API externa después de haber sido visitados/cached según el Service Worker.

El corpus se divide en 1.189 archivos capitulares y 2.378 alineaciones, una por
capítulo y traducción base.
El navegador obtiene únicamente manifest, índice morfológico y el capítulo
activo cuando el usuario abre la herramienta; nunca carga el corpus entero.
El tamaño publicado es elevado porque conserva trazabilidad, variantes y datos
lingüísticos legibles. Una futura compactación binaria o por tablas compartidas
debe medirse contra la mantenibilidad y el soporte estático de Cloudflare.

El producto puede denominarse **Interlineal Verbo** como función, pero sus
alineaciones automáticas no equivalen a aprobación editorial. Antes de
producción se necesita revisión dirigida de excepciones y elevar la cobertura
aprobada.
