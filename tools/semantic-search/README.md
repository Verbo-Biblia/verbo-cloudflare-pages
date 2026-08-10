# Verbo semantic search (Bible only)

Offline generator for semantic search over the Bible. This tool exists only for the Bible — the semantic search over Church History (`build-church-history-index.mjs`) is a separate, unrelated feature that lives in the same folder and is not touched by anything below.

There are two independent monolingual indexes, one per interface language, each built from a Bible that Verbo can legally serialize in bulk:

| Language | Source Bible | Why |
|---|---|---|
| es | `biblia/modules/bibles/rv-verbo` (Biblia Verbo) | Verbo's own canonical Spanish text. |
| en | `biblia/modules/bibles/bsb` (Berean Standard Bible) | Public domain, already local, contemporary English. NASB (the default *visual* English Bible) is remote via API.Bible and cannot be bulk-downloaded/serialized into a local index — see `AGENTS.md` licensing note. |

The index only finds **references** (book/chapter/verse). The app always displays the result in the reader's **active** Bible version, whatever that is — see `resolveResultsToActiveVersion` in `biblia/assets/app.js`. The source Bible above only affects (a) what text is embedded for ranking, and (b) the text shown in the results list as a preview when the active version is remote (labeled, never silent).

No backend, no per-query LLM/API cost: the embedding model runs locally in the browser (transformers.js via CDN, WASM/ONNX), the same model used to build these indexes:

`Xenova/paraphrase-multilingual-MiniLM-L12-v2` (multilingual — this is what makes a single model usable for both the es and en indexes without training/hosting anything separately)

## Commands

```bash
npm install

# Spanish index (Biblia Verbo) — publishes straight to
# biblia/modules/semantic-search/bible-rv-verbo/
npm run build:bible
npm run eval:preset
npm run eval -- --question "¿Qué dijo Jesús sobre el divorcio?"

# English index (BSB) — publishes straight to
# biblia/modules/semantic-search/bible-en-bsb/
npm run build:bible:en
npm run eval:en:preset
npm run eval -- --lang en --question "what does the Bible say about anxiety"
```

`build-index.mjs` reads `BIBLE_ID`/`BIBLE_LANG`/`OUT_ID` from the environment (see `package.json` scripts above for the values used for es/en) and writes directly to `biblia/modules/semantic-search/bible-<OUT_ID>/` — there is no manual copy step, unlike the old workflow. This was a real footgun before: the index was built to a local `out/` folder and had to be copied by hand into `biblia/`, and that copy step was the thing that never actually happened after the site moved under `biblia/` (see git history) — the client pointed at a path that was never published. Don't reintroduce a manual copy step.

Running both builds back to back on the same machine is CPU/RAM-bound (embedding ~31k Bible verses + ~5.7k six-verse pericopes takes real time on a modest machine); don't run them concurrently on a constrained box.

## Indexes

Each `biblia/modules/semantic-search/bible-<id>/` folder has:

- `verses.i8.bin` / `verses.meta.json` — one vector per verse.
- `pericopes.i8.bin` / `pericopes.meta.json` — one vector per fixed six-verse window within a chapter (no overlap). This is the **default** unit in the UI: an isolated short verse (e.g. "Jesus wept.") carries little semantic signal on its own, but the same verse inside its six-verse window ranks far better (see the "chisme"/gossip case documented inline in `module-loader.js`).

The binary files are int8-quantized, L2-normalized vectors (`dot(query, vector/127)` approximates cosine similarity). Metadata (`*.meta.json`) contains, per record: reference (book/chapter/verse range), label, source text, vector offset/length, plus index-level fields: `language`, `model`, `dimensions`, `generatedAt`, `sourceHash` (first 16 hex chars of a sha256 over every record's id+text, to detect a stale/rebuilt-differently index), `recordCount`, and `source` (which Bible module it came from).

## Client integration

`biblia/assets/module-loader.js` (`searchSemanticBible`) loads the index for the requested `lang` (`semanticSearch.basePaths.es` / `.en`), embeds the query with the same model, ranks by cosine + a lexical boost + hand-tuned expansions/adjustments (stopwords and query-expansion rules exist in both a Spanish and an English variant). `biblia/assets/app.js` picks `lang` from the interface language toggle (`contentLang()`, same convention as the Strong Bible panel), short-circuits straight to navigation for direct references ("Juan 3:16", "Jn 3 16", "Romanos 8", "John 3:16" — no point spending a semantic query on those), and resolves the results list to the reader's actual active Bible version when that version is local (falls back to a labeled preview in the index's source Bible when the active version is remote, to avoid an unbounded number of API.Bible calls per search).
