import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@xenova/transformers';

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const BOOKS_ES = [
  ['GEN', 'Génesis'], ['EXO', 'Éxodo'], ['LEV', 'Levítico'], ['NUM', 'Números'], ['DEU', 'Deuteronomio'],
  ['JOS', 'Josué'], ['JDG', 'Jueces'], ['RUT', 'Rut'], ['1SA', '1 Samuel'], ['2SA', '2 Samuel'],
  ['1KI', '1 Reyes'], ['2KI', '2 Reyes'], ['1CH', '1 Crónicas'], ['2CH', '2 Crónicas'], ['EZR', 'Esdras'],
  ['NEH', 'Nehemías'], ['EST', 'Ester'], ['JOB', 'Job'], ['PSA', 'Salmos'], ['PRO', 'Proverbios'],
  ['ECC', 'Eclesiastés'], ['SNG', 'Cantares'], ['ISA', 'Isaías'], ['JER', 'Jeremías'], ['LAM', 'Lamentaciones'],
  ['EZK', 'Ezequiel'], ['DAN', 'Daniel'], ['HOS', 'Oseas'], ['JOL', 'Joel'], ['AMO', 'Amós'],
  ['OBA', 'Abdías'], ['JON', 'Jonás'], ['MIC', 'Miqueas'], ['NAM', 'Nahúm'], ['HAB', 'Habacuc'],
  ['ZEP', 'Sofonías'], ['HAG', 'Hageo'], ['ZEC', 'Zacarías'], ['MAL', 'Malaquías'],
  ['MAT', 'Mateo'], ['MRK', 'Marcos'], ['LUK', 'Lucas'], ['JHN', 'Juan'], ['ACT', 'Hechos'],
  ['ROM', 'Romanos'], ['1CO', '1 Corintios'], ['2CO', '2 Corintios'], ['GAL', 'Gálatas'], ['EPH', 'Efesios'],
  ['PHP', 'Filipenses'], ['COL', 'Colosenses'], ['1TH', '1 Tesalonicenses'], ['2TH', '2 Tesalonicenses'],
  ['1TI', '1 Timoteo'], ['2TI', '2 Timoteo'], ['TIT', 'Tito'], ['PHM', 'Filemón'], ['HEB', 'Hebreos'],
  ['JAS', 'Santiago'], ['1PE', '1 Pedro'], ['2PE', '2 Pedro'], ['1JN', '1 Juan'], ['2JN', '2 Juan'],
  ['3JN', '3 Juan'], ['JUD', 'Judas'], ['REV', 'Apocalipsis'],
];
const BOOKS_EN = [
  ['GEN', 'Genesis'], ['EXO', 'Exodus'], ['LEV', 'Leviticus'], ['NUM', 'Numbers'], ['DEU', 'Deuteronomy'],
  ['JOS', 'Joshua'], ['JDG', 'Judges'], ['RUT', 'Ruth'], ['1SA', '1 Samuel'], ['2SA', '2 Samuel'],
  ['1KI', '1 Kings'], ['2KI', '2 Kings'], ['1CH', '1 Chronicles'], ['2CH', '2 Chronicles'], ['EZR', 'Ezra'],
  ['NEH', 'Nehemiah'], ['EST', 'Esther'], ['JOB', 'Job'], ['PSA', 'Psalms'], ['PRO', 'Proverbs'],
  ['ECC', 'Ecclesiastes'], ['SNG', 'Song of Solomon'], ['ISA', 'Isaiah'], ['JER', 'Jeremiah'], ['LAM', 'Lamentations'],
  ['EZK', 'Ezekiel'], ['DAN', 'Daniel'], ['HOS', 'Hosea'], ['JOL', 'Joel'], ['AMO', 'Amos'],
  ['OBA', 'Obadiah'], ['JON', 'Jonah'], ['MIC', 'Micah'], ['NAM', 'Nahum'], ['HAB', 'Habakkuk'],
  ['ZEP', 'Zephaniah'], ['HAG', 'Haggai'], ['ZEC', 'Zechariah'], ['MAL', 'Malachi'],
  ['MAT', 'Matthew'], ['MRK', 'Mark'], ['LUK', 'Luke'], ['JHN', 'John'], ['ACT', 'Acts'],
  ['ROM', 'Romans'], ['1CO', '1 Corinthians'], ['2CO', '2 Corinthians'], ['GAL', 'Galatians'], ['EPH', 'Ephesians'],
  ['PHP', 'Philippians'], ['COL', 'Colossians'], ['1TH', '1 Thessalonians'], ['2TH', '2 Thessalonians'],
  ['1TI', '1 Timothy'], ['2TI', '2 Timothy'], ['TIT', 'Titus'], ['PHM', 'Philemon'], ['HEB', 'Hebrews'],
  ['JAS', 'James'], ['1PE', '1 Peter'], ['2PE', '2 Peter'], ['1JN', '1 John'], ['2JN', '2 John'],
  ['3JN', '3 John'], ['JUD', 'Jude'], ['REV', 'Revelation'],
];
const PERICOPE_SIZE = 6;
const BATCH_SIZE = Number.parseInt(process.env.BATCH_SIZE || '16', 10);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const bibliaRoot = path.join(repoRoot, 'biblia');
const BIBLE_ID = process.env.BIBLE_ID || 'rv-verbo';
const LANG = process.env.BIBLE_LANG || 'es';
const BOOKS = LANG === 'en' ? BOOKS_EN : BOOKS_ES;
// OUT_ID nombra la carpeta publicada bajo biblia/modules/semantic-search/bible-<OUT_ID>/
// — normalmente igual a BIBLE_ID, pero permite (ej. inglés) publicar el índice bajo un
// nombre propio (bible-en-bsb) que no colisiona con el manifest.json de la Biblia bsb.
const OUT_ID = process.env.OUT_ID || BIBLE_ID;
const bibleDir = path.join(bibliaRoot, 'modules', 'bibles', BIBLE_ID, 'books');
const outDir = path.join(bibliaRoot, 'modules', 'semantic-search', `bible-${OUT_ID}`);

