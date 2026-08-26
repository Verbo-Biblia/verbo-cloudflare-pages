# Diagnóstico técnico de indexación — 2026-08-26

Investigación de solo lectura. Sin cambios de código, sin commits. Objetivo: identificar causas técnicas de "sitio verificado en Search Console pero mayormente sin indexar" (`site:verbobiblia.com` sin resultados).

---

## 1. robots.txt

```
User-agent: *
Allow: /
Sitemap: https://verbobiblia.com/sitemap.xml
```

- No hay ninguna línea `Disallow`. No bloquea nada.
- `curl -sI https://verbobiblia.com/robots.txt` → **200 OK**, `content-type: text/plain`.
- `curl -sI https://verbobiblia.com/sitemap.xml` → **200 OK**, `content-type: application/xml`.
- `sitemap.xml` existe en la raíz del repo (51 KB, **235 URLs** vía `<loc>`), con `lastmod`/`changefreq`/`priority` por URL.

**DESCARTADA** como causa. robots.txt y sitemap están bien configurados y responden correctamente en producción.

---

## 2. Meta robots (noindex)

`grep -rin "noindex" --include="*.html" .` → solo 2 resultados en todo el repo:

- `libreria/mi-biblioteca/index.html:17` → `<meta name="robots" content="noindex">` (página personal de progreso de lectura del usuario — correcto que no se indexe).
- `proyector/remoto.html:6` → `<meta name="robots" content="noindex, nofollow">` (panel de control remoto por celular, no contenido público — correcto).

