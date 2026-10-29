-- Medición propia de verbobiblia.com (ver panel.js y /assets/medir.js). Misma base que los votos (verbo-votos).
-- Crear o actualizar: npx wrangler d1 execute verbo-votos --remote --file=medicion.sql
-- Anónima: visitante y sesión son hashes de ids al azar del navegador; no se guarda la IP.
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  t INTEGER NOT NULL,            -- milisegundos (UTC)
  dia TEXT NOT NULL,             -- AAAA-MM-DD (UTC)
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