env.cacheDir = path.join(__dirname, '.cache');

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// El `book` de BOOKS_ES/BOOKS_EN es el id CANÓNICO que usa el resto de la app
// (registry.defaultBible → rv-verbo → catalog.primary.manifest.books, lo que
// llena el <select> de libros y resuelve capítulos). Un resultado de búsqueda
// guarda ese id para poder navegar. Pero el NOMBRE DE ARCHIVO de una Biblia
// fuente concreta puede diferir del id canónico (ej. bsb/books/NAH.json para
// Nahúm, mientras el id canónico —y el de rv-verbo— es NAM); sin este mapa,
// el índice en inglés guardaría "NAH" y hacer clic en ese resultado fallaría
// porque el selector de libros no conoce ese id.
const FILE_ID_OVERRIDES = {
  bsb: { NAM: 'NAH' },
};

async function loadBibleVerses() {
  const overrides = FILE_ID_OVERRIDES[BIBLE_ID] || {};
  const rows = [];
  for (const [book, bookName] of BOOKS) {
    const file = path.join(bibleDir, `${overrides[book] || book}.json`);
    const data = JSON.parse(await readFile(file, 'utf8'));
    const chapters = Object.keys(data.chapters).map(Number).sort((a, b) => a - b);
    for (const chapter of chapters) {
      const verses = data.chapters[String(chapter)];
      const verseNumbers = Object.keys(verses).map(Number).sort((a, b) => a - b);
      for (const verse of verseNumbers) {
        rows.push({
          id: `${book}.${chapter}.${verse}`,
          book,
          bookName,
          chapterStart: chapter,
          verseStart: verse,
          chapterEnd: chapter,
          verseEnd: verse,
          label: `${bookName} ${chapter}:${verse}`,
          // Algunas Biblias guardan el verso como string plano (rv-verbo, bsb) y otras
          // como objeto {text, segments} (rva-1909 con Strong) — mismo patrón de
          // normalización que ya usa buildChapterData() en assets/module-loader.js.
          text: normalizeWhitespace(typeof verses[String(verse)] === 'string' ? verses[String(verse)] : verses[String(verse)].text),
        });
      }
    }
  }
  return rows;
}

function buildPericopes(verses) {
  const byChapter = new Map();
  for (const verse of verses) {
    const key = `${verse.book}.${verse.chapterStart}`;
    if (!byChapter.has(key)) byChapter.set(key, []);
    byChapter.get(key).push(verse);
  }

  const chunks = [];
  for (const chapterVerses of byChapter.values()) {
    for (let index = 0; index < chapterVerses.length; index += PERICOPE_SIZE) {
      const group = chapterVerses.slice(index, index + PERICOPE_SIZE);
      const first = group[0];
      const last = group[group.length - 1];
      chunks.push({
        id: `${first.book}.${first.chapterStart}.${first.verseStart}-${last.verseEnd}`,
        book: first.book,
        bookName: first.bookName,
        chapterStart: first.chapterStart,
        verseStart: first.verseStart,
        chapterEnd: last.chapterEnd,
        verseEnd: last.verseEnd,
        label: `${first.bookName} ${first.chapterStart}:${first.verseStart}-${last.verseEnd}`,
        text: group.map((verse) => `${verse.verseStart}. ${verse.text}`).join(' '),
        verses: group.map((verse) => ({
          book: verse.book,
          chapter: verse.chapterStart,
          verse: verse.verseStart,
        })),
      });
    }
  }
  return chunks;
}