Ningún `noindex` en una plantilla compartida ni en páginas de contenido (portada, biblia/, libreria/*, recursos/*, escuela dominical).

**DESCARTADA** como causa. Los dos `noindex` que existen son intencionales y correctos.

---

## 3. Canonical tags

587 `<link rel="canonical">` en todo el repo. La gran mayoría (verificado con muestra de portada, `acerca/`, `ajustes/`, decenas de `libreria/*`, currículos de escuela dominical y lecciones individuales) apunta correctamente a sí misma.

Encontré **2 canonical mal apuntados** (`sort | uniq -d` sobre todos los hrefs):

- **`recursos/escuela-dominical/index.html:8`** → `<link rel="canonical" href="https://verbobiblia.com/recursos/">` — el hub de Escuela Dominical le dice a Google "no me indexes a mí, indexá `/recursos/` en mi lugar". Debería apuntar a `https://verbobiblia.com/recursos/escuela-dominical/`.
- **`recursos/articles-and-reflections-en/index.html:8`** → `<link rel="canonical" href="https://verbobiblia.com/recursos/articulos-y-reflexiones/">` — la versión en inglés le dice a Google que es un duplicado de la versión en español y que indexe esa en su lugar. Debería apuntar a `https://verbobiblia.com/recursos/articles-and-reflections-en/`.

Ambos parecen error de copy-paste del template (canonical de la página "padre"/"hermana" pegado sin actualizar la ruta). Revisé lecciones individuales de escuela dominical (ej. `recursos/escuela-dominical/4-7-anos/leccion-01-dios-creo-la-luz/index.html`) y esas sí apuntan correctamente a sí mismas — el bug es puntual a estos 2 archivos, no sistémico en todo el árbol de escuela dominical/recursos.

**CAUSA PROBABLE CONFIRMADA (alcance acotado)** — real, pero afecta 2 páginas específicas, no explica "la mayoría del sitio sin indexar".

---

## 4. Renderizado para crawler (contenido client-side vs. estático)

Medido como caracteres de texto visible en el HTML crudo (sin ejecutar JS), quitando `<script>`/`<style>`/tags:

- **`index.html` (portada)**: 2523 caracteres de texto, **0 llamadas a `fetch`/`innerHTML`/`.json`**. Todo el contenido (hero, tarjetas, sección "Qué ofrece Verbo") está en el HTML estático servido de entrada.
- **`libreria/index.html`**: 11 708 caracteres de texto estático, 0 dependencias de fetch/JSON. Las ~118 obras individuales no están listadas ahí (es un hub con enlaces a categorías), pero cada obra vive en su propio `index.html` autocontenido con su propio canonical (confirmado en el punto 3).
- **`recursos/index.html`**: solo 778 caracteres de texto y 5 enlaces — es un hub minimalista, pero **estático** (no depende de JS para pintar contenido). Es corto, no vacío-por-JS.

**DESCARTADA** como causa de "página vacía para el crawler". Las tres páginas clave sirven contenido real en el HTML inicial. No encontré ningún patrón de "fetch de `.json` + `innerHTML`" en las páginas de contenido público (ese patrón sí existe en `biblia/`, pero `biblia/` es una app de estudio interactiva, no páginas de contenido indexable individual — es una sola URL con estado en el cliente, comportamiento esperado y no comparable a libreria/recursos).

---

## 5. Riesgo de contenido duplicado / thin content

Revisé una lección real de Escuela Dominical (`recursos/escuela-dominical/4-7-anos/leccion-01-dios-creo-la-luz/index.html`, 6282 bytes de HTML): descontando navegación compartida (~300-400 caracteres de menú/rail repetidos en cada página), el contenido único real (versículo base, objetivo, historia bíblica) ronda **~1600-1700 caracteres** — corto pero genuinamente único por lección, no boilerplate vacío.

Con 210 archivos `index.html` bajo `recursos/escuela-dominical/` (curricula + lecciones) y una cantidad similar de piezas en `recursos/articulos-y-reflexiones/`+devocionales, el patrón real es: **plantilla visual idéntica + navegación compartida + contenido de cuerpo corto pero distinto por página**. Esto es "thin content" en el sentido de Google (poco texto único, mucho boilerplate proporcional), pero no es contenido duplicado entre sí — cada lección/artículo tiene su propio título y cuerpo.

**NO CONFIRMADA como causa única, pero SÍ es un factor de riesgo real** — con cientos de páginas de plantilla + poco texto único cada una, es consistente con "Google rastrea pero no prioriza indexar" (categoría real de Search Console: "Rastreada, actualmente no indexada"), especialmente en un sitio sin mucha autoridad de dominio todavía. Esta es una inferencia razonable a partir de datos reales medidos, no una suposición sin base — pero es Search Console (categorías de cobertura) quien confirma si esto es efectivamente lo que está pasando.

---

## 6. `_redirects`

Contenido completo:

```
/.well-known/assetlinks.json /wellknown-assetlinks.json 200
```

Una sola regla, para servir el archivo de verificación de Android App Links. No hay ningún catch-all, ningún redirect 301 masivo, nada que interfiera con rutas de contenido.

**DESCARTADA** como causa.

---

## 7. Historial de cambios de dominio/DNS/hosting

Este es el hallazgo más importante del diagnóstico:

- `git log --follow --oneline -- CNAME` → **un solo commit en toda la historia**: `583dc3d1 "Snapshot inicial para migración a Cloudflare Pages"`.
- Ese commit (el primero de todo el repositorio) es de **2026-08-03** — hace **23 días** respecto a hoy (2026-08-26).
- El repo tiene 382 commits en total, todos posteriores a esa fecha — es decir, **este repositorio completo es el resultado de una migración de hosting hecha hace apenas 3 semanas**, tal como describe el propio mensaje del commit.
- No hay `wrangler.toml` ni `_headers` en la raíz (no hace falta para un sitio estático de Pages; no hay señal de configuración inusual).
- El CNAME (`verbobiblia.com`) es el mismo desde ese commit inicial — no hay evidencia de cambio de dominio, solo de **hosting** (consistente con memoria previa del proyecto: "Hosting is Cloudflare Pages, not GitHub Pages").

**CAUSA PROBABLE CONFIRMADA — la más relevante de las 7.** Una migración de hosting de hace 23 días (de lo que aparentemente era GitHub Pages a Cloudflare Pages) es tiempo insuficiente para que Google vuelva a rastrear e indexar ~235 URLs desde cero, incluso si la propiedad de Search Console sigue siendo la misma. Google típicamente tarda semanas a meses en re-rastrear un sitio completo tras un cambio de infraestructura, especialmente sin señales fuertes de autoridad/backlinks que aceleren la prioridad de rastreo. Esto es un **hecho verificado en git** (fecha del commit), no una suposición — pero si ese re-rastreo ya terminó o no es la explicación completa, **solo Search Console puede confirmarlo** (categoría de cobertura, fecha del último rastreo por URL).

---

## Recomendación priorizada

1. **Migración de hosting reciente (2026-08-03, hace 23 días) — punto 7.** Es la explicación más probable y mejor evidenciada de "verificado pero sin indexar": no es tiempo suficiente para un re-rastreo completo de un sitio con autoridad de dominio todavía limitada. Acción: en Search Console, mirar la fecha del último rastreo por URL y la categoría exacta de cobertura (¿"Rastreada, no indexada" vs. "Detectada, no rastreada" vs. algo distinto?) — esa clasificación exacta (que Juan está trayendo en paralelo) va a confirmar o descartar esta hipótesis. Si la categoría es alguna variante de "no rastreada todavía", esto es la causa y la solución es sitemap ya está bien + solicitar indexación manual de las páginas más importantes + paciencia, no un fix de código.

2. **Dos canonical mal apuntados (punto 3)** — reales, confirmados, pero de alcance acotado (2 páginas: hub de escuela dominical y la versión en inglés de artículos). Vale la pena corregirlos igual porque cada uno le dice activamente a Google "no indexes esto", pero no explican que "la mayoría" del sitio esté sin indexar.

3. **Riesgo de thin content en las ~400+ páginas de plantilla (escuela dominical + recursos, punto 5)** — no confirmado como causa, pero es un factor de riesgo real y verificado con datos (contenido único corto por página, mucho boilerplate compartido). Si Search Console muestra específicamente estas páginas como "Rastreada, actualmente no indexada" (a diferencia de "no rastreada"), esto sube de prioridad como explicación.

4. **robots.txt, meta noindex, `_redirects`, renderizado client-side (puntos 1, 2, 4, 6)**: **descartados** — no se encontró nada roto en el código en ninguno de estos cuatro puntos.

**Conclusión general**: no hay un bloqueo técnico masivo en el código (robots.txt, noindex, redirects y renderizado están todos correctos). Sí hay dos bugs puntuales de canonical que vale la pena corregir. Pero la causa más probable del patrón "verificado pero sin indexar en su mayoría" es la migración de hosting de hace 23 días — un problema de tiempo/prioridad de rastreo de Google, no un problema de código. La clasificación exacta que Juan traiga de Search Console (Cobertura → por qué categoría cae cada URL) es lo que debería confirmar esto antes de invertir más tiempo en cambios de código.
