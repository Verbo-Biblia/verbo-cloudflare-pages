# Estado restante — Biblia Verbo — 2026-08-07

## Cambio de repositorio

Este proyecto arrancó en `verbo-github-pages-v1` (Génesis–Malaquías comiteado y
publicado ahí). Ese repo ya no despliega a producción — lo hace
`verbo-cloudflare-pages` desde 2026-08-04. Mateo 1–2 se había revisado en el
repo viejo pero quedó **sin comitear**; se rescató del working tree y se aplicó
aquí. Desde esta sesión, todo el trabajo del Nuevo Testamento continúa en
`verbo-cloudflare-pages`.

## Próximo punto exacto

- Mateo, Marcos, Lucas y Juan quedaron completamente cerrados (2026-08-07):
  Mateo, 28 capítulos y 1.071 versículos; Marcos, 16 capítulos y 678
  versículos; Lucas, 24 capítulos y 1.151 versículos; Juan, 21 capítulos y
  879 versículos; los cuatro con validación de calidad sobre el libro
  completo, 0 problemas (sin desajuste de conteo vs. RVA1909, sin campos
  vacíos, sin arcaísmos "vosotros" residuales, sin comillas indebidas).
- **Los cuatro evangelios están terminados.** Por instrucción explícita de
  Juan ("termina los evangelios pausas y guardas estado"), el trabajo se
  PAUSA aquí. El siguiente libro pendiente es Hechos de los Apóstoles
  (`biblia/modules/bibles/rv-verbo/books/ACT.json`), pero no se debe
  continuar sin nueva indicación de Juan.
- Nota de estilo confirmada en Juan 1–17 (ya presente antes de esta sesión,
  también usada en Marcos y Lucas): las comillas curvas “” SÍ se usan, pero
  solo para citas o discurso anidado dentro de otro discurso (p. ej. una cita
  de Escritura dentro de las palabras de Jesús, o alguien repitiendo lo que
  otro dijo). El discurso directo de primer nivel sigue sin comillas (dos
  puntos + mayúscula). No es un error — el script de validación de calidad
  debe filtrar comillas curvas “” y solo marcar guillemets «» como problema.
- Nota textual: Juan 21:15-17 preserva "hijo de Jonás" (lectura del Textus
  Receptus / RVA1909), aunque BSB y ASV (texto crítico moderno) dicen "hijo
  de Juan" — decisión conforme al método (RVA1909 controla estructura y
  variantes textuales, no las guías modernas). Juan 21:25 conserva el
  "Amén." final de RVA1909, igual que se hizo en Mateo 28:20, Marcos 16:20 y
  Lucas 24:53.
- El avance desde Génesis hasta Juan ya fue revisado, validado y publicado.
- Trabajar desde el texto BV2026 actual, preservando mejoras válidas.
- Revisar cada versículo en contexto y validar cada capítulo antes de avanzar.

## Decisión de estilo ya resuelta (2026-08-07)

