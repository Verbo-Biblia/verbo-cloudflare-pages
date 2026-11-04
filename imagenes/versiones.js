/* Slide de versiones: cambia la imagen grande, el visor y la descarga sin salir de la página. */
(()=>{'use strict';
const box=document.querySelector('.version-slider');if(!box)return;
const thumbs=[...box.querySelectorAll('.version-thumb')],count=box.querySelector('.version-count');
const stage=document.querySelector('.open-viewer img'),viewer=document.querySelector('.viewer img');
const main=document.querySelector('.button.download:not(.secondary)'),vertical=document.querySelector('.button.download.secondary');
const base=main?.getAttribute('download')||'';let i=0;
function show(n){i=(n+thumbs.length)%thumbs.length;const t=thumbs[i],src=t.dataset.src;
 stage.src=src;stage.removeAttribute('srcset');if(viewer)viewer.src=src;
 if(main){main.href=src;main.setAttribute('download',i?base.replace(/\.jpg$/,'-'+(i+1)+'.jpg'):base)}
 if(vertical)vertical.hidden=i>0;
 thumbs.forEach((b,k)=>b.setAttribute('aria-current',k===i?'true':'false'));
 count.textContent=(i+1)+' / '+thumbs.length}
thumbs.forEach((b,k)=>b.addEventListener('click',()=>show(k)));
box.querySelector('[data-prev]').addEventListener('click',()=>show(i-1));
box.querySelector('[data-next]').addEventListener('click',()=>show(i+1));
let x=null;const s=document.querySelector('.image-stage');
s.addEventListener('touchstart',e=>{x=e.touches[0].clientX},{passive:true});
s.addEventListener('touchend',e=>{if(x===null)return;const d=e.changedTouches[0].clientX-x;x=null;if(Math.abs(d)>50)show(i+(d<0?1:-1))},{passive:true});
})();
