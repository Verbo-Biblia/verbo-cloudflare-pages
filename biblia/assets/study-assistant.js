(function(){
  'use strict';

  const EVENT_NAME='verbo:selected-passage-changed';
  const PACKAGE_ROOT='modules/study-assistant/chapters';
  const CATEGORIES=['diccionario','historia','costumbres'];
  const INITIAL_LIMITS={diccionario:8,historia:3,costumbres:3};
  // Categorías del mensaje-resumen (VerboStudyMessages) que abren una
  // sección propia del panel → su clave de recurso interna (currentResources).
  const CATEGORY_TO_RESOURCE_KEY={terminos:'diccionario',historia:'historia',costumbres:'costumbres'};
  const TRANSLATE_MAX_RESOURCES=100;
  const TRANSLATE_MAX_RESOURCE_CHARS=4000;
  const TRANSLATE_MAX_TOTAL_CHARS=12000; // debe coincidir con STUDY_TRANSLATE_MAX_TOTAL_CHARS en worker.js
  const cache=new Map();
  const translationCache=new Map();
  const pendingTranslationKeys=new Set();
  const referenceCountsCache=new Map();
  let requestGeneration=0;
  let controlSequence=0;
  let currentContext=null;
  let currentResources=null;
  let currentCounts=null;
  let translationBasePromise=null;
  // Qué está mostrando el body ahora mismo (resumen / sección expandida /
  // nada) — lo actualizan renderSummary/renderSingleSection/renderNoSelection.
  // Sirve para volver exactamente a esa vista después de una búsqueda del
  // campo del header (Parte B): la búsqueda nunca debe "pisar" lo que el
  // usuario tenía abierto, solo lo tapa mientras carga.
  let currentView={type:'none'};
  // Búsqueda semántica del header (Parte C): resultados crudos de
  // searchSemanticBible + página actual. No toca currentView — mientras
  // esto se muestra, currentView sigue apuntando a lo que había antes,
  // así "volver" restaura esa vista.
  let searchResultsState=null;
  const SEARCH_RESULTS_PAGE_SIZE=10;
  // limit es un parámetro de searchSemanticBible (no algo propio del
  // Asistente) — mismo valor que ya usa el buscador principal (app.js),
  // sin razón para cambiarlo.
  const ASSISTANT_SEARCH_LIMIT=90;
  // Ícono "volver" compartido por renderSingleSection y los dos estados de
  // resultados de búsqueda (resumen de conteo y página) — mismo SVG, misma
  // clase .study-assistant__back-to-summary, solo cambia el aria-label
  // según a dónde vuelve cada uno.
  const BACK_ARROW_SVG='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>';

  // Ilustración del header, pedido de Juan 2026-08-29. Se inyecta vía
  // Shadow DOM (ver buildShell) en vez de innerHTML directo: el SVG trae
  // su propio <style> con clases genéricas (.st0, .st1...) que si se
  // insertan sueltas en el documento aplican globalmente y podrían chocar
  // con clases de otras partes del sitio — el shadow root las aísla sin
  // tener que renombrar ninguna de las ~70 clases del archivo original.
  const HEADER_ICON_SVG='<svg id="Layer_1" width="100%" height="100%" style="display:block;enable-background:new 0 0 512 512;" version="1.1" viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style type="text/css">.st0{fill:#EEEDF2;}.st1{fill:none;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st2{fill:#EFC12F;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st3{fill:none;stroke:#1E247E;stroke-width:3;stroke-linecap:round;stroke-miterlimit:10;}.st4{fill:#FFFFFF;stroke:#1E247E;stroke-width:3;stroke-linecap:round;stroke-miterlimit:10;}.st5{fill:#FCF5F2;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st6{fill:#FCF5F2;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st7{fill:#1E247E;}.st8{fill:none;stroke:#1E247E;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}.st9{fill:#EAB8B1;}.st10{fill:#DC9695;stroke:#1E247E;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}.st11{fill:#EECED1;stroke:#1E247E;stroke-width:3;stroke-linecap:round;stroke-miterlimit:10;}.st12{fill:#CB7272;stroke:#1E247E;stroke-width:3;stroke-linecap:round;stroke-miterlimit:10;}.st13{fill:#D3D5E7;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st14{fill:#D3D5E7;}.st15{fill:#FFFFFF;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st16{fill:#FFFFFF;stroke:#1E247E;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}.st17{fill:#ECECEE;}.st18{fill:#DA867D;stroke:#1E247E;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}.st19{fill:#FCF5F2;stroke:#1E247E;stroke-width:4;stroke-linecap:round;stroke-miterlimit:10;}.st20{fill:#69AEF8;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st21{opacity:0.4;fill:#FFFFFF;}.st22{opacity:0.7;fill:#FFFFFF;}.st23{fill:#69ADF7;stroke:#1E247E;stroke-width:2.5;stroke-linecap:round;stroke-miterlimit:10;}.st24{fill:none;stroke:#FFFFFF;stroke-width:7;stroke-linecap:round;stroke-miterlimit:10;}.st25{fill:none;stroke:#1E247E;stroke-width:2.5;stroke-linecap:round;stroke-miterlimit:10;}.st26{fill:#F0C330;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st27{opacity:0.3;}.st28{fill:#FFFFFF;}.st29{fill:#79CAA1;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st30{fill:#DA867D;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st31{fill:#FFFFFF;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st32{fill:#DBE7FE;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st33{fill:#F2F3F3;}.st34{fill:none;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st35{fill:#DBE7FE;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st36{fill:#EFC230;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st37{fill:none;stroke:#1E247E;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st38{fill:#F0C330;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st39{fill:#79CAA1;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st40{fill:#FFFFFF;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st41{fill:#DA867D;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st42{fill:#DBE7FE;stroke:#1E247E;stroke-width:6;stroke-linejoin:round;stroke-miterlimit:10;}.st43{fill:none;stroke:#1E247E;stroke-width:6;stroke-linejoin:round;stroke-miterlimit:10;}.st44{opacity:0.7;}.st45{fill:#FFFFFF;stroke:#1E247E;stroke-width:6;stroke-linejoin:round;stroke-miterlimit:10;}.st46{fill:none;stroke:#FFFFFF;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st47{fill:none;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st48{fill:#DBE7FE;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-miterlimit:10;}.st49{opacity:0.1;fill:#BDBDBD;}.st50{fill:#69AEF8;stroke:#1E247E;stroke-width:6;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st51{fill:#79CAA1;stroke:#1E247E;stroke-width:5;stroke-miterlimit:10;}.st52{fill:#D2D4E6;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st53{fill:#69AEF8;stroke:#1E247E;stroke-width:5;stroke-miterlimit:10;}.st54{opacity:0.2;fill:none;stroke:#1E247E;stroke-width:5;stroke-linecap:round;stroke-miterlimit:10;}.st55{fill:none;stroke:#1E247E;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;}.st56{fill:#69AEF8;stroke:#1E247E;stroke-width:6;stroke-miterlimit:10;}.st57{fill:#DBE7FE;}.st58{fill:#FFFFFF;stroke:#1E247E;stroke-width:6;stroke-miterlimit:10;}.st59{fill:#D9857D;stroke:#1E247E;stroke-width:5;stroke-miterlimit:10;}.st60{fill:none;stroke:#D3D5E7;stroke-width:4.7904;stroke-linecap:round;stroke-miterlimit:10;}.st61{fill:#D2D4E6;stroke:#D3D5E7;stroke-width:4.7904;stroke-linecap:round;stroke-miterlimit:10;}.st62{fill:#D2D4E6;stroke:#D3D5E7;stroke-width:5.5;stroke-linecap:round;stroke-miterlimit:10;}.st63{fill:none;stroke:#D3D5E7;stroke-width:5.5;stroke-linecap:round;stroke-miterlimit:10;}.st64{fill:#79CAA1;}.st65{fill:#F0C330;}.st66{fill:#79CAA1;stroke:#1E247E;stroke-width:6;stroke-miterlimit:10;}.st67{opacity:0.8;fill:#FFFFFF;}.st68{fill:#DA867D;stroke:#1E247E;stroke-width:6;stroke-miterlimit:10;}.st69{fill:#F0C330;stroke:#1E247E;stroke-width:5;stroke-miterlimit:10;}.st70{fill:#D2D4E6;}.st71{fill:#EEBDBC;stroke:#D3D5E7;stroke-width:5.5;stroke-linecap:round;stroke-miterlimit:10;}.st72{fill:#D3D5E7;stroke:#D3D5E7;stroke-width:5.5;stroke-linecap:round;stroke-miterlimit:10;}</style><g><g id="Documents_1_"><circle class="st0" cx="252.9" cy="252.5" id="Background_18_" r="215.6"/><g id="Shadows_2_"><g><path class="st14" d="M228.6,441.2l64.8-112.3c2.8-4.8,1.1-11-3.7-13.8l-159-91.8c-4.8-2.8-11-1.1-13.8,3.7       L52.1,339.3c-2.8,4.8-1.1,11,3.7,13.8l159,91.8C219.6,447.6,225.8,446,228.6,441.2z" id="_x31_st_16_"/><path class="st14" d="M205.7,400.5L307.3,320c4.4-3.5,5.1-9.8,1.6-14.1l-114-144c-3.5-4.4-9.8-5.1-14.1-1.6       L79.2,240.8c-4.4,3.5-5.1,9.8-1.6,14.1l114,144C195,403.2,201.3,404,205.7,400.5z" id="_x32_nd_16_"/><path class="st14" d="M327.3,353.2H197.6c-5.6,0-10.1-4.5-10.1-10.1V159.5c0-5.6,4.5-10.1,10.1-10.1h129.7       c5.6,0,10.1,4.5,10.1,10.1v183.6C337.4,348.7,332.9,353.2,327.3,353.2z" id="_x33_rd_15_"/><path class="st14" d="M316,394.2l-99.4-83.3c-4.3-3.6-4.8-9.9-1.2-14.2l118-140.7c3.6-4.3,9.9-4.8,14.2-1.2       l99.4,83.3c4.3,3.6,4.8,9.9,1.2,14.2L330.2,393C326.6,397.2,320.3,397.8,316,394.2z" id="_x34_th_7_"/></g><path class="st14" d="M293.2,432.1l-55-117.4c-2.4-5-0.2-11,4.8-13.4l166.3-77.9c5-2.4,11-0.2,13.4,4.8      l55,117.4c2.4,5,0.2,11-4.8,13.4L306.6,437C301.5,439.3,295.5,437.2,293.2,432.1z" id="_x35_th_2_"/></g><g id="Documents"><g id="_x31_st_15_"><path class="st13" d="M217.2,451.5l64.8-112.3c2.8-4.8,1.1-11-3.7-13.8l-159-91.8c-4.8-2.8-11-1.1-13.8,3.7       L40.8,349.6c-2.8,4.8-1.1,11,3.7,13.8l159,91.8C208.3,458,214.4,456.3,217.2,451.5z" id="Shape_70_"/><path class="st25" d="M47.3,353.6c-0.7,1.2-0.3,2.7,0.9,3.4" id="Line_28_"/></g><g id="_x32_nd_15_"><path class="st26" d="M203.6,403.5L305.3,323c4.4-3.5,5.1-9.8,1.6-14.1l-114-144c-3.5-4.4-9.8-5.1-14.1-1.6       L77.1,243.8c-4.4,3.5-5.1,9.8-1.6,14.1l114,144C192.9,406.3,199.3,407,203.6,403.5z" id="Shape_69_"/><path class="st25" d="M80.7,249c-1.3,1-1.5,2.9-0.5,4.1" id="Line_27_"/></g><g id="_x33_rd_14_"><path class="st20" d="M316,363.6H186.3c-5.6,0-10.1-4.5-10.1-10.1V169.9c0-5.6,4.5-10.1,10.1-10.1H316       c5.6,0,10.1,4.5,10.1,10.1v183.6C326,359.1,321.5,363.6,316,363.6z" id="Shape_68_"/><g class="st27" id="Content_12_"><path class="st28" d="M252.4,221.6h-54c-1.6,0-3-1.3-3-3v-10.1c0-1.6,1.3-3,3-3h54c1.6,0,3,1.3,3,3v10.1        C255.3,220.3,254,221.6,252.4,221.6z" id="Bottom_60_"/><path class="st28" d="M274.1,197.5h-75.3c-1.9,0-3.5-1.5-3.5-3.5v-9.1c0-1.9,1.5-3.5,3.5-3.5h75.3        c1.9,0,3.5,1.5,3.5,3.5v9.1C277.6,195.9,276.1,197.5,274.1,197.5z" id="Top_62_"/></g><path class="st25" d="M183.6,170.7c0-2,1.7-3.7,3.7-3.7" id="Line_26_"/></g><g id="_x34_th_6_"><path class="st29" d="M310.2,404.6l-99.4-83.3c-4.3-3.6-4.8-9.9-1.2-14.2l118-140.7c3.6-4.3,9.9-4.8,14.2-1.2       l99.4,83.3c4.3,3.6,4.8,9.9,1.2,14.2l-118,140.7C320.8,407.6,314.5,408.2,310.2,404.6z" id="Shape_67_"/><path class="st25" d="M334,173.8c1.3-1.5,3.6-1.7,5.1-0.4" id="Line_25_"/></g><g id="_x35_th_1_"><path class="st30" d="M281.8,442.5l-55-117.4c-2.4-5-0.2-11,4.8-13.4l166.3-77.9c5-2.4,11-0.2,13.4,4.8       l55,117.4c2.4,5,0.2,11-4.8,13.4l-166.3,77.9C290.2,449.7,284.2,447.5,281.8,442.5z" id="Shape_66_"/><g class="st27" id="Content_11_"><path class="st28" d="M391.4,352.8l-32-68.2c-0.8-1.7-0.1-3.8,1.7-4.6l8.2-3.9c1.7-0.8,3.8-0.1,4.6,1.7l32,68.2        c0.8,1.7,0.1,3.8-1.7,4.6l-8.2,3.9C394.3,355.3,392.2,354.5,391.4,352.8z" id="Left_44_"/><path class="st28" d="M413.9,342.2L382,274c-0.8-1.7-0.1-3.8,1.7-4.6l8.2-3.9c1.7-0.8,3.8-0.1,4.6,1.7l32,68.2        c0.8,1.7,0.1,3.8-1.7,4.6l-8.2,3.9C416.8,344.7,414.7,344,413.9,342.2z" id="Right_43_"/></g><path class="st25" d="M399.1,243.3c1.9-0.9,4.1-0.1,5,1.8" id="Line_24_"/></g></g><g id="Bottom_line_13_"><line class="st1" id="Right_42_" x1="416.2" x2="469" y1="468.1" y2="468.1"/><line class="st1" id="Middle_52_" x1="80.1" x2="399.1" y1="468.1" y2="468.1"/><line class="st1" id="Left_43_" x1="37.7" x2="63.8" y1="468.1" y2="468.1"/></g><g id="Folder"><path class="st31" d="M396.9,303.8v133.4c0,17.1-13.9,31-31,31H144.7c-17.1,0-31-13.9-31-31V270      c0-21.3,17.3-38.6,38.6-38.6h89.6c11.8,0,22.9,5.4,30.2,14.6l12.1,15.2c3.2,4,8.1,6.4,13.3,6.4h63.2      C380.7,267.6,396.9,283.8,396.9,303.8z" id="Shape_65_"/><g id="Folder_outer"><g id="Holes"><circle class="st32" cx="211.1" cy="272.3" id="_x33_rd_13_" r="5.7"/><circle class="st32" cx="185.1" cy="272.3" id="_x32_nd_14_" r="5.7"/><circle class="st32" cx="159.2" cy="272.3" id="_x31_st_14_" r="5.7"/></g><g id="Lines_31_"><line class="st25" id="Bottom_59_" x1="228.5" x2="236.5" y1="328.5" y2="334.7"/><line class="st25" id="Middle_51_" x1="228.5" x2="244.5" y1="320.8" y2="333.1"/><line class="st25" id="Top_61_" x1="240.1" x2="244.5" y1="321.9" y2="325.3"/></g><path class="st3" d="M368.8,283.4c6.4,1.8,11.4,7.1,12.7,13.7" id="Line_23_"/><g id="Vertical_line_4_"><line class="st3" id="Bottom_58_" x1="381.5" x2="381.5" y1="331.9" y2="364.6"/><line class="st3" id="Top_60_" x1="381.5" x2="381.5" y1="321.4" y2="325.7"/></g><g id="Content_10_"><path class="st33" d="M246,426.5H146c-2.7,0-4.9-2.2-4.9-4.9v-54c0-2.7,2.2-4.9,4.9-4.9h100        c2.7,0,4.9,2.2,4.9,4.9v54C250.9,424.3,248.7,426.5,246,426.5z" id="Bottom_57_"/><path class="st33" d="M188.2,350.7h-44.9c-1.6,0-2.9-1.3-2.9-2.9v-28.5c0-1.6,1.3-2.9,2.9-2.9h44.9        c1.6,0,2.9,1.3,2.9,2.9v28.5C191.2,349.3,189.9,350.7,188.2,350.7z" id="Top_59_"/></g></g></g><g id="Sparkles_17_"><g id="Right_41_"><line class="st24" id="Bottom_56_" x1="369.1" x2="360.8" y1="126.5" y2="129.2"/><line class="st24" id="Middle_50_" x1="359.8" x2="353.2" y1="114.7" y2="122"/><line class="st24" id="Top_58_" x1="344.5" x2="345.8" y1="116.1" y2="106.9"/></g><g id="Left_42_"><line class="st24" id="Bottom_55_" x1="111.7" x2="102.5" y1="161" y2="159.6"/><line class="st24" id="Middle_49_" x1="110.4" x2="117.7" y1="145.7" y2="152.3"/><line class="st24" id="Top_57_" x1="122.3" x2="124.9" y1="136.5" y2="144.8"/></g></g></g></g></svg>';

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
    const close=element('button','study-assistant__close','✕');
    close.type='button';
    close.setAttribute('aria-label',window.VerboI18n?.t('panel.closeAria')||'Cerrar panel');
    close.addEventListener('click',()=>{ document.getElementById('studyAssistantToggle')?.click(); });
    header.appendChild(close);
    const headerMain=element('div','study-assistant__header-main');
    const icon=element('div','study-assistant__header-icon');
    icon.setAttribute('aria-hidden','true');
    icon.attachShadow({mode:'open'}).innerHTML=HEADER_ICON_SVG;
    headerMain.appendChild(icon);
    const headerText=element('div','study-assistant__header-text');
    headerText.appendChild(element('div','study-assistant__kicker',t('title')));
    const reference=element('div','study-assistant__reference',passageReference(context));
    reference.hidden=!context?.ranges?.length;
    headerText.appendChild(reference);
    headerMain.appendChild(headerText);
    header.appendChild(headerMain);
    // Campo de búsqueda semántica: vive en el header (no en body), así que
    // sale de acá en los 4 estados de render sin duplicar nada — pedido de
    // Juan 2026-08-29 ("SIEMPRE visible, con o sin pasaje seleccionado").
    header.appendChild(buildSearchForm());
    const body=element('div','study-assistant__content');
    root.replaceChildren(header,body);
    return body;
  }

  // Mismas clases que el formulario del buscador principal (app.js
  // renderSearch) — reusa su CSS (search-panel-form/-input/-button) tal
  // cual, sin inventar estilo nuevo. No lleva el <select> de indexType: acá
  // siempre se busca por perícopas (ver handleAssistantSearch).
  function buildSearchForm(){
    const form=element('form','search-panel-form study-assistant__search-form');
    const input=element('input','search-panel-input');
    input.type='search';
    input.id='studyAssistantSearchInput';
    input.minLength=2;
    input.placeholder=window.VerboI18n?.t('busqueda.placeholder')||'';
    input.autocomplete='off';
    const button=element('button','search-panel-button',window.VerboI18n?.t('busqueda.boton')||'');
    button.type='submit';
    form.append(input,button);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      handleAssistantSearch(input.value);
    });
    return form;
  }

  // Vuelve a pintar lo que el body tenía antes de la búsqueda (resumen,
  // sección expandida, o nada) — la búsqueda del header nunca debe
  // reemplazar esa vista de forma permanente, solo taparla mientras carga
  // (renderState('loading',...) en handleAssistantSearch).
  function restoreCurrentView(){
    if(currentView.type==='section' && currentContext && currentResources){
      renderSingleSection(currentContext,currentView.category);
    }else if(currentView.type==='summary' && currentContext && currentCounts){
      renderSummary(currentContext,currentCounts);
    }else{
      renderNoSelection();
    }
  }

  // Compartido por renderSingleSection y los dos estados de resultados de
  // búsqueda — mismo ícono/clase, cambia el mensaje y la acción de "volver".
  function buildBackBar(ariaLabel,onClick){
    const backBar=element('div','study-assistant__back-bar');
    const back=element('button','study-assistant__back-to-summary');
    back.type='button';
    back.innerHTML=BACK_ARROW_SVG;
    back.setAttribute('aria-label',ariaLabel);
    back.addEventListener('click',onClick);
    backBar.appendChild(back);
    return backBar;
  }

  // "Volver" desde cualquiera de los dos estados de resultados de
  // búsqueda — descarta el estado de búsqueda y restaura currentView
  // (que la búsqueda nunca tocó).
  function backFromSearchResults(){
    searchResultsState=null;
    restoreCurrentView();
  }

  // Solo el conteo, sin listar nada — mismo criterio que el mensaje-resumen
  // ("contar antes de listar"). currentView NO se toca acá: sigue apuntando
  // a lo que había antes de buscar.
  function renderSearchResultsSummary(){
    const root=assistant();
    const body=buildShell(currentContext);
    if(!root || !body) return;
    body.appendChild(buildBackBar(t('back'),backFromSearchResults));
    const {query,results}=searchResultsState;
    if(!results.length){
      body.appendChild(element('p','study-assistant__search-summary',window.VerboI18n?.t('busqueda.sinResultados',{query})||''));
      return;
    }
    const totalPages=Math.ceil(results.length/SEARCH_RESULTS_PAGE_SIZE);
    body.appendChild(element('p','study-assistant__search-summary',t('searchResultsSummary',{count:results.length,pages:totalPages})));
    const expand=element('button','search-panel-button',t('searchResultsExpand'));
    expand.type='button';
    expand.addEventListener('click',()=>{
      searchResultsState.page=0;
      renderSearchResultsPage();
    });
    body.appendChild(expand);
  }

  // Página de a 10 resultados — mismo patrón visual que el buscador
  // principal (search-result/__ref/__text, ya estilizados en style.css),
  // sin reusar su función de render porque es interna a app.js y está
  // atada a su propio DOM/estado (ver Paso 0). Paginación propia, chica.
  function renderSearchResultsPage(){
    const root=assistant();
    const body=buildShell(currentContext);
    if(!root || !body) return;
    body.appendChild(buildBackBar(t('back'),backFromSearchResults));
    const {results}=searchResultsState;
    const page=searchResultsState.page;
    const totalPages=Math.ceil(results.length/SEARCH_RESULTS_PAGE_SIZE);
    const start=page*SEARCH_RESULTS_PAGE_SIZE;
    const end=Math.min(start+SEARCH_RESULTS_PAGE_SIZE,results.length);
    const list=element('div','search-results-list');
    results.slice(start,end).forEach(r=>{
      const item=element('button','search-result');
      item.type='button';
      const ref=`${r.book} ${r.chapter}:${r.verse}${r.verseEnd && r.verseEnd!==r.verse ? `-${r.verseEnd}` : ''}`;
      item.appendChild(element('span','search-result__ref',ref));
      item.appendChild(element('span','search-result__text',r.text));
      item.addEventListener('click',()=>{
        window.VerboPassageSelection?.selectPassage(r.bookId,r.chapter,r.verse);
      });
      list.appendChild(item);
    });
    body.appendChild(list);
    const pagination=element('nav','search-pagination');
    pagination.setAttribute('aria-label',window.VerboI18n?.t('busqueda.paginasAria')||'');
    const prev=element('button','search-page-button',window.VerboI18n?.t('busqueda.anterior')||'');
    prev.type='button';
    prev.disabled=page===0;
    prev.addEventListener('click',()=>{
      if(searchResultsState.page>0){ searchResultsState.page--; renderSearchResultsPage(); }
    });
    const status=element('span','search-page-status',window.VerboI18n?.t('busqueda.paginaEstado',{page:page+1,total:totalPages})||'');
    const next=element('button','search-page-button',window.VerboI18n?.t('busqueda.siguiente')||'');
    next.type='button';
    next.disabled=page>=totalPages-1;
    next.addEventListener('click',()=>{
      if(searchResultsState.page<totalPages-1){ searchResultsState.page++; renderSearchResultsPage(); }
    });
    pagination.append(prev,status,next);
    body.appendChild(pagination);
  }

  // Reusa requestGeneration (el mismo contador que update()) para
  // invalidarse sola si el usuario selecciona un pasaje nuevo mientras la
  // búsqueda está en vuelo — no hace falta un contador aparte.
  async function handleAssistantSearch(query){
    const trimmed=query.trim();
    if(trimmed.length<2) return;
    const generation=++requestGeneration;
    const stageText={
      index:window.VerboI18n?.t('busqueda.stageIndex'),
      model:window.VerboI18n?.t('busqueda.stageModel'),
      embedding:window.VerboI18n?.t('busqueda.stageEmbedding'),
      ranking:window.VerboI18n?.t('busqueda.stageRanking')
    };
    renderState('loading',window.VerboI18n?.t('busqueda.preparando')||'…',currentContext);
    try{
      const results=await VerboModules.searchSemanticBible(trimmed,{
        indexType:'pericopes',
        limit:ASSISTANT_SEARCH_LIMIT,
        lang:uiLanguage(),
        onProgress:p=>{
          if(generation!==requestGeneration) return;
          renderState('loading',stageText[p.stage]||window.VerboI18n?.t('busqueda.buscando')||'…',currentContext);
        }
      });
      if(generation!==requestGeneration) return;
      searchResultsState={query:trimmed,results,page:0};
      renderSearchResultsSummary();
    }catch(error){
      if(generation!==requestGeneration) return;
      console.error('No se pudo completar la búsqueda semántica del Asistente.',error);
      restoreCurrentView();
    }
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
    currentView={type:'none'};
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
      // "Ver en Diccionario →" genérico es ambiguo en cuanto hay más de una
      // fuente (Easton y Smith conviven en el mismo listado) — el botón debe
      // decir exactamente a cuál apunta, no solo la etiqueta pequeña aparte.
      return moduleId ? {panel:'diccionarios',moduleId,entryId:source.entryId,label:'viewDictionarySource',labelVars:{source:moduleLabel(source.modulo)}} : null;
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
    const button=element('button',`study-assistant__resource-link study-assistant__resource-link--${navigation.panel}`,t(navigation.label,navigation.labelVars));
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
      translationBasePromise=VerboModules.getCatalog()
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
    if(translation){
      root.querySelectorAll('[data-study-translation-key]').forEach(node=>{
        if(node.dataset.studyTranslationKey===key) node.textContent=translation;
      });
    }
    // Sin traducción: el texto original ya está mostrado desde el primer render,
    // así que basta con quitar el indicador "Traduciendo…" — nunca debe quedar
    // pegado esperando algo que ya sabemos que no va a llegar (fase J: fallback
    // silencioso, sin error global por un recurso individual).
    root.querySelectorAll('[data-study-translation-status]').forEach(node=>{
      if(node.dataset.studyTranslationStatus===key) node.remove();
    });
  }

  function clearTranslationStatus(batch,generation){
    if(generation!==requestGeneration) return;
    for(const item of batch) applyTranslationToMountedNodes(item.key,null);
  }

  async function resolveTranslationBatch(batch,generation,targetLanguage){
    batch.forEach(item=>pendingTranslationKeys.add(item.key));
    try{
      const base=await translationWorkerBase();
      if(!base){ clearTranslationStatus(batch,generation); return; }
      const response=await fetch(`${base}/translate-study-assistant`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          targetLanguage,
          resources:batch.map(({resourceId,sourceLanguage,sourceHash,text})=>({resourceId,sourceLanguage,sourceHash,text})),
        }),
      });
      if(!response.ok){ clearTranslationStatus(batch,generation); return; }
      const payload=await response.json();
      for(const item of batch){
        const translation=payload?.translations?.[item.resourceId]?.translation;
        const trimmed=typeof translation==='string' && translation.trim() ? translation.trim() : null;
        if(trimmed) translationCache.set(item.key,trimmed);
        if(generation===requestGeneration) applyTranslationToMountedNodes(item.key,trimmed);
      }
    }catch(error){
      console.warn('No se pudo resolver una traducción del Asistente.',error);
      clearTranslationStatus(batch,generation);
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

  function passageVerseList(context){
    return context.ranges.map(range=>{
      const start=Number(range.verseStart);
      const end=Number(range.verseEnd);
      return start===end ? String(start) : `${start}-${end}`;
    }).join(', ');
  }

  // Mensaje-resumen: reemplaza las secciones colapsables hasta que el
  // usuario toque una categoría clickeable (Términos/Historia/Costumbres).
  // Comentarios y Referencias cruzadas se muestran como texto informativo,
  // sin acción (ver VerboStudyMessages — actionable por categoría).
  function renderSummary(context,counts){
    const root=assistant();
    const body=buildShell(context);
    if(!root || !body) return;
    currentView={type:'summary'};
    const lang=uiLanguage();
    const libro=window.VerboPassageSelection?.getBookLabel?.(context.book) || context.book;
    const capitulo=Number(context.ranges[0].chapterStart);
    const versiculo=passageVerseList(context);
    const message=VerboStudyMessages.buildMessage({counts,lang,libro,capitulo,versiculo});
    const paragraph=element('p','study-assistant__summary-text');
    message.parts.forEach(part=>{
      if(part.type==='text'){
        paragraph.appendChild(document.createTextNode(part.value));
        return;
      }
      if(part.actionable){
        const chip=element('button',`study-assistant__summary-chip study-assistant__summary-chip--${part.category}`,part.text);
        chip.type='button';
        chip.setAttribute('aria-label',t('openSection',{section:part.text}));
        chip.addEventListener('click',()=>renderSingleSection(context,part.category));
        paragraph.appendChild(chip);
      }else{
        paragraph.appendChild(element('span',`study-assistant__summary-static study-assistant__summary-static--${part.category}`,part.text));
      }
    });
    body.replaceChildren(paragraph);
    root.dataset.studyBook=context.book;
    root.dataset.studyChapter=String(context.ranges[0].chapterStart);
  }

  // Expande UNA categoría (Términos/Historia/Costumbres) dentro del panel,
  // reusando renderSection tal cual (ya nace expandida). El botón "volver"
  // reconstruye el resumen sin recalcular nada — currentCounts ya está en
  // memoria para el versículo actual.
  function renderSingleSection(context,category){
    const root=assistant();
    const body=buildShell(context);
    if(!root || !body) return;
    currentView={type:'section',category};
    const resourceKey=CATEGORY_TO_RESOURCE_KEY[category];
    const items=(currentResources && currentResources[resourceKey]) || [];
    const titles={diccionario:t('terms'),historia:t('history'),costumbres:t('customs')};
    // Ícono circular, sin texto — va envuelto en una barra sticky opaca
    // (study-assistant__back-bar) para no perderse al scrollear secciones
    // largas como Historia/Costumbres, y para que el título de la sección
    // quede tapado (no atravesado) al pasar por detrás.
    body.appendChild(buildBackBar(t('backToSummary'),()=>{
      if(currentContext && currentCounts) renderSummary(currentContext,currentCounts);
    }));
    body.appendChild(renderSection(resourceKey,titles[resourceKey],items));
    root.dataset.studyBook=context.book;
    root.dataset.studyChapter=String(context.ranges[0].chapterStart);
    // Traducción diferida: solo se pide para la categoría que el usuario
    // realmente abrió, no para las 3 al cargar el versículo (ver diseño
    // del mensaje-resumen — evita gastar créditos en contenido que capaz
    // nunca se ve). resourcesNeedingTranslation itera CATEGORIES completo,
    // así que le pasamos un objeto con solo esta categoría poblada.
    const scoped={diccionario:[],historia:[],costumbres:[],[resourceKey]:items};
    resolveMissingTranslations(scoped,requestGeneration);
  }

  // ── Conteo de comentarios y cross-refs por pasaje seleccionado (solo datos) ──
  // Capa de datos exclusivamente: no renderiza nada, no toca el DOM. Usa
  // loadCommentaryIndex/loadCrossrefs (índices livianos, sin prosa) en vez de
  // buildChapterData, así que no baja el HTML de ningún comentario salvo el
  // que el usuario tenga activo en la lectura principal (ese lo carga aparte
  // el flujo normal de la Biblia, no este módulo).
  function verseOverlapsEntry(entry,verse){
    const ref=entry?.reference || {};
    const start=Number(ref.verseStart ?? 0);
    const end=Number(ref.verseEnd ?? start);
    return verse>=start && verse<=end;
  }

  // getJSON (module-loader.js) ya cachea por URL, así que pedir el mismo
  // libro en otro capítulo no repite la descarga de red — este Map solo
  // evita rearmar el resultado agregado (recorrer ~20 comentarios) cada vez
  // que el usuario cambia de versículo dentro del mismo libro+capítulo.
  function loadReferenceCounts(bookId,chapter){
    const key=`${bookId}:${chapter}`;
    if(referenceCountsCache.has(key)) return referenceCountsCache.get(key);
    const request=(async()=>{
      const catalog=await VerboModules.getCatalog();
      const commentaryEntries=await Promise.all((catalog.commentaries||[]).map(async entry=>{
        try{
          const {entries}=await VerboModules.loadCommentaryIndex(entry.path,bookId,chapter);
          return {commentaryId:entry.manifest.id,entries:entries||[]};
        }catch(error){
          console.warn(`Índice de comentario omitido: ${entry.path}`,error);
          return {commentaryId:entry.manifest.id,entries:[]};
        }
      }));
      let crossrefsByVerse={};
      const crossrefEntry=(catalog.crossrefs||[])[0];
      if(crossrefEntry){
        try{
          crossrefsByVerse=await VerboModules.loadCrossrefs(crossrefEntry.path,bookId,chapter) || {};
        }catch(error){
          console.warn(`Referencias cruzadas omitidas: ${crossrefEntry.path}`,error);
        }
      }
      return {commentaryEntries,crossrefsByVerse};
    })();
    referenceCountsCache.set(key,request);
    return request;
  }

  async function countReferences({bookId,chapter,verses}){
    const {commentaryEntries,crossrefsByVerse}=await loadReferenceCounts(bookId,chapter);
    const commentaries=commentaryEntries
      .map(({commentaryId,entries})=>{
        const matched=new Set();
        for(const entry of entries){
          if(verses.some(verse=>verseOverlapsEntry(entry,verse))) matched.add(entry.id);
        }
        return {commentaryId,count:matched.size};
      })
      .filter(item=>item.count>0);
    const crossrefsCount=verses.reduce((total,verse)=>total+((crossrefsByVerse[String(verse)]||[]).length),0);
    return {commentaries,crossrefs:{count:crossrefsCount}};
  }

  async function update(context){
    const generation=++requestGeneration;
    currentContext=context;
    currentResources=null;
    currentCounts=null;
    if(!context?.ranges?.length){renderNoSelection();return;}
    renderState('loading',t('loading'),context);
    try{
      const selection=selectedVerses(context);
      const [packageData,referenceCounts]=await Promise.all([
        loadPackage(context.book,selection.chapter),
        countReferences({bookId:context.book,chapter:selection.chapter,verses:selection.verses})
          .catch(error=>{
            console.warn('No se pudo calcular el conteo de comentarios/cross-refs.',error);
            return {commentaries:[],crossrefs:{count:0}};
          })
      ]);
      if(generation!==requestGeneration) return;
      currentResources=collectResources(packageData,selection.verses);
      currentCounts={
        // "Comentarios" cuenta comentaristas (fuentes distintas), no notas —
        // mismo criterio que el badge 💬 ya existente en la lectura principal
        // (v.commentaries.length, app.js:816-817). countReferences() ya filtra
        // a los comentarios con count>0, así que .length alcanza; sumar
        // item.count inflaba el total cuando un comentarista tenía más de
        // una entrada para el mismo versículo (ej. utley-free-bible-commentary).
        comentarios:referenceCounts.commentaries.length,
        crossrefs:referenceCounts.crossrefs.count,
        historia:currentResources.historia.length,
        terminos:currentResources.diccionario.length,
        costumbres:currentResources.costumbres.length
      };
      // No se dispara traducción acá: el resumen es texto del banco fijo
      // (VerboStudyMessages), sin prosa traducible. La traducción por
      // categoría se pide recién en renderSingleSection, cuando el usuario
      // abre esa sección puntual.
      renderSummary(context,currentCounts);
    }catch(error){
      if(generation!==requestGeneration) return;
      console.error('No se pudo cargar el Asistente de estudio.',error);
      renderState('error',t('loadError'),context);
    }
  }

  function wireToggle(){
    const button=document.getElementById('studyAssistantToggle');
    const root=assistant();
    if(!button || !root) return;
    const setOpen=open=>{
      root.classList.toggle('study-assistant--closed',!open);
      button.classList.toggle('tab-rail__btn--active',open);
      button.setAttribute('aria-pressed',String(open));
    };
    // Siempre cerrado al cargar, igual que el resto de los paneles (Historia,
    // Costumbres, Diccionarios...): ninguno de ellos recuerda su estado entre
    // visitas, viven solo en memoria de la sesión actual.
    setOpen(false);
    button.addEventListener('click',()=>{
      const open=root.classList.contains('study-assistant--closed');
      setOpen(open);
    });
  }

  async function init(){
    if(!assistant()) return;
    if(window.VerboI18n) await window.VerboI18n.ready();
    renderNoSelection();
    wireToggle();
    document.addEventListener(EVENT_NAME,event=>update(event.detail));
    document.addEventListener('verbo:uilang-changed',()=>{
      // El mensaje-resumen depende del idioma; al cambiar, siempre vuelve
      // al resumen (misma lógica que "no persiste sección abierta" ya
      // aplicada entre versículos — acá aplica también al cambio de idioma).
      // El resumen no tiene prosa traducible, así que no dispara
      // resolveMissingTranslations acá — solo renderSingleSection lo hace,
      // y recién si el usuario vuelve a abrir una sección en el idioma nuevo.
      if(currentContext && currentCounts) renderSummary(currentContext,currentCounts);
      else if(currentContext) renderState('loading',t('loading'),currentContext);
      else renderNoSelection();
    });
    const initial=window.VerboPassageSelection?.getContext?.();
    if(initial) update(initial);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
