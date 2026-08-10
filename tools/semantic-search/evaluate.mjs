import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, pipeline } from '@xenova/transformers';

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
const TOP_K = 15;

const PRESET_QUESTIONS_ES = [
  '¿Qué dijo Jesús sobre el divorcio?',
  '¿Cómo debo perdonar a quien me ofende muchas veces?',
  'El amor de Dios por los perdidos',
  '¿Qué enseñó Jesús sobre el dinero y las riquezas?',
  'Promesas de Jesús para los que están cansados',
  '¿Qué dijo Jesús sobre la oración a solas?',
  'El nuevo nacimiento',
  '¿Cómo trató Jesús a los pecadores y marginados?',
  'Advertencias sobre los falsos profetas',
  '¿Qué dijo Jesús en la cruz?',
  'ansiedad',
  'miedo al futuro',
  'perdonar a mis enemigos',
  'muerte de un ser querido',
  'Dios me abandonó',
  'matrimonio',
  'tentación',
  'orgullo',
  'depresión y tristeza',
  'esperanza',
  'Espíritu Santo',
  'salvación por gracia',
  'resurrección',
  'cómo tratar a los pobres',
  'liderazgo',
  'crianza de hijos',
  'sabiduría',
  'oración',
  'sufrimiento',
];

const PRESET_QUESTIONS_EN = [
  'what does the Bible say about anxiety',
  'verses about forgiving enemies',
  'God is with me when I am afraid',
  'fear of the future',
  'the death of a loved one',
  'God has abandoned me',
  'marriage',
  'temptation',
  'love of money',
  'pride',
  'depression and sadness',
  'hope',
  'the Holy Spirit',
  'salvation by grace',
  'resurrection',
  'how to treat the poor',
  'leadership',
  'raising children',
  'wisdom',
  'prayer',
  'suffering',
  'I have no strength to go on',
  'what Jesus taught about money',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const bibliaRoot = path.join(repoRoot, 'biblia');
env.cacheDir = path.join(__dirname, '.cache');

function parseArgs(argv) {
  const args = { preset: false, question: null, lang: 'es' };
  const rest = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--preset') args.preset = true;
    else if (argv[index] === '--lang') { args.lang = argv[index + 1] || 'es'; index += 1; }
    else if (argv[index] === '--question' || argv[index] === '-q') { args.question = argv[index + 1]; index += 1; }
    else rest.push(argv[index]);
  }
  if (!args.question && rest.length) args.question = rest.join(' ').trim();
  return args;
}

async function loadIndex(outDir, name) {
  const metadata = JSON.parse(await readFile(path.join(outDir, `${name}.meta.json`), 'utf8'));
  const bytes = await readFile(path.join(outDir, metadata.vectorFile));
  return {
    name,
    metadata,
    vectors: new Int8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength),
  };
}

function tensorVector(tensor) {
  return tensor.data;
}

const STOPWORDS_ES = new Set([
  'a','al','ante','bajo','con','contra','de','del','desde','el','en','entre','es','la','las','lo','los','mas','me','mi','no','o','para','por','que','se','sin','sobre','su','sus','te','tu','un','una','y',
  'como','cual','cuales','quien','quienes','cuando','donde','porque','dijo','dios','jesus','senor','sobre','todos',
  'habla','hablan','hablar','hablo','dice','dicen','decir','biblia','escritura','escrituras',
  'versiculo','versiculos','capitulo','capitulos','pasaje','pasajes','menciona','mencionan',
  'trata','tratan','tema','acerca','respecto','hay','existe','existen','ejemplo','ejemplos',
  'significa','significado','version','opina','opinar',
]);
const QUERY_EXPANSIONS_ES = [
  { test:/\bdivorci|\brepudi/i, terms:['divorcio','repudiar','repudiarla','repudiare','repudiada','mujer','adulterio'] },
  { test:/\bperdon|\bofend/i, terms:['perdon','perdona','perdonados','perdonareis','perdonale','misericordia','deudas','ofensas'] },
  { test:/\bperdid|\bsalvar|\bsalvaci/i, terms:['perdido','perdidos','salvar','salvo','salvacion','misericordia','pecadores'] },
  { test:/\bdinero|\briquez|\brico|\btesoro/i, terms:['dinero','riquezas','ricos','rico','tesoro','pobres','ofrenda','mammon'] },
  { test:/\bcansad|\bdescans/i, terms:['cansados','trabajados','cargados','descanso','descansar','venid'] },
  { test:/\boraci|\borar|\bsolas|\bsecreto/i, terms:['orar','oracion','orando','aposento','secreto','padre','hipocritas'] },
  { test:/\bnuevo nacimiento|\bnacer|\bnacim/i, terms:['nacer','nacido','nacimiento','nicodemo','otra','vez','agua','espiritu'] },
  { test:/\bpecador|\bmargin|\bpublican|\benfer/i, terms:['pecadores','publicanos','misericordia','enfermos','samaritano','zacheo'] },
  { test:/\bfals[oa]s? profet|\bengañ/i, terms:['falsos','profetas','enganaran','enganar','lobos','Cristos'] },
  { test:/\bcruz|\bcrucific/i, terms:['cruz','crucificado','crucificar','calvario','golgota','madero'] },
  { test:/\bdijo\b.*\bcruz|\bcruz\b.*\bdijo|\bpalabras?\b.*\bcruz/i, terms:['padre','perdonalos','paraiso','encomiendo','espiritu','sed','consumado','madre','hijo'] },
];

