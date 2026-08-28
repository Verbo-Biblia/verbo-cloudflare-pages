(function(){
  'use strict';

  const EVENT_NAME='verbo:selected-passage-changed';
  const PACKAGE_ROOT='modules/study-assistant/chapters';
  const CATEGORIES=['diccionario','historia','costumbres'];
  const INITIAL_LIMITS={diccionario:8,historia:3,costumbres:3};
  const TRANSLATE_MAX_RESOURCES=100;
  const TRANSLATE_MAX_RESOURCE_CHARS=4000;
  const TRANSLATE_MAX_TOTAL_CHARS=12000; // debe coincidir con STUDY_TRANSLATE_MAX_TOTAL_CHARS en worker.js
  const cache=new Map();
  const translationCache=new Map();
  const pendingTranslationKeys=new Set();
  let requestGeneration=0;
  let controlSequence=0;
  let currentContext=null;
  let currentResources=null;
  let translationBasePromise=null;

  const assistant=()=>document.getElementById('studyAssistant');
  const t=(key,vars)=>window.VerboI18n?.t(`studyAssistant.${key}`,vars) || key;
  const element=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className) node.className=className;
    if(text!==undefined) node.textContent=text;
    return node;
  };

  function passageReference(context){
    if(!context?.ranges?.length) return '';
    const book=window.VerboPassageSelection?.getBookLabel?.(context.book) || context.book;
    const chapter=Number(context.ranges[0].chapterStart);
    const parts=context.ranges.map(range=>{
      const start=Number(range.verseStart);
      const end=Number(range.verseEnd);
      return start===end ? String(start) : `${start}-${end}`;
    });
    return `${book} ${chapter}:${parts.join(', ')}`;
  }

  function buildShell(context){
    const root=assistant();
    if(!root) return null;
    const header=element('header','study-assistant__header');
    header.appendChild(element('div','study-assistant__kicker',t('title')));
    const reference=element('div','study-assistant__reference',passageReference(context));
    reference.hidden=!context?.ranges?.length;
    header.appendChild(reference);
    const body=element('div','study-assistant__content');
    root.replaceChildren(header,body);
    return body;
  }

  function renderState(kind,message,context=currentContext){
    const root=assistant();
    const body=buildShell(context);
    if(!root || !body) return;
    if(context?.ranges?.length){
      root.dataset.studyBook=context.book;
      root.dataset.studyChapter=String(context.ranges[0].chapterStart);
    }else{
      delete root.dataset.studyBook;
      delete root.dataset.studyChapter;
    }
    const state=element('div',`study-assistant__state study-assistant__state--${kind}`);
    if(kind==='loading') state.appendChild(element('span','study-assistant__loading-mark'));
    state.appendChild(element('p','',message));
    body.appendChild(state);
  }

  function renderNoSelection(){
    renderState('empty',t('selectPassage'),null);
  }

  function loadPackage(book,chapter){
    const key=`${book}:${chapter}`;
    if(cache.has(key)) return cache.get(key);
    const request=fetch(`${PACKAGE_ROOT}/${encodeURIComponent(book)}/${chapter}.json`)
      .then(response=>{
        if(!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(packageData=>{
        if(packageData.book!==book || Number(packageData.chapter)!==chapter){
          throw new Error('El paquete no corresponde al pasaje solicitado.');
        }
        return packageData;
      })
      .catch(error=>{
        cache.delete(key);
        throw error;
      });
    cache.set(key,request);
    return request;
  }

  function selectedVerses(context){
    const chapter=Number(context.ranges[0].chapterStart);
    const verses=[];
    const seen=new Set();
    for(const range of context.ranges){
      if(Number(range.chapterStart)!==chapter || Number(range.chapterEnd)!==chapter){
        throw new Error('La selección entre capítulos todavía no está disponible.');
      }
      for(let verse=Number(range.verseStart); verse<=Number(range.verseEnd); verse++){
        if(!seen.has(verse)){
          seen.add(verse);
          verses.push(verse);
        }
      }
    }
    return {chapter,verses};
  }

  function collectResources(packageData,verses){
    const collected={diccionario:[],historia:[],costumbres:[]};
    const seen={diccionario:new Set(),historia:new Set(),costumbres:new Set()};
    for(const verse of verses){
      const references=packageData.verses[String(verse)] || {};
      for(const category of CATEGORIES){
        for(const identifier of references[category] || []){
          if(seen[category].has(identifier)) continue;
          const resource=packageData.resources[category]?.[identifier];
          if(!resource) throw new Error(`Referencia de recurso inexistente: ${identifier}`);
          seen[category].add(identifier);
          collected[category].push(resource);
        }
      }
    }
    return collected;
  }

  function moduleLabel(module){
    const labels={
      'book-classification-nt':'sourceBookContext',
      'book-classification-ot':'sourceBookContext',
      'concilios-temas':'sourceCouncils',
      'eusebio-historia-eclesiastica':'sourceEusebius',
      'bernabe':'sourceBarnabas',
      'clemente-1':'sourceClement',
      'didache':'sourceDidache',
      'hermas-pastor':'sourceHermas',
      'mathietes-diogneto':'sourceDiognetus',
      'policarpo-filipenses':'sourcePolycarp',
      'freeman-manners-customs':'sourceFreeman',
      'tucker-roman-world':'sourceTucker'
    };
    return labels[module] ? t(labels[module]) : module;
  }

  const uiLanguage=()=>window.VerboI18n?.getUiLang()==='en'?'en':'es';

  function resourceOriginal(item,category){
    return category==='diccionario' ? item.termino : item.texto;
  }

  function translationKey(item,targetLanguage){
    const metadata=item.traduccion;
    return metadata
      ? `${metadata.sourceLanguage}-${targetLanguage}:${metadata.resourceId}:${metadata.sourceHash}`
      : '';
  }

  function resourceDisplay(item,category){
    const original=resourceOriginal(item,category);
    const metadata=item.traduccion;
    const targetLanguage=uiLanguage();
    if(!metadata || metadata.sourceLanguage===targetLanguage) return {text:original,key:'',pending:false};
    const key=translationKey(item,targetLanguage);
    return {text:translationCache.get(key)||original,key,pending:!translationCache.has(key)};
  }

  function navigationFor(item,category){
    const source=item.fuente||{};
    if(category==='diccionario' && source.entryId){
      const moduleId=source.modulo==='Easton'?'easton-bible-dictionary':source.modulo==='Smith'?'smith-bible-dictionary':'';
      return moduleId ? {panel:'diccionarios',moduleId,entryId:source.entryId,label:'viewDictionary'} : null;
    }
    if(source.modulo==='eusebio-historia-eclesiastica' && source.entradaId){
      return {panel:'historia',moduleId:source.modulo,entryId:source.entradaId,label:'viewHistory'};
    }
    if(['freeman-manners-customs','tucker-roman-world'].includes(source.modulo) && source.entradaId){
      return {panel:'costumbres',moduleId:source.modulo,entryId:source.entradaId,label:'viewCustoms'};
    }
    if(Array.isArray(source.seccionIds) && source.seccionIds.length){
      return {panel:'padres',moduleId:source.modulo,entryId:source.seccionIds[0],label:'viewFathers'};
    }
    return null;
  }

  function navigationButton(item,category){
    const navigation=navigationFor(item,category);
    if(!navigation) return null;
    const button=element('button',`study-assistant__resource-link study-assistant__resource-link--${navigation.panel}`,t(navigation.label));
    button.type='button';
    button.addEventListener('click',()=>window.VerboResourceNavigation?.open(navigation));
    return button;
  }

  function translationStatus(display){
    if(!display.pending) return null;
    const status=element('small','study-assistant__translation-status',t('translating'));
    status.dataset.studyTranslationStatus=display.key;
    return status;
  }

  function sourceLabel(source){
    const module=moduleLabel(source?.modulo || '');
    const isBookContext=source?.modulo==='book-classification-nt' || source?.modulo==='book-classification-ot';
    const location=isBookContext ? '' : source?.libroSeccion;
    return [module,location].filter(Boolean).join(' · ');
  }

  function historyTypeLabel(type){
    const keys={
      'contexto-libro':'typeContext',
      'circunstancia':'typeCircumstance',
      'evento':'typeEvent',
      'recepcion-doctrinal':'typeReception'
    };
    return keys[type] ? t(keys[type]) : '';
  }

  function renderTerm(item){
    const entry=element('li','study-assistant__term');
    const display=resourceDisplay(item,'diccionario');
    const main=element('div','study-assistant__term-main');
    const name=element('span','study-assistant__term-name',display.text);
    if(display.key) name.dataset.studyTranslationKey=display.key;
    main.appendChild(name);
    const status=translationStatus(display);
    if(status) main.appendChild(status);
    const action=navigationButton(item,'diccionario');
    if(action) main.appendChild(action);
    entry.appendChild(main);
    entry.appendChild(element('small','study-assistant__term-source',moduleLabel(item.fuente?.modulo || '')));
    return entry;
  }

  function renderTextEntry(item,category){
    const article=element('article','study-assistant__entry');
    const source=element('div','study-assistant__entry-source',sourceLabel(item.fuente));
    article.appendChild(source);
    const type=category==='historia' ? historyTypeLabel(item.tipo) : '';
    if(type) article.appendChild(element('div','study-assistant__type',type));

    const display=resourceDisplay(item,category);
    const paragraph=element('p',`study-assistant__text study-assistant__text--${category}`,display.text);
    if(display.key) paragraph.dataset.studyTranslationKey=display.key;
    article.appendChild(paragraph);
    const status=translationStatus(display);
    if(status) article.appendChild(status);
    const action=navigationButton(item,category);
    if(action) article.appendChild(action);
    return article;
  }

  function translationWorkerBase(){
    if(!translationBasePromise){
      translationBasePromise=window.VerboModules.getCatalog()
        .then(catalog=>String(catalog?.registry?.apiBible?.proxyUrl||'').trim().replace(/\/+$/,''))
        .catch(()=> '');
    }
    return translationBasePromise;
  }

  function resourcesNeedingTranslation(resources,targetLanguage){
    const unique=new Map();
    for(const category of CATEGORIES){
      for(const item of resources[category]){
        const metadata=item.traduccion;
        const text=resourceOriginal(item,category);
        if(!metadata || metadata.sourceLanguage===targetLanguage || text.length>TRANSLATE_MAX_RESOURCE_CHARS) continue;
        const key=translationKey(item,targetLanguage);
        if(translationCache.has(key) || pendingTranslationKeys.has(key)) continue;
        unique.set(metadata.resourceId,{
          key,
          resourceId:metadata.resourceId,
          sourceLanguage:metadata.sourceLanguage,
          sourceHash:metadata.sourceHash,
          text,
        });
      }
    }
    return [...unique.values()];
  }

  function translationBatches(items){
    const batches=[];
    let batch=[];
    let chars=0;
    for(const item of items){
      if(batch.length && (batch.length>=TRANSLATE_MAX_RESOURCES || chars+item.text.length>TRANSLATE_MAX_TOTAL_CHARS)){
        batches.push(batch);
        batch=[];
        chars=0;
      }
      batch.push(item);
      chars+=item.text.length;
    }
    if(batch.length) batches.push(batch);
    return batches;
  }

  function applyTranslationToMountedNodes(key,translation){
    const root=assistant();
    if(!root) return;
    root.querySelectorAll('[data-study-translation-key]').forEach(node=>{
      if(node.dataset.studyTranslationKey===key) node.textContent=translation;
    });
    root.querySelectorAll('[data-study-translation-status]').forEach(node=>{
      if(node.dataset.studyTranslationStatus===key) node.remove();
    });
  }

  async function resolveTranslationBatch(batch,generation,targetLanguage){
    batch.forEach(item=>pendingTranslationKeys.add(item.key));
    try{
      const base=await translationWorkerBase();
      if(!base) return;
      const response=await fetch(`${base}/translate-study-assistant`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          targetLanguage,
          resources:batch.map(({resourceId,sourceLanguage,sourceHash,text})=>({resourceId,sourceLanguage,sourceHash,text})),
        }),
      });
      if(!response.ok) return;
      const payload=await response.json();
      for(const item of batch){
        const translation=payload?.translations?.[item.resourceId]?.translation;
        if(typeof translation!=='string' || !translation.trim()) continue;
        translationCache.set(item.key,translation.trim());
        if(generation===requestGeneration) applyTranslationToMountedNodes(item.key,translation.trim());
      }
    }catch(error){
      console.warn('No se pudo resolver una traducción del Asistente.',error);
    }finally{
      batch.forEach(item=>pendingTranslationKeys.delete(item.key));
    }
  }

  function resolveMissingTranslations(resources,generation){
    const targetLanguage=uiLanguage();
    const batches=translationBatches(resourcesNeedingTranslation(resources,targetLanguage));
    batches.forEach(batch=>resolveTranslationBatch(batch,generation,targetLanguage));
  }

  function renderSection(category,title,items){
    const section=element('section',`study-assistant__section study-assistant__section--${category}`);
    const contentId=`study-assistant-section-${category}-${++controlSequence}`;
    const heading=element('h2','study-assistant__heading');
    const sectionToggle=element('button','study-assistant__section-toggle');
    sectionToggle.type='button';
    sectionToggle.setAttribute('aria-controls',contentId);
    sectionToggle.setAttribute('aria-expanded','true');
    sectionToggle.setAttribute('aria-label',t('collapseSection',{section:title}));
    const sectionChevron=element('span','study-assistant__chevron','⌃');
    sectionChevron.setAttribute('aria-hidden','true');
    sectionToggle.append(
      element('span','study-assistant__section-title',title),
      element('span','study-assistant__count',String(items.length)),
      sectionChevron
    );
    heading.appendChild(sectionToggle);
    section.appendChild(heading);
    const content=element('div','study-assistant__section-content');
    content.id=contentId;
    section.appendChild(content);

    let showAll=false;
    const limit=INITIAL_LIMITS[category];
    const renderContent=()=>{
      const fragment=document.createDocumentFragment();
      const visible=showAll ? items : items.slice(0,limit);
      if(category==='diccionario'){
        const list=element('ul','study-assistant__term-list');
        visible.forEach(item=>list.appendChild(renderTerm(item)));
        fragment.appendChild(list);
      }else{
        visible.forEach(item=>fragment.appendChild(renderTextEntry(item,category)));
      }
      if(items.length>limit){
        const remaining=items.length-limit;
        const more=element('button','study-assistant__more',showAll ? t('showLess') : t('showMore',{count:remaining}));
        more.type='button';
        more.setAttribute('aria-controls',contentId);
        more.setAttribute('aria-expanded',String(showAll));
        more.addEventListener('click',()=>{showAll=!showAll;renderContent();});
        fragment.appendChild(more);
      }
      content.replaceChildren(fragment);
    };
    renderContent();

    sectionToggle.addEventListener('click',()=>{
      const expanded=sectionToggle.getAttribute('aria-expanded')==='true';
      sectionToggle.setAttribute('aria-expanded',String(!expanded));
      sectionToggle.setAttribute('aria-label',t(expanded?'expandSection':'collapseSection',{section:title}));
      sectionChevron.textContent=expanded?'⌄':'⌃';
      content.hidden=expanded;
      if(expanded) content.replaceChildren();
      else renderContent();
    });
    return section;
  }

  function renderResults(context,resources){
    const root=assistant();
    const body=buildShell(context);
    if(!root || !body) return;
    const total=CATEGORIES.reduce((sum,category)=>sum+resources[category].length,0);
    if(!total){
      renderState('empty',t('noResources'),context);
      return;
    }
    const titles={diccionario:t('terms'),historia:t('history'),costumbres:t('customs')};
    for(const category of CATEGORIES){
      if(resources[category].length){
        body.appendChild(renderSection(category,titles[category],resources[category]));
      }
    }
    root.dataset.studyBook=context.book;
    root.dataset.studyChapter=String(context.ranges[0].chapterStart);
  }

  async function update(context){
    const generation=++requestGeneration;
    currentContext=context;
    currentResources=null;
    if(!context?.ranges?.length){renderNoSelection();return;}
    renderState('loading',t('loading'),context);
    try{
      const selection=selectedVerses(context);
      const packageData=await loadPackage(context.book,selection.chapter);
      if(generation!==requestGeneration) return;
      currentResources=collectResources(packageData,selection.verses);
      renderResults(context,currentResources);
      resolveMissingTranslations(currentResources,generation);
    }catch(error){
      if(generation!==requestGeneration) return;
      console.error('No se pudo cargar el Asistente de estudio.',error);
      renderState('error',t('loadError'),context);
    }
  }

  async function init(){
    if(!assistant()) return;
    if(window.VerboI18n) await window.VerboI18n.ready();
    renderNoSelection();
    document.addEventListener(EVENT_NAME,event=>update(event.detail));
    document.addEventListener('verbo:uilang-changed',()=>{
      if(currentContext && currentResources){
        renderResults(currentContext,currentResources);
        resolveMissingTranslations(currentResources,requestGeneration);
      }
      else if(currentContext) renderState('loading',t('loading'),currentContext);
      else renderNoSelection();
    });
    const initial=window.VerboPassageSelection?.getContext?.();
    if(initial) update(initial);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
