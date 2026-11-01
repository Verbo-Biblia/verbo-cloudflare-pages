-- Medición propia de verbobiblia.com (ver panel.js y /assets/medir.js). Misma base que los votos (verbo-votos).
-- Crear o actualizar: npx wrangler d1 execute verbo-votos --remote --file=medicion.sql
-- Anónima: visitante y sesión son hashes de ids al azar del navegador; no se guarda la IP.
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  t INTEGER NOT NULL,            -- milisegundos (UTC)
  dia TEXT NOT NULL,             -- AAAA-MM-DD (UTC); el panel no la usa: agrupa por día de Costa Rica a partir de t
  visitante TEXT,
  sesion TEXT,
  nuevo INTEGER DEFAULT 0,       -- 1 en el primer evento de un visitante nuevo
  tipo TEXT NOT NULL,            -- vista, fin, clic, descarga, salida, juego, juego_fin, voto, busqueda, imprimir
  ruta TEXT,
  objetivo TEXT,                 -- título, enlace, juego, texto buscado…
  detalle TEXT,                  -- JSON corto (zona y posición del clic, profundidad, toques…)
  ms INTEGER,                    -- tiempo visible en la página o en el juego
  ref TEXT,                      -- origen de la visita (solo en «vista»)
  pais TEXT, disp TEXT, idioma TEXT
);
CREATE INDEX IF NOT EXISTS eventos_t ON eventos (t);
CREATE INDEX IF NOT EXISTS eventos_tipo_t ON eventos (tipo, t);
CREATE INDEX IF NOT EXISTS eventos_sesion ON eventos (sesion, t);
CREATE INDEX IF NOT EXISTS eventos_ruta ON eventos (ruta);

-- Sección «Dirección» del panel (tendencia semana a semana):
-- catalogo: cuánto contenido había publicado cada día (lo toma el cron diario del Worker de los sitemaps).
CREATE TABLE IF NOT EXISTS catalogo (
  dia TEXT PRIMARY KEY,          -- AAAA-MM-DD de Costa Rica
  imagenes INTEGER, juegos INTEGER, historias INTEGER, lecciones INTEGER
);
-- hitos: lanzamientos y cambios que se marcan en las gráficas para ver qué movió la curva.
CREATE TABLE IF NOT EXISTS hitos (id INTEGER PRIMARY KEY AUTOINCREMENT, dia TEXT NOT NULL, texto TEXT NOT NULL);
-- yo: aparatos de Juan (hash del visitante), que el panel no cuenta, tampoco hacia atrás.
CREATE TABLE IF NOT EXISTS yo (visitante TEXT PRIMARY KEY, desde INTEGER);
-- ev: los eventos sin los aparatos de Juan. El panel lee de aquí.
CREATE VIEW IF NOT EXISTS ev AS SELECT * FROM eventos WHERE visitante NOT IN (SELECT visitante FROM yo);
INSERT INTO hitos (dia, texto) SELECT '2026-10-22', 'Se publican Juegos, Banco de imágenes y Apps' WHERE NOT EXISTS (SELECT 1 FROM hitos);
INSERT INTO hitos (dia, texto) SELECT '2026-10-23', 'Portal de juegos cristianos' WHERE (SELECT COUNT(*) FROM hitos) = 1;
INSERT INTO hitos (dia, texto) SELECT '2026-10-29', 'Empieza la medición propia' WHERE (SELECT COUNT(*) FROM hitos) = 2;
INSERT INTO hitos (dia, texto) SELECT '2026-10-31', 'Historias interactivas (George Müller) y sitio bilingüe' WHERE (SELECT COUNT(*) FROM hitos) = 3;
