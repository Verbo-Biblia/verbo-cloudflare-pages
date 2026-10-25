/* «👍 Me gustó» de los juegos. Lo cuenta el Worker verbo-api-bible (/v1/juegos/votos, base D1).
   Uso: <div class="v-votos" data-votos-juego="<id>"></div> + este script. Para pedirlo al final de una
   partida desde el juego: window.VerboVotos.boton('<id>') devuelve el botón listo para insertar.
   Anónimo: un id al azar en localStorage, sin cuentas. El número solo se muestra desde UMBRAL votos para
   que un juego nuevo no se vea vacío; los datos completos se ven con wrangler (cloudflare/api-bible-worker/votos.sql). */
(()=>{
 const API='https://verbo-api-bible.juanjosevenegas78.workers.dev/v1/juegos/votos';
 const UMBRAL=20;
 const guardar=(k,v)=>{try{localStorage.setItem(k,v)}catch{}};
 const leer=k=>{try{return localStorage.getItem(k)}catch{return null}};
 const votante=()=>{let id=leer('verbo-votante');if(!id){id=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,14);guardar('verbo-votante',id)}return id};
 const en=()=>window.VerboI18n?.getUiLang?.()==='en';
 let conteos=null;
 const cargar=()=>conteos||(conteos=fetch(API).then(r=>r.ok?r.json():{juegos:{}}).then(d=>d.juegos||{}).catch(()=>({})));
 const botones=[];

 function pintar(b){
  const n=b._votos||0,si=b._gusta;
  b.setAttribute('aria-pressed',si?'true':'false');
  b.querySelector('.v-votos__texto').textContent=si?(en()?'Thanks!':'¡Gracias!'):(en()?'I liked it':'Me gustó');
  const c=b.querySelector('.v-votos__n');c.hidden=n<UMBRAL;c.textContent=n.toLocaleString(en()?'en':'es');
  b.title=n>=UMBRAL?(en()?`${n} people liked this game`:`A ${n} personas les gustó este juego`):'';
 }

 function boton(juego){
  const b=document.createElement('button');
  b.type='button';b.className='v-votos__boton';
  b.innerHTML='<span aria-hidden="true">👍</span><span class="v-votos__texto"></span><span class="v-votos__n" hidden></span>';
  b._gusta=leer('verbo-gusta:'+juego)==='1';b._votos=0;
  botones.push(b);pintar(b);
  cargar().then(c=>{b._votos=c[juego]||0;pintar(b)});
  b.addEventListener('click',async()=>{
   if(b.disabled)return;
   const gusta=!b._gusta;
   b._gusta=gusta;b._votos=Math.max(0,b._votos+(gusta?1:-1));pintar(b);b.disabled=true;
   try{
    const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({juego,votante:votante(),gusta})});
    if(!r.ok)throw 0;
    const d=await r.json();b._votos=d.votos;guardar('verbo-gusta:'+juego,gusta?'1':'0');
   }catch{b._gusta=!gusta;b._votos=Math.max(0,b._votos+(gusta?-1:1))}
   b.disabled=false;pintar(b);
  });
  return b;
 }

 window.VerboVotos={boton};
 const iniciar=()=>document.querySelectorAll('[data-votos-juego]').forEach(el=>{if(!el.firstChild)el.append(boton(el.dataset.votosJuego))});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',iniciar);else iniciar();
 document.addEventListener('verbo:uilang-changed',()=>botones.forEach(pintar));
 window.VerboI18n?.ready?.().then(()=>botones.forEach(pintar));
})();
