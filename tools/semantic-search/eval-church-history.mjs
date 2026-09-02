import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@xenova/transformers';

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const TOP_K = 8;
const QUERIES = [
  'la persecución de los cristianos bajo Diocleciano',
  'el concilio de Nicea y la controversia arriana',
  'la conversión de Constantino y la visión de la cruz',
  'geografía de Canaán y la tierra de Palestina',
  'los pueblos de Canaán en la época patriarcal',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const indexDir = path.join(repoRoot, 'biblia', 'modules', 'semantic-search', 'church-history');
env.cacheDir = path.join(__dirname, '.cache');

async function loadIndex() {
  const metadata = JSON.parse(await readFile(path.join(indexDir, 'entries.meta.json'), 'utf8'));
  const bytes = await readFile(path.join(indexDir, metadata.vectorFile));
  return { metadata, vectors: new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) };
}

async function main() {
  const { metadata, vectors } = await loadIndex();
  const records = metadata.records;
  console.log(`records: ${records.length}, dims: ${metadata.dimensions}`);
  const extractor = await pipeline('feature-extraction', MODEL);
  for (const query of QUERIES) {
    const output = await extractor(query, { pooling: 'mean', normalize: true });
    const queryVector = output.data;
    const dims = metadata.dimensions;
    const scored = records.map(record => {
      let score = 0;
      for (let dim = 0; dim < dims; dim += 1) score += queryVector[dim] * (vectors[record.offset + dim] / 127);
      return { id: record.id, title: record.title, source: record.source, score };
    });
    scored.sort((a, b) => b.score - a.score);
    console.log(`\n=== "${query}" ===`);
    scored.slice(0, TOP_K).forEach((r, i) => console.log(`${i + 1}. [${r.score.toFixed(4)}] (${r.source}) ${r.id} — ${r.title}`));
  }
}

main().catch(error => { console.error(error); process.exit(1); });
