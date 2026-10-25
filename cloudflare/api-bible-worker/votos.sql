-- Base D1 de los «👍 Me gustó» de los juegos (ver handleVotos en worker.js).
-- Crear una vez:
--   npx wrangler d1 create verbo-votos      (copiar el database_id en wrangler.toml)
--   npx wrangler d1 execute verbo-votos --remote --file=votos.sql
-- Ver resultados:
--   npx wrangler d1 execute verbo-votos --remote --command="SELECT juego, COUNT(*) AS votos FROM votos GROUP BY juego ORDER BY votos DESC"
CREATE TABLE IF NOT EXISTS votos (
  juego TEXT NOT NULL,
  votante TEXT NOT NULL,
  creado INTEGER NOT NULL,
  PRIMARY KEY (juego, votante)
);
