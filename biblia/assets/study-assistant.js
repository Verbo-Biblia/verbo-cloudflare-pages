(function(){
  'use strict';

  const EVENT_NAME='verbo:selected-passage-changed';
  const PACKAGE_ROOT='modules/study-assistant/chapters';
  const CATEGORIES=['diccionario','historia','costumbres'];
  const INITIAL_LIMITS={diccionario:8,historia:3,costumbres:3};
  const cache=new Map();
  let requestGeneration=0;
  let controlSequence=0;
  let currentContext=null;
  let currentResources=null;

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
      'policarpo-filipenses':'sourcePolycarp',
      'freeman-manners-customs':'sourceFreeman',
      'tucker-roman-world':'sourceTucker'
    };
    return labels[module] ? t(labels[module]) : module;
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
    entry.appendChild(element('span','study-assistant__term-name',item.termino));
    entry.appendChild(element('small','study-assistant__term-source',moduleLabel(item.fuente?.modulo || '')));
    return entry;
  }

  function renderTextEntry(item,category){
    const article=element('article','study-assistant__entry');
    const source=element('div','study-assistant__entry-source',sourceLabel(item.fuente));
    article.appendChild(source);
    const type=category==='historia' ? historyTypeLabel(item.tipo) : '';
    if(type) article.appendChild(element('div','study-assistant__type',type));

    const textId=`study-assistant-text-${++controlSequence}`;
    const paragraph=element('p',`study-assistant__text study-assistant__text--${category}`,item.texto);
    paragraph.id=textId;
    article.appendChild(paragraph);
    const toggle=element('button','study-assistant__text-toggle',t('readMore'));
    toggle.type='button';
    toggle.hidden=true;
    toggle.setAttribute('aria-controls',textId);
    toggle.setAttribute('aria-expanded','false');
    toggle.addEventListener('click',()=>{
      const expanded=toggle.getAttribute('aria-expanded')==='true';
      toggle.setAttribute('aria-expanded',String(!expanded));
      paragraph.classList.toggle('study-assistant__text--expanded',!expanded);
      toggle.textContent=expanded ? t('readMore') : t('showLessText');
    });
    article.appendChild(toggle);
    requestAnimationFrame(()=>{
      const previewHeight=paragraph.getBoundingClientRect().height;
      paragraph.classList.add('study-assistant__text--expanded');
      const fullHeight=paragraph.scrollHeight;
      paragraph.classList.remove('study-assistant__text--expanded');
      toggle.hidden=fullHeight<=previewHeight+1;
    });
    return article;
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
      if(currentContext && currentResources) renderResults(currentContext,currentResources);
      else if(currentContext) renderState('loading',t('loading'),currentContext);
      else renderNoSelection();
    });
    const initial=window.VerboPassageSelection?.getContext?.();
    if(initial) update(initial);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
