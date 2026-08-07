/* Traducción en vivo para contenido largo fuera del diccionario estático de
   interfaz (VerboI18n): ensayos de Misión/Fundador, catálogo de Librería y
   Recursos. Mismo mecanismo que ya usa /biblia/ para Comentario/Strong —
   POST /translate en el Worker verbo-api-bible (Claude Haiku 4.5 + caché
   compartido en Cloudflare KV, ver cloudflare/api-bible-worker/README.md)
   + caché en localStorage compartida (mismo prefijo 'verbo:t:') — pero
   reutilizable desde cualquier página del sitio. Marca cada bloque a
   traducir con data-i18n-live (opcionalmente data-i18n-live="id-estable"
   para una clave de caché legible). */
(function(){
  'use strict';
  const T_PREFIX = 'verbo:t:';
  function tcacheGet(key){ try{ return JSON.parse(localStorage.getItem(T_PREFIX+key)); }catch{ return null; } }
  function tcacheSet(key,val){ try{ localStorage.setItem(T_PREFIX+key, JSON.stringify(val)); }catch{} }

  function hashText(text){
    let hash=2166136261;
    const value=String(text||'');
    for(let i=0;i<value.length;i++){ hash^=value.charCodeAt(i); hash=Math.imul(hash,16777619); }
    return (hash>>>0).toString(16);
  }
  function cacheKey(id, text, targetLang){ return `v4:${targetLang}:${id}:${hashText(text)}`; }

  function splitTextIntoChunks(text, maxLen=4500){
    const chunks=[];
    while(text.length>maxLen){
      let idx=text.lastIndexOf('. ',maxLen);
      if(idx<maxLen/2) idx=text.lastIndexOf(' ',maxLen);
      if(idx<0) idx=maxLen;
      chunks.push(text.slice(0,idx+1).trim());
      text=text.slice(idx+1).trim();
    }
    if(text) chunks.push(text);
    return chunks;
  }

  // Resuelto relativo a la ubicación de este script (no a la página que lo
  // incluye) — mismo motivo y mismo patrón que REGISTRY_URL en assets/sync.js:
  // este archivo se carga desde fuera de /biblia/ (Misión, Fundador, Librería,
  // Recursos), así que 'modules/registry.json' relativo a la página rompería.
  const REGISTRY_URL = (() => {
    const src = (document.currentScript && document.currentScript.src) || '';
    const scriptDir = src ? src.split('?')[0].replace(/[^/]+$/, '') : './';
    return scriptDir + '../modules/registry.json';
  })();
  let workerBasePromise = null;
  function translateWorkerBase(){
    if(!workerBasePromise){
      workerBasePromise = fetch(REGISTRY_URL).then(r=>r.json())
        .then(registry => String(registry.apiBible?.proxyUrl || '').trim().replace(/\/+$/, ''))
        .catch(() => '');
    }
    return workerBasePromise;
  }

  async function verboTranslate(text, sourceLang, targetLang){
    // Fase 2 (2026-08-07): reemplaza el endpoint no oficial de Google
    // Translate por POST /translate en el Worker verbo-api-bible — mismo
    // cambio y mismos reintentos que assets/app.js.
    async function fetchTranslateOnce(chunk){
      const base=await translateWorkerBase();
      if(!base) return null;
      const controller=new AbortController();
      const timeoutId=setTimeout(()=>controller.abort(), 12000);
      try{
        const resp=await fetch(`${base}/translate`, {
          method:'POST',
          headers:{ 'Content-Type':'application/json' },
          body:JSON.stringify({ text:chunk, targetLang }),
          signal:controller.signal
        });
        if(!resp.ok) return null;
        const json=await resp.json();
        return typeof json?.translation==='string' ? json.translation : null;
      }catch{ return null; }
      finally{ clearTimeout(timeoutId); }
    }
    async function fetchTranslate(chunk, attempts=3){
      for(let i=0;i<attempts;i++){
        const result=await fetchTranslateOnce(chunk);
        if(result!==null) return result;
        if(i<attempts-1) await new Promise(resolve=>setTimeout(resolve,300*(i+1)));
      }
      console.error(`[traducción] /translate no respondió tras ${attempts} intentos — se muestra el texto original sin traducir.`);
      return null;
    }
    if(text.length<=4500) return fetchTranslate(text);
    const chunks=splitTextIntoChunks(text);
    const parts=[];
    for(const chunk of chunks){
      const r=await fetchTranslate(chunk);
      if(r===null) return null;
      parts.push(r);
    }
    return parts.join(' ');
  }

  async function translateElement(el, id, sourceLang, targetLang){
    if(el.dataset.origText == null) el.dataset.origText = el.textContent;
    const original = el.dataset.origText;
    if(!original || !original.trim()) return;
    const key = cacheKey(id, original, targetLang);
    let translated = tcacheGet(key);
    if(!translated){
      translated = await verboTranslate(original, sourceLang, targetLang);
      if(!translated) return;
      tcacheSet(key, translated);
    }
    el.textContent = translated;
    el.dataset.translated = targetLang;
  }

  function restoreElement(el){
    if(el.dataset.origText != null){ el.textContent = el.dataset.origText; delete el.dataset.translated; }
  }

  // Variante sin DOM: traduce un string suelto (con el mismo caché) y lo
  // devuelve. Para consumidores que no renderizan vía textContent directo
  // (ej. el lector de Librería, que reconstruye párrafos a mano para poder
  // superponer el resaltado). Si falla la traducción, devuelve el original.
  async function translateText(text, id, sourceLang, targetLang){
    if(!text || !text.trim()) return text;
    const key = cacheKey(id, text, targetLang);
    let translated = tcacheGet(key);
    if(!translated){
      translated = await verboTranslate(text, sourceLang, targetLang);
      if(!translated) return text;
      tcacheSet(key, translated);
    }
    return translated;
  }

  // Aplica a todo [data-i18n-live] dentro de root según el idioma activo de
  // VerboI18n. El sitio nace en español, así que sourceLang es 'es' salvo
  // que se indique otra cosa.
  async function applyLiveTranslation(root, sourceLang){
    if(!window.VerboI18n) return;
    sourceLang = sourceLang || 'es';
    const targetLang = VerboI18n.getUiLang();
    const els = [...(root||document).querySelectorAll('[data-i18n-live]')];
    if(targetLang===sourceLang){ els.forEach(restoreElement); return; }
    let i=0;
    for(const el of els){
      const id = el.getAttribute('data-i18n-live') || `${location.pathname}:${i++}`;
      await translateElement(el, id, sourceLang, targetLang);
    }
  }

  window.VerboSiteTranslate = { applyLiveTranslation, translateText };
})();