- Mateo 1–2 había introducido comillas angulares/curvas para todo el discurso
  directo, distinto del estilo del AT ya publicado ("y dijo Dios: Sea la
  luz", dos puntos + mayúscula, sin comillas). Juan decidió mantener
  consistencia total con el AT: se quitaron las comillas de Mateo 1–2 y el
  resto del NT sigue el mismo patrón sin comillas.

## Trabajo restante

- Restan 24 libros completos: Juan–Apocalipsis.
- Restan 192 capítulos desde Juan 1 hasta Apocalipsis (Mateo, Marcos y Lucas
  ya cerrados).

## Cierres ya descontados

- Génesis: 50 capítulos y 1.533 versículos; candidato editorial.
- Éxodo: 40 capítulos y 1.213 versículos; candidato editorial.
- Levítico: 27 capítulos y 859 versículos; candidato editorial.
- Números: 36 capítulos y 1.288 versículos; candidato editorial.
- Deuteronomio: 34 capítulos y 959 versículos; candidato editorial.
- Josué: 24 capítulos y 658 versículos; candidato editorial.
- Jueces: 21 capítulos y 618 versículos; candidato editorial.
- Rut: 4 capítulos y 85 versículos; candidato editorial.
- 1 Samuel–2 Crónicas: 167 capítulos; candidatos editoriales publicados.
- Esdras: 10 capítulos y 280 versículos; candidato editorial publicado.
- Nehemías: 13 capítulos y 406 versículos; candidato editorial publicado.
- Ester: 10 capítulos y 167 versículos; candidato editorial publicado.
- Job: 42 capítulos y 1.070 versículos; candidato editorial publicado.
- Proverbios: 31 capítulos y 915 versículos; candidato editorial publicado.
- Eclesiastés: 12 capítulos y 222 versículos; candidato editorial publicado.
- Cantares: 8 capítulos y 117 versículos; candidato editorial publicado.
- Isaías: 66 capítulos y 1.292 versículos; candidato editorial publicado.
- Jeremías: 52 capítulos y 1.364 versículos; candidato editorial publicado.
- Lamentaciones: 5 capítulos y 154 versículos; candidato editorial publicado.
- Ezequiel: 48 capítulos y 1.273 versículos; candidato editorial publicado.
- Daniel: 12 capítulos y 357 versículos; candidato editorial publicado.
- Oseas: 14 capítulos y 197 versículos; candidato editorial publicado.
- Joel: 3 capítulos y 73 versículos; candidato editorial publicado.
- Amós: 9 capítulos y 146 versículos; candidato editorial publicado.
- Abdías: 1 capítulo y 21 versículos; candidato editorial publicado.
- Jonás: 4 capítulos y 48 versículos; candidato editorial publicado.
- Miqueas: 7 capítulos y 105 versículos; candidato editorial publicado.
- Nahúm: 3 capítulos y 47 versículos; candidato editorial publicado.
- Habacuc: 3 capítulos y 56 versículos; candidato editorial publicado.
- Sofonías: 3 capítulos y 53 versículos; candidato editorial publicado.
- Hageo: 2 capítulos y 38 versículos; candidato editorial publicado.
- Zacarías: 14 capítulos y 211 versículos; candidato editorial publicado.
- Malaquías: 4 capítulos y 55 versículos; candidato editorial publicado.
- Mateo: 28 capítulos y 1.071 versículos; candidato editorial publicado.
- Marcos: 16 capítulos y 678 versículos; candidato editorial publicado.
- Lucas: 24 capítulos y 1.151 versículos; candidato editorial publicado.
- Total AT+Mateo+Marcos+Lucas terminado: 42 libros y 997 capítulos.

## Método obligatorio restante

1. Usar BV2026 como texto base; RVA1909 solo para controlar estructura,
   numeración e historia textual, nunca como modelo de redacción.
2. Usar BSB y ASV como guías textuales principales disponibles (ambas ya están
   en `biblia/modules/bibles/` de este repo); contrastar también LBLA cuando
   sea accesible y RVG u otras versiones conocidas para alternativas léxicas,
   sin copiar la redacción de ninguna como base.
3. Corregir errores, conversiones defectuosas, arcaísmos y nombres anticuados
   mediante revisión contextual, nunca con sustituciones globales ciegas.
4. Verificar estructura, numeración, textos no vacíos, cifras, negaciones,
   sujetos, términos teológicos, referencias y JSON.
5. Cuidado especial en genealogías y listas: no introducir distinciones que el
   texto original no marca (ver nota de calidad más abajo sobre Mateo 1:8).
6. Mantener este archivo centrado solamente en lo que falta y actualizarlo al
   cerrar cada nuevo avance.

## Nota de calidad — revisión de Mateo 1–2 (Claude, 2026-08-07)

Ver informe completo en `review/bible-verbo/OPINION-MATEO-1-2.md`. Resumen: la
traducción es de buena calidad, natural y fiel al griego; corrige bien nombres
propios arcaicos y reestructura la genealogía de forma legible. Dos ajustes
ya aplicados en esta sesión: (1) Mateo 1:8 corregido de "antepasado de Uzías"
a "padre de Uzías", parejo con el resto de la genealogía — el griego usa el
mismo verbo en todos los eslabones, aunque históricamente se sepa que ahí
Mateo omite tres reyes; vigilar que no se repita el patrón en otras
genealogías (p. ej. Lucas 3). (2) Comillas quitadas de Mateo 1–2 para igualar
el estilo sin comillas del AT ya publicado.

## Publicación

- Juan autorizó comitear y subir cada libro terminado.
- La Biblia completa todavía no está terminada ni debe marcarse como oficial.
