# Historia AT — estado de integraciones cerradas

Guardado: 2026-09-02
Estado: Sayce publicado; Maclear integrado y validado para publicación.

## Punto exacto de pausa

- `fd30cd05` publicó la obra completa de Sayce en Historia.
- `9cced51e` publicó tres fichas estrictamente ancladas en el Asistente y
  corrigió los enlaces profundos de Concilios.
- Cloudflare Pages sirve la versión de caché `20260902-sayce-assistant`.
- Se verificó en producción una ficha de Sayce en cada paquete de Génesis 12,
  Deuteronomio 3 y Josué 10, y recursos conciliares en Juan 1.
- Sayce aparece solo en Génesis 12:1–9, Deuteronomio 3:8–9 y Josué 10:1–5.
- Los 30 recursos conciliares generados apuntan a entradas documentales reales.
- No hay procesos en ejecución ni cambios productivos pendientes de publicar.
- Maclear quedó incorporado como segunda obra: 74 unidades de lectura y cero
  fichas del Asistente, decisión cerrada y documentada.
- Permanecen únicamente como staging local Pinches, H. P. Smith y el piloto de
  Génesis 1–11.

## Próximo inicio

No continuar automáticamente con otra fuente. Cada obra siguiente requiere su
propuesta concreta y aprobación conforme a `AGENTS.md`. Una vez aprobada, debe
completarse antes de publicar: lectura, fichas estrictamente ancladas que sean
pertinentes, enlaces profundos, traducción, paquetes, catálogos, índices y
pruebas de extremo a extremo.

## Resultado

- La aprobación expresa del usuario habilitó la adaptación propuesta de
  *Patriarchal Palestine*.
- Las nueve unidades cotejadas están `APPROVED` para lectura como fuente
  histórica secundaria.
- El módulo activo está en
  `biblia/modules/church-history/sayce-patriarchal-palestine/`.
- La obra aparece en el estante `🏛️ Historia` con portada propia, índice,
  navegación, texto inglés traducible, ubicación de páginas y aviso editorial
  visible en cada unidad.
- El registro de módulos contiene el manifiesto estable de la obra.
- El índice semántico de Historia conserva sus 1.577 vectores previos y añade
  únicamente las nueve entradas de Sayce: 1.586 registros, 384 dimensiones y
  609.024 bytes. Se usó el modo incremental documentado por tratarse de una
  máquina con 4 GB de RAM.
- No se tocaron el Worker, API, secretos, Cloudflare, `.wrangler/` ni el texto
  de ninguna Biblia.
- Tres fichas contextuales nuevas, investigadas como expedientes separados de
  la cola automática, están integradas en el Asistente exclusivamente en
  Génesis 12:1–9, Deuteronomio 3:8–9 y Josué 10:1–5.
- Cada ficha enlaza al capítulo exacto de Sayce, contiene límites explícitos y
  registra afirmaciones y fuentes modernas de contraste institucionales.
- Los 1.189 paquetes del Asistente y su catálogo de traducción fueron
  regenerados y validados.

## Decisión independiente sobre el Asistente

Los 111 candidatos automáticos y sus 118 anclajes fueron revisados. Los 111 se
rechazaron **solo para proyección desde esa cola**: son citas integradas en los
argumentos de Sayce, no fichas contextuales modernas independientes. Cuarenta y
dos ventanas recibieron además una marca de riesgo por identificación o
equivalencia histórica/toponímica.

La cola automática no generó fichas. Las tres fichas finalmente incorporadas
se investigaron como expedientes nuevos: contexto regional de Canaán para
Génesis 12:1–9, contexto de ciudades-estado y cartas de Amarna para Josué
10:1–5, y el testimonio del topónimo asirio Saniru para Deuteronomio 3:8–9.
Habiru, Jacob-el, Rephaim y las demás identificaciones antiguas permanecen
fuera del Asistente.

El detalle reproducible está en:

- `tools/historia-at/triage_sayce_candidates.py`;
- `data/fuentes-externas/historia-at/sayce-patriarchal-palestine/editorial/bible-relation-candidates.json`;
- `data/fuentes-externas/historia-at/sayce-patriarchal-palestine/editorial/CANDIDATE-QUEUE-REPORT.md`.

## Reproducción

```bash
python3 tools/historia-at/build_sayce_reading_units.py
python3 tools/historia-at/project_sayce_history_module.py
python3 tools/historia-at/triage_sayce_candidates.py

cd tools/semantic-search
ONLY_SOURCE_ID=sayce-patriarchal-palestine REUSE_EXISTING_BY_ID=1 BATCH_SIZE=1 \
  node build-church-history-index.mjs
```

## Límite del cierre

Sayce y Maclear están cerrados. Los expedientes de Pinches y H. P. Smith
permanecen en staging y no fueron integrados. ISBE no se inició. Integrar
cualquiera de esas fuentes sería una nueva adaptación y
requeriría su propia propuesta y aprobación conforme a `AGENTS.md`.
