// Fase 4 (comparación) — Camino B: filtro semántico sobre los candidatos del
// stemming original (Porter, sin filtro — el mismo resultado ya obtenido en
// data/motor-diccionario-prueba-piloto.json).
//
// Reutiliza el modelo YA DESCARGADO/cacheado por tools/semantic-search
// (Xenova/paraphrase-multilingual-MiniLM-L12-v2) por referencia relativa de
// solo lectura — no se toca ni se modifica nada dentro de tools/semantic-search.
//
// Para cada pasaje: embebe el texto completo del pasaje UNA vez, embebe el
// excerpt de cada headword candidato (deduplicado por id de diccionario), y
// calcula similitud coseno (dot product, los vectores del pipeline ya salen
// normalizados con normalize:true). Reporta a 3 umbrales (0.3/0.4/0.5) cuáles
// candidatos sobreviven.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '../semantic-search/node_modules/@xenova/transformers/src/transformers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

// Reusa el cache ya descargado por tools/semantic-search — no descarga nada nuevo.
env.cacheDir = path.join(repoRoot, 'tools', 'semantic-search', '.cache');

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const THRESHOLDS = [0.3, 0.4, 0.5];

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function tensorVector(output) {
  return Array.from(output.data);
}

async function main() {
  const t0 = Date.now();
  const baseline = JSON.parse(
    await readFile(path.join(__dirname, 'data', 'motor-diccionario-prueba-piloto.json'), 'utf8'),
  );

  const diccionarios = {};
  for (const nombre of ['easton-bible-dictionary', 'smith-bible-dictionary']) {
    const raw = JSON.parse(
      await readFile(path.join(repoRoot, 'biblia', 'modules', 'diccionarios', nombre, 'entries.json'), 'utf8'),
    );
    diccionarios[nombre] = new Map(raw.entries.map((e) => [e.id, e]));
  }
  const dictKeyByName = { easton: 'easton-bible-dictionary', smith: 'smith-bible-dictionary' };

  console.error('Cargando el modelo (desde cache local, sin descarga nueva)...');
  const tModelStart = Date.now();
  const extractor = await pipeline('feature-extraction', MODEL);
  console.error(`Modelo cargado en ${Date.now() - tModelStart} ms.`);

  // Cache de embeddings de headwords, por (diccionario,id) — un headword que
  // se repite como candidato en varios pasajes solo se embebe una vez.
  const headwordVectorCache = new Map();
  let embedCount = 0;
  const tEmbedStart = Date.now();

  async function embedHeadword(diccionario, id) {
    const key = `${diccionario}:${id}`;
    if (headwordVectorCache.has(key)) return headwordVectorCache.get(key);
    const entry = diccionarios[dictKeyByName[diccionario]].get(id);
    const texto = `${entry.titulo}. ${entry.excerpt}`;
    const output = await extractor(texto, { pooling: 'mean', normalize: true });
    const vec = tensorVector(output);
    headwordVectorCache.set(key, vec);
    embedCount++;
    return vec;
  }

  const resultados = [];
  for (const pasajeBase of baseline) {
    const { pasaje, textoBSB, entradas } = pasajeBase;
    const tPasajeStart = Date.now();

    const outQuery = await extractor(textoBSB, { pooling: 'mean', normalize: true });
    const queryVec = tensorVector(outQuery);
    embedCount++;

    const candidatos = [];
    for (const e of entradas) {
      for (const f of e.fuentes) {
        const vec = await embedHeadword(f.diccionario, f.id);
        const sim = dot(queryVec, vec);
        candidatos.push({ headword: e.headword, diccionario: f.diccionario, id: f.id, similitud: sim });
      }
    }
    candidatos.sort((a, b) => b.similitud - a.similitud);

    const porUmbral = {};
    for (const th of THRESHOLDS) {
      porUmbral[th] = candidatos.filter((c) => c.similitud >= th).length;
    }

    resultados.push({
      pasaje,
      totalCandidatosOriginal: entradas.length,
      candidatos,
      conteoPorUmbral: porUmbral,
      msPasaje: Date.now() - tPasajeStart,
    });
    console.error(
      `${pasaje.book} ${pasaje.chapterStart}: ${candidatos.length} candidatos evaluados en ${Date.now() - tPasajeStart} ms`,
    );
  }

  console.error(`Total embeddings calculados: ${embedCount} en ${Date.now() - tEmbedStart} ms (incluye 5 queries de pasaje).`);
  console.error(`Tiempo total del script: ${Date.now() - t0} ms.`);

  const salida = {
    _metadata: {
      modelo: MODEL,
      umbrales: THRESHOLDS,
      totalEmbeddingsCalculados: embedCount,
      msTotalEmbeddings: Date.now() - tEmbedStart,
      msTotalScript: Date.now() - t0,
    },
    resultados,
  };

  process.stdout.write(JSON.stringify(salida, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