function tensorRows(tensor, rowCount) {
  const dims = tensor.dims;
  const width = dims[dims.length - 1];
  const data = tensor.data;
  const rows = [];
  for (let row = 0; row < rowCount; row += 1) {
    const start = row * width;
    rows.push(data.slice(start, start + width));
  }
  return rows;
}

async function embedRecords(records) {
  const extractor = await pipeline('feature-extraction', MODEL);
  const vectors = [];
  for (let index = 0; index < records.length; index += BATCH_SIZE) {
    const batch = records.slice(index, index + BATCH_SIZE);
    const output = await extractor(batch.map((record) => record.text), {
      pooling: 'mean',
      normalize: true,
    });
    vectors.push(...tensorRows(output, batch.length));
    console.log(`Embedded ${Math.min(index + batch.length, records.length)}/${records.length}`);
  }
  return vectors;
}

function quantizeUnitVector(vector) {
  const quantized = new Int8Array(vector.length);
  for (let index = 0; index < vector.length; index += 1) {
    const value = Math.max(-1, Math.min(1, vector[index]));
    quantized[index] = Math.round(value * 127);
  }
  return quantized;
}

function sourceHash(records) {
  const hash = createHash('sha256');
  for (const record of records) hash.update(record.id).update(' ').update(record.text).update('\n');
  return hash.digest('hex').slice(0, 16);
}

async function writeIndex(name, records, vectors) {
  const dimensions = vectors[0].length;
  const vectorBytes = new Int8Array(records.length * dimensions);
  const metadata = {
    schemaVersion: 2,
    source: `biblia/modules/bibles/${BIBLE_ID}`,
    language: LANG,
    books: BOOKS.map(([id, name]) => ({ id, name })),
    model: MODEL,
    dimensions,
    metric: 'cosine',
    quantization: {
      type: 'int8',
      scale: 127,
      note: 'Vectors are L2-normalized before scalar int8 quantization; approximate cosine is dot(query, int8/127).',
    },
    chunking: name === 'pericopes'
      ? { strategy: 'fixed_verse_windows_by_chapter', versesPerChunk: PERICOPE_SIZE, overlap: 0 }
      : { strategy: 'single_verse' },
    vectorFile: `${name}.i8.bin`,
    generatedAt: new Date().toISOString(),
    sourceHash: sourceHash(records),
    recordCount: records.length,
    records: records.map((record, index) => ({
      id: record.id,
      book: record.book,
      bookName: record.bookName,
      chapterStart: record.chapterStart,
      verseStart: record.verseStart,
      chapterEnd: record.chapterEnd,
      verseEnd: record.verseEnd,
      label: record.label,
      text: record.text,
      offset: index * dimensions,
      length: dimensions,
      ...(record.verses ? { verses: record.verses } : {}),
    })),
  };

  vectors.forEach((vector, index) => {
    vectorBytes.set(quantizeUnitVector(vector), index * dimensions);
  });

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, `${name}.i8.bin`), vectorBytes);
  await writeFile(path.join(outDir, `${name}.meta.json`), JSON.stringify(metadata, null, 2) + '\n');

  const binStat = await stat(path.join(outDir, `${name}.i8.bin`));
  const metaStat = await stat(path.join(outDir, `${name}.meta.json`));
  console.log(`${name}: ${records.length} records, ${dimensions} dims`);
  console.log(`${name}.i8.bin: ${binStat.size.toLocaleString()} bytes`);
  console.log(`${name}.meta.json: ${metaStat.size.toLocaleString()} bytes`);
}

async function main() {
  const verses = await loadBibleVerses();
  const pericopes = buildPericopes(verses);
  console.log(`Loaded ${verses.length} verses and ${pericopes.length} fixed pericope chunks from ${BIBLE_ID} (${LANG})`);
  console.log(`Publishing to ${outDir}`);

  const expectedBooks = BOOKS.length;
  const seenBooks = new Set(verses.map((v) => v.book));
  if (seenBooks.size !== expectedBooks) {
    throw new Error(`Se esperaban ${expectedBooks} libros, se encontraron ${seenBooks.size}`);
  }

  console.log('Building verse index...');
  await writeIndex('verses', verses, await embedRecords(verses));

  console.log('Building pericope index...');
  await writeIndex('pericopes', pericopes, await embedRecords(pericopes));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