const STOPWORDS_EN = new Set([
  'a','an','the','and','or','but','if','of','to','in','on','at','for','with','about','as','by','from','is','are','was','were','be','been','it','this','that','what','who','how','when','where','why',
  'do','does','did','say','says','said','bible','scripture','scriptures','verse','verses','chapter','chapters','passage','passages','mention','mentions','topic','regarding','example','examples','mean','meaning','version','god','jesus','lord',
]);
const QUERY_EXPANSIONS_EN = [
  { test:/\bdivorce|\bdivorced/i, terms:['divorce','divorced','adultery','wife','marriage'] },
  { test:/\bforgiv|\boffen/i, terms:['forgive','forgiven','forgiveness','mercy','debts','offenses'] },
  { test:/\blost|\bsav(e|ing|ed|ation)/i, terms:['lost','save','saved','salvation','mercy','sinners'] },
  { test:/\bmoney|\bwealth|\brich|\btreasure/i, terms:['money','wealth','riches','rich','treasure','poor','offering'] },
  { test:/\btired|\brest|\bweary/i, terms:['weary','burdened','rest','labor','come'] },
  { test:/\bpray(er)?|\balone|\bsecret/i, terms:['pray','prayer','praying','room','secret','father','hypocrites'] },
  { test:/\bborn again|\bbirth/i, terms:['born','again','birth','nicodemus','water','spirit'] },
  { test:/\bsinner|\boutcast|\bsick/i, terms:['sinners','tax','collectors','mercy','sick','samaritan','zacchaeus'] },
  { test:/\bfalse prophet|\bdeceiv/i, terms:['false','prophets','deceive','wolves','christs'] },
  { test:/\bcross|\bcrucif/i, terms:['cross','crucified','crucify','calvary','golgotha'] },
  { test:/\banxi(ety|ous)|\bworry|\bworried/i, terms:['anxious','worry','worried','troubled','cares','afraid'] },
];

function normalizeSearchText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function queryTokens(query, lang) {
  const stopwords = lang === 'en' ? STOPWORDS_EN : STOPWORDS_ES;
  const expansions = lang === 'en' ? QUERY_EXPANSIONS_EN : QUERY_EXPANSIONS_ES;
  const tokens = normalizeSearchText(query).split(' ').filter((token) => token.length > 2 && !stopwords.has(token));
  const expanded = new Set(tokens);
  expansions.forEach((rule) => {
    if (!rule.test.test(query)) return;
    rule.terms.forEach((term) => expanded.add(normalizeSearchText(term)));
  });
  return [...expanded].filter(Boolean);
}

function lexicalBoost(record, tokens) {
  if (!tokens.length) return 0;
  const haystack = ` ${normalizeSearchText(`${record.label} ${record.text}`)} `;
  let hits = 0;
  let strongHits = 0;
  tokens.forEach((token) => {
    if (haystack.includes(` ${token} `)) {
      hits += 1;
      strongHits += 1;
    } else if (token.length > 4 && haystack.includes(token.slice(0, -1))) {
      hits += 0.7;
    }
  });
  const coverage = hits / tokens.length;
  return Math.min(0.4, coverage * 0.3 + strongHits * 0.03);
}

function searchIndex(index, queryVector, query, lang) {
  const { dimensions, records } = index.metadata;
  const tokens = queryTokens(query, lang);
  const results = [];
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const offset = recordIndex * dimensions;
    let score = 0;
    for (let dim = 0; dim < dimensions; dim += 1) {
      score += queryVector[dim] * (index.vectors[offset + dim] / 127);
    }
    score += lexicalBoost(records[recordIndex], tokens);
    results.push({ score, record: records[recordIndex] });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, TOP_K);
}

function trim(text, max = 145) {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

function printSideBySide(question, verseResults, pericopeResults) {
  console.log(`\n## ${question}\n`);
  console.log('| # | Versículo | score | Texto | Perícopa | score | Texto |');
  console.log('|---:|---|---:|---|---|---:|---|');
  for (let index = 0; index < TOP_K; index += 1) {
    const verse = verseResults[index];
    const pericope = pericopeResults[index];
    console.log([
      `| ${index + 1}`,
      verse.record.label,
      verse.score.toFixed(4),
      trim(verse.record.text).replaceAll('|', '\\|'),
      pericope.record.label,
      pericope.score.toFixed(4),
      trim(pericope.record.text).replaceAll('|', '\\|'),
      '|',
    ].join(' | '));
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const questions = args.preset ? (args.lang === 'en' ? PRESET_QUESTIONS_EN : PRESET_QUESTIONS_ES) : [args.question];
  if (!questions[0]) {
    console.error('Usage: node evaluate.mjs --question "¿Qué dijo Jesús sobre el divorcio?" [--lang es|en]');
    console.error('   or: node evaluate.mjs --preset [--lang es|en]');
    process.exit(1);
  }

  const outId = args.lang === 'en' ? 'en-bsb' : 'rv-verbo';
  const outDir = path.join(bibliaRoot, 'modules', 'semantic-search', `bible-${outId}`);
  const [verses, pericopes] = await Promise.all([loadIndex(outDir, 'verses'), loadIndex(outDir, 'pericopes')]);
  const extractor = await pipeline('feature-extraction', MODEL);

  for (const question of questions) {
    const output = await extractor(question, { pooling: 'mean', normalize: true });
    const queryVector = tensorVector(output);
    printSideBySide(
      question,
      searchIndex(verses, queryVector, question, args.lang),
      searchIndex(pericopes, queryVector, question, args.lang),
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
