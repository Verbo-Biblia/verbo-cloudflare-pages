var Zf=Object.defineProperty;var hd=(a,e)=>{for(var t in e)Zf(a,t,{get:e[t],enumerable:!0})};var Zl={};hd(Zl,{AGUA:()=>br,ANCHO_PUERTA:()=>xr,AURA_NEHEMIAS:()=>Io,AVISO_OLEADA:()=>Oo,DECORADO:()=>$l,DIAS:()=>ca,DIFICULTAD:()=>Do,EDIFICIOS:()=>Me,ENEMIGOS:()=>ki,ENTRADAS:()=>wi,FAMILIAS:()=>vr,GOBERNADOR:()=>zo,HABILIDADES:()=>Sr,HERIDO_SEGUNDOS:()=>Mr,INICIO:()=>Tr,LARGO_TRAMO:()=>ud,MAPA:()=>vt,MURO:()=>ii,MURO_REGLAS:()=>pi,NOCHE:()=>Uo,OLEADAS:()=>Yl,RECOLECCION:()=>Xl,RECURSOS_FIJOS:()=>No,RECURSO_DE:()=>Po,TECNOLOGIAS:()=>Hi,TEMPLO:()=>Si,UNIDADES:()=>Ze,calcularTramos:()=>ql,dentroDeLaCiudad:()=>Ti,relieve:()=>yr});var vt={lado:220,medio:110,celda:1},Ba=(a,e,t)=>{let i=Math.min(1,Math.max(0,(t-a)/(e-a)));return i*i*(3-2*i)};function yr(a,e){let t=6;t+=4*(1-Ba(0,70,Math.hypot(a*1.6,e*.9))),t+=3*(1-Ba(0,18,Math.hypot(a-12,e+36)));let i=Math.abs(a-(46+Math.sin(e*.04)*4));t-=7*(1-Ba(3,16,i))*Ba(-110,-60,e);let n=Math.abs(Math.hypot(a+6,e-8)-72);return t-=6*(1-Ba(3,14,n))*Ba(-40,10,e),t+=7*(1-Ba(0,40,Math.hypot(a-84,e+10))),t}var br=[{nombre:"siloe",x:6,z:62,r:4.5},{nombre:"rey",x:-6,z:66,r:3.5},{nombre:"gihon",x:36,z:24,r:2.5}],ii=[{x:22,z:-50,puerta:"ovejas"},{x:4,z:-57,torre:"hananeel"},{x:-13,z:-53,puerta:"pescado"},{x:-29,z:-39,puerta:"vieja"},{x:-35,z:-20,torre:"ancho"},{x:-36,z:-2,torre:"hornos"},{x:-31,z:16,puerta:"valle"},{x:-24,z:34},{x:-14,z:50,puerta:"basurero"},{x:1,z:56,puerta:"fuente"},{x:11,z:46,torre:"valientes"},{x:19,z:29,puerta:"aguas"},{x:26,z:8,puerta:"caballos"},{x:31,z:-12,puerta:"oriental"},{x:32,z:-33,puerta:"inspeccion"}],vr=["eliasib","jerico","zacur","senaa","meremot","mesulam","sadoc","tecoa","joiada","gabaon","uziel","refaias","jedaias","malquias_harim","salum_hijas","hanun_zanoa","malquias_recab","salum_colhoze","nehemias_azbuc","levitas","hasabias","bavai","ezer","baruc","meremot2","sacerdotes","benjamin_hasub","azarias","binui","palal","servidores_ofel","tecoa2","sacerdotes_caballos","sadoc_imer","semaias_guardian","hananias_hanun","malquias_orfebre","orfebres_comerciantes"],ud=8,xr=5;function Jf(a){let e=Math.sin(a*12.9898+4.1)*43758.5453;return .05+(e-Math.floor(e))*.3}function ql(){let a=ii.length,e=[],t=(n,r,o)=>({x:n.x+(r.x-n.x)*o,z:n.z+(r.z-n.z)*o}),i=0;for(let n=0;n<a;n++){let r=ii[n],o=ii[(n+1)%a],s=Math.hypot(o.x-r.x,o.z-r.z),l=r.puerta?xr/2/s:0,c=o.puerta?1-xr/2/s:1;if(r.puerta){let u=ii[(n-1+a)%a],d=Math.hypot(r.x-u.x,r.z-u.z);e.push({id:e.length,tipo:"puerta",nombre:r.puerta,a:t(r,u,xr/2/d),b:t(r,o,l),largo:xr,familia:vr[i++%vr.length],avance0:.1})}let h=Math.max(1,Math.round(s*(c-l)/ud));for(let u=0;u<h;u++){let d=t(r,o,l+(c-l)*u/h),p=t(r,o,l+(c-l)*(u+1)/h);e.push({id:e.length,tipo:"muro",nombre:r.torre&&u===0?r.torre:null,a:d,b:p,largo:Math.hypot(p.x-d.x,p.z-d.z),familia:vr[i++%vr.length],avance0:Jf(e.length)})}}return e[0].avance0=.35,e}function Ti(a,e){let t=!1;for(let i=0,n=ii.length-1;i<ii.length;n=i++){let r=ii[i],o=ii[n];r.z>e!=o.z>e&&a<(o.x-r.x)*(e-r.z)/(o.z-r.z)+r.x&&(t=!t)}return t}var pi={muro:{costo:{piedra:110,madera:10},trabajo:80,hp:400},puerta:{costo:{piedra:150,madera:40},trabajo:100,hp:500},hojas:{costo:{madera:100},trabajo:45,requiere:"cerrojos"},reparar:.4},Ze={aldeano:{hp:30,ataque:2,cadencia:1.5,alcance:.9,armadura:0,vel:3.3,vision:9,carga:10,costo:{comida:50},tiempo:12,pob:1,tecla:"Q"},lancero:{hp:60,ataque:6,cadencia:1.6,alcance:1.1,armadura:1,vel:3.2,vision:10,costo:{comida:40,madera:25},tiempo:14,pob:1,tecla:"Q"},arquero:{hp:32,ataque:4,cadencia:2,alcance:9,armadura:0,vel:3.2,vision:12,costo:{comida:30,madera:40},tiempo:15,pob:1,tecla:"W"},jinete:{hp:95,ataque:7,cadencia:1.8,alcance:1.2,armadura:1,vel:5.2,vision:13,pob:1},nehemias:{hp:140,ataque:5,cadencia:1.6,alcance:1.1,armadura:2,vel:3.5,vision:14,pob:0,heroe:!0}},ki={saqueador:{hp:40,ataque:5,cadencia:1.6,alcance:1,armadura:0,vel:3,vision:10},hondero:{hp:26,ataque:3,cadencia:2.2,alcance:8,armadura:0,vel:3,vision:11},jinete_arabe:{hp:60,ataque:6,cadencia:1.8,alcance:1.2,armadura:1,vel:5,vision:12},cabecilla:{hp:110,ataque:8,cadencia:1.7,alcance:1.1,armadura:2,vel:3,vision:12}},Mr=40,Xl={arbol:.55,cantera:.45,escombros:.6,olivo:.5,oveja:.8,granja:.45},Po={arbol:"madera",cantera:"piedra",escombros:"piedra",olivo:"comida",oveja:"comida",granja:"comida"},Me={gobernador:{tam:7,hp:1600,entrega:["comida","madera","piedra"],entrena:["aldeano"],guarnicion:15,investiga:["cartas_rey","guardia_noche"],ataque:{dano:3,alcance:9,cadencia:2},pob:10},casa:{tam:3,hp:500,costo:{madera:30},trabajo:18,pob:5,tecla:"Q"},aserradero:{tam:4,hp:700,costo:{madera:60},trabajo:22,entrega:["madera"],investiga:["hachas","carretillas"],tecla:"W"},deposito:{tam:4,hp:700,costo:{madera:60},trabajo:22,entrega:["piedra"],investiga:["picos","cestas"],tecla:"E"},molino:{tam:4,hp:700,costo:{madera:80},trabajo:25,entrega:["comida"],investiga:["arado","yugo"],tecla:"R"},granja:{tam:6,hp:300,costo:{madera:50},trabajo:12,comida:175,requiere:"molino",tecla:"T",suelo:!0},cuartel:{tam:6,hp:1100,costo:{madera:120,piedra:40},trabajo:40,entrena:["lancero","arquero"],investiga:["escudos","corazas","mitad"],tecla:"A"},taller:{tam:5,hp:800,costo:{madera:110},trabajo:30,investiga:["cerrojos","andamios"],tecla:"S"},torre:{tam:3,hp:900,costo:{madera:40,piedra:110},trabajo:35,guarnicion:4,ataque:{dano:5,alcance:10,cadencia:2},tecla:"D"}},Hi={cartas_rey:{costo:{comida:100},tiempo:25,cita:"Neh 2:8"},guardia_noche:{costo:{comida:150,madera:50},tiempo:30,cita:"Neh 4:22"},hachas:{costo:{comida:100,madera:50},tiempo:25},carretillas:{costo:{comida:175,madera:50},tiempo:35},picos:{costo:{comida:100,madera:75},tiempo:25},cestas:{costo:{comida:75,madera:50},tiempo:20,cita:"Neh 4:10"},arado:{costo:{comida:75,madera:75},tiempo:25},yugo:{costo:{comida:125,madera:50},tiempo:30},escudos:{costo:{comida:100,madera:40},tiempo:30,cita:"Neh 4:16"},corazas:{costo:{comida:150,madera:60},tiempo:35,cita:"Neh 4:16"},mitad:{costo:{comida:150,madera:100},tiempo:35,cita:"Neh 4:16-17",requiereHito:"mitad_altura"},cerrojos:{costo:{madera:120,piedra:30},tiempo:40,cita:"Neh 3:3"},andamios:{costo:{comida:100,madera:100},tiempo:30}},Sr={orar:{recarga:120,animo:18,cita:"Neh 4:9",tecla:"Q"},exhortar:{recarga:90,radio:14,duracion:30,cita:"Neh 4:14",tecla:"W"},trompeta:{recarga:60,cita:"Neh 4:20",tecla:"E",requiereHito:"mitad_altura"}},Io={radio:11,trabajo:.15},zo={x:2,z:-8},Si={x:14,z:-36,r:9},wi={samaria:{x:-10,z:-106,nombre:"samaria"},amon:{x:106,z:-20,nombre:"amon"},arabes:{x:20,z:106,nombre:"arabes"},asdod:{x:-106,z:14,nombre:"asdod"}},No=[...Array.from({length:34},(a,e)=>({tipo:"arbol",x:-86+e%6*4.2+e*7%3,z:-26+Math.floor(e/6)*4.5+e*5%3,cant:90})),...Array.from({length:18},(a,e)=>({tipo:"arbol",x:30+e%6*4+e*3%2,z:-86+Math.floor(e/6)*4.4,cant:90})),...Array.from({length:8},(a,e)=>({tipo:"cantera",x:-58+e%4*4,z:-70+Math.floor(e/4)*4.5,cant:400})),...Array.from({length:10},(a,e)=>({tipo:"olivo",x:64+e%5*4.5,z:-4+Math.floor(e/5)*5,cant:120})),...Array.from({length:8},(a,e)=>({tipo:"oveja",x:34+e%4*2.2,z:-66+Math.floor(e/4)*2.4,cant:100})),...Array.from({length:6},(a,e)=>({tipo:"oveja",x:12+e%3*2.2,z:-15+Math.floor(e/3)*2.2,cant:100})),...Array.from({length:6},(a,e)=>({tipo:"olivo",x:-16+e%3*4,z:14+Math.floor(e/3)*4.5,cant:125})),{tipo:"escombros",x:-10,z:-20,cant:140},{tipo:"escombros",x:-16,z:-12,cant:140},{tipo:"escombros",x:8,z:8,cant:140},{tipo:"escombros",x:-4,z:22,cant:140}],ca=52,Do={facil:{dia:46,oleada:.6,animoBase:.6,nombre:"facil"},normal:{dia:40,oleada:1,animoBase:1,nombre:"normal"},dificil:{dia:36,oleada:1.45,animoBase:1.3,nombre:"dificil"}},Uo={desde:.79,hasta:.96},Yl=[{dia:8,de:["samaria"],tropa:{saqueador:3}},{dia:13,de:["asdod"],tropa:{saqueador:4,hondero:2}},{dia:18,de:["amon"],tropa:{saqueador:5,hondero:2}},{dia:22,de:["arabes"],tropa:{jinete_arabe:4,saqueador:3}},{dia:26,de:["samaria","amon"],tropa:{saqueador:5,hondero:3,cabecilla:1}},{dia:30,de:["asdod","arabes"],tropa:{saqueador:5,jinete_arabe:3,hondero:2}},{dia:35,de:["samaria","asdod"],tropa:{saqueador:6,hondero:4,cabecilla:1}},{dia:40,de:["amon","arabes"],tropa:{saqueador:6,jinete_arabe:4,hondero:3,cabecilla:1}},{dia:46,de:["samaria","amon","arabes","asdod"],tropa:{saqueador:5,hondero:3,jinete_arabe:2,cabecilla:1}}],Oo=.5,Tr={recursos:{comida:200,madera:220,piedra:120},unidades:[{tipo:"nehemias",x:2,z:-1},...Array.from({length:6},(a,e)=>({tipo:"aldeano",x:-3+e%3*1.6,z:0+Math.floor(e/3)*1.6})),{tipo:"jinete",x:7,z:0},{tipo:"jinete",x:8.5,z:0}],animo:60},jt=a=>{let e=Math.sin(a*127.1+311.7)*43758.5453;return e-Math.floor(e)};function Ro(a,e){let t=1/0;for(let i=0;i<ii.length;i++){let n=ii[i],r=ii[(i+1)%ii.length],o=r.x-n.x,s=r.z-n.z,l=o*o+s*s||1,c=Math.max(0,Math.min(1,((a-n.x)*o+(e-n.z)*s)/l));t=Math.min(t,Math.hypot(a-(n.x+o*c),e-(n.z+s*c)))}return t}var Lo=(a,e,t)=>No.some(i=>Math.hypot(i.x-a,i.z-e)<t),Kf=(a,e,t)=>Object.values(wi).some(i=>Math.hypot(i.x-a,i.z-e)<t),$l=(()=>{let a={ruinas:[],barrios:[],ciudadela:{x:-5,z:-47},rocas:[],terrazas:[],cipreses:[],palmeras:[],olivos:[],bloques:[]},e=(t,i,n,r,o=0)=>a.bloques.push({x:t,z:i,an:n,fo:r,rot:o});e(Si.x,Si.z-.5,14,14);for(let t=0;t<24;t++){let i=-27+jt(t+70)*48,n=-38+jt(t+120)*81;if(!Ti(i,n)||Math.hypot(i-Si.x,n-Si.z)<14||Math.hypot(i,n+8)<13||Ro(i,n)<5.5||Lo(i,n,4))continue;let r=jt(t)*.4;a.ruinas.push({x:i,z:n,rot:r}),e(i,n,4,3.4,r)}for(let t=0;t<32;t++){let i=-29+t%4*15,n=-35+Math.floor(t/4)*10;if(!(!Ti(i,n)||Math.hypot(i-Si.x,n-Si.z)<17||Math.abs(i)<17&&Math.abs(n)<22)&&!(Ro(i,n)<6||Lo(i,n,5)))if(t%3){let r=4+jt(t)*2,o=2.5+jt(t+9)*1.5;a.barrios.push({x:i,z:n,casa:!0,an:r,al:o}),e(i,n,r,4)}else a.barrios.push({x:i,z:n,casa:!1}),e(i,n,5,4.4)}e(a.ciudadela.x,a.ciudadela.z,16,6.5);for(let t=0;t<650;t++){let i=(jt(t+700)-.5)*300,n=(jt(t+1600)-.5)*300;if(Ti(i,n))continue;let r={x:i,z:n,sx:.25+jt(t)*.7,sy:.2+jt(t+2)*.4,sz:.4+jt(t+3)*.6,rot:jt(t)*4,mata:t%3===0};Math.abs(i)>vt.medio-2||Math.abs(n)>vt.medio-2||Ro(i,n)<4||Lo(i,n,2.5)||Kf(i,n,8)?(r.sx=Math.min(r.sx,.5),r.sz=Math.min(r.sz,.55)):r.sx>.6&&r.sz>.6&&e(i,n,r.sx,r.sz,r.rot),a.rocas.push(r)}for(let t=0;t<6;t++)for(let i=0;i<22;i++){let n=62+t%3*6,r=-.5+Math.floor(t/3)*.7+i*(.83/n),o=8+Math.cos(r)*n,s=15+Math.sin(r)*n;Lo(o,s,2.2)||(a.terrazas.push({x:o,z:s,ang:r}),e(o,s,.9,.65,-r-Math.PI/2))}for(let t=0;t<16;t++){let i=36+jt(t+89)*7,n=14+jt(t+109)*22,r={x:i,z:n,h:3+jt(t+77)*3,w:.85+jt(t+55)*.8};Ro(i,n)<3||(a.cipreses.push(r),e(i,n,.6,.6))}for(let[t,i]of[[-4,63],[11,66],[37,26]])a.palmeras.push({x:t,z:i}),e(t,i,.6,.6);for(let t=0;t<14;t++){let i=69+t%7*4,n=12+Math.floor(t/7)*6;a.olivos.push({x:i,z:n}),e(i,n,1.2,1.2)}return a})();var ua={};hd(ua,{DECISIONES:()=>Sn,actualizarNiebla:()=>_c,aldeanosOciosos:()=>Br,avanceMuro:()=>Tn,cancelarCola:()=>uc,cancelarColaEn:()=>wc,cancelarEdificio:()=>cc,cancelarEdificioEn:()=>Or,cancelarInvestigacion:()=>pc,cancelarInvestigacionEn:()=>Ec,colgarHojas:()=>Mc,colocarEdificio:()=>lc,crearPartida:()=>Fa,cuenta:()=>Ga,decidir:()=>Qo,deserializar:()=>Fo,entrenar:()=>hc,entrenarEn:()=>Sc,esNoche:()=>Gi,gobernador:()=>Ot,iniciar:()=>Va,investigar:()=>dc,investigarEn:()=>Tc,nehemias:()=>En,objetivos:()=>Ko,ordenAtaqueMovil:()=>vc,ordenDefender:()=>xc,ordenDetener:()=>yc,ordenGuarnecerCerca:()=>Ur,ordenar:()=>Zi,paso:()=>gc,pasoFijo:()=>Dd,pasoProduccion:()=>mc,puedeConstruir:()=>Mn,puedeEntrenar:()=>Zo,puedeInvestigar:()=>Jo,puntoReunion:()=>ts,quitarEdificio:()=>$o,sacarGuarnicion:()=>bc,serializar:()=>Bo,tiene:()=>ot,usarHabilidad:()=>es});var _n=2;function Fa(a="normal"){let e=ql().map(o=>{let s=pi[o.tipo];return{...o,avance:o.avance0,hpMax:s.hp,hp:s.hp*o.avance0,hojas:!1,abierta:!1}}),t=Math.ceil(vt.lado/_n),i={version:1,dificultad:a,t:0,dia:1,hora:.3,velocidad:1,siguienteId:1,recursosJugador:{...Tr.recursos},animo:Tr.animo,pob:0,pobMax:0,tecnologias:{},hitos:{},habilidades:{orar:0,exhortar:0,trompeta:0},niebla:{ancho:t,alto:t,celda:_n,datos:new Uint8Array(t*t)},unidades:new Map,enemigos:new Map,edificios:new Map,recursos:new Map,tramos:e,proyectiles:[],eventos:[],mensajes:[],decision:null,estadisticas:{recogido:{comida:0,madera:0,piedra:0},entrenados:0,heridos:0,rechazadas:0,oleadas:0,avancePorDia:[],animoPorDia:[]},oleadasLanzadas:[],avisosDados:[],resultado:null},n=Kl(i,"gobernador",zo.x,zo.z);n.avance=1,n.hp=n.hpMax;for(let o of Tr.unidades)Jl(i,o.tipo,o.x,o.z);for(let o of No)dd(i,o.tipo,o.x,o.z,o.cant);for(let o of e){if(o.tipo!=="muro"||o.avance>.3)continue;let s=(o.a.x+o.b.x)/2,l=(o.a.z+o.b.z)/2,c=-(o.b.z-o.a.z)/o.largo,h=(o.b.x-o.a.x)/o.largo,u=Ti(s+c*4,l+h*4)?1:-1;dd(i,"escombros",s+c*4.5*u,l+h*4.5*u,160)}let r=i.niebla;for(let o of e)for(let s=0;s<=1;s+=1/Math.ceil(o.largo/2)){let l=o.a.x+(o.b.x-o.a.x)*s,c=o.a.z+(o.b.z-o.a.z)*s;for(let h=-7;h<=7;h+=_n)for(let u=-7;u<=7;u+=_n){if(u*u+h*h>49)continue;let d=Math.floor((l+u+vt.medio)/_n),p=Math.floor((c+h+vt.medio)/_n);d>=0&&p>=0&&d<r.ancho&&p<r.alto&&(r.datos[p*r.ancho+d]=1)}}return ka(i),i.dif=Do[a],i}function Jl(a,e,t,i){let n=Ze[e],r={id:a.siguienteId++,tipo:e,x:t,z:i,dir:0,hp:n.hp,hpMax:n.hp,accion:"quieto",carga:null,armado:!1,orden:null,ruta:null,espera:0,golpe:0,herido:0,grupo:0};return a.unidades.set(r.id,r),r}function pd(a,e,t,i,n){let r=ki[e],o={id:a.siguienteId++,tipo:e,faccion:t,x:i,z:n,dir:0,hp:r.hp,hpMax:r.hp,accion:"camina",objetivo:null,ruta:null,espera:0,golpe:0,botin:null};return a.enemigos.set(o.id,o),o}function Kl(a,e,t,i){let n=Me[e],r={id:a.siguienteId++,tipo:e,x:t,z:i,avance:0,hp:1,hpMax:n.hp,fuego:0,trabajando:!1,cola:[],investigando:null,reunion:null,guarnicion:[],golpe:0,comida:n.comida||0};return a.edificios.set(r.id,r),r}function dd(a,e,t,i,n){let r={id:a.siguienteId++,tipo:e,x:t,z:i,cant:n,cantMax:n,dir:(t*13+i*7)%6.28};return a.recursos.set(r.id,r),r}function ka(a){let e=0,t=0;for(let i of a.unidades.values())e+=Ze[i.tipo].pob;for(let i of a.edificios.values()){i.avance>=1&&(t+=Me[i.tipo].pob||0);for(let n of i.cola)Ze[n]&&(e+=Ze[n].pob)}a.pob=e,a.pobMax=Math.min(t,75)}var md=["unidades","enemigos","edificios","recursos"];function Bo(a){let e={...a,niebla:{...a.niebla,datos:Array.from(a.niebla.datos)},eventos:[],dif:void 0};for(let t of md)e[t]=[...a[t].values()];return JSON.stringify(e)}function Fo(a){let e=JSON.parse(a);for(let t of md)e[t]=new Map(e[t].map(i=>[i.id,i]));return e.niebla.datos=Uint8Array.from(e.niebla.datos),e.dif=Do[e.dificultad],e.eventos=[],e}var Ge=vt.lado,Ho=vt.medio,at=a=>Math.max(0,Math.min(Ge-1,Math.floor(a+Ho))),Jt=a=>a-Ho+.5;function _d(a){let e={fijo:new Uint8Array(Ge*Ge),tramoDe:new Int16Array(Ge*Ge).fill(-1),cuenta:new Uint16Array(Ge*Ge)};for(let t=0;t<Ge;t++)for(let i=0;i<Ge;i++){let n=Jt(i),r=Jt(t);br.some(o=>Math.hypot(n-o.x,r-o.z)<o.r)&&(e.fijo[t*Ge+i]=1)}for(let t of $l.bloques)Qf(e,t);for(let t of a.tramos)eg(e,t);for(let t of a.edificios.values())wr(e,t,1);for(let t of a.recursos.values())tc(e,t,1);return e}function Qf(a,e){let t=Math.cos(e.rot),i=Math.sin(e.rot),n=e.an/2+.3,r=e.fo/2+.3,o=Math.hypot(n,r);for(let s=at(e.z-o);s<=at(e.z+o);s++)for(let l=at(e.x-o);l<=at(e.x+o);l++){let c=Jt(l)-e.x,h=Jt(s)-e.z;Math.abs(c*t-h*i)<=n&&Math.abs(c*i+h*t)<=r&&(a.fijo[s*Ge+l]=1)}}function eg(a,e){let t=at(Math.min(e.a.x,e.b.x)-2),i=at(Math.max(e.a.x,e.b.x)+2),n=at(Math.min(e.a.z,e.b.z)-2),r=at(Math.max(e.a.z,e.b.z)+2);for(let o=n;o<=r;o++)for(let s=t;s<=i;s++)Ei(Jt(s),Jt(o),e.a,e.b)<.95&&(a.tramoDe[o*Ge+s]=e.id)}function Ei(a,e,t,i){let n=i.x-t.x,r=i.z-t.z,o=n*n+r*r||1,s=Math.max(0,Math.min(1,((a-t.x)*n+(e-t.z)*r)/o));return Math.hypot(a-(t.x+n*s),e-(t.z+r*s))}function vd(a,e,t,i,n,r){for(let o=Math.max(0,t);o<=Math.min(Ge-1,n);o++)for(let s=Math.max(0,e);s<=Math.min(Ge-1,i);s++){let l=o*Ge+s;a.cuenta[l]+=r,a.fijo[l]=a.cuenta[l]>0?Math.max(a.fijo[l],2):a.fijo[l]===1?1:0}}function wr(a,e,t){let i=Me[e.tipo];if(i.suelo)return;let n=i.tam/2;vd(a,at(e.x-n+.01),at(e.z-n+.01),at(e.x+n-.01),at(e.z+n-.01),t)}function tc(a,e,t){if(e.tipo==="oveja")return;let i=e.tipo==="cantera"?1.4:e.tipo==="escombros"?1.2:.4;vd(a,at(e.x-i),at(e.z-i),at(e.x+i),at(e.z+i),t)}function tg(a,e){return a.avance<1||a.hp<=0?!1:a.tipo==="puerta"?a.hojas?e==="enemigo":!1:!0}function xn(a,e,t,i,n){if(t<0||i<0||t>=Ge||i>=Ge)return!1;let r=i*Ge+t;if(e.fijo[r])return!1;let o=e.tramoDe[r];return o<0||!tg(a.tramos[o],n)}var mi=(a,e,t,i,n)=>xn(a,e,at(t),at(i),n),ko=new Float32Array(Ge*Ge),Ql=new Int32Array(Ge*Ge),ec=new Uint32Array(Ge*Ge),fd=new Uint32Array(Ge*Ge),vn=0,it={idx:new Int32Array(Ge*Ge),f:new Float32Array(Ge*Ge),n:0};function gd(a,e){let t=it.n++;for(;t>0;){let i=t-1>>1;if(it.f[i]<=e)break;it.idx[t]=it.idx[i],it.f[t]=it.f[i],t=i}it.idx[t]=a,it.f[t]=e}function ig(){let a=it.idx[0],e=it.idx[--it.n],t=it.f[it.n],i=0;for(;;){let n=2*i+1;if(n>=it.n||(n+1<it.n&&it.f[n+1]<it.f[n]&&n++,it.f[n]>=t))break;it.idx[i]=it.idx[n],it.f[i]=it.f[n],i=n}return it.idx[i]=e,it.f[i]=t,a}var ag=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.4142],[1,-1,1.4142],[-1,1,1.4142],[-1,-1,1.4142]];function yn(a,e,t,i,n,r,o,s,l=null,c=3e4){vn++;let h=at(t),u=at(i);if(!xn(a,e,h,u,s)){let y=Ha(a,e,t,i,s,4);if(!y)return null;h=y.cx,u=y.cz}let d=l||((y,C)=>Math.hypot(y-n,C-r)<=o),p=(y,C)=>{let S=Math.abs(Jt(y)-n),w=Math.abs(Jt(C)-r);return Math.max(0,Math.max(S,w)+.4142*Math.min(S,w)-o)},m=u*Ge+h;it.n=0,ko[m]=0,Ql[m]=-1,ec[m]=vn,gd(m,p(h,u));let g=m,f=1/0,x=-1,_=0;for(;it.n;){let y=ig();if(fd[y]===vn)continue;fd[y]=vn;let C=y%Ge,S=y/Ge|0;if(d(Jt(C),Jt(S))){x=y;break}let w=p(C,S);if(w<f&&(f=w,g=y),++_>c)break;for(let[O,N,B]of ag){let $=C+O,R=S+N;if(!xn(a,e,$,R,s)||O&&N&&(!xn(a,e,C+O,S,s)||!xn(a,e,C,S+N,s)))continue;let V=R*Ge+$,W=ko[y]+B;ec[V]===vn&&W>=ko[V]||(ec[V]=vn,ko[V]=W,Ql[V]=y,gd(V,W+p($,R)*1.05))}}if(x<0&&(l||(x=g,x===m)))return null;let v=[];for(let y=x;y!==-1&&y!==m;y=Ql[y])v.push(y);return v.reverse(),ng(a,e,t,i,v.map(y=>({x:Jt(y%Ge),z:Jt(y/Ge|0)})),s)}function xd(a,e,t,i){if(!a||!a.length)return!1;let n=a[a.length-1];return Math.hypot(n.x-e,n.z-t)<=i+.8}function ng(a,e,t,i,n,r){if(n.length<3)return n;let o=[],s={x:t,z:i},l=0;for(;l<n.length;){let c=l;for(let h=Math.min(n.length-1,l+24);h>l;h--)if(rg(a,e,s.x,s.z,n[h].x,n[h].z,r)){c=h;break}o.push(n[c]),s=n[c],l=c+1}return o}function rg(a,e,t,i,n,r,o){let s=Math.hypot(n-t,r-i),l=Math.ceil(s/.4);for(let c=1;c<=l;c++){let h=c/l,u=t+(n-t)*h,d=i+(r-i)*h;if(!mi(a,e,u,d,o)||!mi(a,e,u+.35,d+.35,o)||!mi(a,e,u-.35,d-.35,o)||!mi(a,e,u+.35,d-.35,o)||!mi(a,e,u-.35,d+.35,o))return!1}return!0}function Ha(a,e,t,i,n,r=10){let o=at(t),s=at(i);for(let l=0;l<=r;l++)for(let c=-l;c<=l;c++)for(let h=-l;h<=l;h++)if(Math.max(Math.abs(h),Math.abs(c))===l&&xn(a,e,o+h,s+c,n))return{cx:o+h,cz:s+c,x:Jt(o+h),z:Jt(s+c)};return null}function Go(a,e,t,i,n){let r=Me[t],o=r.tam/2;if(Math.abs(i)+o>Ho-4||Math.abs(n)+o>Ho-4)return"borde";for(let s=at(n-o+.01);s<=at(n+o-.01);s++)for(let l=at(i-o+.01);l<=at(i+o-.01);l++){let c=s*Ge+l;if(e.fijo[c])return"ocupado";if(e.tramoDe[c]>=0)return"muro"}for(let s of a.edificios.values()){if(!Me[s.tipo].suelo||!r.suelo)continue;let l=(Me[s.tipo].tam+r.tam)/2;if(Math.abs(s.x-i)<l&&Math.abs(s.z-n)<l)return"ocupado"}for(let s of a.tramos)if(Ei(i,n,s.a,s.b)<o+1.6)return"muro";return!0}var yd=new WeakMap;function pt(a){let e=yd.get(a);return e||(e=_d(a),yd.set(a,e)),e}var Kt=(a,e)=>Math.hypot(a.x-e.x,a.z-e.z);function Ke(a,e){let t=Me[e.tipo].tam/2,i=Math.max(0,Math.abs(a.x-e.x)-t),n=Math.max(0,Math.abs(a.z-e.z)-t);return Math.hypot(i,n)}function Qe(a,e,t,i,n={}){a.eventos.push({tipo:e,x:t,z:i,...n})}function Ae(a,e,t={},i=!1,n=null,r=null){a.mensajes.push({t:a.t,dia:a.dia,clave:e,datos:t,peligro:i,x:n,z:r}),a.mensajes.length>60&&a.mensajes.shift()}function Et(a,e,t){let i=Math.min(a.animo,e*(a.dif?a.dif.animoBase:1));a.animo-=i;let n=a.estadisticas.animoPerdido||(a.estadisticas.animoPerdido={});n[t]=(n[t]||0)+i}var ot=(a,e)=>!!a.tecnologias[e],Gi=a=>a.hora>=Uo.desde&&a.hora<Uo.hasta,bd=a=>.6+.8*Math.max(0,Math.min(100,a.animo))/100;function Er(a,e){return Object.entries(e||{}).every(([t,i])=>a.recursosJugador[t]>=i)}function Vo(a,e){if(!Er(a,e))return!1;for(let[t,i]of Object.entries(e||{}))a.recursosJugador[t]-=i;return!0}function Ar(a,e,t=1){for(let[i,n]of Object.entries(e||{}))a.recursosJugador[i]+=Math.floor(n*t)}function jo(a,e){let t={};for(let[i,n]of Object.entries(e||{}))a.recursosJugador[i]<n&&(t[i]=n-Math.floor(a.recursosJugador[i]));return t}function Cr(a,e){let i={...Ze[e.tipo]};return(e.tipo==="lancero"||e.tipo==="arquero"||e.tipo==="jinete")&&ot(a,"escudos")&&(i.armadura+=1),e.tipo==="aldeano"&&e.armado&&(i.ataque+=3,i.armadura+=1),e.exhortado>a.t&&(i.ataque*=1.25),i}function Rr(a,e){let t=e==="lancero"||e==="arquero"||e==="jinete";return Ze[e].hp+(t&&ot(a,"corazas")?15:0)}var Md=a=>ki[a.tipo];function Lr(a,e){return Math.max(1,a-e)}function Sd(a,e,t,i){let n=null,r=1/0;for(let o of a.edificios.values()){if(o.avance<1||!(Me[o.tipo].entrega||[]).includes(e))continue;let s=Ke({x:t,z:i},o);s<r&&(r=s,n=o)}return n}function Ot(a){for(let e of a.edificios.values())if(e.tipo==="gobernador")return e;return null}var og={arbol:"tala",cantera:"pica",escombros:"pica",olivo:"cosecha",oveja:"cosecha",granja:"cosecha"};function Nt(a,e,t,i,n=.4,r=null){let o=yn(a,pt(a),e.x,e.z,t,i,n,"nuestro",r);return e.ruta=o||[],e.destino={x:t,z:i,radio:n,meta:r},!!o}function Ai(a,e,t,i){if(!e.ruta||!e.ruta.length)return!0;let n=t*i;for(;n>0&&e.ruta.length;){let r=e.ruta[0],o=r.x-e.x,s=r.z-e.z,l=Math.hypot(o,s);if(l>.01&&(e.dir=Math.atan2(o,s)),l<=n)e.x=r.x,e.z=r.z,e.ruta.shift(),n-=l;else{let c=e.x+o/l*n,h=e.z+s/l*n;if(!mi(a,pt(a),c,h,"nuestro"))return e.destino&&Nt(a,e,e.destino.x,e.destino.z,e.destino.radio,e.destino.meta),!e.ruta.length;e.x=c,e.z=h,n=0}}return!e.ruta.length}function Ir(a,e){return e.ruta=null,e.destino=null,e.reintentos=(e.reintentos||0)+1,e.reintentos>4?(e.reintentos=0,bt(e),Ae(a,"no_llega"),!0):!1}function bt(a){a.orden=null,a.ruta=null,a.accion="quieto"}function Ci(a,e,t,i){Bt(a,e),e.orden={tipo:"mover",x:t,z:i},Nt(a,e,t,i,.5),e.accion="camina"}function ic(a,e,t,i){Bt(a,e),e.orden={tipo:"atacar_mover",x:t,z:i},Nt(a,e,t,i,1),e.accion="camina"}function bn(a,e,t){if(e.tipo!=="aldeano")return Ci(a,e,t.x,t.z);Bt(a,e),e.carga&&e.carga.recurso!==Po[t.tipo]&&(e.carga=null),e.orden={tipo:"recolectar",id:t.id,tipoRec:t.tipo,fase:"ir"},e.ruta=null,e.cerca=!1}function zr(a,e,t){Bt(a,e),e.carga&&e.carga.recurso!=="comida"&&(e.carga=null),e.orden={tipo:"recolectar",granja:t.id,tipoRec:"granja",fase:"ir"},e.ruta=null,e.cerca=!1}function Nr(a,e,t){if(e.tipo!=="aldeano")return Ci(a,e,t.x,t.z);Bt(a,e),e.orden={tipo:"construir",id:t.id},e.ruta=null}function ac(a,e,t,i=!1){if(e.tipo!=="aldeano")return Ci(a,e,(t.a.x+t.b.x)/2,(t.a.z+t.b.z)/2);Bt(a,e),e.orden={tipo:"tramo",id:t.id,hojas:i},e.ruta=null}function wd(a,e,t){Bt(a,e),e.orden={tipo:"atacar",id:t.id},e.ruta=null}function Xo(a,e,t){if(!Me[t.tipo].guarnicion||t.avance<1)return Ci(a,e,t.x,t.z);Bt(a,e),e.orden={tipo:"guarnecer",id:t.id},e.ruta=null}function nc(a,e){if(e.orden&&(e.orden.tipo==="refugio"||e.orden.tipo==="herido"))return;let t=null,i=70;for(let r of a.edificios.values()){let o=Me[r.tipo].guarnicion;if(!o||r.avance<1||r.guarnicion.length>=o)continue;let s=Ke(e,r);s<i&&(i=s,t=r)}let n=e.orden&&e.orden.tipo!=="atacar"?e.orden:null;e.orden={tipo:"refugio",id:t?t.id:null,antes:n},e.ruta=null,(!a._avisoRefugio||a.t-a._avisoRefugio>20)&&(a._avisoRefugio=a.t,Ae(a,"aldeanos_huyen",{},!0,e.x,e.z))}function Ed(a,e,t,i){for(let n of a.enemigos.values())if(n.accion!=="huye"&&Math.hypot(n.x-e,n.z-t)<i)return!0;return!1}function sg(a,e,t){let i=e.orden,n=i.id&&a.edificios.get(i.id);if(!n){if(!Ed(a,e.x,e.z,16)){e.orden=i.antes,e.ruta=null;return}let r=Ot(a);(!e.ruta||!e.ruta.length)&&Nt(a,e,r?r.x:0,r?r.z+6:0,2),e.accion="camina",Ai(a,e,Ze.aldeano.vel*1.1,t);return}if(Ke(e,n)<=1.6){if(n.guarnicion.length>=Me[n.tipo].guarnicion){i.id=null;return}e.accion="guarnecido",e.dentro=n.id,e.ruta=null,n.guarnicion.push(e.id),e.refugio={antes:i.antes,desde:a.t},e.orden=null;return}(!e.ruta||!e.destino||e.destino.id!==n.id)&&(Nt(a,e,n.x,n.z,0,(r,o)=>Ke({x:r,z:o},n)<=1.1),e.destino.id=n.id),e.accion="camina",Ai(a,e,Ze.aldeano.vel*1.1,t)&&Ke(e,n)>1.6&&Ir(a,e)}function lg(a,e){if(!e.refugio||e.herido>0||a.t-e.refugio.desde<6)return;let t=a.edificios.get(e.dentro);if(t&&Ed(a,t.x,t.z,22)){e.refugio.desde=a.t-3;return}let i=e.refugio.antes;e.refugio=null,Bt(a,e),e.orden=i,e.ruta=null}function Bt(a,e){if(e.accion!=="guarnecido")return;let t=a.edificios.get(e.dentro);t&&(t.guarnicion=t.guarnicion.filter(n=>n!==e.id)),e.dentro=null,e.accion="quieto",e.refugio=null;let i=t?Ha(a,pt(a),t.x,t.z+Me[t.tipo].tam/2+1,"nuestro",8):null;i&&(e.x=i.x,e.z=i.z)}function Ad(a,e){for(let t of[...e.guarnicion]){let i=a.unidades.get(t);i&&i.herido<=0&&(Bt(a,i),bt(i))}}function Pr(a,e,t,i,n=18){let r=null,o=n;for(let s of a.recursos.values()){if(s.tipo!==e||s.cant<=0)continue;let l=Math.hypot(s.x-t,s.z-i);l<o&&(o=l,r=s)}return r}var cg=a=>({arbol:1.6,cantera:2.9,escombros:2.7,olivo:1.6,oveja:1})[a]||1.6;function hg(a,e){let t=Xl[e];return e==="arbol"&&ot(a,"hachas")&&(t*=1.2),(e==="cantera"||e==="escombros")&&ot(a,"picos")&&(t*=1.2),e==="escombros"&&ot(a,"cestas")&&(t*=1.3),e==="granja"&&ot(a,"yugo")&&(t*=1.15),t}function ug(a,e){return Ze.aldeano.carga+(ot(a,"carretillas")?5:0)}function dg(a,e){for(let t of a.unidades.values())if(t.tipo==="nehemias"&&t.accion!=="herido"&&t.accion!=="guarnecido"&&!t.ausente&&Kt(t,e)<Io.radio)return 1+Io.trabajo;return 1}function rc(a,e){return bd(a)*dg(a,e)*(e.armado?.9:1)}function pg(a,e,t){let i=e.orden,n=i.granja?null:a.recursos.get(i.id),r=i.granja?a.edificios.get(i.granja):null,o=i.tipoRec,s=Po[o],l=ug(a,e);if(i.fase==="volver"){let p=Sd(a,s,e.x,e.z);if(!p){e.accion="quieto",e.avisoSinEntrega||(Ae(a,"sin_entrega",{recurso:s}),e.avisoSinEntrega=!0);return}if(e.avisoSinEntrega=!1,Ke(e,p)<=1.3||Ke(e,p)<=1.8&&(!e.ruta||!e.ruta.length)){e.carga&&(a.recursosJugador[e.carga.recurso]+=e.carga.cant,a.estadisticas.recogido[e.carga.recurso]+=e.carga.cant,e.carga=null),i.fase="ir",e.ruta=null,e.cerca=!1;return}(!e.ruta||!e.destino||e.destino.id!==p.id)&&(Nt(a,e,p.x,p.z,0,(m,g)=>Ke({x:m,z:g},p)<=1.2),e.destino.id=p.id),e.accion="camina",Ai(a,e,Ze.aldeano.vel,t)&&Ke(e,p)>1.3&&Ir(a,e);return}let c=n||r;if(!c||n&&n.cant<=0||r&&(r.comida<=0||r.avance<1)){if(r&&r.avance<1){Nr(a,e,r);return}let p=o==="granja"?null:Pr(a,o,e.x,e.z);if(p){i.id=p.id,e.ruta=null,e.cerca=!1;return}if(e.carga){i.fase="volver",e.ruta=null;return}bt(e);return}let h=r?0:cg(o);if(!(e.cerca&&(r?Ke(e,r)<=1.5:Kt(e,c)<=h+1.2)||(r?Ke(e,r)<=.01:Kt(e,c)<=h+.25))){if(!e.ruta||!e.destino||e.destino.id!==c.id){if(r){let p=Me.granja.tam/2-.8,m=r.x+(e.id*37%10/10-.5)*2*p,g=r.z+(e.id*53%10/10-.5)*2*p;Nt(a,e,m,g,.3)}else Nt(a,e,c.x,c.z,h);e.destino.id=c.id}if(e.accion="camina",Ai(a,e,Ze.aldeano.vel,t)){if(r?Ke(e,r)>1.5:Kt(e,c)>h+1.2){let p=r?null:Pr(a,o,e.x,e.z,30);p&&p.id!==c.id?(i.id=p.id,e.ruta=null):(bt(e),Ae(a,"no_llega"));return}e.cerca=!0}else return}e.ruta=null,e.ultimoRecurso=c.id,e.ultimoTipo=o,e.accion=og[o],e.dir=Math.atan2(c.x-e.x,c.z-e.z),e.carga||(e.carga={recurso:s,cant:0});let d=Math.min(hg(a,o)*rc(a,e)*t,l-e.carga.cant,r?r.comida:n.cant);e.carga.cant+=d,r?r.comida-=d:n.cant-=d,e.golpe-=t,e.golpe<=0&&(e.golpe=1.1,Qe(a,e.accion,c.x,c.z)),n&&n.cant<=.001&&mg(a,n),r&&r.comida<=.001&&fg(a,r),e.carga.cant>=l-.001&&(e.carga.cant=Math.round(e.carga.cant),i.fase="volver",e.ruta=null,e.cerca=!1)}function mg(a,e){a.recursos.has(e.id)&&(a.recursos.delete(e.id),tc(pt(a),e,-1))}function fg(a,e){let t=Me.granja.costo.madera;a.recursosJugador.madera>=t?(a.recursosJugador.madera-=t,e.comida=Me.granja.comida+(ot(a,"arado")?100:0),Ae(a,"granja_resembrada",{},!1,e.x,e.z)):(Ae(a,"granja_agotada",{},!0,e.x,e.z),a.edificios.delete(e.id),Qe(a,"derribado",e.x,e.z,{id:e.id}))}function gg(a,e,t){let i=a.edificios.get(e.orden.id);if(!i){bt(e);return}if(!(i.avance<1||i.hp<i.hpMax||i.fuego>0)){xg(a,e,i);return}if(Ke(e,i)>1.6||Ke(e,i)>1.1&&e.ruta&&e.ruta.length){if((!e.ruta||!e.destino||e.destino.id!==i.id)&&(Nt(a,e,i.x,i.z,0,(o,s)=>Ke({x:o,z:s},i)<=1),e.destino.id=i.id,!e.ruta.length&&Ke(e,i)>1.6)){bt(e),Ae(a,"no_llega");return}e.accion="camina",Ai(a,e,Ze.aldeano.vel,t)&&Ke(e,i)>1.6&&Ir(a,e);return}e.ruta=null,e.reintentos=0,e.accion="construye",e.dir=Math.atan2(i.x-e.x,i.z-e.z);let r=rc(a,e)*(ot(a,"andamios")?1.2:1);if(i.fuego>0)i.fuego=Math.max(0,i.fuego-.12*r*t),i.fuego===0&&(Qe(a,"apagado",i.x,i.z,{id:i.id}),Ae(a,"fuego_apagado",{},!1,i.x,i.z));else if(i.avance<1){let o=Me[i.tipo],s=_g(a,i.id),l=s>1?(1+(s-1)/3)/s:1,c=r*l*t/o.trabajo;i.avance=Math.min(1,i.avance+c),i.hp=Math.min(i.hpMax,i.hp+c*i.hpMax),i.avance>=1&&vg(a,i)}else{let o=Math.min(i.hpMax-i.hp,25*r*t),s=o/i.hpMax*((Me[i.tipo].costo||{}).madera||60)*.5;if(a.recursosJugador.madera>=s)a.recursosJugador.madera-=s,i.hp+=o;else{Ae(a,"falta",{recurso:"madera"}),bt(e);return}}e.golpe-=t,e.golpe<=0&&(e.golpe=.9,Qe(a,"construye",i.x,i.z))}function _g(a,e){let t=0;for(let i of a.unidades.values())i.orden&&i.orden.tipo==="construir"&&i.orden.id===e&&i.accion==="construye"&&t++;return Math.max(1,t)}function vg(a,e){e.avance=1,e.hp=Math.max(e.hp,e.hpMax*.999),e.hp=e.hpMax,Qe(a,"terminado",e.x,e.z,{edificio:e.tipo,id:e.id}),Ae(a,"edificio_listo",{tipo:e.tipo},!1,e.x,e.z),e.tipo==="granja"&&(e.comida=Me.granja.comida+(ot(a,"arado")?100:0)),a._recalcularPob=!0}function xg(a,e,t){let i={aserradero:"arbol",deposito:null,molino:"olivo"}[t.tipo];if(t.tipo==="granja"&&!yg(a,t,e)){zr(a,e,t);return}if(t.tipo==="deposito"){let n=Pr(a,"cantera",e.x,e.z,22)||Pr(a,"escombros",e.x,e.z,22);if(n){bn(a,e,n);return}}if(i){let n=Pr(a,i,e.x,e.z,22);if(n){bn(a,e,n);return}}bt(e)}function yg(a,e,t){for(let i of a.unidades.values())if(i!==t&&i.orden&&i.orden.granja===e.id)return!0;return!1}function bg(a,e,t){let i=a.tramos[e.orden.id],n=e.orden.hojas,r=pi[i.tipo];if(n?i.hojas:i.avance>=1&&i.hp>=i.hpMax){Mg(a,e,i);return}if(n&&i.avance<1){e.orden.hojas=!1;return}if(n&&!ot(a,"cerrojos")){Ae(a,"falta_cerrojos"),bt(e);return}let s=Ei(e.x,e.z,i.a,i.b);if(s>2.4||s>1.9&&e.ruta&&e.ruta.length){if(!e.ruta||!e.destino||e.destino.tramo!==i.id){let p=(i.a.x+i.b.x)/2,m=(i.a.z+i.b.z)/2;if(Nt(a,e,p,m,0,(g,f)=>Ei(g,f,i.a,i.b)<=1.7),e.destino.tramo=i.id,!e.ruta.length&&s>2.5){bt(e),Ae(a,"no_llega");return}}e.accion="camina",Ai(a,e,Ze.aldeano.vel,t)&&Ei(e.x,e.z,i.a,i.b)>2.4&&Ir(a,e);return}e.ruta=null,e.reintentos=0,e.accion="construye";let l=(i.a.x+i.b.x)/2,c=(i.a.z+i.b.z)/2;e.dir=Math.atan2(l-e.x,c-e.z);let h=rc(a,e)*(ot(a,"andamios")?1.2:1),u=Math.max(1,[...a.unidades.values()].filter(p=>p.orden&&p.orden.tipo==="tramo"&&p.orden.id===i.id&&p.accion==="construye").length),d=u>1?(1+(u-1)/2)/u:1;if(n){let p=h*d*t/pi.hojas.trabajo,m=pi.hojas.costo.madera*p;if(a.recursosJugador.madera<m){Wo(a,e,"madera",i);return}a.recursosJugador.madera-=m,i.progresoHojas=(i.progresoHojas||0)+p,i.progresoHojas>=1&&(i.hojas=!0,i.progresoHojas=0,i.hp=i.hpMax,Qe(a,"hojas",l,c,{id:i.id}),Ae(a,"hojas_puestas",{puerta:i.nombre},!1,l,c),a.animo=Math.min(100,a.animo+4))}else if(i.avance<1){let p=Math.min(1-i.avance,h*d*t/r.trabajo),m={piedra:r.costo.piedra*p,madera:r.costo.madera*p};if(a.recursosJugador.piedra<m.piedra){Wo(a,e,"piedra",i);return}if(a.recursosJugador.madera<m.madera){Wo(a,e,"madera",i);return}if(a.recursosJugador.piedra-=m.piedra,a.recursosJugador.madera-=m.madera,i.avance=Math.min(1,i.avance+p),i.hp=Math.min(i.hpMax,i.hp+p*i.hpMax),i.avance>=.999){i.avance=1,i.hp=i.hpMax,Qe(a,"tramo_completo",l,c,{id:i.id}),a.animo=Math.min(100,a.animo+(i.tipo==="puerta"?3:1.5)),i.tipo==="puerta"&&Ae(a,"marco_puerta",{puerta:i.nombre},!1,l,c);for(let g of a.unidades.values())if(Ei(g.x,g.z,i.a,i.b)<1&&g.accion!=="guarnecido"){let f=Ha(a,pt(a),g.x,g.z,"nuestro",4);f&&(g.x=f.x,g.z=f.z)}}}else{let p=Math.min(i.hpMax-i.hp,30*h*d*t),m=p/i.hpMax*r.costo.piedra*pi.reparar;if(a.recursosJugador.piedra<m){Wo(a,e,"piedra",i);return}a.recursosJugador.piedra-=m,i.hp+=p}e.esperando=null,e.golpe-=t,e.golpe<=0&&(e.golpe=.9,Qe(a,"construye",l,c))}function Wo(a,e,t,i){e.accion="quieto",e.esperando!==t&&(e.esperando=t,(!a._avisoFalta||a.t-a._avisoFalta>8)&&(a._avisoFalta=a.t,Ae(a,"falta",{recurso:t},!1,(i.a.x+i.b.x)/2,(i.a.z+i.b.z)/2)))}function Mg(a,e,t){let i=a.tramos.length;for(let n of[1,-1,2,-2]){let r=a.tramos[(t.id+n+i)%i];if((e.orden.hojas?r.tipo==="puerta"&&!r.hojas&&r.avance>=1:r.avance<1)&&Ei(e.x,e.z,r.a,r.b)<16){e.orden.id=r.id,e.ruta=null;return}}bt(e)}function Sg(a,e,t){let i=a.enemigos.get(e.orden.id);if(!i||i.accion==="huye"){Td(a,e);return}let n=Cr(a,e);if(Kt(e,i)>n.alcance+.6){(!e.ruta||!e.destino||e.espera<=0||Math.hypot(e.destino.x-i.x,e.destino.z-i.z)>2)&&(Nt(a,e,i.x,i.z,Math.max(.8,n.alcance*.85)),e.espera=.6),e.espera-=t,e.accion="camina",Ai(a,e,n.vel,t),e.orden.origen&&Math.hypot(e.x-e.orden.origen.x,e.z-e.orden.origen.z)>28&&Td(a,e);return}e.ruta=null,e.dir=Math.atan2(i.x-e.x,i.z-e.z),e.accion=n.alcance>2?"dispara":"ataca",e.golpe-=t,e.golpe<=0&&(e.golpe=n.cadencia,Tg(a,i,Lr(n.ataque,Md(i).armadura),e,n.alcance>2))}function Td(a,e){let t=e.orden;if(t&&t.antes){e.orden=t.antes,e.ruta=null;return}if(t&&t.origen&&t.defender){e.orden={tipo:"defender",x:t.origen.x,z:t.origen.z},e.ruta=null;return}bt(e)}function Tg(a,e,t,i,n){n?a.proyectiles.push({id:a.siguienteId++,tipo:"flecha",de:{x:i.x,z:i.z},a:{x:e.x,z:e.z},t:0,dur:Math.max(.25,Math.hypot(e.x-i.x,e.z-i.z)/22)}):Qe(a,"golpe",e.x,e.z),e.hp-=t,e.ultimoAtacante=i.id,e.hp<=0&&a._huir.push(e)}function qo(a,e,t){let i=null,n=t;for(let r of a.enemigos.values()){if(r.accion==="huye")continue;let o=Kt(e,r);o<n&&wg(a,r.x,r.z)&&(n=o,i=r)}return i}function wg(a,e,t){let i=a.niebla,n=Math.floor((e+110)/i.celda),r=Math.floor((t+110)/i.celda);return i.datos[r*i.ancho+n]===2}function Cd(a,e){e.accion!=="herido"&&(Bt(a,e),e.hp=0,e.accion="herido",e.carga=null,e.ruta=null,e.orden={tipo:"herido"},a.estadisticas.heridos++,Qe(a,"herido",e.x,e.z,{id:e.id}),Et(a,e.tipo==="nehemias"?15:1.2,"heridos"),Ae(a,e.tipo==="nehemias"?"nehemias_herido":"herido",{tipo:e.tipo},!0,e.x,e.z))}function Eg(a,e,t){let i=Ot(a);if(!i){e.herido=(e.herido||Mr)-t,e.herido<=0&&Rd(a,e);return}if(Ke(e,i)>1.2){(!e.ruta||!e.ruta.length)&&Nt(a,e,i.x,i.z,0,(n,r)=>Ke({x:n,z:r},i)<=1.1),Ai(a,e,Ze[e.tipo].vel*.45,t);return}e.accion="guarnecido",e.dentro=i.id,e.herido=Mr,e.orden={tipo:"recuperando"},i.guarnicion.push(e.id)}function Rd(a,e){e.hp=Rr(a,e.tipo),e.hpMax=e.hp,e.herido=0,e.accion==="guarnecido"&&Bt(a,e),bt(e),Ae(a,"recuperado",{tipo:e.tipo},!1,e.x,e.z)}function Ld(a,e){for(let t of a.unidades.values()){if(t.ausente)continue;if(t.accion==="guarnecido"){t.herido>0?(t.herido-=e,t.hp=Math.min(t.hpMax,t.hpMax*(1-t.herido/Mr)),t.herido<=0&&Rd(a,t)):(t.hp=Math.min(t.hpMax,t.hp+e*.5),lg(a,t));continue}let i=t.orden;if(t.accion==="herido"||i&&i.tipo==="herido"){Eg(a,t,e);continue}if(t.ocupado>a.t)continue;(t.accion==="ora"||t.accion==="toca")&&(t.accion="quieto");let n=Cr(a,t),r=t.tipo!=="aldeano"||t.armado;if(!i){if(t.accion="quieto",r){let o=qo(a,t,n.vision);o&&(t.orden={tipo:"atacar",id:o.id,origen:{x:t.x,z:t.z},defender:!0})}continue}switch(i.tipo){case"mover":t.accion="camina",Ai(a,t,n.vel,e)&&bt(t);break;case"atacar_mover":case"defender":{let o=qo(a,t,n.vision);if(o&&r){t.orden={tipo:"atacar",id:o.id,origen:{x:t.x,z:t.z},defender:i.tipo==="defender",antes:i.tipo==="atacar_mover"?i:null};break}if(i.tipo==="defender"&&Math.hypot(t.x-i.x,t.z-i.z)<2){t.accion="quieto";break}if(!t.ruta||!t.ruta.length)if(Math.hypot(t.x-i.x,t.z-i.z)>1.5)Nt(a,t,i.x,i.z,1);else{i.tipo==="atacar_mover"&&bt(t);break}t.accion="camina",Ai(a,t,n.vel,e);break}case"recolectar":{if(t.armado){let o=qo(a,t,4);if(o){t.orden={tipo:"atacar",id:o.id,origen:{x:t.x,z:t.z},antes:i};break}}pg(a,t,e);break}case"refugio":sg(a,t,e);break;case"construir":gg(a,t,e);break;case"tramo":{if(t.armado){let o=qo(a,t,4);if(o){t.orden={tipo:"atacar",id:o.id,origen:{x:t.x,z:t.z},antes:i};break}}bg(a,t,e);break}case"atacar":Sg(a,t,e);break;case"guarnecer":{let o=a.edificios.get(i.id);if(!o||o.avance<1){bt(t);break}if(Ke(t,o)<=1.6){if(o.guarnicion.length>=Me[o.tipo].guarnicion){bt(t),Ae(a,"lleno");break}t.accion="guarnecido",t.dentro=o.id,t.ruta=null,t.orden=null,o.guarnicion.push(t.id);break}(!t.ruta||!t.destino||t.destino.id!==o.id)&&(Nt(a,t,o.x,o.z,0,(s,l)=>Ke({x:s,z:l},o)<=1.1),t.destino.id=o.id),t.accion="camina",Ai(a,t,n.vel,e)&&Ke(t,o)>1.6&&Ir(a,t);break}default:bt(t)}}Ag(a)}function Ag(a){let e=[...a.unidades.values()].filter(i=>i.accion!=="guarnecido"&&!i.ausente),t=new Map;for(let i of e){let n=Math.floor(i.x/2)*4099+Math.floor(i.z/2);(t.get(n)||t.set(n,[]).get(n)).push(i)}for(let i of e){let n=i.accion!=="camina";for(let r=-1;r<=1;r++)for(let o=-1;o<=1;o++){let s=t.get((Math.floor(i.x/2)+r)*4099+Math.floor(i.z/2)+o);if(s)for(let l of s){if(l.id<=i.id)continue;let c=l.x-i.x,h=l.z-i.z,u=Math.hypot(c,h);if(u>.7||u<1e-4)continue;let d=(.7-u)*.25,p=c/u,m=h/u,g=pt(a);(!n||l.accion!=="camina")&&(mi(a,g,l.x+p*d,l.z+m*d,"nuestro")&&(l.x+=p*d,l.z+=m*d),mi(a,g,i.x-p*d,i.z-m*d,"nuestro")&&(i.x-=p*d,i.z-=m*d))}}}}var ha=vt.medio;function Pd(a,e,t){let i=a.dif.oleada,n={indice:t,ids:[],total:0};for(let r of e.de){let o=wi[r],s=0;for(let[l,c]of Object.entries(e.tropa)){let h=Math.max(1,Math.round(c*i));for(let u=0;u<h;u++,s++){let d=s%5-2,p=Math.floor(s/5),m=o.x+(Math.abs(o.z)>100?d*1.6:-Math.sign(o.x)*p*1.6),g=o.z+(Math.abs(o.z)>100?-Math.sign(o.z)*p*1.6:d*1.6),f=pd(a,l,r,m,g);f.oleada=t,f.espera=Math.random()*.5,n.ids.push(f.id),n.total++}}}a.oleadasActivas=a.oleadasActivas||[],a.oleadasActivas.push(n),a.estadisticas.oleadas++,Ae(a,"oleada_llega",{de:e.de},!0,wi[e.de[0]].x*.7,wi[e.de[0]].z*.7)}function Cg(a){return a.tramos.filter(e=>e.avance<1||e.hp<=0||e.tipo==="puerta"&&!e.hojas)}var oc=a=>({x:(a.a.x+a.b.x)/2,z:(a.a.z+a.b.z)/2});function Rg(a,e){let t=ki[e.tipo],i=Ti(e.x,e.z),n=e.tipo==="jinete_arabe"?22:i?12:7,r=null,o=n;for(let h of a.unidades.values()){if(h.accion==="guarnecido"||h.accion==="herido"||h.ausente)continue;let u=Kt(e,h);u<o&&(o=u,r=h)}if(r)return{tipo:"unidad",id:r.id};if(i||e.tipo==="jinete_arabe"){let h=null,u=1/0;for(let d of a.edificios.values()){if(Me[d.tipo].suelo&&e.tipo!=="jinete_arabe")continue;let p=e.tipo==="saqueador"&&(Me[d.tipo].entrega||[]).length&&d.avance>=1,m=Ke(e,d)-(p?15:0)+(d.tipo==="gobernador"&&e.tipo!=="cabecilla"?10:0);m<u&&(u=m,h=d)}if(h&&(i||Ke(e,h)<25))return{tipo:"edificio",id:h.id}}let s=Cg(a);if(s.length){let h=null,u=1/0;for(let d of s){let p=Kt(e,oc(d))+(d.tipo==="puerta"?-6:0);p<u&&(u=p,h=d)}return{tipo:"brecha",id:h.id}}let l=null,c=1/0;for(let h of a.tramos){let u=Kt(e,oc(h))*.7+h.hp*.05;u<c&&(c=u,l=h)}return{tipo:"muro",id:l.id}}function Id(a,e){for(let t of a.enemigos.values()){if(t.accion==="huye"){Ig(a,t,e);continue}let i=ki[t.tipo];if(t.espera-=e,t.golpe-=e,t.espera<=0||!t.objetivo||!Lg(a,t)){t.espera=1.2+Math.random()*.6;let n=Rg(a,t);(!t.objetivo||n.tipo!==t.objetivo.tipo||n.id!==t.objetivo.id)&&(t.objetivo=n,t.ruta=null)}Pg(a,t,i,e)}for(let t of a._huir)sc(a,t);a._huir.length=0,zg(a)}function Lg(a,e){let t=e.objetivo;if(t.tipo==="unidad"){let i=a.unidades.get(t.id);return i&&i.accion!=="herido"&&i.accion!=="guarnecido"&&!i.ausente}if(t.tipo==="edificio")return a.edificios.has(t.id);if(t.tipo==="brecha"){let i=a.tramos[t.id];return i.avance<1||i.hp<=0||i.tipo==="puerta"&&!i.hojas}return!0}function Yo(a,e,t,i,n,r,o,s=null){(!e.ruta||e.replan<=0)&&(e.ruta=yn(a,pt(a),e.x,e.z,t,i,n,"enemigo",s,12e3)||[],e.replan=2.5),e.replan-=o;let l=r*(Gi(a)?1.05:1)*o;for(;l>0&&e.ruta.length;){let c=e.ruta[0],h=c.x-e.x,u=c.z-e.z,d=Math.hypot(h,u);if(d>.01&&(e.dir=Math.atan2(h,u)),d<=l)e.x=c.x,e.z=c.z,e.ruta.shift(),l-=d;else{let p=e.x+h/d*l,m=e.z+u/d*l;if(!mi(a,pt(a),p,m,"enemigo"))return e.ruta=null,e.replan=0,!1;e.x=p,e.z=m,l=0}}return e.accion="camina",!e.ruta.length}function Pg(a,e,t,i){let n=e.objetivo;if(n.tipo==="unidad"){let l=a.unidades.get(n.id),c=Kt(e,l);if(c>t.alcance+.5){Yo(a,e,l.x,l.z,Math.max(.8,t.alcance*.85),t.vel,i),e.ruta&&e.ruta.length&&Math.hypot(e.ruta[e.ruta.length-1].x-l.x,e.ruta[e.ruta.length-1].z-l.z)>3&&(e.replan=0);return}if(e.ruta=null,e.dir=Math.atan2(l.x-e.x,l.z-e.z),e.accion=t.alcance>2?"dispara":"ataca",e.golpe<=0){e.golpe=t.cadencia,t.alcance>2?a.proyectiles.push({id:a.siguienteId++,tipo:"piedra_honda",de:{x:e.x,z:e.z},a:{x:l.x,z:l.z},t:0,dur:Math.max(.25,c/18)}):Qe(a,"golpe",l.x,l.z);let h=Cr(a,l);l.hp-=Lr(t.ataque,h.armadura),l.hp<=0?Cd(a,l):!l.orden||l.orden.tipo==="mover"||l.orden.tipo==="recolectar"||l.orden.tipo==="tramo"||l.orden.tipo==="construir"?l.tipo!=="aldeano"||l.armado?l.orden={tipo:"atacar",id:e.id,origen:{x:l.x,z:l.z},antes:l.orden}:nc(a,l):l.tipo==="aldeano"&&!l.armado&&l.orden&&l.orden.tipo!=="refugio"&&nc(a,l)}return}if(n.tipo==="edificio"){let l=a.edificios.get(n.id);if(Ke(e,l)>Math.max(1,t.alcance)){Yo(a,e,l.x,l.z,0,t.vel,i,(u,d)=>Ke({x:u,z:d},l)<=Math.max(.9,t.alcance*.9));return}e.ruta=null,e.dir=Math.atan2(l.x-e.x,l.z-e.z);let h=Me[l.tipo].entrega||[];if(e.tipo==="saqueador"&&h.length&&l.avance>=1&&!e.botin){let u=h.slice().sort((p,m)=>a.recursosJugador[m]-a.recursosJugador[p])[0],d=Math.min(25,Math.floor(a.recursosJugador[u]));if(d>0){a.recursosJugador[u]-=d,e.botin={recurso:u,cant:d},Qe(a,"robo",l.x,l.z,{recurso:u,cant:d}),Ae(a,"robo",{recurso:u,cant:d},!0,l.x,l.z),Et(a,1.5,"robos"),sc(a,e,!0);return}}if((e.tipo==="cabecilla"||e.tipo==="jinete_arabe"||e.tipo==="saqueador"&&e.botin)&&l.fuego<.95&&e.golpe<=0){e.golpe=3,l.fuego=Math.min(1,l.fuego+.35),e.accion="incendia",Qe(a,"fuego",l.x,l.z,{id:l.id}),(!l.avisoFuego||a.t-l.avisoFuego>15)&&(l.avisoFuego=a.t,Ae(a,"incendio",{tipo:l.tipo},!0,l.x,l.z));return}e.accion=t.alcance>2?"dispara":"ataca",e.golpe<=0&&(e.golpe=t.cadencia,t.alcance>2?a.proyectiles.push({id:a.siguienteId++,tipo:"piedra_honda",de:{x:e.x,z:e.z},a:{x:l.x,z:l.z},t:0,dur:.6}):Qe(a,"golpe",e.x+Math.sin(e.dir)*.8,e.z+Math.cos(e.dir)*.8),l.hp-=t.ataque*.6);return}let r=a.tramos[n.id],o=oc(r);if(n.tipo==="brecha"){let l=-(r.b.z-r.a.z)/r.largo,c=(r.b.x-r.a.x)/r.largo,h=Ti(o.x+l*3,o.z+c*3)?1:-1,u=o.x+l*5*h,d=o.z+c*5*h;Yo(a,e,u,d,1.5,t.vel,i)&&(e.objetivo=null,e.espera=0);return}if(Ei(e.x,e.z,r.a,r.b)>Math.max(1.5,t.alcance)){Yo(a,e,o.x,o.z,0,t.vel,i,(l,c)=>Ei(l,c,r.a,r.b)<=Math.max(1.4,t.alcance*.9));return}e.ruta=null,e.dir=Math.atan2(o.x-e.x,o.z-e.z),e.accion=t.alcance>2?"dispara":"ataca",e.golpe<=0&&(e.golpe=t.cadencia,Qe(a,"golpe",o.x,o.z),r.hp-=t.ataque*(e.tipo==="cabecilla"?1.6:1),r.hp<=0&&(r.hp=0,r.tipo==="puerta"&&r.hojas?(r.hojas=!1,r.hp=r.hpMax*.5,Ae(a,"puerta_rota",{puerta:r.nombre},!0,o.x,o.z)):(r.avance=.6,Ae(a,"brecha_abierta",{},!0,o.x,o.z)),Et(a,4,"muro_roto")))}function sc(a,e,t=!1){if(e.accion==="huye")return;!t&&e.botin&&(a.recursosJugador[e.botin.recurso]+=e.botin.cant,Ae(a,"botin_recuperado",{...e.botin},!1,e.x,e.z),e.botin=null),e.accion="huye",e.hp=Math.max(0,e.hp),e.ruta=null,Qe(a,"huye",e.x,e.z,{id:e.id});let i=Math.abs(e.x)>Math.abs(e.z)?Math.sign(e.x)*(ha+6):e.x,n=Math.abs(e.x)>Math.abs(e.z)?e.z:Math.sign(e.z||1)*(ha+6);e.huida={x:i,z:n}}function Ig(a,e,t){let i=ki[e.tipo].vel*1.25;if(!e.ruta||!e.ruta.length){let r=Math.max(-ha+1,Math.min(ha-1,e.huida.x)),o=Math.max(-ha+1,Math.min(ha-1,e.huida.z));e.ruta=yn(a,pt(a),e.x,e.z,r,o,2,"enemigo",null,15e3),xd(e.ruta,r,o,2)||(e.ruta=yn(a,pt(a),e.x,e.z,r,o,2,"nuestro",null,15e3)||e.ruta),e.ruta=e.ruta||[]}let n=i*t;for(;n>0&&e.ruta.length;){let r=e.ruta[0],o=r.x-e.x,s=r.z-e.z,l=Math.hypot(o,s);if(l>.01&&(e.dir=Math.atan2(o,s)),l<=n)e.x=r.x,e.z=r.z,e.ruta.shift(),n-=l;else{let c=e.x+o/l*n,h=e.z+s/l*n;if(!mi(a,pt(a),c,h,"nuestro")){e.ruta=null;return}e.x=c,e.z=h,n=0}}(Math.abs(e.x)>ha-1.5||Math.abs(e.z)>ha-1.5||!e.ruta.length)&&(e.botin&&Ae(a,"botin_perdido",{...e.botin},!0),a.enemigos.delete(e.id))}function zg(a){if(a.oleadasActivas)for(let e of a.oleadasActivas){if(e.fin)continue;let t=e.ids.map(n=>a.enemigos.get(n)).filter(Boolean),i=t.filter(n=>n.accion!=="huye");if(!e.desbandada&&i.length&&i.length<=e.total*.25){e.desbandada=!0;for(let n of i)sc(a,n,!0)}t.length||(e.fin=!0,a.estadisticas.rechazadas++,a.animo=Math.min(100,a.animo+8),Ae(a,"oleada_rechazada",{indice:e.indice}))}}function zd(a,e,t){for(let i of a.edificios.values()){let n=Me[i.tipo].ataque;if(!n||i.avance<1||(i.golpe-=e,i.golpe>0))continue;let r=n.alcance+(t("guardia_noche")?2:0),o=null,s=r;for(let c of a.enemigos.values()){if(c.accion==="huye")continue;let h=Ke(c,i);h<s&&(s=h,o=c)}if(!o){i.golpe=.4;continue}let l=1+Math.floor(i.guarnicion.filter(c=>(a.unidades.get(c)||{}).herido<=0).length/(i.tipo==="torre"?1:3));i.golpe=n.cadencia;for(let c=0;c<l;c++)a.proyectiles.push({id:a.siguienteId++,tipo:"flecha",de:{x:i.x+(c-l/2)*.4,z:i.z},a:{x:o.x,z:o.z},t:0,dur:Math.max(.3,s/22)}),o.hp-=Lr(n.dano,ki[o.tipo].armadura);o.hp<=0&&a._huir.push(o)}}function Mn(a,e){let t=Me[e];return t.costo?t.requiere&&![...a.edificios.values()].some(i=>i.tipo===t.requiere&&i.avance>=1)?{ok:!1,motivo:"requiere",requiere:t.requiere}:Er(a,t.costo)?{ok:!0}:{ok:!1,motivo:"falta",falta:jo(a,t.costo)}:{ok:!1,motivo:"unico"}}function lc(a,e,t,i,n){let r=Mn(a,t);if(!r.ok)return Ae(a,r.motivo==="falta"?"falta":"requiere",r.motivo==="falta"?{recurso:Object.keys(r.falta)[0]}:{tipo:r.requiere}),null;i=Math.round(i*2)/2,n=Math.round(n*2)/2;let o=Go(a,pt(a),t,i,n);if(o!==!0)return Ae(a,"sitio_"+o),null;Vo(a,Me[t].costo);let s=Kl(a,t,i,n);s.avance=0,s.hp=1,wr(pt(a),s,1);for(let l of a.unidades.values()){let c=Me[t].tam/2;if(!Me[t].suelo&&Math.abs(l.x-i)<c&&Math.abs(l.z-n)<c&&l.accion!=="guarnecido"){let h=Ha(a,pt(a),l.x,l.z,"nuestro",8);h&&(l.x=h.x,l.z=h.z,l.ruta=null)}}for(let l of e){let c=a.unidades.get(l);c&&c.tipo==="aldeano"&&c.accion!=="herido"&&Nr(a,c,s)}return Qe(a,"cimientos",i,n,{id:s.id,tipo:t}),s}function cc(a,e){return e.avance>=1||e.tipo==="gobernador"?!1:(Ar(a,Me[e.tipo].costo,1-e.avance*.5),$o(a,e),!0)}function $o(a,e){if(a.edificios.has(e.id)){for(let t of e.guarnicion){let i=a.unidades.get(t);i&&(i.accion="quieto",i.dentro=null)}a.edificios.delete(e.id),wr(pt(a),e,-1);for(let t of e.cola)Ze[t]&&Ar(a,Ze[t].costo);a._recalcularPob=!0}}function Zo(a,e,t){return e.avance<1||!(Me[e.tipo].entrena||[]).includes(t)?{ok:!1,motivo:"no"}:e.cola.length>=5?{ok:!1,motivo:"cola_llena"}:a.pob+Ze[t].pob>a.pobMax?{ok:!1,motivo:"poblacion"}:Er(a,Ze[t].costo)?{ok:!0}:{ok:!1,motivo:"falta",falta:jo(a,Ze[t].costo)}}function hc(a,e,t){let i=Zo(a,e,t);return i.ok?(Vo(a,Ze[t].costo),e.cola.push(t),e.cola.length===1&&(e.progreso=0),ka(a),!0):(Ae(a,i.motivo==="falta"?"falta":i.motivo,i.falta?{recurso:Object.keys(i.falta)[0]}:{}),!1)}function uc(a,e,t){let i=e.cola[t];i&&(e.cola.splice(t,1),Ze[i]&&Ar(a,Ze[i].costo),t===0&&(e.progreso=0),ka(a))}function Jo(a,e,t){let i=Hi[t];return e.avance<1||!(Me[e.tipo].investiga||[]).includes(t)?{ok:!1,motivo:"no"}:a.tecnologias[t]?{ok:!1,motivo:"hecha"}:e.investigando||Ng(a,t)?{ok:!1,motivo:"ocupado"}:i.requiereHito&&!a.hitos[i.requiereHito]?{ok:!1,motivo:"hito",hito:i.requiereHito}:Er(a,i.costo)?{ok:!0}:{ok:!1,motivo:"falta",falta:jo(a,i.costo)}}function Ng(a,e){for(let t of a.edificios.values())if(t.investigando===e)return!0;return!1}function dc(a,e,t){let i=Jo(a,e,t);return i.ok?(Vo(a,Hi[t].costo),e.investigando=t,e.progresoTec=0,!0):(Ae(a,i.motivo==="falta"?"falta":"no_ahora",i.falta?{recurso:Object.keys(i.falta)[0]}:{}),!1)}function pc(a,e){e.investigando&&(Ar(a,Hi[e.investigando].costo),e.investigando=null,e.progresoTec=0)}function Dg(a,e){if(a.tecnologias[e]=!0,e==="corazas"){for(let t of a.unidades.values())if(t.tipo==="lancero"||t.tipo==="arquero"||t.tipo==="jinete"){let i=Rr(a,t.tipo);t.hp+=i-t.hpMax,t.hpMax=i}}if(e==="mitad")for(let t of a.unidades.values())t.tipo==="aldeano"&&(t.armado=!0);if(e==="arado")for(let t of a.edificios.values())t.tipo==="granja"&&(t.comida+=100);e==="cartas_rey"&&(a.proximaCaravana=a.dia+1),Ae(a,"tecnologia_lista",{tec:e})}function mc(a,e){for(let t of a.edificios.values()){if(t.avance<1){t.trabajando=!1;continue}if(t.cola.length){let i=t.cola[0];if(t.progreso=(t.progreso||0)+e/Ze[i].tiempo,t.progreso>=1){let n=Me[t.tipo].tam/2+1,r=t.reunion||{x:t.x,z:t.z+n+1.5},o=Math.atan2(r.x-t.x,r.z-t.z),s=Ha(a,pt(a),t.x+Math.sin(o)*n,t.z+Math.cos(o)*n,"nuestro",6);if(s){let l=Jl(a,i,s.x,s.z);l.hp=l.hpMax=Rr(a,i),i==="aldeano"&&ot(a,"mitad")&&(l.armado=!0),t.cola.shift(),t.progreso=0,a.estadisticas.entrenados++,Qe(a,"entrenado",s.x,s.z,{tipo:i});let c=t.reunion;c&&c.recurso&&a.recursos.has(c.recurso)&&i==="aldeano"?bn(a,l,a.recursos.get(c.recurso)):c&&c.granja&&a.edificios.has(c.granja)&&i==="aldeano"?zr(a,l,a.edificios.get(c.granja)):c&&Ci(a,l,c.x,c.z),ka(a)}}}if(t.investigando&&(t.progresoTec+=e/Hi[t.investigando].tiempo,t.progresoTec>=1)){let i=t.investigando;t.investigando=null,t.progresoTec=0,Dg(a,i)}t.trabajando=!!(t.cola.length||t.investigando)}}var Ug=a=>a.t/a.dif.dia+.3;function Tn(a){let e=0,t=0;for(let i of a.tramos)i.tipo==="muro"?(e+=i.avance>=1&&i.hp>0?1:Math.min(i.avance,.99),t+=1):(e+=(i.avance>=1?.7:i.avance*.7)+(i.hojas?.3:0),t+=1);return e/t}function Ga(a){let e=a.tramos.filter(i=>i.tipo==="muro"),t=a.tramos.filter(i=>i.tipo==="puerta");return{tramos:e.filter(i=>i.avance>=1&&i.hp>0).length,totalTramos:e.length,marcos:t.filter(i=>i.avance>=1).length,hojas:t.filter(i=>i.hojas).length,totalPuertas:t.length,brechas:a.tramos.filter(i=>i.avance<1||i.hp<=0).length}}function Ko(a){let e=Ga(a);return[{clave:"obj_tramos",hecho:e.tramos===e.totalTramos,n:e.tramos,de:e.totalTramos},{clave:"obj_marcos",hecho:e.marcos===e.totalPuertas,n:e.marcos,de:e.totalPuertas},{clave:"obj_hojas",hecho:e.hojas===e.totalPuertas,n:e.hojas,de:e.totalPuertas},{clave:"obj_gobernador",hecho:!1,siempre:!0},{clave:"obj_animo",hecho:!1,siempre:!0}]}var Sn={clamor:{opciones:["perdonar","callar"],buena:"perdonar"},ono:{opciones:["no_ir","ir"],buena:"no_ir"},carta:{opciones:["nada_cierto","ir_conversar"],buena:"nada_cierto"},semaias:{opciones:["no_entrare","esconderse"],buena:"no_entrare"}};function Qo(a,e){let t=a.decision;if(!t||!Sn[t.clave].opciones.includes(e))return!1;a.decision=null;let i=[...a.unidades.values()].find(o=>o.tipo==="nehemias"),n=o=>{!i||i.accion==="herido"||(i.ausente=a.t+o*a.dif.dia,i.accion="guarnecido",i.orden=null,i.ruta=null)},r={clave:t.clave,opcion:e,buena:Sn[t.clave].buena===e};switch(t.clave+":"+e){case"clamor:perdonar":a.recursosJugador.comida=Math.max(0,a.recursosJugador.comida-150),a.animo=Math.min(100,a.animo+22);break;case"clamor:callar":Et(a,22,"decisiones");break;case"ono:no_ir":a.animo=Math.min(100,a.animo+6);break;case"ono:ir":n(2),Et(a,15,"decisiones");break;case"carta:nada_cierto":a.animo=Math.min(100,a.animo+6);break;case"carta:ir_conversar":n(2),Et(a,12,"decisiones");break;case"semaias:no_entrare":a.animo=Math.min(100,a.animo+12);break;case"semaias:esconderse":n(1),Et(a,25,"decisiones");break}return a.decisiones=a.decisiones||[],a.decisiones.push(r),Ae(a,"decision_"+(r.buena?"buena":"mala"),{clave:t.clave}),r}function es(a,e){let t=[...a.unidades.values()].find(n=>n.tipo==="nehemias"),i=Sr[e];if(!t||t.accion==="herido"||t.accion==="guarnecido"||t.ausente)return{ok:!1,motivo:"nehemias"};if(i.requiereHito&&!a.hitos[i.requiereHito])return{ok:!1,motivo:"hito"};if(a.habilidades[e]>a.t)return{ok:!1,motivo:"recarga"};if(a.habilidades[e]=a.t+i.recarga,e==="orar")a.animo=Math.min(100,a.animo+i.animo),t.accion="ora",t.ocupado=a.t+3,t.ruta=null,Qe(a,"oracion",t.x,t.z);else if(e==="exhortar"){for(let n of a.unidades.values())Kt(n,t)<i.radio&&(n.exhortado=a.t+i.duracion);t.accion="ora",t.ocupado=a.t+1.5,Qe(a,"exhortar",t.x,t.z)}else e==="trompeta"&&(t.accion="toca",t.ocupado=a.t+2,t.ruta=null,Qe(a,"trompeta",t.x,t.z),a._trompeta={x:t.x,z:t.z});return Ae(a,"habilidad_"+e),{ok:!0}}function Nd(a,e){if(a.prologo){a.hora=.84,a.dia=1;return}let t=Ug(a),i=a.dia;a.dia=Math.min(ca+1,Math.floor(t)+1),a.hora=t-Math.floor(t),a.dia!==i&&Og(a,i);let n=a.pob*.5/a.dif.dia*e;a.recursosJugador.comida=Math.max(0,a.recursosJugador.comida-n);let r=0;for(let s of a.enemigos.values())s.accion!=="huye"&&Ti(s.x,s.z)&&r++;r&&Et(a,Math.min(.5,r*.05)*e,"invasores"),a.recursosJugador.comida<1&&(Et(a,.15*e,"hambre"),(!a._avisoHambre||a.t-a._avisoHambre>30)&&(a._avisoHambre=a.t,Ae(a,"hambre",{},!0)));let o=0;for(let s of a.edificios.values())s.fuego>0&&o++;o&&Et(a,.05*o*e,"incendios"),a.hitos.cansancio&&a.dia-a.hitos.cansancio<4&&Et(a,.04*e,"cansancio"),a.animo>75&&(a.animo-=.03*e),a.animo=Math.max(0,Math.min(100,a.animo)),a.animo<=.5?(a.sinAnimo=(a.sinAnimo||0)+e,a.sinAnimo>0&&!a._avisoSinAnimo&&(a._avisoSinAnimo=!0,Ae(a,"sin_animo",{},!0))):(a.sinAnimo=0,a._avisoSinAnimo=!1);for(let s of a.unidades.values())if(s.ausente&&a.t>=s.ausente){s.ausente=0,s.accion="quieto";let l=Ot(a);l&&(s.x=l.x,s.z=l.z+5),Ae(a,"nehemias_vuelve",{},!1,s.x,s.z)}Yl.forEach((s,l)=>{let c=l%2?.8:.45,h=s.dia-1+c;!a.avisosDados.includes(l)&&t>=h-Oo&&(a.avisosDados.push(l),Ae(a,a.avisosDados.length===1?"aviso_vecinos_primero":"aviso_vecinos",{de:s.de},!0,wi[s.de[0]].x*.75,wi[s.de[0]].z*.75),a.alertas=(a.alertas||[]).concat(s.de.map(u=>({x:wi[u].x*.8,z:wi[u].z*.8,hasta:a.t+Oo*a.dif.dia+20})))),!a.oleadasLanzadas.includes(l)&&t>=h&&(a.oleadasLanzadas.push(l),Pd(a,s,l))}),a.alertas&&(a.alertas=a.alertas.filter(s=>s.hasta>a.t)),Bg(a,t),Fg(a)}function Og(a,e){if(a.estadisticas.avancePorDia.push(Math.round(Tn(a)*1e3)/10),a.estadisticas.animoPorDia.push(Math.round(a.animo)),Ae(a,"amanece",{dia:a.dia}),ot(a,"cartas_rey")&&a.dia>=(a.proximaCaravana||0)){a.proximaCaravana=a.dia+4,a.recursosJugador.madera+=120;let t=Ot(a);Qe(a,"caravana",t?t.x:0,t?t.z:0),Ae(a,"caravana",{cant:120},!1,t&&t.x,t&&t.z)}}function Ri(a,e){return a.hitos[e]?!1:(a.hitos[e]=a.dia,!0)}function Bg(a,e){if(a.decision)return;let t=Tn(a),i=Ga(a);if(e>=.32&&Ri(a,"inicio")&&Ae(a,"historia_inicio"),a.dia>=2&&Ri(a,"escolta")&&Ae(a,"historia_escolta"),a.dia>=3&&Ri(a,"burla")&&(Ae(a,"historia_burla",{},!0),Et(a,4,"burlas")),t>=.25&&Ri(a,"zorra")&&(Ae(a,"historia_zorra",{},!0),Et(a,6,"burlas")),t>=.5&&Ri(a,"mitad_altura")&&Ae(a,"historia_mitad"),a.hitos.mitad_altura&&a.dia>=Math.max(20,a.hitos.mitad_altura+3)&&Ri(a,"cansancio")&&(Ae(a,"historia_cansancio",{},!0),Et(a,10,"cansancio")),a.dia>=24&&Ri(a,"clamor")){a.decision={clave:"clamor"};return}let n=i.tramos===i.totalTramos&&i.marcos===i.totalPuertas;if((n||a.dia>=36)&&a.hitos.clamor&&Ri(a,"ono")){n&&Ae(a,"historia_cerrado"),a.decision={clave:"ono"};return}if(a.hitos.ono&&a.dia>=a.hitos.ono+2&&Ri(a,"carta")){a.decision={clave:"carta"};return}if(a.hitos.carta&&a.dia>=a.hitos.carta+2&&Ri(a,"semaias")){a.decision={clave:"semaias"};return}a.dia>=45&&Ri(a,"ultimos_dias")&&Ae(a,"historia_ultimos",{},!0)}function Fg(a){if(a.resultado)return;let e=Ga(a);if(e.tramos===e.totalTramos&&e.hojas===e.totalPuertas){a.resultado={gano:!0,motivo:"completo",dia:a.dia};return}if(!Ot(a)){a.resultado={gano:!1,motivo:"gobernador",dia:a.dia};return}if((a.sinAnimo||0)>2*a.dif.dia){a.resultado={gano:!1,motivo:"animo",dia:a.dia};return}a.dia>ca&&(a.resultado={gano:!1,motivo:"tiempo",dia:ca})}var fc=.1;function Va(a){return pt(a),_c(a),a}function gc(a,e){if(a.pausa||a.decision||a.resultado){a.eventos=[];return}for(a.acumulado=(a.acumulado||0)+Math.min(e,.25)*(a.velocidad||1),a.eventos=[];a.acumulado>=fc;)if(a.acumulado-=fc,Dd(a,fc),a.decision||a.resultado){a.acumulado=0;break}}function Dd(a,e){a._huir=a._huir||[],a.t+=e,Nd(a,e),a._trompeta&&(Gg(a,a._trompeta),a._trompeta=null),Ld(a,e),Id(a,e),zd(a,e,t=>ot(a,t)),mc(a,e),kg(a,e),a.proyectiles=a.proyectiles.filter(t=>(t.t+=e)<t.dur),a._nieblaT=(a._nieblaT||0)-e,a._nieblaT<=0&&(a._nieblaT=.3,_c(a)),a._recalcularPob&&(a._recalcularPob=!1,ka(a)),Hg(a)}function kg(a,e){for(let t of[...a.edificios.values()])t.fuego>0&&(t.fuego=Math.min(1,t.fuego+.012*e),t.hp-=t.fuego*9*e),t.hp<=0&&t.avance>.05&&(Qe(a,"derribado",t.x,t.z,{id:t.id,tipo:t.tipo}),Ae(a,"edificio_perdido",{tipo:t.tipo},!0,t.x,t.z),Et(a,t.tipo==="casa"?4:6,"edificios"),$o(a,t)),t.hp<=0&&t.avance<=.05&&(t.hp=1)}function Hg(a){for(let e of a.tramos){if(e.tipo!=="puerta"||!e.hojas)continue;let t=(e.a.x+e.b.x)/2,i=(e.a.z+e.b.z)/2,n=!1;for(let r of a.unidades.values())if(r.accion!=="guarnecido"&&Math.abs(r.x-t)<4&&Math.abs(r.z-i)<4){n=!0;break}e.abierta=n}}function Gg(a,e){for(let t of a.unidades.values())t.accion==="herido"||t.ausente||(t.tipo==="lancero"||t.tipo==="arquero"||t.tipo==="jinete")&&(Bt(a,t),ic(a,t,e.x+(Math.random()-.5)*4,e.z+(Math.random()-.5)*4))}function _c(a){let e=a.niebla,t=e.datos,i=e.celda,n=vt.medio;for(let s=0;s<t.length;s++)t[s]===2&&(t[s]=1);let r=Gi(a)?ot(a,"guardia_noche")?.9:.7:1,o=(s,l,c)=>{let h=Math.floor((s-c+n)/i),u=Math.floor((s+c+n)/i),d=Math.floor((l-c+n)/i),p=Math.floor((l+c+n)/i);for(let m=Math.max(0,d);m<=Math.min(e.alto-1,p);m++)for(let g=Math.max(0,h);g<=Math.min(e.ancho-1,u);g++){let f=g*i-n+i/2,x=m*i-n+i/2;(f-s)**2+(x-l)**2<=c*c&&(t[m*e.ancho+g]=2)}};for(let s of a.unidades.values())s.ausente||s.accion==="guarnecido"&&!a.edificios.get(s.dentro)||o(s.x,s.z,Ze[s.tipo].vision*r);for(let s of a.edificios.values())o(s.x,s.z,(Me[s.tipo].tam/2+(s.tipo==="torre"?12:s.tipo==="gobernador"?10:4))*(s.avance>=1?r:.6));for(let s of a.tramos)s.avance>=1&&s.hp>0&&o((s.a.x+s.b.x)/2,(s.a.z+s.b.z)/2,7*r)}var wn=(a,e)=>e.map(t=>a.unidades.get(t)).filter(t=>t&&t.accion!=="herido"&&!t.ausente);function Zi(a,e,t,i=!1){let n=wn(a,e);if(!n.length||!t)return null;let r=n.filter(s=>s.tipo==="aldeano"),o=n.filter(s=>s.tipo!=="aldeano");switch(t.tipo){case"enemigo":{let s=a.enemigos.get(t.id);if(!s)return null;for(let l of n)wd(a,l,s);return"atacar"}case"recurso":{let s=a.recursos.get(t.id);if(!s)return null;for(let l of r)bn(a,l,s);return Dr(a,o,s.x,s.z,Ci),"recolectar"}case"edificio":{let s=a.edificios.get(t.id);if(!s)return null;for(let l of r)s.avance<1||s.hp<s.hpMax||s.fuego>0?Nr(a,l,s):s.tipo==="granja"?zr(a,l,s):l.carga&&(Me[s.tipo].entrega||[]).includes(l.carga.recurso)?(l.orden={tipo:"recolectar",id:l.ultimoRecurso,tipoRec:l.ultimoTipo||"arbol",fase:"volver"},l.ruta=null):Me[s.tipo].guarnicion?Xo(a,l,s):Ci(a,l,s.x,s.z+Me[s.tipo].tam/2+1.5);for(let l of o)Me[s.tipo].guarnicion&&s.avance>=1?Xo(a,l,s):Ci(a,l,s.x,s.z+Me[s.tipo].tam/2+2);return r.length&&(s.avance<1||s.hp<s.hpMax||s.fuego>0)?"construir":"mover"}case"tramo":{let s=a.tramos[t.id];if(!s)return null;let l=s.tipo==="puerta"&&s.avance>=1&&!s.hojas;for(let c of r)ac(a,c,s,l);if(o.length){let c=(s.a.x+s.b.x)/2,h=(s.a.z+s.b.z)/2;Dr(a,o,c*.88,h*.88,(u,d,p,m)=>{Bt(u,d),d.orden={tipo:"defender",x:p,z:m},Nt(u,d,p,m,1)})}return"construir"}default:return Dr(a,n,t.x,t.z,Ci),"mover"}}function Dr(a,e,t,i,n){let r=e.length,o=Math.ceil(Math.sqrt(r));e.forEach((s,l)=>{let c=l%o-(o-1)/2,h=Math.floor(l/o)-(o-1)/2;n(a,s,t+c*1.3,i+h*1.3)})}function vc(a,e,t,i){return Dr(a,wn(a,e),t,i,ic),"atacar"}function xc(a,e,t,i){return Dr(a,wn(a,e),t,i,(n,r,o,s)=>{Bt(n,r),r.orden={tipo:"defender",x:o,z:s},Nt(n,r,o,s,1)}),"reunir"}function yc(a,e){for(let t of wn(a,e))bt(t)}function Ur(a,e){for(let t of wn(a,e)){let i=null,n=1/0;for(let r of a.edificios.values()){if(!Me[r.tipo].guarnicion||r.avance<1||r.guarnicion.length>=Me[r.tipo].guarnicion)continue;let o=Ke(t,r);o<n&&(n=o,i=r)}i&&Xo(a,t,i)}}function bc(a,e){let t=a.edificios.get(e);t&&Ad(a,t)}function Mc(a,e,t){let i=a.tramos[t];for(let n of wn(a,e))n.tipo==="aldeano"&&ac(a,n,i,!0)}function ts(a,e,t){let i=a.edificios.get(e);if(i)if(t.tipo==="recurso"){let n=a.recursos.get(t.id);i.reunion={x:n.x,z:n.z,recurso:n.id}}else if(t.tipo==="edificio"&&a.edificios.get(t.id)?.tipo==="granja"){let n=a.edificios.get(t.id);i.reunion={x:n.x,z:n.z,granja:n.id}}else i.reunion={x:t.x,z:t.z}}function Sc(a,e,t){let i=a.edificios.get(e);return i?hc(a,i,t):!1}function Tc(a,e,t){let i=a.edificios.get(e);return i?dc(a,i,t):!1}function wc(a,e,t){let i=a.edificios.get(e);i&&uc(a,i,t)}function Ec(a,e){let t=a.edificios.get(e);t&&pc(a,t)}function Or(a,e){let t=a.edificios.get(e);return t?cc(a,t):!1}function Br(a){return[...a.unidades.values()].filter(e=>e.tipo==="aldeano"&&!e.orden&&e.accion==="quieto"&&!e.ausente)}function En(a){return[...a.unidades.values()].find(e=>e.tipo==="nehemias")}var lm=1,Vg=2,ia=3,ba=0,Ht=1,lu=2;var cm=2;var $a=100;var lh=204,ch=205;var hm=0,jg=1,Wg=2,xa=0,qg=1,Xg=2,Yg=3,cu=4,$g=5,Zg=6;var um=300,$n=301,Zn=302,hh=303,uh=304,dl=306,Kr=1e3,na=1001,dh=1002,Xt=1003,Ud=1004;var Ac=1005;var ri=1006,Jg=1007;var Is=1008;var Qa=1009;var hu=1012,dm=1013,_a=1014,va=1015,Qr=1016,pm=1017,mm=1018,en=1020;var ji=1023;var tn=1026,Jn=1027;var fm=1029;var gm=1031,_m=1033,Cc=33776,Rc=33777,Lc=33778,Pc=33779,Od=35840,Bd=35841,Fd=35842,kd=35843,vm=36196,Hd=37492,Gd=37496,Vd=37808,jd=37809,Wd=37810,qd=37811,Xd=37812,Yd=37813,$d=37814,Zd=37815,Jd=37816,Kd=37817,Qd=37818,ep=37819,tp=37820,ip=37821,Ic=36492,ap=36494,np=36495;var rp=36284,op=36285,sp=36286;var zs=2300,Ns=2301,zc=2302,lp=2400,cp=2401,hp=2402;var xm=3e3,an=3001;var Wi="",xt="srgb",ra="srgb-linear",uu="display-p3",pl="display-p3-linear",Ds="linear",rt="srgb",Us="rec709",Os="p3";var An=7680;var up=35044,ml=35048;var dp="300 es",ph=1035,Kn=2e3,Bs=2001,Ma=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let i=this._listeners;return i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let i=this._listeners[e];if(i!==void 0){let n=i.indexOf(t);n!==-1&&i.splice(n,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let t=this._listeners[e.type];if(t!==void 0){e.target=this;let i=t.slice(0);for(let n=0,r=i.length;n<r;n++)i[n].call(this,e);e.target=null}}},Ft=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],pp=1234567,qn=Math.PI/180,eo=180/Math.PI;function cn(){let a=4294967295*Math.random()|0,e=4294967295*Math.random()|0,t=4294967295*Math.random()|0,i=4294967295*Math.random()|0;return(Ft[255&a]+Ft[a>>8&255]+Ft[a>>16&255]+Ft[a>>24&255]+"-"+Ft[255&e]+Ft[e>>8&255]+"-"+Ft[e>>16&15|64]+Ft[e>>24&255]+"-"+Ft[63&t|128]+Ft[t>>8&255]+"-"+Ft[t>>16&255]+Ft[t>>24&255]+Ft[255&i]+Ft[i>>8&255]+Ft[i>>16&255]+Ft[i>>24&255]).toLowerCase()}function Pt(a,e,t){return Math.max(e,Math.min(t,a))}function mh(a,e){return(a%e+e)%e}function qr(a,e,t){return(1-t)*a+t*e}function fh(a){return(a&a-1)==0&&a!==0}function Fs(a){return Math.pow(2,Math.floor(Math.log(a)/Math.LN2))}function jn(a,e){switch(e.constructor){case Float32Array:return a;case Uint32Array:return a/4294967295;case Uint16Array:return a/65535;case Uint8Array:return a/255;case Int32Array:return Math.max(a/2147483647,-1);case Int16Array:return Math.max(a/32767,-1);case Int8Array:return Math.max(a/127,-1);default:throw new Error("Invalid component type.")}}function Wt(a,e){switch(e.constructor){case Float32Array:return a;case Uint32Array:return Math.round(4294967295*a);case Uint16Array:return Math.round(65535*a);case Uint8Array:return Math.round(255*a);case Int32Array:return Math.round(2147483647*a);case Int16Array:return Math.round(32767*a);case Int8Array:return Math.round(127*a);default:throw new Error("Invalid component type.")}}var nr={DEG2RAD:qn,RAD2DEG:eo,generateUUID:cn,clamp:Pt,euclideanModulo:mh,mapLinear:function(a,e,t,i,n){return i+(a-e)*(n-i)/(t-e)},inverseLerp:function(a,e,t){return a!==e?(t-a)/(e-a):0},lerp:qr,damp:function(a,e,t,i){return qr(a,e,1-Math.exp(-t*i))},pingpong:function(a,e=1){return e-Math.abs(mh(a,2*e)-e)},smoothstep:function(a,e,t){return a<=e?0:a>=t?1:(a=(a-e)/(t-e))*a*(3-2*a)},smootherstep:function(a,e,t){return a<=e?0:a>=t?1:(a=(a-e)/(t-e))*a*a*(a*(6*a-15)+10)},randInt:function(a,e){return a+Math.floor(Math.random()*(e-a+1))},randFloat:function(a,e){return a+Math.random()*(e-a)},randFloatSpread:function(a){return a*(.5-Math.random())},seededRandom:function(a){a!==void 0&&(pp=a);let e=pp+=1831565813;return e=Math.imul(e^e>>>15,1|e),e^=e+Math.imul(e^e>>>7,61|e),((e^e>>>14)>>>0)/4294967296},degToRad:function(a){return a*qn},radToDeg:function(a){return a*eo},isPowerOfTwo:fh,ceilPowerOfTwo:function(a){return Math.pow(2,Math.ceil(Math.log(a)/Math.LN2))},floorPowerOfTwo:Fs,setQuaternionFromProperEuler:function(a,e,t,i,n){let r=Math.cos,o=Math.sin,s=r(t/2),l=o(t/2),c=r((e+i)/2),h=o((e+i)/2),u=r((e-i)/2),d=o((e-i)/2),p=r((i-e)/2),m=o((i-e)/2);switch(n){case"XYX":a.set(s*h,l*u,l*d,s*c);break;case"YZY":a.set(l*d,s*h,l*u,s*c);break;case"ZXZ":a.set(l*u,l*d,s*h,s*c);break;case"XZX":a.set(s*h,l*m,l*p,s*c);break;case"YXY":a.set(l*p,s*h,l*m,s*c);break;case"ZYZ":a.set(l*m,l*p,s*h,s*c);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}},normalize:Wt,denormalize:jn},ce=class a{constructor(e=0,t=0){a.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,n=e.elements;return this.x=n[0]*t+n[3]*i+n[6],this.y=n[1]*t+n[4]*i+n[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Pt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),n=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*n+e.x,this.y=r*n+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Fe=class a{constructor(e,t,i,n,r,o,s,l,c){a.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,n,r,o,s,l,c)}set(e,t,i,n,r,o,s,l,c){let h=this.elements;return h[0]=e,h[1]=n,h[2]=s,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,r=this.elements,o=i[0],s=i[3],l=i[6],c=i[1],h=i[4],u=i[7],d=i[2],p=i[5],m=i[8],g=n[0],f=n[3],x=n[6],_=n[1],v=n[4],y=n[7],C=n[2],S=n[5],w=n[8];return r[0]=o*g+s*_+l*C,r[3]=o*f+s*v+l*S,r[6]=o*x+s*y+l*w,r[1]=c*g+h*_+u*C,r[4]=c*f+h*v+u*S,r[7]=c*x+h*y+u*w,r[2]=d*g+p*_+m*C,r[5]=d*f+p*v+m*S,r[8]=d*x+p*y+m*w,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*s*c-i*r*h+i*s*l+n*r*c-n*o*l}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],h=e[8],u=h*o-s*c,d=s*l-h*r,p=c*r-o*l,m=t*u+i*d+n*p;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let g=1/m;return e[0]=u*g,e[1]=(n*c-h*i)*g,e[2]=(s*i-n*o)*g,e[3]=d*g,e[4]=(h*t-n*l)*g,e[5]=(n*r-s*t)*g,e[6]=p*g,e[7]=(i*l-c*t)*g,e[8]=(o*t-i*r)*g,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,n,r,o,s){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*s)+o+e,-n*c,n*l,-n*(-c*o+l*s)+s+t,0,0,1),this}scale(e,t){return this.premultiply(Nc.makeScale(e,t)),this}rotate(e){return this.premultiply(Nc.makeRotation(-e)),this}translate(e,t){return this.premultiply(Nc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<9;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Nc=new Fe;function ym(a){for(let e=a.length-1;e>=0;--e)if(a[e]>=65535)return!0;return!1}function ks(a){return document.createElementNS("http://www.w3.org/1999/xhtml",a)}function Kg(){let a=ks("canvas");return a.style.display="block",a}var mp={};function Xr(a){a in mp||(mp[a]=!0,console.warn(a))}var fp=new Fe().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),gp=new Fe().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),is={[ra]:{transfer:Ds,primaries:Us,toReference:a=>a,fromReference:a=>a},[xt]:{transfer:rt,primaries:Us,toReference:a=>a.convertSRGBToLinear(),fromReference:a=>a.convertLinearToSRGB()},[pl]:{transfer:Ds,primaries:Os,toReference:a=>a.applyMatrix3(gp),fromReference:a=>a.applyMatrix3(fp)},[uu]:{transfer:rt,primaries:Os,toReference:a=>a.convertSRGBToLinear().applyMatrix3(gp),fromReference:a=>a.applyMatrix3(fp).convertLinearToSRGB()}},Qg=new Set([ra,pl]),et={enabled:!0,_workingColorSpace:ra,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(a){if(!Qg.has(a))throw new Error(`Unsupported working color space, "${a}".`);this._workingColorSpace=a},convert:function(a,e,t){if(this.enabled===!1||e===t||!e||!t)return a;let i=is[e].toReference;return(0,is[t].fromReference)(i(a))},fromWorkingColorSpace:function(a,e){return this.convert(a,this._workingColorSpace,e)},toWorkingColorSpace:function(a,e){return this.convert(a,e,this._workingColorSpace)},getPrimaries:function(a){return is[a].primaries},getTransfer:function(a){return a===Wi?Ds:is[a].transfer}};function Xn(a){return a<.04045?.0773993808*a:Math.pow(.9478672986*a+.0521327014,2.4)}function Dc(a){return a<.0031308?12.92*a:1.055*Math.pow(a,.41666)-.055}var Cn,Hs=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Cn===void 0&&(Cn=ks("canvas")),Cn.width=e.width,Cn.height=e.height;let i=Cn.getContext("2d");e instanceof ImageData?i.putImageData(e,0,0):i.drawImage(e,0,0,e.width,e.height),t=Cn}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ks("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let n=i.getImageData(0,0,e.width,e.height),r=n.data;for(let o=0;o<r.length;o++)r[o]=255*Xn(r[o]/255);return i.putImageData(n,0,0),t}if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(255*Xn(t[i]/255)):t[i]=Xn(t[i]);return{data:t,width:e.width,height:e.height}}return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},e0=0,Gs=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:e0++}),this.uuid=cn(),this.data=e,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},n=this.data;if(n!==null){let r;if(Array.isArray(n)){r=[];for(let o=0,s=n.length;o<s;o++)n[o].isDataTexture?r.push(Uc(n[o].image)):r.push(Uc(n[o]))}else r=Uc(n);i.url=r}return t||(e.images[this.uuid]=i),i}};function Uc(a){return typeof HTMLImageElement<"u"&&a instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&a instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&a instanceof ImageBitmap?Hs.getDataURL(a):a.data?{data:Array.from(a.data),width:a.width,height:a.height,type:a.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var t0=0,oi=class a extends Ma{constructor(e=a.DEFAULT_IMAGE,t=a.DEFAULT_MAPPING,i=1001,n=1001,r=1006,o=1008,s=1023,l=1009,c=a.DEFAULT_ANISOTROPY,h=""){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:t0++}),this.uuid=cn(),this.name="",this.source=new Gs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=n,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=s,this.internalFormat=null,this.type=l,this.offset=new ce(0,0),this.repeat=new ce(1,1),this.center=new ce(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Fe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof h=="string"?this.colorSpace=h:(Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=h===an?xt:Wi),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==um)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Kr:e.x=e.x-Math.floor(e.x);break;case na:e.x=e.x<0?0:1;break;case dh:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x)}if(e.y<0||e.y>1)switch(this.wrapT){case Kr:e.y=e.y-Math.floor(e.y);break;case na:e.y=e.y<0?0:1;break;case dh:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y)}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===xt?an:xm}set encoding(e){Xr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=e===an?xt:Wi}};oi.DEFAULT_IMAGE=null,oi.DEFAULT_MAPPING=um,oi.DEFAULT_ANISOTROPY=1;var St=class a{constructor(e=0,t=0,i=0,n=1){a.prototype.isVector4=!0,this.x=e,this.y=t,this.z=i,this.w=n}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,n){return this.x=e,this.y=t,this.z=i,this.w=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*n+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*n+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*n+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*n+o[15]*r,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,n,r,l=e.elements,c=l[0],h=l[4],u=l[8],d=l[1],p=l[5],m=l[9],g=l[2],f=l[6],x=l[10];if(Math.abs(h-d)<.01&&Math.abs(u-g)<.01&&Math.abs(m-f)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+g)<.1&&Math.abs(m+f)<.1&&Math.abs(c+p+x-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let v=(c+1)/2,y=(p+1)/2,C=(x+1)/2,S=(h+d)/4,w=(u+g)/4,O=(m+f)/4;return v>y&&v>C?v<.01?(i=0,n=.707106781,r=.707106781):(i=Math.sqrt(v),n=S/i,r=w/i):y>C?y<.01?(i=.707106781,n=0,r=.707106781):(n=Math.sqrt(y),i=S/n,r=O/n):C<.01?(i=.707106781,n=.707106781,r=0):(r=Math.sqrt(C),i=w/r,n=O/r),this.set(i,n,r,t),this}let _=Math.sqrt((f-m)*(f-m)+(u-g)*(u-g)+(d-h)*(d-h));return Math.abs(_)<.001&&(_=1),this.x=(f-m)/_,this.y=(u-g)/_,this.z=(d-h)/_,this.w=Math.acos((c+p+x-1)/2),this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this.w=Math.max(e.w,Math.min(t.w,this.w)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this.w=Math.max(e,Math.min(t,this.w)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},gh=class extends Ma{constructor(e=1,t=1,i={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new St(0,0,e,t),this.scissorTest=!1,this.viewport=new St(0,0,e,t);let n={width:e,height:t,depth:1};i.encoding!==void 0&&(Xr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),i.colorSpace=i.encoding===an?xt:Wi),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:ri,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0},i),this.texture=new oi(n,i.mapping,i.wrapS,i.wrapT,i.magFilter,i.minFilter,i.format,i.type,i.anisotropy,i.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=i.generateMipmaps,this.texture.internalFormat=i.internalFormat,this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.depthTexture=i.depthTexture,this.samples=i.samples}setSize(e,t,i=1){this.width===e&&this.height===t&&this.depth===i||(this.width=e,this.height=t,this.depth=i,this.texture.image.width=e,this.texture.image.height=t,this.texture.image.depth=i,this.dispose()),this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.texture=e.texture.clone(),this.texture.isRenderTargetTexture=!0;let t=Object.assign({},e.texture.image);return this.texture.source=new Gs(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},oa=class extends gh{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},Vs=class extends oi{constructor(e=null,t=1,i=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=na,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var _h=class extends oi{constructor(e=null,t=1,i=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:n},this.magFilter=Xt,this.minFilter=Xt,this.wrapR=na,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var qi=class{constructor(e=0,t=0,i=0,n=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=n}static slerpFlat(e,t,i,n,r,o,s){let l=i[n+0],c=i[n+1],h=i[n+2],u=i[n+3],d=r[o+0],p=r[o+1],m=r[o+2],g=r[o+3];if(s===0)return e[t+0]=l,e[t+1]=c,e[t+2]=h,void(e[t+3]=u);if(s===1)return e[t+0]=d,e[t+1]=p,e[t+2]=m,void(e[t+3]=g);if(u!==g||l!==d||c!==p||h!==m){let f=1-s,x=l*d+c*p+h*m+u*g,_=x>=0?1:-1,v=1-x*x;if(v>Number.EPSILON){let C=Math.sqrt(v),S=Math.atan2(C,x*_);f=Math.sin(f*S)/C,s=Math.sin(s*S)/C}let y=s*_;if(l=l*f+d*y,c=c*f+p*y,h=h*f+m*y,u=u*f+g*y,f===1-s){let C=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=C,c*=C,h*=C,u*=C}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,i,n,r,o){let s=i[n],l=i[n+1],c=i[n+2],h=i[n+3],u=r[o],d=r[o+1],p=r[o+2],m=r[o+3];return e[t]=s*m+h*u+l*p-c*d,e[t+1]=l*m+h*d+c*u-s*p,e[t+2]=c*m+h*p+s*d-l*u,e[t+3]=h*m-s*u-l*d-c*p,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,n){return this._x=e,this._y=t,this._z=i,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,n=e._y,r=e._z,o=e._order,s=Math.cos,l=Math.sin,c=s(i/2),h=s(n/2),u=s(r/2),d=l(i/2),p=l(n/2),m=l(r/2);switch(o){case"XYZ":this._x=d*h*u+c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u-d*p*m;break;case"YXZ":this._x=d*h*u+c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u+d*p*m;break;case"ZXY":this._x=d*h*u-c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u-d*p*m;break;case"ZYX":this._x=d*h*u-c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u+d*p*m;break;case"YZX":this._x=d*h*u+c*p*m,this._y=c*p*u+d*h*m,this._z=c*h*m-d*p*u,this._w=c*h*u-d*p*m;break;case"XZY":this._x=d*h*u-c*p*m,this._y=c*p*u-d*h*m,this._z=c*h*m+d*p*u,this._w=c*h*u+d*p*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,n=Math.sin(i);return this._x=e.x*n,this._y=e.y*n,this._z=e.z*n,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],n=t[4],r=t[8],o=t[1],s=t[5],l=t[9],c=t[2],h=t[6],u=t[10],d=i+s+u;if(d>0){let p=.5/Math.sqrt(d+1);this._w=.25/p,this._x=(h-l)*p,this._y=(r-c)*p,this._z=(o-n)*p}else if(i>s&&i>u){let p=2*Math.sqrt(1+i-s-u);this._w=(h-l)/p,this._x=.25*p,this._y=(n+o)/p,this._z=(r+c)/p}else if(s>u){let p=2*Math.sqrt(1+s-i-u);this._w=(r-c)/p,this._x=(n+o)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+u-i-s);this._w=(o-n)/p,this._x=(r+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<Number.EPSILON?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Pt(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let n=Math.min(1,t/i);return this.slerp(e,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,n=e._y,r=e._z,o=e._w,s=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*s+n*c-r*l,this._y=n*h+o*l+r*s-i*c,this._z=r*h+o*c+i*l-n*s,this._w=o*h-i*s-n*l-r*c,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let i=this._x,n=this._y,r=this._z,o=this._w,s=o*e._w+i*e._x+n*e._y+r*e._z;if(s<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,s=-s):this.copy(e),s>=1)return this._w=o,this._x=i,this._y=n,this._z=r,this;let l=1-s*s;if(l<=Number.EPSILON){let p=1-t;return this._w=p*o+t*this._w,this._x=p*i+t*this._x,this._y=p*n+t*this._y,this._z=p*r+t*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,s),u=Math.sin((1-t)*h)/c,d=Math.sin(t*h)/c;return this._w=o*u+this._w*d,this._x=i*u+this._x*d,this._y=n*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=Math.random(),t=Math.sqrt(1-e),i=Math.sqrt(e),n=2*Math.PI*Math.random(),r=2*Math.PI*Math.random();return this.set(t*Math.cos(n),i*Math.sin(r),i*Math.cos(r),t*Math.sin(n))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},A=class a{constructor(e=0,t=0,i=0){a.prototype.isVector3=!0,this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(_p.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(_p.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*n,this.y=r[1]*t+r[4]*i+r[7]*n,this.z=r[2]*t+r[5]*i+r[8]*n,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,n=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*n+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*n+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*n+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*n+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,n=this.z,r=e.x,o=e.y,s=e.z,l=e.w,c=2*(o*n-s*i),h=2*(s*t-r*n),u=2*(r*i-o*t);return this.x=t+l*c+o*u-s*h,this.y=i+l*h+s*c-r*u,this.z=n+l*u+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,n=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*n,this.y=r[1]*t+r[5]*i+r[9]*n,this.z=r[2]*t+r[6]*i+r[10]*n,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Math.max(e.x,Math.min(t.x,this.x)),this.y=Math.max(e.y,Math.min(t.y,this.y)),this.z=Math.max(e.z,Math.min(t.z,this.z)),this}clampScalar(e,t){return this.x=Math.max(e,Math.min(t,this.x)),this.y=Math.max(e,Math.min(t,this.y)),this.z=Math.max(e,Math.min(t,this.z)),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Math.max(e,Math.min(t,i)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,n=e.y,r=e.z,o=t.x,s=t.y,l=t.z;return this.x=n*l-r*s,this.y=r*o-i*l,this.z=i*s-n*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Oc.copy(this).projectOnVector(e),this.sub(Oc)}reflect(e){return this.sub(Oc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(Pt(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,n=this.z-e.z;return t*t+i*i+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let n=Math.sin(t)*e;return this.x=n*Math.sin(i),this.y=Math.cos(t)*e,this.z=n*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),n=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=n,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,4*t)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,3*t)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=2*(Math.random()-.5),t=Math.random()*Math.PI*2,i=Math.sqrt(1-e**2);return this.x=i*Math.cos(t),this.y=i*Math.sin(t),this.z=e,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Oc=new A,_p=new qi,Ni=class{constructor(e=new A(1/0,1/0,1/0),t=new A(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Li.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Li.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Li.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,s=r.count;o<s;o++)e.isMesh===!0?e.getVertexPosition(o,Li):Li.fromBufferAttribute(r,o),Li.applyMatrix4(e.matrixWorld),this.expandByPoint(Li);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),as.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),as.copy(i.boundingBox)),as.applyMatrix4(e.matrixWorld),this.union(as)}let n=e.children;for(let r=0,o=n.length;r<o;r++)this.expandByObject(n[r],t);return this}containsPoint(e){return!(e.x<this.min.x||e.x>this.max.x||e.y<this.min.y||e.y>this.max.y||e.z<this.min.z||e.z>this.max.z)}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return!(e.max.x<this.min.x||e.min.x>this.max.x||e.max.y<this.min.y||e.min.y>this.max.y||e.max.z<this.min.z||e.min.z>this.max.z)}intersectsSphere(e){return this.clampPoint(e.center,Li),Li.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Fr),ns.subVectors(this.max,Fr),Rn.subVectors(e.a,Fr),Ln.subVectors(e.b,Fr),Pn.subVectors(e.c,Fr),da.subVectors(Ln,Rn),pa.subVectors(Pn,Ln),ja.subVectors(Rn,Pn);let t=[0,-da.z,da.y,0,-pa.z,pa.y,0,-ja.z,ja.y,da.z,0,-da.x,pa.z,0,-pa.x,ja.z,0,-ja.x,-da.y,da.x,0,-pa.y,pa.x,0,-ja.y,ja.x,0];return!!Bc(t,Rn,Ln,Pn,ns)&&(t=[1,0,0,0,1,0,0,0,1],!!Bc(t,Rn,Ln,Pn,ns)&&(rs.crossVectors(da,pa),t=[rs.x,rs.y,rs.z],Bc(t,Rn,Ln,Pn,ns)))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Li).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=.5*this.getSize(Li).length()),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()||(Ji[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ji[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ji[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ji[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ji[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ji[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ji[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ji[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ji)),this}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},Ji=[new A,new A,new A,new A,new A,new A,new A,new A],Li=new A,as=new Ni,Rn=new A,Ln=new A,Pn=new A,da=new A,pa=new A,ja=new A,Fr=new A,ns=new A,rs=new A,Wa=new A;function Bc(a,e,t,i,n){for(let r=0,o=a.length-3;r<=o;r+=3){Wa.fromArray(a,r);let s=n.x*Math.abs(Wa.x)+n.y*Math.abs(Wa.y)+n.z*Math.abs(Wa.z),l=e.dot(Wa),c=t.dot(Wa),h=i.dot(Wa);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>s)return!1}return!0}var i0=new Ni,kr=new A,Fc=new A,si=class{constructor(e=new A,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):i0.setFromPoints(e).getCenter(i);let n=0;for(let r=0,o=e.length;r<o;r++)n=Math.max(n,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(n),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;kr.subVectors(e,this.center);let t=kr.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),n=.5*(i-this.radius);this.center.addScaledVector(kr,n/i),this.radius+=n}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Fc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(kr.copy(e.center).add(Fc)),this.expandByPoint(kr.copy(e.center).sub(Fc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},Ki=new A,kc=new A,os=new A,ma=new A,Hc=new A,ss=new A,Gc=new A,nn=class{constructor(e=new A,t=new A(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Ki)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Ki.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Ki.copy(this.origin).addScaledVector(this.direction,t),Ki.distanceToSquared(e))}distanceSqToSegment(e,t,i,n){kc.copy(e).add(t).multiplyScalar(.5),os.copy(t).sub(e).normalize(),ma.copy(this.origin).sub(kc);let r=.5*e.distanceTo(t),o=-this.direction.dot(os),s=ma.dot(this.direction),l=-ma.dot(os),c=ma.lengthSq(),h=Math.abs(1-o*o),u,d,p,m;if(h>0)if(u=o*l-s,d=o*s-l,m=r*h,u>=0)if(d>=-m)if(d<=m){let g=1/h;u*=g,d*=g,p=u*(u+o*d+2*s)+d*(o*u+d+2*l)+c}else d=r,u=Math.max(0,-(o*d+s)),p=-u*u+d*(d+2*l)+c;else d=-r,u=Math.max(0,-(o*d+s)),p=-u*u+d*(d+2*l)+c;else d<=-m?(u=Math.max(0,-(-o*r+s)),d=u>0?-r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c):d<=m?(u=0,d=Math.min(Math.max(-r,-l),r),p=d*(d+2*l)+c):(u=Math.max(0,-(o*r+s)),d=u>0?r:Math.min(Math.max(-r,-l),r),p=-u*u+d*(d+2*l)+c);else d=o>0?-r:r,u=Math.max(0,-(o*d+s)),p=-u*u+d*(d+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,u),n&&n.copy(kc).addScaledVector(os,d),p}intersectSphere(e,t){Ki.subVectors(e.center,this.origin);let i=Ki.dot(this.direction),n=Ki.dot(Ki)-i*i,r=e.radius*e.radius;if(n>r)return null;let o=Math.sqrt(r-n),s=i-o,l=i+o;return l<0?null:s<0?this.at(l,t):this.at(s,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0?!0:e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,n,r,o,s,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return c>=0?(i=(e.min.x-d.x)*c,n=(e.max.x-d.x)*c):(i=(e.max.x-d.x)*c,n=(e.min.x-d.x)*c),h>=0?(r=(e.min.y-d.y)*h,o=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,o=(e.min.y-d.y)*h),i>o||r>n?null:((r>i||isNaN(i))&&(i=r),(o<n||isNaN(n))&&(n=o),u>=0?(s=(e.min.z-d.z)*u,l=(e.max.z-d.z)*u):(s=(e.max.z-d.z)*u,l=(e.min.z-d.z)*u),i>l||s>n?null:((s>i||i!=i)&&(i=s),(l<n||n!=n)&&(n=l),n<0?null:this.at(i>=0?i:n,t)))}intersectsBox(e){return this.intersectBox(e,Ki)!==null}intersectTriangle(e,t,i,n,r){Hc.subVectors(t,e),ss.subVectors(i,e),Gc.crossVectors(Hc,ss);let o,s=this.direction.dot(Gc);if(s>0){if(n)return null;o=1}else{if(!(s<0))return null;o=-1,s=-s}ma.subVectors(this.origin,e);let l=o*this.direction.dot(ss.crossVectors(ma,ss));if(l<0)return null;let c=o*this.direction.dot(Hc.cross(ma));if(c<0||l+c>s)return null;let h=-o*ma.dot(Gc);return h<0?null:this.at(h/s,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Re=class a{constructor(e,t,i,n,r,o,s,l,c,h,u,d,p,m,g,f){a.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,n,r,o,s,l,c,h,u,d,p,m,g,f)}set(e,t,i,n,r,o,s,l,c,h,u,d,p,m,g,f){let x=this.elements;return x[0]=e,x[4]=t,x[8]=i,x[12]=n,x[1]=r,x[5]=o,x[9]=s,x[13]=l,x[2]=c,x[6]=h,x[10]=u,x[14]=d,x[3]=p,x[7]=m,x[11]=g,x[15]=f,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new a().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,i=e.elements,n=1/In.setFromMatrixColumn(e,0).length(),r=1/In.setFromMatrixColumn(e,1).length(),o=1/In.setFromMatrixColumn(e,2).length();return t[0]=i[0]*n,t[1]=i[1]*n,t[2]=i[2]*n,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,n=e.y,r=e.z,o=Math.cos(i),s=Math.sin(i),l=Math.cos(n),c=Math.sin(n),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*h,p=o*u,m=s*h,g=s*u;t[0]=l*h,t[4]=-l*u,t[8]=c,t[1]=p+m*c,t[5]=d-g*c,t[9]=-s*l,t[2]=g-d*c,t[6]=m+p*c,t[10]=o*l}else if(e.order==="YXZ"){let d=l*h,p=l*u,m=c*h,g=c*u;t[0]=d+g*s,t[4]=m*s-p,t[8]=o*c,t[1]=o*u,t[5]=o*h,t[9]=-s,t[2]=p*s-m,t[6]=g+d*s,t[10]=o*l}else if(e.order==="ZXY"){let d=l*h,p=l*u,m=c*h,g=c*u;t[0]=d-g*s,t[4]=-o*u,t[8]=m+p*s,t[1]=p+m*s,t[5]=o*h,t[9]=g-d*s,t[2]=-o*c,t[6]=s,t[10]=o*l}else if(e.order==="ZYX"){let d=o*h,p=o*u,m=s*h,g=s*u;t[0]=l*h,t[4]=m*c-p,t[8]=d*c+g,t[1]=l*u,t[5]=g*c+d,t[9]=p*c-m,t[2]=-c,t[6]=s*l,t[10]=o*l}else if(e.order==="YZX"){let d=o*l,p=o*c,m=s*l,g=s*c;t[0]=l*h,t[4]=g-d*u,t[8]=m*u+p,t[1]=u,t[5]=o*h,t[9]=-s*h,t[2]=-c*h,t[6]=p*u+m,t[10]=d-g*u}else if(e.order==="XZY"){let d=o*l,p=o*c,m=s*l,g=s*c;t[0]=l*h,t[4]=-u,t[8]=c*h,t[1]=d*u+g,t[5]=o*h,t[9]=p*u-m,t[2]=m*u-p,t[6]=s*h,t[10]=g*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(a0,e,n0)}lookAt(e,t,i){let n=this.elements;return ai.subVectors(e,t),ai.lengthSq()===0&&(ai.z=1),ai.normalize(),fa.crossVectors(i,ai),fa.lengthSq()===0&&(Math.abs(i.z)===1?ai.x+=1e-4:ai.z+=1e-4,ai.normalize(),fa.crossVectors(i,ai)),fa.normalize(),ls.crossVectors(ai,fa),n[0]=fa.x,n[4]=ls.x,n[8]=ai.x,n[1]=fa.y,n[5]=ls.y,n[9]=ai.y,n[2]=fa.z,n[6]=ls.z,n[10]=ai.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,n=t.elements,r=this.elements,o=i[0],s=i[4],l=i[8],c=i[12],h=i[1],u=i[5],d=i[9],p=i[13],m=i[2],g=i[6],f=i[10],x=i[14],_=i[3],v=i[7],y=i[11],C=i[15],S=n[0],w=n[4],O=n[8],N=n[12],B=n[1],$=n[5],R=n[9],V=n[13],W=n[2],le=n[6],ge=n[10],ne=n[14],Z=n[3],ae=n[7],H=n[11],Q=n[15];return r[0]=o*S+s*B+l*W+c*Z,r[4]=o*w+s*$+l*le+c*ae,r[8]=o*O+s*R+l*ge+c*H,r[12]=o*N+s*V+l*ne+c*Q,r[1]=h*S+u*B+d*W+p*Z,r[5]=h*w+u*$+d*le+p*ae,r[9]=h*O+u*R+d*ge+p*H,r[13]=h*N+u*V+d*ne+p*Q,r[2]=m*S+g*B+f*W+x*Z,r[6]=m*w+g*$+f*le+x*ae,r[10]=m*O+g*R+f*ge+x*H,r[14]=m*N+g*V+f*ne+x*Q,r[3]=_*S+v*B+y*W+C*Z,r[7]=_*w+v*$+y*le+C*ae,r[11]=_*O+v*R+y*ge+C*H,r[15]=_*N+v*V+y*ne+C*Q,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],n=e[8],r=e[12],o=e[1],s=e[5],l=e[9],c=e[13],h=e[2],u=e[6],d=e[10],p=e[14];return e[3]*(+r*l*u-n*c*u-r*s*d+i*c*d+n*s*p-i*l*p)+e[7]*(+t*l*p-t*c*d+r*o*d-n*o*p+n*c*h-r*l*h)+e[11]*(+t*c*u-t*s*p-r*o*u+i*o*p+r*s*h-i*c*h)+e[15]*(-n*s*h-t*l*u+t*s*d+n*o*u-i*o*d+i*l*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let n=this.elements;return e.isVector3?(n[12]=e.x,n[13]=e.y,n[14]=e.z):(n[12]=e,n[13]=t,n[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],n=e[2],r=e[3],o=e[4],s=e[5],l=e[6],c=e[7],h=e[8],u=e[9],d=e[10],p=e[11],m=e[12],g=e[13],f=e[14],x=e[15],_=u*f*c-g*d*c+g*l*p-s*f*p-u*l*x+s*d*x,v=m*d*c-h*f*c-m*l*p+o*f*p+h*l*x-o*d*x,y=h*g*c-m*u*c+m*s*p-o*g*p-h*s*x+o*u*x,C=m*u*l-h*g*l-m*s*d+o*g*d+h*s*f-o*u*f,S=t*_+i*v+n*y+r*C;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let w=1/S;return e[0]=_*w,e[1]=(g*d*r-u*f*r-g*n*p+i*f*p+u*n*x-i*d*x)*w,e[2]=(s*f*r-g*l*r+g*n*c-i*f*c-s*n*x+i*l*x)*w,e[3]=(u*l*r-s*d*r-u*n*c+i*d*c+s*n*p-i*l*p)*w,e[4]=v*w,e[5]=(h*f*r-m*d*r+m*n*p-t*f*p-h*n*x+t*d*x)*w,e[6]=(m*l*r-o*f*r-m*n*c+t*f*c+o*n*x-t*l*x)*w,e[7]=(o*d*r-h*l*r+h*n*c-t*d*c-o*n*p+t*l*p)*w,e[8]=y*w,e[9]=(m*u*r-h*g*r-m*i*p+t*g*p+h*i*x-t*u*x)*w,e[10]=(o*g*r-m*s*r+m*i*c-t*g*c-o*i*x+t*s*x)*w,e[11]=(h*s*r-o*u*r-h*i*c+t*u*c+o*i*p-t*s*p)*w,e[12]=C*w,e[13]=(h*g*n-m*u*n+m*i*d-t*g*d-h*i*f+t*u*f)*w,e[14]=(m*s*n-o*g*n-m*i*l+t*g*l+o*i*f-t*s*f)*w,e[15]=(o*u*n-h*s*n+h*i*l-t*u*l-o*i*d+t*s*d)*w,this}scale(e){let t=this.elements,i=e.x,n=e.y,r=e.z;return t[0]*=i,t[4]*=n,t[8]*=r,t[1]*=i,t[5]*=n,t[9]*=r,t[2]*=i,t[6]*=n,t[10]*=r,t[3]*=i,t[7]*=n,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],n=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,n))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),n=Math.sin(t),r=1-i,o=e.x,s=e.y,l=e.z,c=r*o,h=r*s;return this.set(c*o+i,c*s-n*l,c*l+n*s,0,c*s+n*l,h*s+i,h*l-n*o,0,c*l-n*s,h*l+n*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,n,r,o){return this.set(1,i,r,0,e,1,o,0,t,n,1,0,0,0,0,1),this}compose(e,t,i){let n=this.elements,r=t._x,o=t._y,s=t._z,l=t._w,c=r+r,h=o+o,u=s+s,d=r*c,p=r*h,m=r*u,g=o*h,f=o*u,x=s*u,_=l*c,v=l*h,y=l*u,C=i.x,S=i.y,w=i.z;return n[0]=(1-(g+x))*C,n[1]=(p+y)*C,n[2]=(m-v)*C,n[3]=0,n[4]=(p-y)*S,n[5]=(1-(d+x))*S,n[6]=(f+_)*S,n[7]=0,n[8]=(m+v)*w,n[9]=(f-_)*w,n[10]=(1-(d+g))*w,n[11]=0,n[12]=e.x,n[13]=e.y,n[14]=e.z,n[15]=1,this}decompose(e,t,i){let n=this.elements,r=In.set(n[0],n[1],n[2]).length(),o=In.set(n[4],n[5],n[6]).length(),s=In.set(n[8],n[9],n[10]).length();this.determinant()<0&&(r=-r),e.x=n[12],e.y=n[13],e.z=n[14],Pi.copy(this);let l=1/r,c=1/o,h=1/s;return Pi.elements[0]*=l,Pi.elements[1]*=l,Pi.elements[2]*=l,Pi.elements[4]*=c,Pi.elements[5]*=c,Pi.elements[6]*=c,Pi.elements[8]*=h,Pi.elements[9]*=h,Pi.elements[10]*=h,t.setFromRotationMatrix(Pi),i.x=r,i.y=o,i.z=s,this}makePerspective(e,t,i,n,r,o,s=2e3){let l=this.elements,c=2*r/(t-e),h=2*r/(i-n),u=(t+e)/(t-e),d=(i+n)/(i-n),p,m;if(s===Kn)p=-(o+r)/(o-r),m=-2*o*r/(o-r);else{if(s!==Bs)throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+s);p=-o/(o-r),m=-o*r/(o-r)}return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=d,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=m,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,n,r,o,s=2e3){let l=this.elements,c=1/(t-e),h=1/(i-n),u=1/(o-r),d=(t+e)*c,p=(i+n)*h,m,g;if(s===Kn)m=(o+r)*u,g=-2*u;else{if(s!==Bs)throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+s);m=r*u,g=-1*u}return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-d,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-p,l[2]=0,l[6]=0,l[10]=g,l[14]=-m,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let n=0;n<16;n++)if(t[n]!==i[n])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},In=new A,Pi=new Re,a0=new A(0,0,0),n0=new A(1,1,1),fa=new A,ls=new A,ai=new A,vp=new Re,xp=new qi,js=class a{constructor(e=0,t=0,i=0,n=a.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=n}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,n=this._order){return this._x=e,this._y=t,this._z=i,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let n=e.elements,r=n[0],o=n[4],s=n[8],l=n[1],c=n[5],h=n[9],u=n[2],d=n[6],p=n[10];switch(t){case"XYZ":this._y=Math.asin(Pt(s,-1,1)),Math.abs(s)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Pt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(s,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Pt(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,p),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-Pt(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,p),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(Pt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(s,p));break;case"XZY":this._z=Math.asin(-Pt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,c),this._y=Math.atan2(s,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return vp.makeRotationFromQuaternion(e),this.setFromRotationMatrix(vp,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return xp.setFromEuler(this),this.setFromQuaternion(xp,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};js.DEFAULT_ORDER="XYZ";var to=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!=0}isEnabled(e){return(this.mask&(1<<e|0))!=0}},r0=0,yp=new A,zn=new qi,Qi=new Re,cs=new A,Hr=new A,o0=new A,s0=new qi,bp=new A(1,0,0),Mp=new A(0,1,0),Sp=new A(0,0,1),l0={type:"added"},c0={type:"removed"},gt=class a extends Ma{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:r0++}),this.uuid=cn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=a.DEFAULT_UP.clone();let e=new A,t=new js,i=new qi,n=new A(1,1,1);t._onChange((function(){i.setFromEuler(t,!1)})),i._onChange((function(){t.setFromQuaternion(i,void 0,!1)})),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new Re},normalMatrix:{value:new Fe}}),this.matrix=new Re,this.matrixWorld=new Re,this.matrixAutoUpdate=a.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=a.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new to,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return zn.setFromAxisAngle(e,t),this.quaternion.multiply(zn),this}rotateOnWorldAxis(e,t){return zn.setFromAxisAngle(e,t),this.quaternion.premultiply(zn),this}rotateX(e){return this.rotateOnAxis(bp,e)}rotateY(e){return this.rotateOnAxis(Mp,e)}rotateZ(e){return this.rotateOnAxis(Sp,e)}translateOnAxis(e,t){return yp.copy(e).applyQuaternion(this.quaternion),this.position.add(yp.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bp,e)}translateY(e){return this.translateOnAxis(Mp,e)}translateZ(e){return this.translateOnAxis(Sp,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Qi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?cs.copy(e):cs.set(e,t,i);let n=this.parent;this.updateWorldMatrix(!0,!1),Hr.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qi.lookAt(Hr,cs,this.up):Qi.lookAt(cs,Hr,this.up),this.quaternion.setFromRotationMatrix(Qi),n&&(Qi.extractRotation(n.matrixWorld),zn.setFromRotationMatrix(Qi),this.quaternion.premultiply(zn.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.parent!==null&&e.parent.remove(e),e.parent=this,this.children.push(e),e.dispatchEvent(l0)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(c0)),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Qi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Qi.multiply(e.parent.matrixWorld)),e.applyMatrix4(Qi),this.add(e),e.updateWorldMatrix(!1,!0),this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,n=this.children.length;i<n;i++){let r=this.children[i].getObjectByProperty(e,t);if(r!==void 0)return r}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let n=this.children;for(let r=0,o=n.length;r<o;r++)n[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hr,e,o0),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Hr,s0,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,n=t.length;i<n;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,n=t.length;i<n;i++){let r=t[i];r.matrixWorldAutoUpdate!==!0&&e!==!0||r.updateMatrixWorld(e)}}updateWorldMatrix(e,t){let i=this.parent;if(e===!0&&i!==null&&i.matrixWorldAutoUpdate===!0&&i.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){let n=this.children;for(let r=0,o=n.length;r<o;r++){let s=n[r];s.matrixWorldAutoUpdate===!0&&s.updateWorldMatrix(!1,!0)}}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let n={};function r(s,l){return s[l.uuid]===void 0&&(s[l.uuid]=l.toJSON(e)),l.uuid}if(n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(n.type="BatchedMesh",n.perObjectFrustumCulled=this.perObjectFrustumCulled,n.sortObjects=this.sortObjects,n.drawRanges=this._drawRanges,n.reservedRanges=this._reservedRanges,n.visibility=this._visibility,n.active=this._active,n.bounds=this._bounds.map((s=>({boxInitialized:s.boxInitialized,boxMin:s.box.min.toArray(),boxMax:s.box.max.toArray(),sphereInitialized:s.sphereInitialized,sphereRadius:s.sphere.radius,sphereCenter:s.sphere.center.toArray()}))),n.maxGeometryCount=this._maxGeometryCount,n.maxVertexCount=this._maxVertexCount,n.maxIndexCount=this._maxIndexCount,n.geometryInitialized=this._geometryInitialized,n.geometryCount=this._geometryCount,n.matricesTexture=this._matricesTexture.toJSON(e),this.boundingSphere!==null&&(n.boundingSphere={center:n.boundingSphere.center.toArray(),radius:n.boundingSphere.radius}),this.boundingBox!==null&&(n.boundingBox={min:n.boundingBox.min.toArray(),max:n.boundingBox.max.toArray()})),this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=r(e.geometries,this.geometry);let s=this.geometry.parameters;if(s!==void 0&&s.shapes!==void 0){let l=s.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(e.shapes,u)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let s=[];for(let l=0,c=this.material.length;l<c;l++)s.push(r(e.materials,this.material[l]));n.material=s}else n.material=r(e.materials,this.material);if(this.children.length>0){n.children=[];for(let s=0;s<this.children.length;s++)n.children.push(this.children[s].toJSON(e).object)}if(this.animations.length>0){n.animations=[];for(let s=0;s<this.animations.length;s++){let l=this.animations[s];n.animations.push(r(e.animations,l))}}if(t){let s=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),u=o(e.shapes),d=o(e.skeletons),p=o(e.animations),m=o(e.nodes);s.length>0&&(i.geometries=s),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),u.length>0&&(i.shapes=u),d.length>0&&(i.skeletons=d),p.length>0&&(i.animations=p),m.length>0&&(i.nodes=m)}return i.object=n,i;function o(s){let l=[];for(let c in s){let h=s[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let n=e.children[i];this.add(n.clone())}return this}};gt.DEFAULT_UP=new A(0,1,0),gt.DEFAULT_MATRIX_AUTO_UPDATE=!0,gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Ii=new A,ea=new A,Vc=new A,ta=new A,Nn=new A,Dn=new A,Tp=new A,jc=new A,Wc=new A,qc=new A,hs=!1,Ka=class a{constructor(e=new A,t=new A,i=new A){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,n){n.subVectors(i,t),Ii.subVectors(e,t),n.cross(Ii);let r=n.lengthSq();return r>0?n.multiplyScalar(1/Math.sqrt(r)):n.set(0,0,0)}static getBarycoord(e,t,i,n,r){Ii.subVectors(n,t),ea.subVectors(i,t),Vc.subVectors(e,t);let o=Ii.dot(Ii),s=Ii.dot(ea),l=Ii.dot(Vc),c=ea.dot(ea),h=ea.dot(Vc),u=o*c-s*s;if(u===0)return r.set(0,0,0),null;let d=1/u,p=(c*l-s*h)*d,m=(o*h-s*l)*d;return r.set(1-p-m,m,p)}static containsPoint(e,t,i,n){return this.getBarycoord(e,t,i,n,ta)!==null&&ta.x>=0&&ta.y>=0&&ta.x+ta.y<=1}static getUV(e,t,i,n,r,o,s,l){return hs===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),hs=!0),this.getInterpolation(e,t,i,n,r,o,s,l)}static getInterpolation(e,t,i,n,r,o,s,l){return this.getBarycoord(e,t,i,n,ta)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ta.x),l.addScaledVector(o,ta.y),l.addScaledVector(s,ta.z),l)}static isFrontFacing(e,t,i,n){return Ii.subVectors(i,t),ea.subVectors(e,t),Ii.cross(ea).dot(n)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,n){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[n]),this}setFromAttributeAndIndices(e,t,i,n){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,n),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Ii.subVectors(this.c,this.b),ea.subVectors(this.a,this.b),.5*Ii.cross(ea).length()}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return a.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return a.getBarycoord(e,this.a,this.b,this.c,t)}getUV(e,t,i,n,r){return hs===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),hs=!0),a.getInterpolation(e,this.a,this.b,this.c,t,i,n,r)}getInterpolation(e,t,i,n,r){return a.getInterpolation(e,this.a,this.b,this.c,t,i,n,r)}containsPoint(e){return a.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return a.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,n=this.b,r=this.c,o,s;Nn.subVectors(n,i),Dn.subVectors(r,i),jc.subVectors(e,i);let l=Nn.dot(jc),c=Dn.dot(jc);if(l<=0&&c<=0)return t.copy(i);Wc.subVectors(e,n);let h=Nn.dot(Wc),u=Dn.dot(Wc);if(h>=0&&u<=h)return t.copy(n);let d=l*u-h*c;if(d<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector(Nn,o);qc.subVectors(e,r);let p=Nn.dot(qc),m=Dn.dot(qc);if(m>=0&&p<=m)return t.copy(r);let g=p*c-l*m;if(g<=0&&c>=0&&m<=0)return s=c/(c-m),t.copy(i).addScaledVector(Dn,s);let f=h*m-p*u;if(f<=0&&u-h>=0&&p-m>=0)return Tp.subVectors(r,n),s=(u-h)/(u-h+(p-m)),t.copy(n).addScaledVector(Tp,s);let x=1/(f+g+d);return o=g*x,s=d*x,t.copy(i).addScaledVector(Nn,o).addScaledVector(Dn,s)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},bm={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ga={h:0,s:0,l:0},us={h:0,s:0,l:0};function Xc(a,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?a+6*(e-a)*t:t<.5?e:t<2/3?a+6*(e-a)*(2/3-t):a}var xe=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let n=e;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(255&e)/255,et.toWorkingColorSpace(this,t),this}setRGB(e,t,i,n=et.workingColorSpace){return this.r=e,this.g=t,this.b=i,et.toWorkingColorSpace(this,n),this}setHSL(e,t,i,n=et.workingColorSpace){if(e=mh(e,1),t=Pt(t,0,1),i=Pt(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=Xc(o,r,e+1/3),this.g=Xc(o,r,e),this.b=Xc(o,r,e-1/3)}return et.toWorkingColorSpace(this,n),this}setStyle(e,t=xt){function i(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=n[1],s=n[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(s))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=n[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xt){let i=bm[e.toLowerCase()];return i!==void 0?this.setHex(i,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Xn(e.r),this.g=Xn(e.g),this.b=Xn(e.b),this}copyLinearToSRGB(e){return this.r=Dc(e.r),this.g=Dc(e.g),this.b=Dc(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xt){return et.fromWorkingColorSpace(kt.copy(this),e),65536*Math.round(Pt(255*kt.r,0,255))+256*Math.round(Pt(255*kt.g,0,255))+Math.round(Pt(255*kt.b,0,255))}getHexString(e=xt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=et.workingColorSpace){et.fromWorkingColorSpace(kt.copy(this),t);let i=kt.r,n=kt.g,r=kt.b,o=Math.max(i,n,r),s=Math.min(i,n,r),l,c,h=(s+o)/2;if(s===o)l=0,c=0;else{let u=o-s;switch(c=h<=.5?u/(o+s):u/(2-o-s),o){case i:l=(n-r)/u+(n<r?6:0);break;case n:l=(r-i)/u+2;break;case r:l=(i-n)/u+4}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=et.workingColorSpace){return et.fromWorkingColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=xt){et.fromWorkingColorSpace(kt.copy(this),e);let t=kt.r,i=kt.g,n=kt.b;return e!==xt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(255*t)},${Math.round(255*i)},${Math.round(255*n)})`}offsetHSL(e,t,i){return this.getHSL(ga),this.setHSL(ga.h+e,ga.s+t,ga.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ga),e.getHSL(us);let i=qr(ga.h,us.h,t),n=qr(ga.s,us.s,t),r=qr(ga.l,us.l,t);return this.setHSL(i,n,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,n=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*n,this.g=r[1]*t+r[4]*i+r[7]*n,this.b=r[2]*t+r[5]*i+r[8]*n,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},kt=new xe;xe.NAMES=bm;var h0=0,rn=class extends Ma{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:h0++}),this.uuid=cn(),this.name="",this.type="Material",this.blending=1,this.side=ba,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=lh,this.blendDst=ch,this.blendEquation=$a,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new xe(0,0,0),this.blendAlpha=0,this.depthFunc=3,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=519,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=An,this.stencilZFail=An,this.stencilZPass=An,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let n=this[t];n!==void 0?n&&n.isColor?n.set(i):n&&n.isVector3&&i&&i.isVector3?n.copy(i):this[t]=i:console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`)}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};function n(r){let o=[];for(let s in r){let l=r[s];delete l.metadata,o.push(l)}return o}if(i.uuid=this.uuid,i.type=this.type,this.name!==""&&(i.name=this.name),this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.shadowSide!==null&&(i.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),this.blending!==1&&(i.blending=this.blending),this.side!==ba&&(i.side=this.side),this.vertexColors===!0&&(i.vertexColors=!0),this.opacity<1&&(i.opacity=this.opacity),this.transparent===!0&&(i.transparent=!0),this.blendSrc!==lh&&(i.blendSrc=this.blendSrc),this.blendDst!==ch&&(i.blendDst=this.blendDst),this.blendEquation!==$a&&(i.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(i.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(i.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(i.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(i.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(i.blendAlpha=this.blendAlpha),this.depthFunc!==3&&(i.depthFunc=this.depthFunc),this.depthTest===!1&&(i.depthTest=this.depthTest),this.depthWrite===!1&&(i.depthWrite=this.depthWrite),this.colorWrite===!1&&(i.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(i.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==519&&(i.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(i.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(i.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==An&&(i.stencilFail=this.stencilFail),this.stencilZFail!==An&&(i.stencilZFail=this.stencilZFail),this.stencilZPass!==An&&(i.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(i.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(i.rotation=this.rotation),this.polygonOffset===!0&&(i.polygonOffset=!0),this.polygonOffsetFactor!==0&&(i.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(i.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(i.linewidth=this.linewidth),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.dithering===!0&&(i.dithering=!0),this.alphaTest>0&&(i.alphaTest=this.alphaTest),this.alphaHash===!0&&(i.alphaHash=!0),this.alphaToCoverage===!0&&(i.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(i.premultipliedAlpha=!0),this.forceSinglePass===!0&&(i.forceSinglePass=!0),this.wireframe===!0&&(i.wireframe=!0),this.wireframeLinewidth>1&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(i.flatShading=!0),this.visible===!1&&(i.visible=!1),this.toneMapped===!1&&(i.toneMapped=!1),this.fog===!1&&(i.fog=!1),Object.keys(this.userData).length>0&&(i.userData=this.userData),t){let r=n(e.textures),o=n(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let n=t.length;i=new Array(n);for(let r=0;r!==n;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}},Sa=class extends rn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new xe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=hm,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Hx=u0();function u0(){let a=new ArrayBuffer(4),e=new Float32Array(a),t=new Uint32Array(a),i=new Uint32Array(512),n=new Uint32Array(512);for(let l=0;l<256;++l){let c=l-127;c<-27?(i[l]=0,i[256|l]=32768,n[l]=24,n[256|l]=24):c<-14?(i[l]=1024>>-c-14,i[256|l]=1024>>-c-14|32768,n[l]=-c-1,n[256|l]=-c-1):c<=15?(i[l]=c+15<<10,i[256|l]=c+15<<10|32768,n[l]=13,n[256|l]=13):c<128?(i[l]=31744,i[256|l]=64512,n[l]=24,n[256|l]=24):(i[l]=31744,i[256|l]=64512,n[l]=13,n[256|l]=13)}let r=new Uint32Array(2048),o=new Uint32Array(64),s=new Uint32Array(64);for(let l=1;l<1024;++l){let c=l<<13,h=0;for(;(8388608&c)==0;)c<<=1,h-=8388608;c&=-8388609,h+=947912704,r[l]=c|h}for(let l=1024;l<2048;++l)r[l]=939524096+(l-1024<<13);for(let l=1;l<31;++l)o[l]=l<<23;o[31]=1199570944,o[32]=2147483648;for(let l=33;l<63;++l)o[l]=2147483648+(l-32<<23);o[63]=3347054592;for(let l=1;l<64;++l)l!==32&&(s[l]=1024);return{floatView:e,uint32View:t,baseTable:i,shiftTable:n,mantissaTable:r,exponentTable:o,offsetTable:s}}var Mt=new A,ds=new ce,$t=class{constructor(e,t,i=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=up,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=va,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}get updateRange(){return console.warn("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let n=0,r=this.itemSize;n<r;n++)this.array[e+n]=t.array[i+n];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)ds.fromBufferAttribute(this,t),ds.applyMatrix3(e),this.setXY(t,ds.x,ds.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix3(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyMatrix4(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.applyNormalMatrix(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Mt.fromBufferAttribute(this,t),Mt.transformDirection(e),this.setXYZ(t,Mt.x,Mt.y,Mt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=jn(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=Wt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=jn(t,this.array)),t}setX(e,t){return this.normalized&&(t=Wt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=jn(t,this.array)),t}setY(e,t){return this.normalized&&(t=Wt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=jn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=Wt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=jn(t,this.array)),t}setW(e,t){return this.normalized&&(t=Wt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=Wt(t,this.array),i=Wt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,n){return e*=this.itemSize,this.normalized&&(t=Wt(t,this.array),i=Wt(i,this.array),n=Wt(n,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this}setXYZW(e,t,i,n,r){return e*=this.itemSize,this.normalized&&(t=Wt(t,this.array),i=Wt(i,this.array),n=Wt(n,this.array),r=Wt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=n,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==up&&(e.usage=this.usage),e}};var Ws=class extends $t{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var qs=class extends $t{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var Pe=class extends $t{constructor(e,t,i){super(new Float32Array(e),t,i)}};var d0=0,fi=new Re,Yc=new gt,Un=new A,ni=new Ni,Gr=new Ni,Lt=new A,ct=class a extends Ma{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:d0++}),this.uuid=cn(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ym(e)?qs:Ws)(e,1):this.index=e,this}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Fe().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(e),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return fi.makeRotationFromQuaternion(e),this.applyMatrix4(fi),this}rotateX(e){return fi.makeRotationX(e),this.applyMatrix4(fi),this}rotateY(e){return fi.makeRotationY(e),this.applyMatrix4(fi),this}rotateZ(e){return fi.makeRotationZ(e),this.applyMatrix4(fi),this}translate(e,t,i){return fi.makeTranslation(e,t,i),this.applyMatrix4(fi),this}scale(e,t,i){return fi.makeScale(e,t,i),this.applyMatrix4(fi),this}lookAt(e){return Yc.lookAt(e),Yc.updateMatrix(),this.applyMatrix4(Yc.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Un).negate(),this.translate(Un.x,Un.y,Un.z),this}setFromPoints(e){let t=[];for(let i=0,n=e.length;i<n;i++){let r=e[i];t.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new Pe(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ni);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingBox.set(new A(-1/0,-1/0,-1/0),new A(1/0,1/0,1/0));if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,n=t.length;i<n;i++){let r=t[i];ni.setFromBufferAttribute(r),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,ni.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,ni.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(ni.min),this.boundingBox.expandByPoint(ni.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new si);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute)return console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),void this.boundingSphere.set(new A,1/0);if(e){let i=this.boundingSphere.center;if(ni.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let s=t[r];Gr.setFromBufferAttribute(s),this.morphTargetsRelative?(Lt.addVectors(ni.min,Gr.min),ni.expandByPoint(Lt),Lt.addVectors(ni.max,Gr.max),ni.expandByPoint(Lt)):(ni.expandByPoint(Gr.min),ni.expandByPoint(Gr.max))}ni.getCenter(i);let n=0;for(let r=0,o=e.count;r<o;r++)Lt.fromBufferAttribute(e,r),n=Math.max(n,i.distanceToSquared(Lt));if(t)for(let r=0,o=t.length;r<o;r++){let s=t[r],l=this.morphTargetsRelative;for(let c=0,h=s.count;c<h;c++)Lt.fromBufferAttribute(s,c),l&&(Un.fromBufferAttribute(e,c),Lt.add(Un)),n=Math.max(n,i.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0)return void console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");let i=e.array,n=t.position.array,r=t.normal.array,o=t.uv.array,s=n.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new $t(new Float32Array(4*s),4));let l=this.getAttribute("tangent").array,c=[],h=[];for(let B=0;B<s;B++)c[B]=new A,h[B]=new A;let u=new A,d=new A,p=new A,m=new ce,g=new ce,f=new ce,x=new A,_=new A;function v(B,$,R){u.fromArray(n,3*B),d.fromArray(n,3*$),p.fromArray(n,3*R),m.fromArray(o,2*B),g.fromArray(o,2*$),f.fromArray(o,2*R),d.sub(u),p.sub(u),g.sub(m),f.sub(m);let V=1/(g.x*f.y-f.x*g.y);isFinite(V)&&(x.copy(d).multiplyScalar(f.y).addScaledVector(p,-g.y).multiplyScalar(V),_.copy(p).multiplyScalar(g.x).addScaledVector(d,-f.x).multiplyScalar(V),c[B].add(x),c[$].add(x),c[R].add(x),h[B].add(_),h[$].add(_),h[R].add(_))}let y=this.groups;y.length===0&&(y=[{start:0,count:i.length}]);for(let B=0,$=y.length;B<$;++B){let R=y[B],V=R.start;for(let W=V,le=V+R.count;W<le;W+=3)v(i[W+0],i[W+1],i[W+2])}let C=new A,S=new A,w=new A,O=new A;function N(B){w.fromArray(r,3*B),O.copy(w);let $=c[B];C.copy($),C.sub(w.multiplyScalar(w.dot($))).normalize(),S.crossVectors(O,$);let R=S.dot(h[B])<0?-1:1;l[4*B]=C.x,l[4*B+1]=C.y,l[4*B+2]=C.z,l[4*B+3]=R}for(let B=0,$=y.length;B<$;++B){let R=y[B],V=R.start;for(let W=V,le=V+R.count;W<le;W+=3)N(i[W+0]),N(i[W+1]),N(i[W+2])}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0)i=new $t(new Float32Array(3*t.count),3),this.setAttribute("normal",i);else for(let d=0,p=i.count;d<p;d++)i.setXYZ(d,0,0,0);let n=new A,r=new A,o=new A,s=new A,l=new A,c=new A,h=new A,u=new A;if(e)for(let d=0,p=e.count;d<p;d+=3){let m=e.getX(d+0),g=e.getX(d+1),f=e.getX(d+2);n.fromBufferAttribute(t,m),r.fromBufferAttribute(t,g),o.fromBufferAttribute(t,f),h.subVectors(o,r),u.subVectors(n,r),h.cross(u),s.fromBufferAttribute(i,m),l.fromBufferAttribute(i,g),c.fromBufferAttribute(i,f),s.add(h),l.add(h),c.add(h),i.setXYZ(m,s.x,s.y,s.z),i.setXYZ(g,l.x,l.y,l.z),i.setXYZ(f,c.x,c.y,c.z)}else for(let d=0,p=t.count;d<p;d+=3)n.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),h.subVectors(o,r),u.subVectors(n,r),h.cross(u),i.setXYZ(d+0,h.x,h.y,h.z),i.setXYZ(d+1,h.x,h.y,h.z),i.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(s,l){let c=s.array,h=s.itemSize,u=s.normalized,d=new c.constructor(l.length*h),p=0,m=0;for(let g=0,f=l.length;g<f;g++){p=s.isInterleavedBufferAttribute?l[g]*s.data.stride+s.offset:l[g]*h;for(let x=0;x<h;x++)d[m++]=c[p++]}return new $t(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new a,i=this.index.array,n=this.attributes;for(let s in n){let l=e(n[s],i);t.setAttribute(s,l)}let r=this.morphAttributes;for(let s in r){let l=[],c=r[s];for(let h=0,u=c.length;h<u;h++){let d=e(c[h],i);l.push(d)}t.morphAttributes[s]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let s=0,l=o.length;s<l;s++){let c=o[s];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let n={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,d=c.length;u<d;u++){let p=c[u];h.push(p.toJSON(e.data))}h.length>0&&(n[l]=h,r=!0)}r&&(e.data.morphAttributes=n,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let s=this.boundingSphere;return s!==null&&(e.data.boundingSphere={center:s.center.toArray(),radius:s.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone(t));let n=e.attributes;for(let c in n){let h=n[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],u=r[c];for(let d=0,p=u.length;d<p;d++)h.push(u[d].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let u=o[c];this.addGroup(u.start,u.count,u.materialIndex)}let s=e.boundingBox;s!==null&&(this.boundingBox=s.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},wp=new Re,qa=new nn,ps=new si,Ep=new A,On=new A,Bn=new A,Fn=new A,$c=new A,ms=new A,fs=new ce,gs=new ce,_s=new ce,Ap=new A,Cp=new A,Rp=new A,vs=new A,xs=new A,ft=class extends gt{constructor(e=new ct,t=new Sa){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,t=Object.keys(e);if(t.length>0){let i=e[t[0]];if(i!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let n=0,r=i.length;n<r;n++){let o=i[n].name||String(n);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=n}}}}getVertexPosition(e,t){let i=this.geometry,n=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(n,e);let s=this.morphTargetInfluences;if(r&&s){ms.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=s[l],u=r[l];h!==0&&($c.fromBufferAttribute(u,e),o?ms.addScaledVector($c,h):ms.addScaledVector($c.sub(t),h))}t.add(ms)}return t}raycast(e,t){let i=this.geometry,n=this.material,r=this.matrixWorld;if(n!==void 0){if(i.boundingSphere===null&&i.computeBoundingSphere(),ps.copy(i.boundingSphere),ps.applyMatrix4(r),qa.copy(e.ray).recast(e.near),ps.containsPoint(qa.origin)===!1&&(qa.intersectSphere(ps,Ep)===null||qa.origin.distanceToSquared(Ep)>(e.far-e.near)**2))return;wp.copy(r).invert(),qa.copy(e.ray).applyMatrix4(wp),i.boundingBox!==null&&qa.intersectsBox(i.boundingBox)===!1||this._computeIntersections(e,t,qa)}}_computeIntersections(e,t,i){let n,r=this.geometry,o=this.material,s=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,p=r.drawRange;if(s!==null)if(Array.isArray(o))for(let m=0,g=d.length;m<g;m++){let f=d[m],x=o[f.materialIndex];for(let _=Math.max(f.start,p.start),v=Math.min(s.count,Math.min(f.start+f.count,p.start+p.count));_<v;_+=3)n=ys(this,x,e,i,c,h,u,s.getX(_),s.getX(_+1),s.getX(_+2)),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=f.materialIndex,t.push(n))}else for(let m=Math.max(0,p.start),g=Math.min(s.count,p.start+p.count);m<g;m+=3)n=ys(this,o,e,i,c,h,u,s.getX(m),s.getX(m+1),s.getX(m+2)),n&&(n.faceIndex=Math.floor(m/3),t.push(n));else if(l!==void 0)if(Array.isArray(o))for(let m=0,g=d.length;m<g;m++){let f=d[m],x=o[f.materialIndex];for(let _=Math.max(f.start,p.start),v=Math.min(l.count,Math.min(f.start+f.count,p.start+p.count));_<v;_+=3)n=ys(this,x,e,i,c,h,u,_,_+1,_+2),n&&(n.faceIndex=Math.floor(_/3),n.face.materialIndex=f.materialIndex,t.push(n))}else for(let m=Math.max(0,p.start),g=Math.min(l.count,p.start+p.count);m<g;m+=3)n=ys(this,o,e,i,c,h,u,m,m+1,m+2),n&&(n.faceIndex=Math.floor(m/3),t.push(n))}};function ys(a,e,t,i,n,r,o,s,l,c){a.getVertexPosition(s,On),a.getVertexPosition(l,Bn),a.getVertexPosition(c,Fn);let h=(function(u,d,p,m,g,f,x,_){let v;if(v=d.side===Ht?m.intersectTriangle(x,f,g,!0,_):m.intersectTriangle(g,f,x,d.side===ba,_),v===null)return null;xs.copy(_),xs.applyMatrix4(u.matrixWorld);let y=p.ray.origin.distanceTo(xs);return y<p.near||y>p.far?null:{distance:y,point:xs.clone(),object:u}})(a,e,t,i,On,Bn,Fn,vs);if(h){n&&(fs.fromBufferAttribute(n,s),gs.fromBufferAttribute(n,l),_s.fromBufferAttribute(n,c),h.uv=Ka.getInterpolation(vs,On,Bn,Fn,fs,gs,_s,new ce)),r&&(fs.fromBufferAttribute(r,s),gs.fromBufferAttribute(r,l),_s.fromBufferAttribute(r,c),h.uv1=Ka.getInterpolation(vs,On,Bn,Fn,fs,gs,_s,new ce),h.uv2=h.uv1),o&&(Ap.fromBufferAttribute(o,s),Cp.fromBufferAttribute(o,l),Rp.fromBufferAttribute(o,c),h.normal=Ka.getInterpolation(vs,On,Bn,Fn,Ap,Cp,Rp,new A),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:s,b:l,c,normal:new A,materialIndex:0};Ka.getNormal(On,Bn,Fn,u.normal),h.face=u}return h}var Ta=class a extends ct{constructor(e=1,t=1,i=1,n=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:n,heightSegments:r,depthSegments:o};let s=this;n=Math.floor(n),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],u=[],d=0,p=0;function m(g,f,x,_,v,y,C,S,w,O,N){let B=y/w,$=C/O,R=y/2,V=C/2,W=S/2,le=w+1,ge=O+1,ne=0,Z=0,ae=new A;for(let H=0;H<ge;H++){let Q=H*$-V;for(let de=0;de<le;de++){let T=de*B-R;ae[g]=T*_,ae[f]=Q*v,ae[x]=W,c.push(ae.x,ae.y,ae.z),ae[g]=0,ae[f]=0,ae[x]=S>0?1:-1,h.push(ae.x,ae.y,ae.z),u.push(de/w),u.push(1-H/O),ne+=1}}for(let H=0;H<O;H++)for(let Q=0;Q<w;Q++){let de=d+Q+le*H,T=d+Q+le*(H+1),M=d+(Q+1)+le*(H+1),F=d+(Q+1)+le*H;l.push(de,T,F),l.push(T,M,F),Z+=6}s.addGroup(p,Z,N),p+=Z,d+=ne}m("z","y","x",-1,-1,i,t,e,o,r,0),m("z","y","x",1,-1,i,t,-e,o,r,1),m("x","z","y",1,1,e,i,t,n,o,2),m("x","z","y",1,-1,e,i,-t,n,o,3),m("x","y","z",1,-1,e,t,i,n,r,4),m("x","y","z",-1,-1,e,t,-i,n,r,5),this.setIndex(l),this.setAttribute("position",new Pe(c,3)),this.setAttribute("normal",new Pe(h,3)),this.setAttribute("uv",new Pe(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function Qn(a){let e={};for(let t in a){e[t]={};for(let i in a[t]){let n=a[t][i];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=n.clone():Array.isArray(n)?e[t][i]=n.slice():e[t][i]=n}}return e}function qt(a){let e={};for(let t=0;t<a.length;t++){let i=Qn(a[t]);for(let n in i)e[n]=i[n]}return e}function Mm(a){return a.getRenderTarget()===null?a.outputColorSpace:et.workingColorSpace}var p0={clone:Qn,merge:qt},Di=class extends rn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,this.fragmentShader=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Qn(e.uniforms),this.uniformsGroups=(function(t){let i=[];for(let n=0;n<t.length;n++)i.push(t[n].clone());return i})(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let n in this.uniforms){let r=this.uniforms[n].value;r&&r.isTexture?t.uniforms[n]={type:"t",value:r.toJSON(e).uuid}:r&&r.isColor?t.uniforms[n]={type:"c",value:r.getHex()}:r&&r.isVector2?t.uniforms[n]={type:"v2",value:r.toArray()}:r&&r.isVector3?t.uniforms[n]={type:"v3",value:r.toArray()}:r&&r.isVector4?t.uniforms[n]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?t.uniforms[n]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?t.uniforms[n]={type:"m4",value:r.toArray()}:t.uniforms[n]={value:r}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let n in this.extensions)this.extensions[n]===!0&&(i[n]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}},io=class extends gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Re,this.projectionMatrix=new Re,this.projectionMatrixInverse=new Re,this.coordinateSystem=Kn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},Yt=class extends io{constructor(e=50,t=1,i=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=2*eo*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(.5*qn*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return 2*eo*Math.atan(Math.tan(.5*qn*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(e,t,i,n,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(.5*qn*this.fov)/this.zoom,i=2*t,n=this.aspect*i,r=-.5*n,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*n/l,t-=o.offsetY*i/c,n*=o.width/l,i*=o.height/c}let s=this.filmOffset;s!==0&&(r+=e*s/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+n,t,t-i,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},kn=-90,vh=class extends gt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let n=new Yt(kn,1,e,t);n.layers=this.layers,this.add(n);let r=new Yt(kn,1,e,t);r.layers=this.layers,this.add(r);let o=new Yt(kn,1,e,t);o.layers=this.layers,this.add(o);let s=new Yt(kn,1,e,t);s.layers=this.layers,this.add(s);let l=new Yt(kn,1,e,t);l.layers=this.layers,this.add(l);let c=new Yt(kn,1,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,n,r,o,s,l]=t;for(let c of t)this.remove(c);if(e===Kn)i.up.set(0,1,0),i.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),s.up.set(0,1,0),s.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else{if(e!==Bs)throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);i.up.set(0,-1,0),i.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),s.up.set(0,-1,0),s.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1)}for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:n}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,s,l,c,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),p=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let g=i.texture.generateMipmaps;i.texture.generateMipmaps=!1,e.setRenderTarget(i,0,n),e.render(t,r),e.setRenderTarget(i,1,n),e.render(t,o),e.setRenderTarget(i,2,n),e.render(t,s),e.setRenderTarget(i,3,n),e.render(t,l),e.setRenderTarget(i,4,n),e.render(t,c),i.texture.generateMipmaps=g,e.setRenderTarget(i,5,n),e.render(t,h),e.setRenderTarget(u,d,p),e.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},Xs=class extends oi{constructor(e,t,i,n,r,o,s,l,c,h){super(e=e!==void 0?e:[],t=t!==void 0?t:$n,i,n,r,o,s,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},xh=class extends oa{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},n=[i,i,i,i,i,i];t.encoding!==void 0&&(Xr("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===an?xt:Wi),this.texture=new Xs(n,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0&&t.generateMipmaps,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:ri}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new Ta(5,5,5),r=new Di({name:"CubemapFromEquirect",uniforms:Qn(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ht,blending:0});r.uniforms.tEquirect.value=t;let o=new ft(n,r),s=t.minFilter;return t.minFilter===Is&&(t.minFilter=ri),new vh(1,10,this).update(e,o),t.minFilter=s,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,i,n){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,n);e.setRenderTarget(r)}},Zc=new A,m0=new A,f0=new Fe,aa=class{constructor(e=new A(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,n){return this.normal.set(e,t,i),this.constant=n,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let n=Zc.subVectors(i,t).cross(m0.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let i=e.delta(Zc),n=this.normal.dot(i);if(n===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/n;return r<0||r>1?null:t.copy(e.start).addScaledVector(i,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||f0.getNormalMatrix(e),n=this.coplanarPoint(Zc).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-n.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Xa=new si,bs=new A,er=class{constructor(e=new aa,t=new aa,i=new aa,n=new aa,r=new aa,o=new aa){this.planes=[e,t,i,n,r,o]}set(e,t,i,n,r,o){let s=this.planes;return s[0].copy(e),s[1].copy(t),s[2].copy(i),s[3].copy(n),s[4].copy(r),s[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=2e3){let i=this.planes,n=e.elements,r=n[0],o=n[1],s=n[2],l=n[3],c=n[4],h=n[5],u=n[6],d=n[7],p=n[8],m=n[9],g=n[10],f=n[11],x=n[12],_=n[13],v=n[14],y=n[15];if(i[0].setComponents(l-r,d-c,f-p,y-x).normalize(),i[1].setComponents(l+r,d+c,f+p,y+x).normalize(),i[2].setComponents(l+o,d+h,f+m,y+_).normalize(),i[3].setComponents(l-o,d-h,f-m,y-_).normalize(),i[4].setComponents(l-s,d-u,f-g,y-v).normalize(),t===Kn)i[5].setComponents(l+s,d+u,f+g,y+v).normalize();else{if(t!==Bs)throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);i[5].setComponents(s,u,g,v).normalize()}return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Xa.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Xa.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Xa)}intersectsSprite(e){return Xa.center.set(0,0,0),Xa.radius=.7071067811865476,Xa.applyMatrix4(e.matrixWorld),this.intersectsSphere(Xa)}intersectsSphere(e){let t=this.planes,i=e.center,n=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<n)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let n=t[i];if(bs.x=n.normal.x>0?e.max.x:e.min.x,bs.y=n.normal.y>0?e.max.y:e.min.y,bs.z=n.normal.z>0?e.max.z:e.min.z,n.distanceToPoint(bs)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Sm(){let a=null,e=!1,t=null,i=null;function n(r,o){t(r,o),i=a.requestAnimationFrame(n)}return{start:function(){e!==!0&&t!==null&&(i=a.requestAnimationFrame(n),e=!0)},stop:function(){a.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){a=r}}}function g0(a,e){let t=e.isWebGL2,i=new WeakMap;return{get:function(n){return n.isInterleavedBufferAttribute&&(n=n.data),i.get(n)},remove:function(n){n.isInterleavedBufferAttribute&&(n=n.data);let r=i.get(n);r&&(a.deleteBuffer(r.buffer),i.delete(n))},update:function(n,r){if(n.isGLBufferAttribute){let s=i.get(n);return void((!s||s.version<n.version)&&i.set(n,{buffer:n.buffer,type:n.type,bytesPerElement:n.elementSize,version:n.version}))}n.isInterleavedBufferAttribute&&(n=n.data);let o=i.get(n);if(o===void 0)i.set(n,(function(s,l){let c=s.array,h=s.usage,u=c.byteLength,d=a.createBuffer(),p;if(a.bindBuffer(l,d),a.bufferData(l,c,h),s.onUploadCallback(),c instanceof Float32Array)p=a.FLOAT;else if(c instanceof Uint16Array)if(s.isFloat16BufferAttribute){if(!t)throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");p=a.HALF_FLOAT}else p=a.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=a.SHORT;else if(c instanceof Uint32Array)p=a.UNSIGNED_INT;else if(c instanceof Int32Array)p=a.INT;else if(c instanceof Int8Array)p=a.BYTE;else if(c instanceof Uint8Array)p=a.UNSIGNED_BYTE;else{if(!(c instanceof Uint8ClampedArray))throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);p=a.UNSIGNED_BYTE}return{buffer:d,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:s.version,size:u}})(n,r));else if(o.version<n.version){if(o.size!==n.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");(function(s,l,c){let h=l.array,u=l._updateRange,d=l.updateRanges;if(a.bindBuffer(c,s),u.count===-1&&d.length===0&&a.bufferSubData(c,0,h),d.length!==0){for(let p=0,m=d.length;p<m;p++){let g=d[p];t?a.bufferSubData(c,g.start*h.BYTES_PER_ELEMENT,h,g.start,g.count):a.bufferSubData(c,g.start*h.BYTES_PER_ELEMENT,h.subarray(g.start,g.start+g.count))}l.clearUpdateRanges()}u.count!==-1&&(t?a.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h,u.offset,u.count):a.bufferSubData(c,u.offset*h.BYTES_PER_ELEMENT,h.subarray(u.offset,u.offset+u.count)),u.count=-1),l.onUploadCallback()})(o.buffer,n,r),o.version=n.version}}}}var wa=class a extends ct{constructor(e=1,t=1,i=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:n};let r=e/2,o=t/2,s=Math.floor(i),l=Math.floor(n),c=s+1,h=l+1,u=e/s,d=t/l,p=[],m=[],g=[],f=[];for(let x=0;x<h;x++){let _=x*d-o;for(let v=0;v<c;v++){let y=v*u-r;m.push(y,-_,0),g.push(0,0,1),f.push(v/s),f.push(1-x/l)}}for(let x=0;x<l;x++)for(let _=0;_<s;_++){let v=_+c*x,y=_+c*(x+1),C=_+1+c*(x+1),S=_+1+c*x;p.push(v,y,S),p.push(y,C,S)}this.setIndex(p),this.setAttribute("position",new Pe(m,3)),this.setAttribute("normal",new Pe(g,3)),this.setAttribute("uv",new Pe(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.width,e.height,e.widthSegments,e.heightSegments)}},Ue={alphahash_fragment:`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,alphahash_pars_fragment:`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,alphamap_fragment:`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,alphamap_pars_fragment:`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,alphatest_fragment:`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,alphatest_pars_fragment:`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,aomap_fragment:`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,aomap_pars_fragment:`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,batching_pars_vertex:`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,batching_vertex:`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,begin_vertex:`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,beginnormal_vertex:`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,bsdfs:`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,iridescence_fragment:`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,bumpmap_pars_fragment:`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,clipping_planes_fragment:`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,clipping_planes_pars_fragment:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,clipping_planes_pars_vertex:`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,clipping_planes_vertex:`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,color_fragment:`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,color_pars_fragment:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,color_pars_vertex:`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,color_vertex:`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,common:`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,cube_uv_reflection_fragment:`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,defaultnormal_vertex:`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,displacementmap_pars_vertex:`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,displacementmap_vertex:`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,emissivemap_fragment:`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,emissivemap_pars_fragment:`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,colorspace_fragment:"gl_FragColor = linearToOutputTexel( gl_FragColor );",colorspace_pars_fragment:`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,envmap_fragment:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,envmap_common_pars_fragment:`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,envmap_pars_fragment:`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,envmap_pars_vertex:`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,envmap_physical_pars_fragment:`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,envmap_vertex:`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,fog_vertex:`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fog_pars_vertex:`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,fog_fragment:`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,fog_pars_fragment:`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gradientmap_pars_fragment:`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,lightmap_fragment:`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,lightmap_pars_fragment:`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,lights_lambert_fragment:`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,lights_lambert_pars_fragment:`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,lights_pars_begin:`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,lights_toon_fragment:`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,lights_toon_pars_fragment:`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,lights_phong_fragment:`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,lights_phong_pars_fragment:`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,lights_physical_fragment:`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,lights_physical_pars_fragment:`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,lights_fragment_begin:`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,lights_fragment_maps:`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,lights_fragment_end:`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,logdepthbuf_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,logdepthbuf_pars_fragment:`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,logdepthbuf_pars_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,logdepthbuf_vertex:`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,map_fragment:`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,map_pars_fragment:`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,map_particle_fragment:`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,map_particle_pars_fragment:`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,metalnessmap_fragment:`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,metalnessmap_pars_fragment:`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,morphcolor_vertex:`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,morphnormal_vertex:`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,morphtarget_pars_vertex:`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,morphtarget_vertex:`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,normal_fragment_begin:`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,normal_fragment_maps:`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,normal_pars_fragment:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_pars_vertex:`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,normal_vertex:`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,normalmap_pars_fragment:`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,clearcoat_normal_fragment_begin:`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,clearcoat_normal_fragment_maps:`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,clearcoat_pars_fragment:`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iridescence_pars_fragment:`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,opaque_fragment:`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,packing:`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,premultiplied_alpha_fragment:`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,project_vertex:`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,dithering_fragment:`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,dithering_pars_fragment:`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,roughnessmap_fragment:`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,roughnessmap_pars_fragment:`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,shadowmap_pars_fragment:`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,shadowmap_pars_vertex:`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,shadowmap_vertex:`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,shadowmask_pars_fragment:`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,skinbase_vertex:`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,skinning_pars_vertex:`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,skinning_vertex:`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,skinnormal_vertex:`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,specularmap_fragment:`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,specularmap_pars_fragment:`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,tonemapping_fragment:`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,tonemapping_pars_fragment:`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color *= toneMappingExposure;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	return color;
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,transmission_fragment:`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,transmission_pars_fragment:`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,uv_pars_fragment:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_pars_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,uv_vertex:`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,worldpos_vertex:`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,background_vert:`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,background_frag:`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,backgroundCube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,backgroundCube_frag:`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,cube_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cube_frag:`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,depth_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,depth_frag:`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,distanceRGBA_vert:`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,distanceRGBA_frag:`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,equirect_vert:`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,equirect_frag:`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,linedashed_vert:`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,linedashed_frag:`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,meshbasic_vert:`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,meshbasic_frag:`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshlambert_vert:`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshlambert_frag:`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshmatcap_vert:`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,meshmatcap_frag:`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshnormal_vert:`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,meshnormal_frag:`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,meshphong_vert:`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshphong_frag:`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshphysical_vert:`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,meshphysical_frag:`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,meshtoon_vert:`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,meshtoon_frag:`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,points_vert:`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,points_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,shadow_vert:`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,shadow_frag:`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,sprite_vert:`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,sprite_frag:`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`},ue={common:{diffuse:{value:new xe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Fe}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Fe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Fe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Fe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Fe},normalScale:{value:new ce(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Fe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Fe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Fe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Fe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new xe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new xe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0},uvTransform:{value:new Fe}},sprite:{diffuse:{value:new xe(16777215)},opacity:{value:1},center:{value:new ce(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Fe},alphaMap:{value:null},alphaMapTransform:{value:new Fe},alphaTest:{value:0}}},Vi={basic:{uniforms:qt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.fog]),vertexShader:Ue.meshbasic_vert,fragmentShader:Ue.meshbasic_frag},lambert:{uniforms:qt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new xe(0)}}]),vertexShader:Ue.meshlambert_vert,fragmentShader:Ue.meshlambert_frag},phong:{uniforms:qt([ue.common,ue.specularmap,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,ue.lights,{emissive:{value:new xe(0)},specular:{value:new xe(1118481)},shininess:{value:30}}]),vertexShader:Ue.meshphong_vert,fragmentShader:Ue.meshphong_frag},standard:{uniforms:qt([ue.common,ue.envmap,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.roughnessmap,ue.metalnessmap,ue.fog,ue.lights,{emissive:{value:new xe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ue.meshphysical_vert,fragmentShader:Ue.meshphysical_frag},toon:{uniforms:qt([ue.common,ue.aomap,ue.lightmap,ue.emissivemap,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.gradientmap,ue.fog,ue.lights,{emissive:{value:new xe(0)}}]),vertexShader:Ue.meshtoon_vert,fragmentShader:Ue.meshtoon_frag},matcap:{uniforms:qt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,ue.fog,{matcap:{value:null}}]),vertexShader:Ue.meshmatcap_vert,fragmentShader:Ue.meshmatcap_frag},points:{uniforms:qt([ue.points,ue.fog]),vertexShader:Ue.points_vert,fragmentShader:Ue.points_frag},dashed:{uniforms:qt([ue.common,ue.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ue.linedashed_vert,fragmentShader:Ue.linedashed_frag},depth:{uniforms:qt([ue.common,ue.displacementmap]),vertexShader:Ue.depth_vert,fragmentShader:Ue.depth_frag},normal:{uniforms:qt([ue.common,ue.bumpmap,ue.normalmap,ue.displacementmap,{opacity:{value:1}}]),vertexShader:Ue.meshnormal_vert,fragmentShader:Ue.meshnormal_frag},sprite:{uniforms:qt([ue.sprite,ue.fog]),vertexShader:Ue.sprite_vert,fragmentShader:Ue.sprite_frag},background:{uniforms:{uvTransform:{value:new Fe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ue.background_vert,fragmentShader:Ue.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:Ue.backgroundCube_vert,fragmentShader:Ue.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ue.cube_vert,fragmentShader:Ue.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ue.equirect_vert,fragmentShader:Ue.equirect_frag},distanceRGBA:{uniforms:qt([ue.common,ue.displacementmap,{referencePosition:{value:new A},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ue.distanceRGBA_vert,fragmentShader:Ue.distanceRGBA_frag},shadow:{uniforms:qt([ue.lights,ue.fog,{color:{value:new xe(0)},opacity:{value:1}}]),vertexShader:Ue.shadow_vert,fragmentShader:Ue.shadow_frag}};Vi.physical={uniforms:qt([Vi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Fe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Fe},clearcoatNormalScale:{value:new ce(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Fe},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Fe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Fe},sheen:{value:0},sheenColor:{value:new xe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Fe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Fe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Fe},transmissionSamplerSize:{value:new ce},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Fe},attenuationDistance:{value:0},attenuationColor:{value:new xe(0)},specularColor:{value:new xe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Fe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Fe},anisotropyVector:{value:new ce},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Fe}}]),vertexShader:Ue.meshphysical_vert,fragmentShader:Ue.meshphysical_frag};var Ms={r:0,b:0,g:0};function _0(a,e,t,i,n,r,o){let s=new xe(0),l,c,h=r===!0?0:1,u=null,d=0,p=null;function m(g,f){g.getRGB(Ms,Mm(a)),i.buffers.color.setClear(Ms.r,Ms.g,Ms.b,f,o)}return{getClearColor:function(){return s},setClearColor:function(g,f=1){s.set(g),h=f,m(s,h)},getClearAlpha:function(){return h},setClearAlpha:function(g){h=g,m(s,h)},render:function(g,f){let x=!1,_=f.isScene===!0?f.background:null;_&&_.isTexture&&(_=(f.backgroundBlurriness>0?t:e).get(_)),_===null?m(s,h):_&&_.isColor&&(m(_,1),x=!0);let v=a.xr.getEnvironmentBlendMode();v==="additive"?i.buffers.color.setClear(0,0,0,1,o):v==="alpha-blend"&&i.buffers.color.setClear(0,0,0,0,o),(a.autoClear||x)&&a.clear(a.autoClearColor,a.autoClearDepth,a.autoClearStencil),_&&(_.isCubeTexture||_.mapping===dl)?(c===void 0&&(c=new ft(new Ta(1,1,1),new Di({name:"BackgroundCubeMaterial",uniforms:Qn(Vi.backgroundCube.uniforms),vertexShader:Vi.backgroundCube.vertexShader,fragmentShader:Vi.backgroundCube.fragmentShader,side:Ht,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(y,C,S){this.matrixWorld.copyPosition(S.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(c)),c.material.uniforms.envMap.value=_,c.material.uniforms.flipEnvMap.value=_.isCubeTexture&&_.isRenderTargetTexture===!1?-1:1,c.material.uniforms.backgroundBlurriness.value=f.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,c.material.toneMapped=et.getTransfer(_.colorSpace)!==rt,u===_&&d===_.version&&p===a.toneMapping||(c.material.needsUpdate=!0,u=_,d=_.version,p=a.toneMapping),c.layers.enableAll(),g.unshift(c,c.geometry,c.material,0,0,null)):_&&_.isTexture&&(l===void 0&&(l=new ft(new wa(2,2),new Di({name:"BackgroundMaterial",uniforms:Qn(Vi.background.uniforms),vertexShader:Vi.background.vertexShader,fragmentShader:Vi.background.fragmentShader,side:ba,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(l)),l.material.uniforms.t2D.value=_,l.material.uniforms.backgroundIntensity.value=f.backgroundIntensity,l.material.toneMapped=et.getTransfer(_.colorSpace)!==rt,_.matrixAutoUpdate===!0&&_.updateMatrix(),l.material.uniforms.uvTransform.value.copy(_.matrix),u===_&&d===_.version&&p===a.toneMapping||(l.material.needsUpdate=!0,u=_,d=_.version,p=a.toneMapping),l.layers.enableAll(),g.unshift(l,l.geometry,l.material,0,0,null))}}}function v0(a,e,t,i){let n=a.getParameter(a.MAX_VERTEX_ATTRIBS),r=i.isWebGL2?null:e.get("OES_vertex_array_object"),o=i.isWebGL2||r!==null,s={},l=p(null),c=l,h=!1;function u(C){return i.isWebGL2?a.bindVertexArray(C):r.bindVertexArrayOES(C)}function d(C){return i.isWebGL2?a.deleteVertexArray(C):r.deleteVertexArrayOES(C)}function p(C){let S=[],w=[],O=[];for(let N=0;N<n;N++)S[N]=0,w[N]=0,O[N]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:S,enabledAttributes:w,attributeDivisors:O,object:C,attributes:{},index:null}}function m(){let C=c.newAttributes;for(let S=0,w=C.length;S<w;S++)C[S]=0}function g(C){f(C,0)}function f(C,S){let w=c.newAttributes,O=c.enabledAttributes,N=c.attributeDivisors;w[C]=1,O[C]===0&&(a.enableVertexAttribArray(C),O[C]=1),N[C]!==S&&((i.isWebGL2?a:e.get("ANGLE_instanced_arrays"))[i.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](C,S),N[C]=S)}function x(){let C=c.newAttributes,S=c.enabledAttributes;for(let w=0,O=S.length;w<O;w++)S[w]!==C[w]&&(a.disableVertexAttribArray(w),S[w]=0)}function _(C,S,w,O,N,B,$){$===!0?a.vertexAttribIPointer(C,S,w,N,B):a.vertexAttribPointer(C,S,w,O,N,B)}function v(){y(),h=!0,c!==l&&(c=l,u(c.object))}function y(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:function(C,S,w,O,N){let B=!1;if(o){let $=(function(R,V,W){let le=W.wireframe===!0,ge=s[R.id];ge===void 0&&(ge={},s[R.id]=ge);let ne=ge[V.id];ne===void 0&&(ne={},ge[V.id]=ne);let Z=ne[le];return Z===void 0&&(Z=p(i.isWebGL2?a.createVertexArray():r.createVertexArrayOES()),ne[le]=Z),Z})(O,w,S);c!==$&&(c=$,u(c.object)),B=(function(R,V,W,le){let ge=c.attributes,ne=V.attributes,Z=0,ae=W.getAttributes();for(let H in ae)if(ae[H].location>=0){let Q=ge[H],de=ne[H];if(de===void 0&&(H==="instanceMatrix"&&R.instanceMatrix&&(de=R.instanceMatrix),H==="instanceColor"&&R.instanceColor&&(de=R.instanceColor)),Q===void 0||Q.attribute!==de||de&&Q.data!==de.data)return!0;Z++}return c.attributesNum!==Z||c.index!==le})(C,O,w,N),B&&(function(R,V,W,le){let ge={},ne=V.attributes,Z=0,ae=W.getAttributes();for(let H in ae)if(ae[H].location>=0){let Q=ne[H];Q===void 0&&(H==="instanceMatrix"&&R.instanceMatrix&&(Q=R.instanceMatrix),H==="instanceColor"&&R.instanceColor&&(Q=R.instanceColor));let de={};de.attribute=Q,Q&&Q.data&&(de.data=Q.data),ge[H]=de,Z++}c.attributes=ge,c.attributesNum=Z,c.index=le})(C,O,w,N)}else{let $=S.wireframe===!0;c.geometry===O.id&&c.program===w.id&&c.wireframe===$||(c.geometry=O.id,c.program=w.id,c.wireframe=$,B=!0)}N!==null&&t.update(N,a.ELEMENT_ARRAY_BUFFER),(B||h)&&(h=!1,(function($,R,V,W){if(i.isWebGL2===!1&&($.isInstancedMesh||W.isInstancedBufferGeometry)&&e.get("ANGLE_instanced_arrays")===null)return;m();let le=W.attributes,ge=V.getAttributes(),ne=R.defaultAttributeValues;for(let Z in ge){let ae=ge[Z];if(ae.location>=0){let H=le[Z];if(H===void 0&&(Z==="instanceMatrix"&&$.instanceMatrix&&(H=$.instanceMatrix),Z==="instanceColor"&&$.instanceColor&&(H=$.instanceColor)),H!==void 0){let Q=H.normalized,de=H.itemSize,T=t.get(H);if(T===void 0)continue;let M=T.buffer,F=T.type,J=T.bytesPerElement,z=i.isWebGL2===!0&&(F===a.INT||F===a.UNSIGNED_INT||H.gpuType===dm);if(H.isInterleavedBufferAttribute){let Y=H.data,D=Y.stride,U=H.offset;if(Y.isInstancedInterleavedBuffer){for(let k=0;k<ae.locationSize;k++)f(ae.location+k,Y.meshPerAttribute);$.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=Y.meshPerAttribute*Y.count)}else for(let k=0;k<ae.locationSize;k++)g(ae.location+k);a.bindBuffer(a.ARRAY_BUFFER,M);for(let k=0;k<ae.locationSize;k++)_(ae.location+k,de/ae.locationSize,F,Q,D*J,(U+de/ae.locationSize*k)*J,z)}else{if(H.isInstancedBufferAttribute){for(let Y=0;Y<ae.locationSize;Y++)f(ae.location+Y,H.meshPerAttribute);$.isInstancedMesh!==!0&&W._maxInstanceCount===void 0&&(W._maxInstanceCount=H.meshPerAttribute*H.count)}else for(let Y=0;Y<ae.locationSize;Y++)g(ae.location+Y);a.bindBuffer(a.ARRAY_BUFFER,M);for(let Y=0;Y<ae.locationSize;Y++)_(ae.location+Y,de/ae.locationSize,F,Q,de*J,de/ae.locationSize*Y*J,z)}}else if(ne!==void 0){let Q=ne[Z];if(Q!==void 0)switch(Q.length){case 2:a.vertexAttrib2fv(ae.location,Q);break;case 3:a.vertexAttrib3fv(ae.location,Q);break;case 4:a.vertexAttrib4fv(ae.location,Q);break;default:a.vertexAttrib1fv(ae.location,Q)}}}}x()})(C,S,w,O),N!==null&&a.bindBuffer(a.ELEMENT_ARRAY_BUFFER,t.get(N).buffer))},reset:v,resetDefaultState:y,dispose:function(){v();for(let C in s){let S=s[C];for(let w in S){let O=S[w];for(let N in O)d(O[N].object),delete O[N];delete S[w]}delete s[C]}},releaseStatesOfGeometry:function(C){if(s[C.id]===void 0)return;let S=s[C.id];for(let w in S){let O=S[w];for(let N in O)d(O[N].object),delete O[N];delete S[w]}delete s[C.id]},releaseStatesOfProgram:function(C){for(let S in s){let w=s[S];if(w[C.id]===void 0)continue;let O=w[C.id];for(let N in O)d(O[N].object),delete O[N];delete w[C.id]}},initAttributes:m,enableAttribute:g,disableUnusedAttributes:x}}function x0(a,e,t,i){let n=i.isWebGL2,r;this.setMode=function(o){r=o},this.render=function(o,s){a.drawArrays(r,o,s),t.update(s,r,1)},this.renderInstances=function(o,s,l){if(l===0)return;let c,h;if(n)c=a,h="drawArraysInstanced";else if(c=e.get("ANGLE_instanced_arrays"),h="drawArraysInstancedANGLE",c===null)return void console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");c[h](r,o,s,l),t.update(s,r,l)},this.renderMultiDraw=function(o,s,l){if(l===0)return;let c=e.get("WEBGL_multi_draw");if(c===null)for(let h=0;h<l;h++)this.render(o[h],s[h]);else{c.multiDrawArraysWEBGL(r,o,0,s,0,l);let h=0;for(let u=0;u<l;u++)h+=s[u];t.update(h,r,1)}}}function y0(a,e,t){let i;function n(y){if(y==="highp"){if(a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.HIGH_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.HIGH_FLOAT).precision>0)return"highp";y="mediump"}return y==="mediump"&&a.getShaderPrecisionFormat(a.VERTEX_SHADER,a.MEDIUM_FLOAT).precision>0&&a.getShaderPrecisionFormat(a.FRAGMENT_SHADER,a.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let r=typeof WebGL2RenderingContext<"u"&&a.constructor.name==="WebGL2RenderingContext",o=t.precision!==void 0?t.precision:"highp",s=n(o);s!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",s,"instead."),o=s);let l=r||e.has("WEBGL_draw_buffers"),c=t.logarithmicDepthBuffer===!0,h=a.getParameter(a.MAX_TEXTURE_IMAGE_UNITS),u=a.getParameter(a.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=a.getParameter(a.MAX_TEXTURE_SIZE),p=a.getParameter(a.MAX_CUBE_MAP_TEXTURE_SIZE),m=a.getParameter(a.MAX_VERTEX_ATTRIBS),g=a.getParameter(a.MAX_VERTEX_UNIFORM_VECTORS),f=a.getParameter(a.MAX_VARYING_VECTORS),x=a.getParameter(a.MAX_FRAGMENT_UNIFORM_VECTORS),_=u>0,v=r||e.has("OES_texture_float");return{isWebGL2:r,drawBuffers:l,getMaxAnisotropy:function(){if(i!==void 0)return i;if(e.has("EXT_texture_filter_anisotropic")===!0){let y=e.get("EXT_texture_filter_anisotropic");i=a.getParameter(y.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else i=0;return i},getMaxPrecision:n,precision:o,logarithmicDepthBuffer:c,maxTextures:h,maxVertexTextures:u,maxTextureSize:d,maxCubemapSize:p,maxAttributes:m,maxVertexUniforms:g,maxVaryings:f,maxFragmentUniforms:x,vertexTextures:_,floatFragmentTextures:v,floatVertexTextures:_&&v,maxSamples:r?a.getParameter(a.MAX_SAMPLES):0}}function b0(a){let e=this,t=null,i=0,n=!1,r=!1,o=new aa,s=new Fe,l={value:null,needsUpdate:!1};function c(h,u,d,p){let m=h!==null?h.length:0,g=null;if(m!==0){if(g=l.value,p!==!0||g===null){let f=d+4*m,x=u.matrixWorldInverse;s.getNormalMatrix(x),(g===null||g.length<f)&&(g=new Float32Array(f));for(let _=0,v=d;_!==m;++_,v+=4)o.copy(h[_]).applyMatrix4(x,s),o.normal.toArray(g,v),g[v+3]=o.constant}l.value=g,l.needsUpdate=!0}return e.numPlanes=m,e.numIntersection=0,g}this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(h,u){let d=h.length!==0||u||i!==0||n;return n=u,i=h.length,d},this.beginShadows=function(){r=!0,c(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(h,u){t=c(h,u,0)},this.setState=function(h,u,d){let p=h.clippingPlanes,m=h.clipIntersection,g=h.clipShadows,f=a.get(h);if(!n||p===null||p.length===0||r&&!g)r?c(null):(function(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0})();else{let x=r?0:i,_=4*x,v=f.clippingState||null;l.value=v,v=c(p,u,_,d);for(let y=0;y!==_;++y)v[y]=t[y];f.clippingState=v,this.numIntersection=m?this.numPlanes:0,this.numPlanes+=x}}}function M0(a){let e=new WeakMap;function t(n,r){return r===hh?n.mapping=$n:r===uh&&(n.mapping=Zn),n}function i(n){let r=n.target;r.removeEventListener("dispose",i);let o=e.get(r);o!==void 0&&(e.delete(r),o.dispose())}return{get:function(n){if(n&&n.isTexture){let r=n.mapping;if(r===hh||r===uh){if(e.has(n))return t(e.get(n).texture,n.mapping);{let o=n.image;if(o&&o.height>0){let s=new xh(o.height/2);return s.fromEquirectangularTexture(a,n),e.set(n,s),n.addEventListener("dispose",i),t(s.texture,n.mapping)}return null}}}return n},dispose:function(){e=new WeakMap}}}var Ys=class extends io{constructor(e=-1,t=1,i=1,n=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=n,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,n,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=n,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,n=(this.top+this.bottom)/2,r=i-e,o=i+e,s=n+t,l=n-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,s-=h*this.view.offsetY,l=s-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,s,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Lp=[.125,.215,.35,.446,.526,.582],Vr=20,Jc=new Ys,Pp=new xe,Kc=null,Qc=0,eh=0,Ya=(1+Math.sqrt(5))/2,Hn=1/Ya,Ip=[new A(1,1,1),new A(-1,1,1),new A(1,1,-1),new A(-1,1,-1),new A(0,Ya,Hn),new A(0,Ya,-Hn),new A(Hn,0,Ya),new A(-Hn,0,Ya),new A(Ya,Hn,0),new A(-Ya,Hn,0)],$s=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,i=.1,n=100){Kc=this._renderer.getRenderTarget(),Qc=this._renderer.getActiveCubeFace(),eh=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,i,n,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Dp(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Np(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(Kc,Qc,eh),e.scissorTest=!1,Ss(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===$n||e.mapping===Zn?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Kc=this._renderer.getRenderTarget(),Qc=this._renderer.getActiveCubeFace(),eh=this._renderer.getActiveMipmapLevel();let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:ri,minFilter:ri,generateMipmaps:!1,type:Qr,format:ji,colorSpace:ra,depthBuffer:!1},n=zp(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=zp(e,t,i);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=(function(o){let s=[],l=[],c=[],h=o,u=o-4+1+Lp.length;for(let d=0;d<u;d++){let p=Math.pow(2,h);l.push(p);let m=1/p;d>o-4?m=Lp[d-o+4-1]:d===0&&(m=0),c.push(m);let g=1/(p-2),f=-g,x=1+g,_=[f,f,x,f,x,x,f,f,x,x,f,x],v=6,y=6,C=3,S=2,w=1,O=new Float32Array(C*y*v),N=new Float32Array(S*y*v),B=new Float32Array(w*y*v);for(let R=0;R<v;R++){let V=R%3*2/3-1,W=R>2?0:-1,le=[V,W,0,V+2/3,W,0,V+2/3,W+1,0,V,W,0,V+2/3,W+1,0,V,W+1,0];O.set(le,C*y*R),N.set(_,S*y*R);let ge=[R,R,R,R,R,R];B.set(ge,w*y*R)}let $=new ct;$.setAttribute("position",new $t(O,C)),$.setAttribute("uv",new $t(N,S)),$.setAttribute("faceIndex",new $t(B,w)),s.push($),h>4&&h--}return{lodPlanes:s,sizeLods:l,sigmas:c}})(r)),this._blurMaterial=(function(o,s,l){let c=new Float32Array(Vr),h=new A(0,1,0);return new Di({name:"SphericalGaussianBlur",defines:{n:Vr,CUBEUV_TEXEL_WIDTH:1/s,CUBEUV_TEXEL_HEIGHT:1/l,CUBEUV_MAX_MIP:`${o}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:c},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:h}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:0,depthTest:!1,depthWrite:!1})})(r,e,t)}return n}_compileMaterial(e){let t=new ft(this._lodPlanes[0],e);this._renderer.compile(t,Jc)}_sceneToCubeUV(e,t,i,n){let r=new Yt(90,1,t,i),o=[1,-1,1,1,1,1],s=[1,1,1,-1,-1,-1],l=this._renderer,c=l.autoClear,h=l.toneMapping;l.getClearColor(Pp),l.toneMapping=xa,l.autoClear=!1;let u=new Sa({name:"PMREM.Background",side:Ht,depthWrite:!1,depthTest:!1}),d=new ft(new Ta,u),p=!1,m=e.background;m?m.isColor&&(u.color.copy(m),e.background=null,p=!0):(u.color.copy(Pp),p=!0);for(let g=0;g<6;g++){let f=g%3;f===0?(r.up.set(0,o[g],0),r.lookAt(s[g],0,0)):f===1?(r.up.set(0,0,o[g]),r.lookAt(0,s[g],0)):(r.up.set(0,o[g],0),r.lookAt(0,0,s[g]));let x=this._cubeSize;Ss(n,f*x,g>2?x:0,x,x),l.setRenderTarget(n),p&&l.render(d,r),l.render(e,r)}d.geometry.dispose(),d.material.dispose(),l.toneMapping=h,l.autoClear=c,e.background=m}_textureToCubeUV(e,t){let i=this._renderer,n=e.mapping===$n||e.mapping===Zn;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=Dp()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Np());let r=n?this._cubemapMaterial:this._equirectMaterial,o=new ft(this._lodPlanes[0],r);r.uniforms.envMap.value=e;let s=this._cubeSize;Ss(t,0,0,3*s,2*s),i.setRenderTarget(t),i.render(o,Jc)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;for(let n=1;n<this._lodPlanes.length;n++){let r=Math.sqrt(this._sigmas[n]*this._sigmas[n]-this._sigmas[n-1]*this._sigmas[n-1]),o=Ip[(n-1)%Ip.length];this._blur(e,n-1,n,r,o)}t.autoClear=i}_blur(e,t,i,n,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,i,n,"latitudinal",r),this._halfBlur(o,e,i,i,n,"longitudinal",r)}_halfBlur(e,t,i,n,r,o,s){let l=this._renderer,c=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=new ft(this._lodPlanes[n],c),u=c.uniforms,d=this._sizeLods[i]-1,p=isFinite(r)?Math.PI/(2*d):2*Math.PI/39,m=r/p,g=isFinite(r)?1+Math.floor(3*m):Vr;g>Vr&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${g} samples when the maximum is set to 20`);let f=[],x=0;for(let y=0;y<Vr;++y){let C=y/m,S=Math.exp(-C*C/2);f.push(S),y===0?x+=S:y<g&&(x+=2*S)}for(let y=0;y<f.length;y++)f[y]=f[y]/x;u.envMap.value=e.texture,u.samples.value=g,u.weights.value=f,u.latitudinal.value=o==="latitudinal",s&&(u.poleAxis.value=s);let{_lodMax:_}=this;u.dTheta.value=p,u.mipInt.value=_-i;let v=this._sizeLods[n];Ss(t,3*v*(n>_-4?n-_+4:0),4*(this._cubeSize-v),3*v,2*v),l.setRenderTarget(t),l.render(h,Jc)}};function zp(a,e,t){let i=new oa(a,e,t);return i.texture.mapping=dl,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ss(a,e,t,i,n){a.viewport.set(e,t,i,n),a.scissor.set(e,t,i,n)}function Np(){return new Di({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function Dp(){return new Di({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:du(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:0,depthTest:!1,depthWrite:!1})}function du(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function S0(a){let e=new WeakMap,t=null;function i(n){let r=n.target;r.removeEventListener("dispose",i);let o=e.get(r);o!==void 0&&(e.delete(r),o.dispose())}return{get:function(n){if(n&&n.isTexture){let r=n.mapping,o=r===hh||r===uh,s=r===$n||r===Zn;if(o||s){if(n.isRenderTargetTexture&&n.needsPMREMUpdate===!0){n.needsPMREMUpdate=!1;let l=e.get(n);return t===null&&(t=new $s(a)),l=o?t.fromEquirectangular(n,l):t.fromCubemap(n,l),e.set(n,l),l.texture}if(e.has(n))return e.get(n).texture;{let l=n.image;if(o&&l&&l.height>0||s&&l&&(function(c){let h=0,u=6;for(let d=0;d<u;d++)c[d]!==void 0&&h++;return h===u})(l)){t===null&&(t=new $s(a));let c=o?t.fromEquirectangular(n):t.fromCubemap(n);return e.set(n,c),n.addEventListener("dispose",i),c.texture}return null}}}return n},dispose:function(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}}}function T0(a){let e={};function t(i){if(e[i]!==void 0)return e[i];let n;switch(i){case"WEBGL_depth_texture":n=a.getExtension("WEBGL_depth_texture")||a.getExtension("MOZ_WEBGL_depth_texture")||a.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=a.getExtension("EXT_texture_filter_anisotropic")||a.getExtension("MOZ_EXT_texture_filter_anisotropic")||a.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=a.getExtension("WEBGL_compressed_texture_s3tc")||a.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=a.getExtension("WEBGL_compressed_texture_pvrtc")||a.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=a.getExtension(i)}return e[i]=n,n}return{has:function(i){return t(i)!==null},init:function(i){i.isWebGL2?(t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance")):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(i){let n=t(i);return n===null&&console.warn("THREE.WebGLRenderer: "+i+" extension not supported."),n}}}function w0(a,e,t,i){let n={},r=new WeakMap;function o(l){let c=l.target;c.index!==null&&e.remove(c.index);for(let u in c.attributes)e.remove(c.attributes[u]);for(let u in c.morphAttributes){let d=c.morphAttributes[u];for(let p=0,m=d.length;p<m;p++)e.remove(d[p])}c.removeEventListener("dispose",o),delete n[c.id];let h=r.get(c);h&&(e.remove(h),r.delete(c)),i.releaseStatesOfGeometry(c),c.isInstancedBufferGeometry===!0&&delete c._maxInstanceCount,t.memory.geometries--}function s(l){let c=[],h=l.index,u=l.attributes.position,d=0;if(h!==null){let g=h.array;d=h.version;for(let f=0,x=g.length;f<x;f+=3){let _=g[f+0],v=g[f+1],y=g[f+2];c.push(_,v,v,y,y,_)}}else{if(u===void 0)return;{let g=u.array;d=u.version;for(let f=0,x=g.length/3-1;f<x;f+=3){let _=f+0,v=f+1,y=f+2;c.push(_,v,v,y,y,_)}}}let p=new(ym(c)?qs:Ws)(c,1);p.version=d;let m=r.get(l);m&&e.remove(m),r.set(l,p)}return{get:function(l,c){return n[c.id]===!0||(c.addEventListener("dispose",o),n[c.id]=!0,t.memory.geometries++),c},update:function(l){let c=l.attributes;for(let u in c)e.update(c[u],a.ARRAY_BUFFER);let h=l.morphAttributes;for(let u in h){let d=h[u];for(let p=0,m=d.length;p<m;p++)e.update(d[p],a.ARRAY_BUFFER)}},getWireframeAttribute:function(l){let c=r.get(l);if(c){let h=l.index;h!==null&&c.version<h.version&&s(l)}else s(l);return r.get(l)}}}function E0(a,e,t,i){let n=i.isWebGL2,r,o,s;this.setMode=function(l){r=l},this.setIndex=function(l){o=l.type,s=l.bytesPerElement},this.render=function(l,c){a.drawElements(r,c,o,l*s),t.update(c,r,1)},this.renderInstances=function(l,c,h){if(h===0)return;let u,d;if(n)u=a,d="drawElementsInstanced";else if(u=e.get("ANGLE_instanced_arrays"),d="drawElementsInstancedANGLE",u===null)return void console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");u[d](r,c,o,l*s,h),t.update(c,r,h)},this.renderMultiDraw=function(l,c,h){if(h===0)return;let u=e.get("WEBGL_multi_draw");if(u===null)for(let d=0;d<h;d++)this.render(l[d]/s,c[d]);else{u.multiDrawElementsWEBGL(r,c,0,o,l,0,h);let d=0;for(let p=0;p<h;p++)d+=c[p];t.update(d,r,1)}}}function A0(a){let e={frame:0,calls:0,triangles:0,points:0,lines:0};return{memory:{geometries:0,textures:0},render:e,programs:null,autoReset:!0,reset:function(){e.calls=0,e.triangles=0,e.points=0,e.lines=0},update:function(t,i,n){switch(e.calls++,i){case a.TRIANGLES:e.triangles+=n*(t/3);break;case a.LINES:e.lines+=n*(t/2);break;case a.LINE_STRIP:e.lines+=n*(t-1);break;case a.LINE_LOOP:e.lines+=n*t;break;case a.POINTS:e.points+=n*t;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",i)}}}}function C0(a,e){return a[0]-e[0]}function R0(a,e){return Math.abs(e[1])-Math.abs(a[1])}function L0(a,e,t){let i={},n=new Float32Array(8),r=new WeakMap,o=new St,s=[];for(let l=0;l<8;l++)s[l]=[l,0];return{update:function(l,c,h){let u=l.morphTargetInfluences;if(e.isWebGL2===!0){let d=c.morphAttributes.position||c.morphAttributes.normal||c.morphAttributes.color,p=d!==void 0?d.length:0,m=r.get(c);if(m===void 0||m.count!==p){let V=function(){$.dispose(),r.delete(c),c.removeEventListener("dispose",V)};m!==void 0&&m.texture.dispose();let x=c.morphAttributes.position!==void 0,_=c.morphAttributes.normal!==void 0,v=c.morphAttributes.color!==void 0,y=c.morphAttributes.position||[],C=c.morphAttributes.normal||[],S=c.morphAttributes.color||[],w=0;x===!0&&(w=1),_===!0&&(w=2),v===!0&&(w=3);let O=c.attributes.position.count*w,N=1;O>e.maxTextureSize&&(N=Math.ceil(O/e.maxTextureSize),O=e.maxTextureSize);let B=new Float32Array(O*N*4*p),$=new Vs(B,O,N,p);$.type=va,$.needsUpdate=!0;let R=4*w;for(let W=0;W<p;W++){let le=y[W],ge=C[W],ne=S[W],Z=O*N*4*W;for(let ae=0;ae<le.count;ae++){let H=ae*R;x===!0&&(o.fromBufferAttribute(le,ae),B[Z+H+0]=o.x,B[Z+H+1]=o.y,B[Z+H+2]=o.z,B[Z+H+3]=0),_===!0&&(o.fromBufferAttribute(ge,ae),B[Z+H+4]=o.x,B[Z+H+5]=o.y,B[Z+H+6]=o.z,B[Z+H+7]=0),v===!0&&(o.fromBufferAttribute(ne,ae),B[Z+H+8]=o.x,B[Z+H+9]=o.y,B[Z+H+10]=o.z,B[Z+H+11]=ne.itemSize===4?o.w:1)}}m={count:p,texture:$,size:new ce(O,N)},r.set(c,m),c.addEventListener("dispose",V)}let g=0;for(let x=0;x<u.length;x++)g+=u[x];let f=c.morphTargetsRelative?1:1-g;h.getUniforms().setValue(a,"morphTargetBaseInfluence",f),h.getUniforms().setValue(a,"morphTargetInfluences",u),h.getUniforms().setValue(a,"morphTargetsTexture",m.texture,t),h.getUniforms().setValue(a,"morphTargetsTextureSize",m.size)}else{let d=u===void 0?0:u.length,p=i[c.id];if(p===void 0||p.length!==d){p=[];for(let _=0;_<d;_++)p[_]=[_,0];i[c.id]=p}for(let _=0;_<d;_++){let v=p[_];v[0]=_,v[1]=u[_]}p.sort(R0);for(let _=0;_<8;_++)_<d&&p[_][1]?(s[_][0]=p[_][0],s[_][1]=p[_][1]):(s[_][0]=Number.MAX_SAFE_INTEGER,s[_][1]=0);s.sort(C0);let m=c.morphAttributes.position,g=c.morphAttributes.normal,f=0;for(let _=0;_<8;_++){let v=s[_],y=v[0],C=v[1];y!==Number.MAX_SAFE_INTEGER&&C?(m&&c.getAttribute("morphTarget"+_)!==m[y]&&c.setAttribute("morphTarget"+_,m[y]),g&&c.getAttribute("morphNormal"+_)!==g[y]&&c.setAttribute("morphNormal"+_,g[y]),n[_]=C,f+=C):(m&&c.hasAttribute("morphTarget"+_)===!0&&c.deleteAttribute("morphTarget"+_),g&&c.hasAttribute("morphNormal"+_)===!0&&c.deleteAttribute("morphNormal"+_),n[_]=0)}let x=c.morphTargetsRelative?1:1-f;h.getUniforms().setValue(a,"morphTargetBaseInfluence",x),h.getUniforms().setValue(a,"morphTargetInfluences",n)}}}}function P0(a,e,t,i){let n=new WeakMap;function r(o){let s=o.target;s.removeEventListener("dispose",r),t.remove(s.instanceMatrix),s.instanceColor!==null&&t.remove(s.instanceColor)}return{update:function(o){let s=i.render.frame,l=o.geometry,c=e.get(o,l);if(n.get(c)!==s&&(e.update(c),n.set(c,s)),o.isInstancedMesh&&(o.hasEventListener("dispose",r)===!1&&o.addEventListener("dispose",r),n.get(o)!==s&&(t.update(o.instanceMatrix,a.ARRAY_BUFFER),o.instanceColor!==null&&t.update(o.instanceColor,a.ARRAY_BUFFER),n.set(o,s))),o.isSkinnedMesh){let h=o.skeleton;n.get(h)!==s&&(h.update(),n.set(h,s))}return c},dispose:function(){n=new WeakMap}}}var Zs=class extends oi{constructor(e,t,i,n,r,o,s,l,c,h){if((h=h!==void 0?h:tn)!==tn&&h!==Jn)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");i===void 0&&h===tn&&(i=_a),i===void 0&&h===Jn&&(i=en),super(null,n,r,o,s,l,h,i,c),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=s!==void 0?s:Xt,this.minFilter=l!==void 0?l:Xt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}},Tm=new oi,wm=new Zs(1,1);wm.compareFunction=515;var Em=new Vs,Am=new _h,Cm=new Xs,Up=[],Op=[],Bp=new Float32Array(16),Fp=new Float32Array(9),kp=new Float32Array(4);function rr(a,e,t){let i=a[0];if(i<=0||i>0)return a;let n=e*t,r=Up[n];if(r===void 0&&(r=new Float32Array(n),Up[n]=r),e!==0){i.toArray(r,0);for(let o=1,s=0;o!==e;++o)s+=t,a[o].toArray(r,s)}return r}function At(a,e){if(a.length!==e.length)return!1;for(let t=0,i=a.length;t<i;t++)if(a[t]!==e[t])return!1;return!0}function Ct(a,e){for(let t=0,i=e.length;t<i;t++)a[t]=e[t]}function fl(a,e){let t=Op[e];t===void 0&&(t=new Int32Array(e),Op[e]=t);for(let i=0;i!==e;++i)t[i]=a.allocateTextureUnit();return t}function I0(a,e){let t=this.cache;t[0]!==e&&(a.uniform1f(this.addr,e),t[0]=e)}function z0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(a.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;a.uniform2fv(this.addr,e),Ct(t,e)}}function N0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(a.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)t[0]===e.r&&t[1]===e.g&&t[2]===e.b||(a.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(At(t,e))return;a.uniform3fv(this.addr,e),Ct(t,e)}}function D0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(a.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;a.uniform4fv(this.addr,e),Ct(t,e)}}function U0(a,e){let t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;a.uniformMatrix2fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,i))return;kp.set(i),a.uniformMatrix2fv(this.addr,!1,kp),Ct(t,i)}}function O0(a,e){let t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;a.uniformMatrix3fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,i))return;Fp.set(i),a.uniformMatrix3fv(this.addr,!1,Fp),Ct(t,i)}}function B0(a,e){let t=this.cache,i=e.elements;if(i===void 0){if(At(t,e))return;a.uniformMatrix4fv(this.addr,!1,e),Ct(t,e)}else{if(At(t,i))return;Bp.set(i),a.uniformMatrix4fv(this.addr,!1,Bp),Ct(t,i)}}function F0(a,e){let t=this.cache;t[0]!==e&&(a.uniform1i(this.addr,e),t[0]=e)}function k0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(a.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;a.uniform2iv(this.addr,e),Ct(t,e)}}function H0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(a.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;a.uniform3iv(this.addr,e),Ct(t,e)}}function G0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(a.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;a.uniform4iv(this.addr,e),Ct(t,e)}}function V0(a,e){let t=this.cache;t[0]!==e&&(a.uniform1ui(this.addr,e),t[0]=e)}function j0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y||(a.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(At(t,e))return;a.uniform2uiv(this.addr,e),Ct(t,e)}}function W0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z||(a.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(At(t,e))return;a.uniform3uiv(this.addr,e),Ct(t,e)}}function q0(a,e){let t=this.cache;if(e.x!==void 0)t[0]===e.x&&t[1]===e.y&&t[2]===e.z&&t[3]===e.w||(a.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(At(t,e))return;a.uniform4uiv(this.addr,e),Ct(t,e)}}function X0(a,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n);let r=this.type===a.SAMPLER_2D_SHADOW?wm:Tm;t.setTexture2D(e||r,n)}function Y0(a,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),t.setTexture3D(e||Am,n)}function $0(a,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),t.setTextureCube(e||Cm,n)}function Z0(a,e,t){let i=this.cache,n=t.allocateTextureUnit();i[0]!==n&&(a.uniform1i(this.addr,n),i[0]=n),t.setTexture2DArray(e||Em,n)}function J0(a,e){a.uniform1fv(this.addr,e)}function K0(a,e){let t=rr(e,this.size,2);a.uniform2fv(this.addr,t)}function Q0(a,e){let t=rr(e,this.size,3);a.uniform3fv(this.addr,t)}function e_(a,e){let t=rr(e,this.size,4);a.uniform4fv(this.addr,t)}function t_(a,e){let t=rr(e,this.size,4);a.uniformMatrix2fv(this.addr,!1,t)}function i_(a,e){let t=rr(e,this.size,9);a.uniformMatrix3fv(this.addr,!1,t)}function a_(a,e){let t=rr(e,this.size,16);a.uniformMatrix4fv(this.addr,!1,t)}function n_(a,e){a.uniform1iv(this.addr,e)}function r_(a,e){a.uniform2iv(this.addr,e)}function o_(a,e){a.uniform3iv(this.addr,e)}function s_(a,e){a.uniform4iv(this.addr,e)}function l_(a,e){a.uniform1uiv(this.addr,e)}function c_(a,e){a.uniform2uiv(this.addr,e)}function h_(a,e){a.uniform3uiv(this.addr,e)}function u_(a,e){a.uniform4uiv(this.addr,e)}function d_(a,e,t){let i=this.cache,n=e.length,r=fl(t,n);At(i,r)||(a.uniform1iv(this.addr,r),Ct(i,r));for(let o=0;o!==n;++o)t.setTexture2D(e[o]||Tm,r[o])}function p_(a,e,t){let i=this.cache,n=e.length,r=fl(t,n);At(i,r)||(a.uniform1iv(this.addr,r),Ct(i,r));for(let o=0;o!==n;++o)t.setTexture3D(e[o]||Am,r[o])}function m_(a,e,t){let i=this.cache,n=e.length,r=fl(t,n);At(i,r)||(a.uniform1iv(this.addr,r),Ct(i,r));for(let o=0;o!==n;++o)t.setTextureCube(e[o]||Cm,r[o])}function f_(a,e,t){let i=this.cache,n=e.length,r=fl(t,n);At(i,r)||(a.uniform1iv(this.addr,r),Ct(i,r));for(let o=0;o!==n;++o)t.setTexture2DArray(e[o]||Em,r[o])}var yh=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=(function(n){switch(n){case 5126:return I0;case 35664:return z0;case 35665:return N0;case 35666:return D0;case 35674:return U0;case 35675:return O0;case 35676:return B0;case 5124:case 35670:return F0;case 35667:case 35671:return k0;case 35668:case 35672:return H0;case 35669:case 35673:return G0;case 5125:return V0;case 36294:return j0;case 36295:return W0;case 36296:return q0;case 35678:case 36198:case 36298:case 36306:case 35682:return X0;case 35679:case 36299:case 36307:return Y0;case 35680:case 36300:case 36308:case 36293:return $0;case 36289:case 36303:case 36311:case 36292:return Z0}})(t.type)}},bh=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=(function(n){switch(n){case 5126:return J0;case 35664:return K0;case 35665:return Q0;case 35666:return e_;case 35674:return t_;case 35675:return i_;case 35676:return a_;case 5124:case 35670:return n_;case 35667:case 35671:return r_;case 35668:case 35672:return o_;case 35669:case 35673:return s_;case 5125:return l_;case 36294:return c_;case 36295:return h_;case 36296:return u_;case 35678:case 36198:case 36298:case 36306:case 35682:return d_;case 35679:case 36299:case 36307:return p_;case 35680:case 36300:case 36308:case 36293:return m_;case 36289:case 36303:case 36311:case 36292:return f_}})(t.type)}},Mh=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let n=this.seq;for(let r=0,o=n.length;r!==o;++r){let s=n[r];s.setValue(e,t[s.id],i)}}},th=/(\w+)(\])?(\[|\.)?/g;function Hp(a,e){a.seq.push(e),a.map[e.id]=e}function g_(a,e,t){let i=a.name,n=i.length;for(th.lastIndex=0;;){let r=th.exec(i),o=th.lastIndex,s=r[1],l=r[2]==="]",c=r[3];if(l&&(s|=0),c===void 0||c==="["&&o+2===n){Hp(t,c===void 0?new yh(s,a,e):new bh(s,a,e));break}{let h=t.map[s];h===void 0&&(h=new Mh(s),Hp(t,h)),t=h}}}var Yn=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let n=0;n<i;++n){let r=e.getActiveUniform(t,n);g_(r,e.getUniformLocation(t,r.name),this)}}setValue(e,t,i,n){let r=this.map[t];r!==void 0&&r.setValue(e,i,n)}setOptional(e,t,i){let n=t[i];n!==void 0&&this.setValue(e,i,n)}static upload(e,t,i,n){for(let r=0,o=t.length;r!==o;++r){let s=t[r],l=i[s.id];l.needsUpdate!==!1&&s.setValue(e,l.value,n)}}static seqWithValue(e,t){let i=[];for(let n=0,r=e.length;n!==r;++n){let o=e[n];o.id in t&&i.push(o)}return i}};function Gp(a,e,t){let i=a.createShader(e);return a.shaderSource(i,t),a.compileShader(i),i}var __=37297,v_=0;function Vp(a,e,t){let i=a.getShaderParameter(e,a.COMPILE_STATUS),n=a.getShaderInfoLog(e).trim();if(i&&n==="")return"";let r=/ERROR: 0:(\d+)/.exec(n);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+n+`

`+(function(s,l){let c=s.split(`
`),h=[],u=Math.max(l-6,0),d=Math.min(l+6,c.length);for(let p=u;p<d;p++){let m=p+1;h.push(`${m===l?">":" "} ${m}: ${c[p]}`)}return h.join(`
`)})(a.getShaderSource(e),o)}return n}function x_(a,e){let t=(function(i){let n=et.getPrimaries(et.workingColorSpace),r=et.getPrimaries(i),o;switch(n===r?o="":n===Os&&r===Us?o="LinearDisplayP3ToLinearSRGB":n===Us&&r===Os&&(o="LinearSRGBToLinearDisplayP3"),i){case ra:case pl:return[o,"LinearTransferOETF"];case xt:case uu:return[o,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[o,"LinearTransferOETF"]}})(e);return`vec4 ${a}( vec4 value ) { return ${t[0]}( ${t[1]}( value ) ); }`}function y_(a,e){let t;switch(e){case qg:t="Linear";break;case Xg:t="Reinhard";break;case Yg:t="OptimizedCineon";break;case cu:t="ACESFilmic";break;case Zg:t="AgX";break;case $g:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+a+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function Gn(a){return a!==""}function jp(a,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return a.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Wp(a,e){return a.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var b_=/^[ \t]*#include +<([\w\d./]+)>/gm;function Sh(a){return a.replace(b_,S_)}var M_=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function S_(a,e){let t=Ue[e];if(t===void 0){let i=M_.get(e);if(i===void 0)throw new Error("Can not resolve #include <"+e+">");t=Ue[i],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i)}return Sh(t)}var T_=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function qp(a){return a.replace(T_,w_)}function w_(a,e,t,i){let n="";for(let r=parseInt(e);r<parseInt(t);r++)n+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return n}function Xp(a){let e="precision "+a.precision+` float;
precision `+a.precision+" int;";return a.precision==="highp"?e+=`
#define HIGH_PRECISION`:a.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:a.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function E_(a,e,t,i){let n=a.getContext(),r=t.defines,o=t.vertexShader,s=t.fragmentShader,l=(function(R){let V="SHADOWMAP_TYPE_BASIC";return R.shadowMapType===lm?V="SHADOWMAP_TYPE_PCF":R.shadowMapType===Vg?V="SHADOWMAP_TYPE_PCF_SOFT":R.shadowMapType===ia&&(V="SHADOWMAP_TYPE_VSM"),V})(t),c=(function(R){let V="ENVMAP_TYPE_CUBE";if(R.envMap)switch(R.envMapMode){case $n:case Zn:V="ENVMAP_TYPE_CUBE";break;case dl:V="ENVMAP_TYPE_CUBE_UV"}return V})(t),h=(function(R){let V="ENVMAP_MODE_REFLECTION";return R.envMap&&R.envMapMode===Zn&&(V="ENVMAP_MODE_REFRACTION"),V})(t),u=(function(R){let V="ENVMAP_BLENDING_NONE";if(R.envMap)switch(R.combine){case hm:V="ENVMAP_BLENDING_MULTIPLY";break;case jg:V="ENVMAP_BLENDING_MIX";break;case Wg:V="ENVMAP_BLENDING_ADD"}return V})(t),d=(function(R){let V=R.envMapCubeUVHeight;if(V===null)return null;let W=Math.log2(V)-2,le=1/V;return{texelWidth:1/(3*Math.max(Math.pow(2,W),112)),texelHeight:le,maxMip:W}})(t),p=t.isWebGL2?"":(function(R){return[R.extensionDerivatives||R.envMapCubeUVHeight||R.bumpMap||R.normalMapTangentSpace||R.clearcoatNormalMap||R.flatShading||R.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(R.extensionFragDepth||R.logarithmicDepthBuffer)&&R.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",R.extensionDrawBuffers&&R.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(R.extensionShaderTextureLOD||R.envMap||R.transmission)&&R.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Gn).join(`
`)})(t),m=(function(R){return[R.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":""].filter(Gn).join(`
`)})(t),g=(function(R){let V=[];for(let W in R){let le=R[W];le!==!1&&V.push("#define "+W+" "+le)}return V.join(`
`)})(r),f=n.createProgram(),x,_,v=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(x=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Gn).join(`
`),x.length>0&&(x+=`
`),_=[p,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Gn).join(`
`),_.length>0&&(_+=`
`)):(x=[Xp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Gn).join(`
`),_=[p,Xp(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==xa?"#define TONE_MAPPING":"",t.toneMapping!==xa?Ue.tonemapping_pars_fragment:"",t.toneMapping!==xa?y_("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ue.colorspace_pars_fragment,x_("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Gn).join(`
`)),o=Sh(o),o=jp(o,t),o=Wp(o,t),s=Sh(s),s=jp(s,t),s=Wp(s,t),o=qp(o),s=qp(s),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,x=[m,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+x,_=["precision mediump sampler2DArray;","#define varying in",t.glslVersion===dp?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===dp?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+_);let y=v+x+o,C=v+_+s,S=Gp(n,n.VERTEX_SHADER,y),w=Gp(n,n.FRAGMENT_SHADER,C);function O(R){if(a.debug.checkShaderErrors){let V=n.getProgramInfoLog(f).trim(),W=n.getShaderInfoLog(S).trim(),le=n.getShaderInfoLog(w).trim(),ge=!0,ne=!0;if(n.getProgramParameter(f,n.LINK_STATUS)===!1)if(ge=!1,typeof a.debug.onShaderError=="function")a.debug.onShaderError(n,f,S,w);else{let Z=Vp(n,S,"vertex"),ae=Vp(n,w,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(f,n.VALIDATE_STATUS)+`

Program Info Log: `+V+`
`+Z+`
`+ae)}else V!==""?console.warn("THREE.WebGLProgram: Program Info Log:",V):W!==""&&le!==""||(ne=!1);ne&&(R.diagnostics={runnable:ge,programLog:V,vertexShader:{log:W,prefix:x},fragmentShader:{log:le,prefix:_}})}n.deleteShader(S),n.deleteShader(w),N=new Yn(n,f),B=(function(V,W){let le={},ge=V.getProgramParameter(W,V.ACTIVE_ATTRIBUTES);for(let ne=0;ne<ge;ne++){let Z=V.getActiveAttrib(W,ne),ae=Z.name,H=1;Z.type===V.FLOAT_MAT2&&(H=2),Z.type===V.FLOAT_MAT3&&(H=3),Z.type===V.FLOAT_MAT4&&(H=4),le[ae]={type:Z.type,location:V.getAttribLocation(W,ae),locationSize:H}}return le})(n,f)}let N,B;n.attachShader(f,S),n.attachShader(f,w),t.index0AttributeName!==void 0?n.bindAttribLocation(f,0,t.index0AttributeName):t.morphTargets===!0&&n.bindAttribLocation(f,0,"position"),n.linkProgram(f),this.getUniforms=function(){return N===void 0&&O(this),N},this.getAttributes=function(){return B===void 0&&O(this),B};let $=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return $===!1&&($=n.getProgramParameter(f,__)),$},this.destroy=function(){i.releaseStatesOfProgram(this),n.deleteProgram(f),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=v_++,this.cacheKey=e,this.usedTimes=1,this.program=f,this.vertexShader=S,this.fragmentShader=w,this}var A_=0,Th=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,i=e.fragmentShader,n=this._getShaderStage(t),r=this._getShaderStage(i),o=this._getShaderCacheForMaterial(e);return o.has(n)===!1&&(o.add(n),n.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new wh(e),t.set(e,i)),i}},wh=class{constructor(e){this.id=A_++,this.code=e,this.usedTimes=0}};function C_(a,e,t,i,n,r,o){let s=new to,l=new Th,c=[],h=n.isWebGL2,u=n.logarithmicDepthBuffer,d=n.vertexTextures,p=n.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(f){return f===0?"uv":`uv${f}`}return{getParameters:function(f,x,_,v,y){let C=v.fog,S=y.geometry,w=f.isMeshStandardMaterial?v.environment:null,O=(f.isMeshStandardMaterial?t:e).get(f.envMap||w),N=O&&O.mapping===dl?O.image.height:null,B=m[f.type];f.precision!==null&&(p=n.getMaxPrecision(f.precision),p!==f.precision&&console.warn("THREE.WebGLProgram.getParameters:",f.precision,"not supported, using",p,"instead."));let $=S.morphAttributes.position||S.morphAttributes.normal||S.morphAttributes.color,R=$!==void 0?$.length:0,V,W,le,ge,ne=0;if(S.morphAttributes.position!==void 0&&(ne=1),S.morphAttributes.normal!==void 0&&(ne=2),S.morphAttributes.color!==void 0&&(ne=3),B){let Dt=Vi[B];V=Dt.vertexShader,W=Dt.fragmentShader}else V=f.vertexShader,W=f.fragmentShader,l.update(f),le=l.getVertexShaderID(f),ge=l.getFragmentShaderID(f);let Z=a.getRenderTarget(),ae=y.isInstancedMesh===!0,H=y.isBatchedMesh===!0,Q=!!f.map,de=!!f.matcap,T=!!O,M=!!f.aoMap,F=!!f.lightMap,J=!!f.bumpMap,z=!!f.normalMap,Y=!!f.displacementMap,D=!!f.emissiveMap,U=!!f.metalnessMap,k=!!f.roughnessMap,ie=f.anisotropy>0,ee=f.clearcoat>0,b=f.iridescence>0,re=f.sheen>0,G=f.transmission>0,j=ie&&!!f.anisotropyMap,oe=ee&&!!f.clearcoatMap,pe=ee&&!!f.clearcoatNormalMap,fe=ee&&!!f.clearcoatRoughnessMap,_e=b&&!!f.iridescenceMap,De=b&&!!f.iridescenceThicknessMap,ve=re&&!!f.sheenColorMap,be=re&&!!f.sheenRoughnessMap,Oe=!!f.specularMap,Rt=!!f.specularColorMap,Ce=!!f.specularIntensityMap,Ye=G&&!!f.transmissionMap,je=G&&!!f.thicknessMap,So=!!f.gradientMap,fn=!!f.alphaMap,To=f.alphaTest>0,hi=!!f.alphaHash,ti=!!f.extensions,gn=!!S.attributes.uv1,X=!!S.attributes.uv2,wo=!!S.attributes.uv3,fr=xa;return f.toneMapped&&(Z!==null&&Z.isXRRenderTarget!==!0||(fr=a.toneMapping)),{isWebGL2:h,shaderID:B,shaderType:f.type,shaderName:f.name,vertexShader:V,fragmentShader:W,defines:f.defines,customVertexShaderID:le,customFragmentShaderID:ge,isRawShaderMaterial:f.isRawShaderMaterial===!0,glslVersion:f.glslVersion,precision:p,batching:H,instancing:ae,instancingColor:ae&&y.instanceColor!==null,supportsVertexTextures:d,outputColorSpace:Z===null?a.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:ra,map:Q,matcap:de,envMap:T,envMapMode:T&&O.mapping,envMapCubeUVHeight:N,aoMap:M,lightMap:F,bumpMap:J,normalMap:z,displacementMap:d&&Y,emissiveMap:D,normalMapObjectSpace:z&&f.normalMapType===1,normalMapTangentSpace:z&&f.normalMapType===0,metalnessMap:U,roughnessMap:k,anisotropy:ie,anisotropyMap:j,clearcoat:ee,clearcoatMap:oe,clearcoatNormalMap:pe,clearcoatRoughnessMap:fe,iridescence:b,iridescenceMap:_e,iridescenceThicknessMap:De,sheen:re,sheenColorMap:ve,sheenRoughnessMap:be,specularMap:Oe,specularColorMap:Rt,specularIntensityMap:Ce,transmission:G,transmissionMap:Ye,thicknessMap:je,gradientMap:So,opaque:f.transparent===!1&&f.blending===1,alphaMap:fn,alphaTest:To,alphaHash:hi,combine:f.combine,mapUv:Q&&g(f.map.channel),aoMapUv:M&&g(f.aoMap.channel),lightMapUv:F&&g(f.lightMap.channel),bumpMapUv:J&&g(f.bumpMap.channel),normalMapUv:z&&g(f.normalMap.channel),displacementMapUv:Y&&g(f.displacementMap.channel),emissiveMapUv:D&&g(f.emissiveMap.channel),metalnessMapUv:U&&g(f.metalnessMap.channel),roughnessMapUv:k&&g(f.roughnessMap.channel),anisotropyMapUv:j&&g(f.anisotropyMap.channel),clearcoatMapUv:oe&&g(f.clearcoatMap.channel),clearcoatNormalMapUv:pe&&g(f.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:fe&&g(f.clearcoatRoughnessMap.channel),iridescenceMapUv:_e&&g(f.iridescenceMap.channel),iridescenceThicknessMapUv:De&&g(f.iridescenceThicknessMap.channel),sheenColorMapUv:ve&&g(f.sheenColorMap.channel),sheenRoughnessMapUv:be&&g(f.sheenRoughnessMap.channel),specularMapUv:Oe&&g(f.specularMap.channel),specularColorMapUv:Rt&&g(f.specularColorMap.channel),specularIntensityMapUv:Ce&&g(f.specularIntensityMap.channel),transmissionMapUv:Ye&&g(f.transmissionMap.channel),thicknessMapUv:je&&g(f.thicknessMap.channel),alphaMapUv:fn&&g(f.alphaMap.channel),vertexTangents:!!S.attributes.tangent&&(z||ie),vertexColors:f.vertexColors,vertexAlphas:f.vertexColors===!0&&!!S.attributes.color&&S.attributes.color.itemSize===4,vertexUv1s:gn,vertexUv2s:X,vertexUv3s:wo,pointsUvs:y.isPoints===!0&&!!S.attributes.uv&&(Q||fn),fog:!!C,useFog:f.fog===!0,fogExp2:C&&C.isFogExp2,flatShading:f.flatShading===!0,sizeAttenuation:f.sizeAttenuation===!0,logarithmicDepthBuffer:u,skinning:y.isSkinnedMesh===!0,morphTargets:S.morphAttributes.position!==void 0,morphNormals:S.morphAttributes.normal!==void 0,morphColors:S.morphAttributes.color!==void 0,morphTargetsCount:R,morphTextureStride:ne,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:f.dithering,shadowMapEnabled:a.shadowMap.enabled&&_.length>0,shadowMapType:a.shadowMap.type,toneMapping:fr,useLegacyLights:a._useLegacyLights,decodeVideoTexture:Q&&f.map.isVideoTexture===!0&&et.getTransfer(f.map.colorSpace)===rt,premultipliedAlpha:f.premultipliedAlpha,doubleSided:f.side===2,flipSided:f.side===Ht,useDepthPacking:f.depthPacking>=0,depthPacking:f.depthPacking||0,index0AttributeName:f.index0AttributeName,extensionDerivatives:ti&&f.extensions.derivatives===!0,extensionFragDepth:ti&&f.extensions.fragDepth===!0,extensionDrawBuffers:ti&&f.extensions.drawBuffers===!0,extensionShaderTextureLOD:ti&&f.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ti&&f.extensions.clipCullDistance&&i.has("WEBGL_clip_cull_distance"),rendererExtensionFragDepth:h||i.has("EXT_frag_depth"),rendererExtensionDrawBuffers:h||i.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:h||i.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:i.has("KHR_parallel_shader_compile"),customProgramCacheKey:f.customProgramCacheKey()}},getProgramCacheKey:function(f){let x=[];if(f.shaderID?x.push(f.shaderID):(x.push(f.customVertexShaderID),x.push(f.customFragmentShaderID)),f.defines!==void 0)for(let _ in f.defines)x.push(_),x.push(f.defines[_]);return f.isRawShaderMaterial===!1&&((function(_,v){_.push(v.precision),_.push(v.outputColorSpace),_.push(v.envMapMode),_.push(v.envMapCubeUVHeight),_.push(v.mapUv),_.push(v.alphaMapUv),_.push(v.lightMapUv),_.push(v.aoMapUv),_.push(v.bumpMapUv),_.push(v.normalMapUv),_.push(v.displacementMapUv),_.push(v.emissiveMapUv),_.push(v.metalnessMapUv),_.push(v.roughnessMapUv),_.push(v.anisotropyMapUv),_.push(v.clearcoatMapUv),_.push(v.clearcoatNormalMapUv),_.push(v.clearcoatRoughnessMapUv),_.push(v.iridescenceMapUv),_.push(v.iridescenceThicknessMapUv),_.push(v.sheenColorMapUv),_.push(v.sheenRoughnessMapUv),_.push(v.specularMapUv),_.push(v.specularColorMapUv),_.push(v.specularIntensityMapUv),_.push(v.transmissionMapUv),_.push(v.thicknessMapUv),_.push(v.combine),_.push(v.fogExp2),_.push(v.sizeAttenuation),_.push(v.morphTargetsCount),_.push(v.morphAttributeCount),_.push(v.numDirLights),_.push(v.numPointLights),_.push(v.numSpotLights),_.push(v.numSpotLightMaps),_.push(v.numHemiLights),_.push(v.numRectAreaLights),_.push(v.numDirLightShadows),_.push(v.numPointLightShadows),_.push(v.numSpotLightShadows),_.push(v.numSpotLightShadowsWithMaps),_.push(v.numLightProbes),_.push(v.shadowMapType),_.push(v.toneMapping),_.push(v.numClippingPlanes),_.push(v.numClipIntersection),_.push(v.depthPacking)})(x,f),(function(_,v){s.disableAll(),v.isWebGL2&&s.enable(0),v.supportsVertexTextures&&s.enable(1),v.instancing&&s.enable(2),v.instancingColor&&s.enable(3),v.matcap&&s.enable(4),v.envMap&&s.enable(5),v.normalMapObjectSpace&&s.enable(6),v.normalMapTangentSpace&&s.enable(7),v.clearcoat&&s.enable(8),v.iridescence&&s.enable(9),v.alphaTest&&s.enable(10),v.vertexColors&&s.enable(11),v.vertexAlphas&&s.enable(12),v.vertexUv1s&&s.enable(13),v.vertexUv2s&&s.enable(14),v.vertexUv3s&&s.enable(15),v.vertexTangents&&s.enable(16),v.anisotropy&&s.enable(17),v.alphaHash&&s.enable(18),v.batching&&s.enable(19),_.push(s.mask),s.disableAll(),v.fog&&s.enable(0),v.useFog&&s.enable(1),v.flatShading&&s.enable(2),v.logarithmicDepthBuffer&&s.enable(3),v.skinning&&s.enable(4),v.morphTargets&&s.enable(5),v.morphNormals&&s.enable(6),v.morphColors&&s.enable(7),v.premultipliedAlpha&&s.enable(8),v.shadowMapEnabled&&s.enable(9),v.useLegacyLights&&s.enable(10),v.doubleSided&&s.enable(11),v.flipSided&&s.enable(12),v.useDepthPacking&&s.enable(13),v.dithering&&s.enable(14),v.transmission&&s.enable(15),v.sheen&&s.enable(16),v.opaque&&s.enable(17),v.pointsUvs&&s.enable(18),v.decodeVideoTexture&&s.enable(19),_.push(s.mask)})(x,f),x.push(a.outputColorSpace)),x.push(f.customProgramCacheKey),x.join()},getUniforms:function(f){let x=m[f.type],_;if(x){let v=Vi[x];_=p0.clone(v.uniforms)}else _=f.uniforms;return _},acquireProgram:function(f,x){let _;for(let v=0,y=c.length;v<y;v++){let C=c[v];if(C.cacheKey===x){_=C,++_.usedTimes;break}}return _===void 0&&(_=new E_(a,x,f,r),c.push(_)),_},releaseProgram:function(f){if(--f.usedTimes==0){let x=c.indexOf(f);c[x]=c[c.length-1],c.pop(),f.destroy()}},releaseShaderCache:function(f){l.remove(f)},programs:c,dispose:function(){l.dispose()}}}function R_(){let a=new WeakMap;return{get:function(e){let t=a.get(e);return t===void 0&&(t={},a.set(e,t)),t},remove:function(e){a.delete(e)},update:function(e,t,i){a.get(e)[t]=i},dispose:function(){a=new WeakMap}}}function L_(a,e){return a.groupOrder!==e.groupOrder?a.groupOrder-e.groupOrder:a.renderOrder!==e.renderOrder?a.renderOrder-e.renderOrder:a.material.id!==e.material.id?a.material.id-e.material.id:a.z!==e.z?a.z-e.z:a.id-e.id}function Yp(a,e){return a.groupOrder!==e.groupOrder?a.groupOrder-e.groupOrder:a.renderOrder!==e.renderOrder?a.renderOrder-e.renderOrder:a.z!==e.z?e.z-a.z:a.id-e.id}function $p(){let a=[],e=0,t=[],i=[],n=[];function r(o,s,l,c,h,u){let d=a[e];return d===void 0?(d={id:o.id,object:o,geometry:s,material:l,groupOrder:c,renderOrder:o.renderOrder,z:h,group:u},a[e]=d):(d.id=o.id,d.object=o,d.geometry=s,d.material=l,d.groupOrder=c,d.renderOrder=o.renderOrder,d.z=h,d.group=u),e++,d}return{opaque:t,transmissive:i,transparent:n,init:function(){e=0,t.length=0,i.length=0,n.length=0},push:function(o,s,l,c,h,u){let d=r(o,s,l,c,h,u);l.transmission>0?i.push(d):l.transparent===!0?n.push(d):t.push(d)},unshift:function(o,s,l,c,h,u){let d=r(o,s,l,c,h,u);l.transmission>0?i.unshift(d):l.transparent===!0?n.unshift(d):t.unshift(d)},finish:function(){for(let o=e,s=a.length;o<s;o++){let l=a[o];if(l.id===null)break;l.id=null,l.object=null,l.geometry=null,l.material=null,l.group=null}},sort:function(o,s){t.length>1&&t.sort(o||L_),i.length>1&&i.sort(s||Yp),n.length>1&&n.sort(s||Yp)}}}function P_(){let a=new WeakMap;return{get:function(e,t){let i=a.get(e),n;return i===void 0?(n=new $p,a.set(e,[n])):t>=i.length?(n=new $p,i.push(n)):n=i[t],n},dispose:function(){a=new WeakMap}}}function I_(){let a={};return{get:function(e){if(a[e.id]!==void 0)return a[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new A,color:new xe};break;case"SpotLight":t={position:new A,direction:new A,color:new xe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new A,color:new xe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new A,skyColor:new xe,groundColor:new xe};break;case"RectAreaLight":t={color:new xe,position:new A,halfWidth:new A,halfHeight:new A}}return a[e.id]=t,t}}}var z_=0;function N_(a,e){return(e.castShadow?2:0)-(a.castShadow?2:0)+(e.map?1:0)-(a.map?1:0)}function D_(a,e){let t=new I_,i=(function(){let l={};return{get:function(c){if(l[c.id]!==void 0)return l[c.id];let h;switch(c.type){case"DirectionalLight":case"SpotLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ce};break;case"PointLight":h={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ce,shadowCameraNear:1,shadowCameraFar:1e3}}return l[c.id]=h,h}}})(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new A);let r=new A,o=new Re,s=new Re;return{setup:function(l,c){let h=0,u=0,d=0;for(let B=0;B<9;B++)n.probe[B].set(0,0,0);let p=0,m=0,g=0,f=0,x=0,_=0,v=0,y=0,C=0,S=0,w=0;l.sort(N_);let O=c===!0?Math.PI:1;for(let B=0,$=l.length;B<$;B++){let R=l[B],V=R.color,W=R.intensity,le=R.distance,ge=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)h+=V.r*W*O,u+=V.g*W*O,d+=V.b*W*O;else if(R.isLightProbe){for(let ne=0;ne<9;ne++)n.probe[ne].addScaledVector(R.sh.coefficients[ne],W);w++}else if(R.isDirectionalLight){let ne=t.get(R);if(ne.color.copy(R.color).multiplyScalar(R.intensity*O),R.castShadow){let Z=R.shadow,ae=i.get(R);ae.shadowBias=Z.bias,ae.shadowNormalBias=Z.normalBias,ae.shadowRadius=Z.radius,ae.shadowMapSize=Z.mapSize,n.directionalShadow[p]=ae,n.directionalShadowMap[p]=ge,n.directionalShadowMatrix[p]=R.shadow.matrix,_++}n.directional[p]=ne,p++}else if(R.isSpotLight){let ne=t.get(R);ne.position.setFromMatrixPosition(R.matrixWorld),ne.color.copy(V).multiplyScalar(W*O),ne.distance=le,ne.coneCos=Math.cos(R.angle),ne.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),ne.decay=R.decay,n.spot[g]=ne;let Z=R.shadow;if(R.map&&(n.spotLightMap[C]=R.map,C++,Z.updateMatrices(R),R.castShadow&&S++),n.spotLightMatrix[g]=Z.matrix,R.castShadow){let ae=i.get(R);ae.shadowBias=Z.bias,ae.shadowNormalBias=Z.normalBias,ae.shadowRadius=Z.radius,ae.shadowMapSize=Z.mapSize,n.spotShadow[g]=ae,n.spotShadowMap[g]=ge,y++}g++}else if(R.isRectAreaLight){let ne=t.get(R);ne.color.copy(V).multiplyScalar(W),ne.halfWidth.set(.5*R.width,0,0),ne.halfHeight.set(0,.5*R.height,0),n.rectArea[f]=ne,f++}else if(R.isPointLight){let ne=t.get(R);if(ne.color.copy(R.color).multiplyScalar(R.intensity*O),ne.distance=R.distance,ne.decay=R.decay,R.castShadow){let Z=R.shadow,ae=i.get(R);ae.shadowBias=Z.bias,ae.shadowNormalBias=Z.normalBias,ae.shadowRadius=Z.radius,ae.shadowMapSize=Z.mapSize,ae.shadowCameraNear=Z.camera.near,ae.shadowCameraFar=Z.camera.far,n.pointShadow[m]=ae,n.pointShadowMap[m]=ge,n.pointShadowMatrix[m]=R.shadow.matrix,v++}n.point[m]=ne,m++}else if(R.isHemisphereLight){let ne=t.get(R);ne.skyColor.copy(R.color).multiplyScalar(W*O),ne.groundColor.copy(R.groundColor).multiplyScalar(W*O),n.hemi[x]=ne,x++}}f>0&&(e.isWebGL2?a.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_FLOAT_1,n.rectAreaLTC2=ue.LTC_FLOAT_2):(n.rectAreaLTC1=ue.LTC_HALF_1,n.rectAreaLTC2=ue.LTC_HALF_2):a.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_FLOAT_1,n.rectAreaLTC2=ue.LTC_FLOAT_2):a.has("OES_texture_half_float_linear")===!0?(n.rectAreaLTC1=ue.LTC_HALF_1,n.rectAreaLTC2=ue.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let N=n.hash;N.directionalLength===p&&N.pointLength===m&&N.spotLength===g&&N.rectAreaLength===f&&N.hemiLength===x&&N.numDirectionalShadows===_&&N.numPointShadows===v&&N.numSpotShadows===y&&N.numSpotMaps===C&&N.numLightProbes===w||(n.directional.length=p,n.spot.length=g,n.rectArea.length=f,n.point.length=m,n.hemi.length=x,n.directionalShadow.length=_,n.directionalShadowMap.length=_,n.pointShadow.length=v,n.pointShadowMap.length=v,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=_,n.pointShadowMatrix.length=v,n.spotLightMatrix.length=y+C-S,n.spotLightMap.length=C,n.numSpotLightShadowsWithMaps=S,n.numLightProbes=w,N.directionalLength=p,N.pointLength=m,N.spotLength=g,N.rectAreaLength=f,N.hemiLength=x,N.numDirectionalShadows=_,N.numPointShadows=v,N.numSpotShadows=y,N.numSpotMaps=C,N.numLightProbes=w,n.version=z_++)},setupView:function(l,c){let h=0,u=0,d=0,p=0,m=0,g=c.matrixWorldInverse;for(let f=0,x=l.length;f<x;f++){let _=l[f];if(_.isDirectionalLight){let v=n.directional[h];v.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(g),h++}else if(_.isSpotLight){let v=n.spot[d];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),v.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),v.direction.sub(r),v.direction.transformDirection(g),d++}else if(_.isRectAreaLight){let v=n.rectArea[p];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),s.identity(),o.copy(_.matrixWorld),o.premultiply(g),s.extractRotation(o),v.halfWidth.set(.5*_.width,0,0),v.halfHeight.set(0,.5*_.height,0),v.halfWidth.applyMatrix4(s),v.halfHeight.applyMatrix4(s),p++}else if(_.isPointLight){let v=n.point[u];v.position.setFromMatrixPosition(_.matrixWorld),v.position.applyMatrix4(g),u++}else if(_.isHemisphereLight){let v=n.hemi[m];v.direction.setFromMatrixPosition(_.matrixWorld),v.direction.transformDirection(g),m++}}},state:n}}function Zp(a,e){let t=new D_(a,e),i=[],n=[];return{init:function(){i.length=0,n.length=0},state:{lightsArray:i,shadowsArray:n,lights:t},setupLights:function(r){t.setup(i,r)},setupLightsView:function(r){t.setupView(i,r)},pushLight:function(r){i.push(r)},pushShadow:function(r){n.push(r)}}}function U_(a,e){let t=new WeakMap;return{get:function(i,n=0){let r=t.get(i),o;return r===void 0?(o=new Zp(a,e),t.set(i,[o])):n>=r.length?(o=new Zp(a,e),r.push(o)):o=r[n],o},dispose:function(){t=new WeakMap}}}var Eh=class extends rn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=3200,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Ah=class extends rn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function O_(a,e,t){let i=new er,n=new ce,r=new ce,o=new St,s=new Eh({depthPacking:3201}),l=new Ah,c={},h=t.maxTextureSize,u={[ba]:Ht,[Ht]:ba,2:2},d=new Di({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ce},radius:{value:4}},vertexShader:`void main() {
	gl_Position = vec4( position, 1.0 );
}`,fragmentShader:`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`}),p=d.clone();p.defines.HORIZONTAL_PASS=1;let m=new ct;m.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let g=new ft(m,d),f=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=lm;let x=this.type;function _(S,w){let O=e.update(g);d.defines.VSM_SAMPLES!==S.blurSamples&&(d.defines.VSM_SAMPLES=S.blurSamples,p.defines.VSM_SAMPLES=S.blurSamples,d.needsUpdate=!0,p.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new oa(n.x,n.y)),d.uniforms.shadow_pass.value=S.map.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,a.setRenderTarget(S.mapPass),a.clear(),a.renderBufferDirect(w,null,O,d,g,null),p.uniforms.shadow_pass.value=S.mapPass.texture,p.uniforms.resolution.value=S.mapSize,p.uniforms.radius.value=S.radius,a.setRenderTarget(S.map),a.clear(),a.renderBufferDirect(w,null,O,p,g,null)}function v(S,w,O,N){let B=null,$=O.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if($!==void 0)B=$;else if(B=O.isPointLight===!0?l:s,a.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0){let R=B.uuid,V=w.uuid,W=c[R];W===void 0&&(W={},c[R]=W);let le=W[V];le===void 0&&(le=B.clone(),W[V]=le,w.addEventListener("dispose",C)),B=le}return B.visible=w.visible,B.wireframe=w.wireframe,B.side=N===ia?w.shadowSide!==null?w.shadowSide:w.side:w.shadowSide!==null?w.shadowSide:u[w.side],B.alphaMap=w.alphaMap,B.alphaTest=w.alphaTest,B.map=w.map,B.clipShadows=w.clipShadows,B.clippingPlanes=w.clippingPlanes,B.clipIntersection=w.clipIntersection,B.displacementMap=w.displacementMap,B.displacementScale=w.displacementScale,B.displacementBias=w.displacementBias,B.wireframeLinewidth=w.wireframeLinewidth,B.linewidth=w.linewidth,O.isPointLight===!0&&B.isMeshDistanceMaterial===!0&&(a.properties.get(B).light=O),B}function y(S,w,O,N,B){if(S.visible===!1)return;if(S.layers.test(w.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&B===ia)&&(!S.frustumCulled||i.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,S.matrixWorld);let R=e.update(S),V=S.material;if(Array.isArray(V)){let W=R.groups;for(let le=0,ge=W.length;le<ge;le++){let ne=W[le],Z=V[ne.materialIndex];if(Z&&Z.visible){let ae=v(S,Z,N,B);S.onBeforeShadow(a,S,w,O,R,ae,ne),a.renderBufferDirect(O,null,R,ae,S,ne),S.onAfterShadow(a,S,w,O,R,ae,ne)}}}else if(V.visible){let W=v(S,V,N,B);S.onBeforeShadow(a,S,w,O,R,W,null),a.renderBufferDirect(O,null,R,W,S,null),S.onAfterShadow(a,S,w,O,R,W,null)}}let $=S.children;for(let R=0,V=$.length;R<V;R++)y($[R],w,O,N,B)}function C(S){S.target.removeEventListener("dispose",C);for(let w in c){let O=c[w],N=S.target.uuid;N in O&&(O[N].dispose(),delete O[N])}}this.render=function(S,w,O){if(f.enabled===!1||f.autoUpdate===!1&&f.needsUpdate===!1||S.length===0)return;let N=a.getRenderTarget(),B=a.getActiveCubeFace(),$=a.getActiveMipmapLevel(),R=a.state;R.setBlending(0),R.buffers.color.setClear(1,1,1,1),R.buffers.depth.setTest(!0),R.setScissorTest(!1);let V=x!==ia&&this.type===ia,W=x===ia&&this.type!==ia;for(let le=0,ge=S.length;le<ge;le++){let ne=S[le],Z=ne.shadow;if(Z===void 0){console.warn("THREE.WebGLShadowMap:",ne,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;n.copy(Z.mapSize);let ae=Z.getFrameExtents();if(n.multiply(ae),r.copy(Z.mapSize),(n.x>h||n.y>h)&&(n.x>h&&(r.x=Math.floor(h/ae.x),n.x=r.x*ae.x,Z.mapSize.x=r.x),n.y>h&&(r.y=Math.floor(h/ae.y),n.y=r.y*ae.y,Z.mapSize.y=r.y)),Z.map===null||V===!0||W===!0){let Q=this.type!==ia?{minFilter:Xt,magFilter:Xt}:{};Z.map!==null&&Z.map.dispose(),Z.map=new oa(n.x,n.y,Q),Z.map.texture.name=ne.name+".shadowMap",Z.camera.updateProjectionMatrix()}a.setRenderTarget(Z.map),a.clear();let H=Z.getViewportCount();for(let Q=0;Q<H;Q++){let de=Z.getViewport(Q);o.set(r.x*de.x,r.y*de.y,r.x*de.z,r.y*de.w),R.viewport(o),Z.updateMatrices(ne,Q),i=Z.getFrustum(),y(w,O,Z.camera,ne,this.type)}Z.isPointLightShadow!==!0&&this.type===ia&&_(Z,O),Z.needsUpdate=!1}x=this.type,f.needsUpdate=!1,a.setRenderTarget(N,B,$)}}function B_(a,e,t){let i=t.isWebGL2,n=new function(){let b=!1,re=new St,G=null,j=new St(0,0,0,0);return{setMask:function(oe){G===oe||b||(a.colorMask(oe,oe,oe,oe),G=oe)},setLocked:function(oe){b=oe},setClear:function(oe,pe,fe,_e,De){De===!0&&(oe*=_e,pe*=_e,fe*=_e),re.set(oe,pe,fe,_e),j.equals(re)===!1&&(a.clearColor(oe,pe,fe,_e),j.copy(re))},reset:function(){b=!1,G=null,j.set(-1,0,0,0)}}},r=new function(){let b=!1,re=null,G=null,j=null;return{setTest:function(oe){oe?J(a.DEPTH_TEST):z(a.DEPTH_TEST)},setMask:function(oe){re===oe||b||(a.depthMask(oe),re=oe)},setFunc:function(oe){if(G!==oe){switch(oe){case 0:a.depthFunc(a.NEVER);break;case 1:a.depthFunc(a.ALWAYS);break;case 2:a.depthFunc(a.LESS);break;case 3:default:a.depthFunc(a.LEQUAL);break;case 4:a.depthFunc(a.EQUAL);break;case 5:a.depthFunc(a.GEQUAL);break;case 6:a.depthFunc(a.GREATER);break;case 7:a.depthFunc(a.NOTEQUAL)}G=oe}},setLocked:function(oe){b=oe},setClear:function(oe){j!==oe&&(a.clearDepth(oe),j=oe)},reset:function(){b=!1,re=null,G=null,j=null}}},o=new function(){let b=!1,re=null,G=null,j=null,oe=null,pe=null,fe=null,_e=null,De=null;return{setTest:function(ve){b||(ve?J(a.STENCIL_TEST):z(a.STENCIL_TEST))},setMask:function(ve){re===ve||b||(a.stencilMask(ve),re=ve)},setFunc:function(ve,be,Oe){G===ve&&j===be&&oe===Oe||(a.stencilFunc(ve,be,Oe),G=ve,j=be,oe=Oe)},setOp:function(ve,be,Oe){pe===ve&&fe===be&&_e===Oe||(a.stencilOp(ve,be,Oe),pe=ve,fe=be,_e=Oe)},setLocked:function(ve){b=ve},setClear:function(ve){De!==ve&&(a.clearStencil(ve),De=ve)},reset:function(){b=!1,re=null,G=null,j=null,oe=null,pe=null,fe=null,_e=null,De=null}}},s=new WeakMap,l=new WeakMap,c={},h={},u=new WeakMap,d=[],p=null,m=!1,g=null,f=null,x=null,_=null,v=null,y=null,C=null,S=new xe(0,0,0),w=0,O=!1,N=null,B=null,$=null,R=null,V=null,W=a.getParameter(a.MAX_COMBINED_TEXTURE_IMAGE_UNITS),le=!1,ge=0,ne=a.getParameter(a.VERSION);ne.indexOf("WebGL")!==-1?(ge=parseFloat(/^WebGL (\d)/.exec(ne)[1]),le=ge>=1):ne.indexOf("OpenGL ES")!==-1&&(ge=parseFloat(/^OpenGL ES (\d)/.exec(ne)[1]),le=ge>=2);let Z=null,ae={},H=a.getParameter(a.SCISSOR_BOX),Q=a.getParameter(a.VIEWPORT),de=new St().fromArray(H),T=new St().fromArray(Q);function M(b,re,G,j){let oe=new Uint8Array(4),pe=a.createTexture();a.bindTexture(b,pe),a.texParameteri(b,a.TEXTURE_MIN_FILTER,a.NEAREST),a.texParameteri(b,a.TEXTURE_MAG_FILTER,a.NEAREST);for(let fe=0;fe<G;fe++)!i||b!==a.TEXTURE_3D&&b!==a.TEXTURE_2D_ARRAY?a.texImage2D(re+fe,0,a.RGBA,1,1,0,a.RGBA,a.UNSIGNED_BYTE,oe):a.texImage3D(re,0,a.RGBA,1,1,j,0,a.RGBA,a.UNSIGNED_BYTE,oe);return pe}let F={};function J(b){c[b]!==!0&&(a.enable(b),c[b]=!0)}function z(b){c[b]!==!1&&(a.disable(b),c[b]=!1)}F[a.TEXTURE_2D]=M(a.TEXTURE_2D,a.TEXTURE_2D,1),F[a.TEXTURE_CUBE_MAP]=M(a.TEXTURE_CUBE_MAP,a.TEXTURE_CUBE_MAP_POSITIVE_X,6),i&&(F[a.TEXTURE_2D_ARRAY]=M(a.TEXTURE_2D_ARRAY,a.TEXTURE_2D_ARRAY,1,1),F[a.TEXTURE_3D]=M(a.TEXTURE_3D,a.TEXTURE_3D,1,1)),n.setClear(0,0,0,1),r.setClear(1),o.setClear(0),J(a.DEPTH_TEST),r.setFunc(3),k(!1),ie(1),J(a.CULL_FACE),U(0);let Y={[$a]:a.FUNC_ADD,101:a.FUNC_SUBTRACT,102:a.FUNC_REVERSE_SUBTRACT};if(i)Y[103]=a.MIN,Y[104]=a.MAX;else{let b=e.get("EXT_blend_minmax");b!==null&&(Y[103]=b.MIN_EXT,Y[104]=b.MAX_EXT)}let D={200:a.ZERO,201:a.ONE,202:a.SRC_COLOR,[lh]:a.SRC_ALPHA,210:a.SRC_ALPHA_SATURATE,208:a.DST_COLOR,206:a.DST_ALPHA,203:a.ONE_MINUS_SRC_COLOR,[ch]:a.ONE_MINUS_SRC_ALPHA,209:a.ONE_MINUS_DST_COLOR,207:a.ONE_MINUS_DST_ALPHA,211:a.CONSTANT_COLOR,212:a.ONE_MINUS_CONSTANT_COLOR,213:a.CONSTANT_ALPHA,214:a.ONE_MINUS_CONSTANT_ALPHA};function U(b,re,G,j,oe,pe,fe,_e,De,ve){if(b!==0){if(m===!1&&(J(a.BLEND),m=!0),b===5)oe=oe||re,pe=pe||G,fe=fe||j,re===f&&oe===v||(a.blendEquationSeparate(Y[re],Y[oe]),f=re,v=oe),G===x&&j===_&&pe===y&&fe===C||(a.blendFuncSeparate(D[G],D[j],D[pe],D[fe]),x=G,_=j,y=pe,C=fe),_e.equals(S)!==!1&&De===w||(a.blendColor(_e.r,_e.g,_e.b,De),S.copy(_e),w=De),g=b,O=!1;else if(b!==g||ve!==O){if(f===$a&&v===$a||(a.blendEquation(a.FUNC_ADD),f=$a,v=$a),ve)switch(b){case 1:a.blendFuncSeparate(a.ONE,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case 2:a.blendFunc(a.ONE,a.ONE);break;case 3:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case 4:a.blendFuncSeparate(a.ZERO,a.SRC_COLOR,a.ZERO,a.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",b)}else switch(b){case 1:a.blendFuncSeparate(a.SRC_ALPHA,a.ONE_MINUS_SRC_ALPHA,a.ONE,a.ONE_MINUS_SRC_ALPHA);break;case 2:a.blendFunc(a.SRC_ALPHA,a.ONE);break;case 3:a.blendFuncSeparate(a.ZERO,a.ONE_MINUS_SRC_COLOR,a.ZERO,a.ONE);break;case 4:a.blendFunc(a.ZERO,a.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",b)}x=null,_=null,y=null,C=null,S.set(0,0,0),w=0,g=b,O=ve}}else m===!0&&(z(a.BLEND),m=!1)}function k(b){N!==b&&(b?a.frontFace(a.CW):a.frontFace(a.CCW),N=b)}function ie(b){b!==0?(J(a.CULL_FACE),b!==B&&(b===1?a.cullFace(a.BACK):b===2?a.cullFace(a.FRONT):a.cullFace(a.FRONT_AND_BACK))):z(a.CULL_FACE),B=b}function ee(b,re,G){b?(J(a.POLYGON_OFFSET_FILL),R===re&&V===G||(a.polygonOffset(re,G),R=re,V=G)):z(a.POLYGON_OFFSET_FILL)}return{buffers:{color:n,depth:r,stencil:o},enable:J,disable:z,bindFramebuffer:function(b,re){return h[b]!==re&&(a.bindFramebuffer(b,re),h[b]=re,i&&(b===a.DRAW_FRAMEBUFFER&&(h[a.FRAMEBUFFER]=re),b===a.FRAMEBUFFER&&(h[a.DRAW_FRAMEBUFFER]=re)),!0)},drawBuffers:function(b,re){let G=d,j=!1;if(b)if(G=u.get(re),G===void 0&&(G=[],u.set(re,G)),b.isWebGLMultipleRenderTargets){let oe=b.texture;if(G.length!==oe.length||G[0]!==a.COLOR_ATTACHMENT0){for(let pe=0,fe=oe.length;pe<fe;pe++)G[pe]=a.COLOR_ATTACHMENT0+pe;G.length=oe.length,j=!0}}else G[0]!==a.COLOR_ATTACHMENT0&&(G[0]=a.COLOR_ATTACHMENT0,j=!0);else G[0]!==a.BACK&&(G[0]=a.BACK,j=!0);j&&(t.isWebGL2?a.drawBuffers(G):e.get("WEBGL_draw_buffers").drawBuffersWEBGL(G))},useProgram:function(b){return p!==b&&(a.useProgram(b),p=b,!0)},setBlending:U,setMaterial:function(b,re){b.side===2?z(a.CULL_FACE):J(a.CULL_FACE);let G=b.side===Ht;re&&(G=!G),k(G),b.blending===1&&b.transparent===!1?U(0):U(b.blending,b.blendEquation,b.blendSrc,b.blendDst,b.blendEquationAlpha,b.blendSrcAlpha,b.blendDstAlpha,b.blendColor,b.blendAlpha,b.premultipliedAlpha),r.setFunc(b.depthFunc),r.setTest(b.depthTest),r.setMask(b.depthWrite),n.setMask(b.colorWrite);let j=b.stencilWrite;o.setTest(j),j&&(o.setMask(b.stencilWriteMask),o.setFunc(b.stencilFunc,b.stencilRef,b.stencilFuncMask),o.setOp(b.stencilFail,b.stencilZFail,b.stencilZPass)),ee(b.polygonOffset,b.polygonOffsetFactor,b.polygonOffsetUnits),b.alphaToCoverage===!0?J(a.SAMPLE_ALPHA_TO_COVERAGE):z(a.SAMPLE_ALPHA_TO_COVERAGE)},setFlipSided:k,setCullFace:ie,setLineWidth:function(b){b!==$&&(le&&a.lineWidth(b),$=b)},setPolygonOffset:ee,setScissorTest:function(b){b?J(a.SCISSOR_TEST):z(a.SCISSOR_TEST)},activeTexture:function(b){b===void 0&&(b=a.TEXTURE0+W-1),Z!==b&&(a.activeTexture(b),Z=b)},bindTexture:function(b,re,G){G===void 0&&(G=Z===null?a.TEXTURE0+W-1:Z);let j=ae[G];j===void 0&&(j={type:void 0,texture:void 0},ae[G]=j),j.type===b&&j.texture===re||(Z!==G&&(a.activeTexture(G),Z=G),a.bindTexture(b,re||F[b]),j.type=b,j.texture=re)},unbindTexture:function(){let b=ae[Z];b!==void 0&&b.type!==void 0&&(a.bindTexture(b.type,null),b.type=void 0,b.texture=void 0)},compressedTexImage2D:function(){try{a.compressedTexImage2D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexImage3D:function(){try{a.compressedTexImage3D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texImage2D:function(){try{a.texImage2D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texImage3D:function(){try{a.texImage3D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},updateUBOMapping:function(b,re){let G=l.get(re);G===void 0&&(G=new WeakMap,l.set(re,G));let j=G.get(b);j===void 0&&(j=a.getUniformBlockIndex(re,b.name),G.set(b,j))},uniformBlockBinding:function(b,re){let G=l.get(re).get(b);s.get(re)!==G&&(a.uniformBlockBinding(re,G,b.__bindingPointIndex),s.set(re,G))},texStorage2D:function(){try{a.texStorage2D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texStorage3D:function(){try{a.texStorage3D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texSubImage2D:function(){try{a.texSubImage2D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},texSubImage3D:function(){try{a.texSubImage3D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexSubImage2D:function(){try{a.compressedTexSubImage2D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},compressedTexSubImage3D:function(){try{a.compressedTexSubImage3D.apply(a,arguments)}catch(b){console.error("THREE.WebGLState:",b)}},scissor:function(b){de.equals(b)===!1&&(a.scissor(b.x,b.y,b.z,b.w),de.copy(b))},viewport:function(b){T.equals(b)===!1&&(a.viewport(b.x,b.y,b.z,b.w),T.copy(b))},reset:function(){a.disable(a.BLEND),a.disable(a.CULL_FACE),a.disable(a.DEPTH_TEST),a.disable(a.POLYGON_OFFSET_FILL),a.disable(a.SCISSOR_TEST),a.disable(a.STENCIL_TEST),a.disable(a.SAMPLE_ALPHA_TO_COVERAGE),a.blendEquation(a.FUNC_ADD),a.blendFunc(a.ONE,a.ZERO),a.blendFuncSeparate(a.ONE,a.ZERO,a.ONE,a.ZERO),a.blendColor(0,0,0,0),a.colorMask(!0,!0,!0,!0),a.clearColor(0,0,0,0),a.depthMask(!0),a.depthFunc(a.LESS),a.clearDepth(1),a.stencilMask(4294967295),a.stencilFunc(a.ALWAYS,0,4294967295),a.stencilOp(a.KEEP,a.KEEP,a.KEEP),a.clearStencil(0),a.cullFace(a.BACK),a.frontFace(a.CCW),a.polygonOffset(0,0),a.activeTexture(a.TEXTURE0),a.bindFramebuffer(a.FRAMEBUFFER,null),i===!0&&(a.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),a.bindFramebuffer(a.READ_FRAMEBUFFER,null)),a.useProgram(null),a.lineWidth(1),a.scissor(0,0,a.canvas.width,a.canvas.height),a.viewport(0,0,a.canvas.width,a.canvas.height),c={},Z=null,ae={},h={},u=new WeakMap,d=[],p=null,m=!1,g=null,f=null,x=null,_=null,v=null,y=null,C=null,S=new xe(0,0,0),w=0,O=!1,N=null,B=null,$=null,R=null,V=null,de.set(0,0,a.canvas.width,a.canvas.height),T.set(0,0,a.canvas.width,a.canvas.height),n.reset(),r.reset(),o.reset()}}}function F_(a,e,t,i,n,r,o){let s=n.isWebGL2,l=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator<"u"&&/OculusBrowser/g.test(navigator.userAgent),h=new WeakMap,u,d=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(T,M){return p?new OffscreenCanvas(T,M):ks("canvas")}function g(T,M,F,J){let z=1;if((T.width>J||T.height>J)&&(z=J/Math.max(T.width,T.height)),z<1||M===!0){if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap){let Y=M?Fs:Math.floor,D=Y(z*T.width),U=Y(z*T.height);u===void 0&&(u=m(D,U));let k=F?m(D,U):u;return k.width=D,k.height=U,k.getContext("2d").drawImage(T,0,0,D,U),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+T.width+"x"+T.height+") to ("+D+"x"+U+")."),k}return"data"in T&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+T.width+"x"+T.height+")."),T}return T}function f(T){return fh(T.width)&&fh(T.height)}function x(T,M){return T.generateMipmaps&&M&&T.minFilter!==Xt&&T.minFilter!==ri}function _(T){a.generateMipmap(T)}function v(T,M,F,J,z=!1){if(s===!1)return M;if(T!==null){if(a[T]!==void 0)return a[T];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let Y=M;if(M===a.RED&&(F===a.FLOAT&&(Y=a.R32F),F===a.HALF_FLOAT&&(Y=a.R16F),F===a.UNSIGNED_BYTE&&(Y=a.R8)),M===a.RED_INTEGER&&(F===a.UNSIGNED_BYTE&&(Y=a.R8UI),F===a.UNSIGNED_SHORT&&(Y=a.R16UI),F===a.UNSIGNED_INT&&(Y=a.R32UI),F===a.BYTE&&(Y=a.R8I),F===a.SHORT&&(Y=a.R16I),F===a.INT&&(Y=a.R32I)),M===a.RG&&(F===a.FLOAT&&(Y=a.RG32F),F===a.HALF_FLOAT&&(Y=a.RG16F),F===a.UNSIGNED_BYTE&&(Y=a.RG8)),M===a.RGBA){let D=z?Ds:et.getTransfer(J);F===a.FLOAT&&(Y=a.RGBA32F),F===a.HALF_FLOAT&&(Y=a.RGBA16F),F===a.UNSIGNED_BYTE&&(Y=D===rt?a.SRGB8_ALPHA8:a.RGBA8),F===a.UNSIGNED_SHORT_4_4_4_4&&(Y=a.RGBA4),F===a.UNSIGNED_SHORT_5_5_5_1&&(Y=a.RGB5_A1)}return Y!==a.R16F&&Y!==a.R32F&&Y!==a.RG16F&&Y!==a.RG32F&&Y!==a.RGBA16F&&Y!==a.RGBA32F||e.get("EXT_color_buffer_float"),Y}function y(T,M,F){return x(T,F)===!0||T.isFramebufferTexture&&T.minFilter!==Xt&&T.minFilter!==ri?Math.log2(Math.max(M.width,M.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?M.mipmaps.length:1}function C(T){return T===Xt||T===Ud||T===Ac?a.NEAREST:a.LINEAR}function S(T){let M=T.target;M.removeEventListener("dispose",S),(function(F){let J=i.get(F);if(J.__webglInit===void 0)return;let z=F.source,Y=d.get(z);if(Y){let D=Y[J.__cacheKey];D.usedTimes--,D.usedTimes===0&&O(F),Object.keys(Y).length===0&&d.delete(z)}i.remove(F)})(M),M.isVideoTexture&&h.delete(M)}function w(T){let M=T.target;M.removeEventListener("dispose",w),(function(F){let J=F.texture,z=i.get(F),Y=i.get(J);if(Y.__webglTexture!==void 0&&(a.deleteTexture(Y.__webglTexture),o.memory.textures--),F.depthTexture&&F.depthTexture.dispose(),F.isWebGLCubeRenderTarget)for(let D=0;D<6;D++){if(Array.isArray(z.__webglFramebuffer[D]))for(let U=0;U<z.__webglFramebuffer[D].length;U++)a.deleteFramebuffer(z.__webglFramebuffer[D][U]);else a.deleteFramebuffer(z.__webglFramebuffer[D]);z.__webglDepthbuffer&&a.deleteRenderbuffer(z.__webglDepthbuffer[D])}else{if(Array.isArray(z.__webglFramebuffer))for(let D=0;D<z.__webglFramebuffer.length;D++)a.deleteFramebuffer(z.__webglFramebuffer[D]);else a.deleteFramebuffer(z.__webglFramebuffer);if(z.__webglDepthbuffer&&a.deleteRenderbuffer(z.__webglDepthbuffer),z.__webglMultisampledFramebuffer&&a.deleteFramebuffer(z.__webglMultisampledFramebuffer),z.__webglColorRenderbuffer)for(let D=0;D<z.__webglColorRenderbuffer.length;D++)z.__webglColorRenderbuffer[D]&&a.deleteRenderbuffer(z.__webglColorRenderbuffer[D]);z.__webglDepthRenderbuffer&&a.deleteRenderbuffer(z.__webglDepthRenderbuffer)}if(F.isWebGLMultipleRenderTargets)for(let D=0,U=J.length;D<U;D++){let k=i.get(J[D]);k.__webglTexture&&(a.deleteTexture(k.__webglTexture),o.memory.textures--),i.remove(J[D])}i.remove(J),i.remove(F)})(M)}function O(T){let M=i.get(T);a.deleteTexture(M.__webglTexture);let F=T.source;delete d.get(F)[M.__cacheKey],o.memory.textures--}let N=0;function B(T,M){let F=i.get(T);if(T.isVideoTexture&&(function(J){let z=o.render.frame;h.get(J)!==z&&(h.set(J,z),J.update())})(T),T.isRenderTargetTexture===!1&&T.version>0&&F.__version!==T.version){let J=T.image;if(J===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else{if(J.complete!==!1)return void ge(F,T,M);console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete")}}t.bindTexture(a.TEXTURE_2D,F.__webglTexture,a.TEXTURE0+M)}let $={[Kr]:a.REPEAT,[na]:a.CLAMP_TO_EDGE,[dh]:a.MIRRORED_REPEAT},R={[Xt]:a.NEAREST,[Ud]:a.NEAREST_MIPMAP_NEAREST,[Ac]:a.NEAREST_MIPMAP_LINEAR,[ri]:a.LINEAR,[Jg]:a.LINEAR_MIPMAP_NEAREST,[Is]:a.LINEAR_MIPMAP_LINEAR},V={512:a.NEVER,519:a.ALWAYS,513:a.LESS,515:a.LEQUAL,514:a.EQUAL,518:a.GEQUAL,516:a.GREATER,517:a.NOTEQUAL};function W(T,M,F){if(F?(a.texParameteri(T,a.TEXTURE_WRAP_S,$[M.wrapS]),a.texParameteri(T,a.TEXTURE_WRAP_T,$[M.wrapT]),T!==a.TEXTURE_3D&&T!==a.TEXTURE_2D_ARRAY||a.texParameteri(T,a.TEXTURE_WRAP_R,$[M.wrapR]),a.texParameteri(T,a.TEXTURE_MAG_FILTER,R[M.magFilter]),a.texParameteri(T,a.TEXTURE_MIN_FILTER,R[M.minFilter])):(a.texParameteri(T,a.TEXTURE_WRAP_S,a.CLAMP_TO_EDGE),a.texParameteri(T,a.TEXTURE_WRAP_T,a.CLAMP_TO_EDGE),T!==a.TEXTURE_3D&&T!==a.TEXTURE_2D_ARRAY||a.texParameteri(T,a.TEXTURE_WRAP_R,a.CLAMP_TO_EDGE),M.wrapS===na&&M.wrapT===na||console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),a.texParameteri(T,a.TEXTURE_MAG_FILTER,C(M.magFilter)),a.texParameteri(T,a.TEXTURE_MIN_FILTER,C(M.minFilter)),M.minFilter!==Xt&&M.minFilter!==ri&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(a.texParameteri(T,a.TEXTURE_COMPARE_MODE,a.COMPARE_REF_TO_TEXTURE),a.texParameteri(T,a.TEXTURE_COMPARE_FUNC,V[M.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){let J=e.get("EXT_texture_filter_anisotropic");if(M.magFilter===Xt||M.minFilter!==Ac&&M.minFilter!==Is||M.type===va&&e.has("OES_texture_float_linear")===!1||s===!1&&M.type===Qr&&e.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||i.get(M).__currentAnisotropy)&&(a.texParameterf(T,J.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,n.getMaxAnisotropy())),i.get(M).__currentAnisotropy=M.anisotropy)}}function le(T,M){let F=!1;T.__webglInit===void 0&&(T.__webglInit=!0,M.addEventListener("dispose",S));let J=M.source,z=d.get(J);z===void 0&&(z={},d.set(J,z));let Y=(function(D){let U=[];return U.push(D.wrapS),U.push(D.wrapT),U.push(D.wrapR||0),U.push(D.magFilter),U.push(D.minFilter),U.push(D.anisotropy),U.push(D.internalFormat),U.push(D.format),U.push(D.type),U.push(D.generateMipmaps),U.push(D.premultiplyAlpha),U.push(D.flipY),U.push(D.unpackAlignment),U.push(D.colorSpace),U.join()})(M);if(Y!==T.__cacheKey){z[Y]===void 0&&(z[Y]={texture:a.createTexture(),usedTimes:0},o.memory.textures++,F=!0),z[Y].usedTimes++;let D=z[T.__cacheKey];D!==void 0&&(z[T.__cacheKey].usedTimes--,D.usedTimes===0&&O(M)),T.__cacheKey=Y,T.__webglTexture=z[Y].texture}return F}function ge(T,M,F){let J=a.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(J=a.TEXTURE_2D_ARRAY),M.isData3DTexture&&(J=a.TEXTURE_3D);let z=le(T,M),Y=M.source;t.bindTexture(J,T.__webglTexture,a.TEXTURE0+F);let D=i.get(Y);if(Y.version!==D.__version||z===!0){t.activeTexture(a.TEXTURE0+F);let U=et.getPrimaries(et.workingColorSpace),k=M.colorSpace===Wi?null:et.getPrimaries(M.colorSpace),ie=M.colorSpace===Wi||U===k?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,M.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,M.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,ie);let ee=(function(be){return!s&&(be.wrapS!==na||be.wrapT!==na||be.minFilter!==Xt&&be.minFilter!==ri)})(M)&&f(M.image)===!1,b=g(M.image,ee,!1,n.maxTextureSize);b=de(M,b);let re=f(b)||s,G=r.convert(M.format,M.colorSpace),j,oe=r.convert(M.type),pe=v(M.internalFormat,G,oe,M.colorSpace,M.isVideoTexture);W(J,M,re);let fe=M.mipmaps,_e=s&&M.isVideoTexture!==!0&&pe!==vm,De=D.__version===void 0||z===!0,ve=y(M,b,re);if(M.isDepthTexture)pe=a.DEPTH_COMPONENT,s?pe=M.type===va?a.DEPTH_COMPONENT32F:M.type===_a?a.DEPTH_COMPONENT24:M.type===en?a.DEPTH24_STENCIL8:a.DEPTH_COMPONENT16:M.type===va&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===tn&&pe===a.DEPTH_COMPONENT&&M.type!==hu&&M.type!==_a&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=_a,oe=r.convert(M.type)),M.format===Jn&&pe===a.DEPTH_COMPONENT&&(pe=a.DEPTH_STENCIL,M.type!==en&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=en,oe=r.convert(M.type))),De&&(_e?t.texStorage2D(a.TEXTURE_2D,1,pe,b.width,b.height):t.texImage2D(a.TEXTURE_2D,0,pe,b.width,b.height,0,G,oe,null));else if(M.isDataTexture)if(fe.length>0&&re){_e&&De&&t.texStorage2D(a.TEXTURE_2D,ve,pe,fe[0].width,fe[0].height);for(let be=0,Oe=fe.length;be<Oe;be++)j=fe[be],_e?t.texSubImage2D(a.TEXTURE_2D,be,0,0,j.width,j.height,G,oe,j.data):t.texImage2D(a.TEXTURE_2D,be,pe,j.width,j.height,0,G,oe,j.data);M.generateMipmaps=!1}else _e?(De&&t.texStorage2D(a.TEXTURE_2D,ve,pe,b.width,b.height),t.texSubImage2D(a.TEXTURE_2D,0,0,0,b.width,b.height,G,oe,b.data)):t.texImage2D(a.TEXTURE_2D,0,pe,b.width,b.height,0,G,oe,b.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){_e&&De&&t.texStorage3D(a.TEXTURE_2D_ARRAY,ve,pe,fe[0].width,fe[0].height,b.depth);for(let be=0,Oe=fe.length;be<Oe;be++)j=fe[be],M.format!==ji?G!==null?_e?t.compressedTexSubImage3D(a.TEXTURE_2D_ARRAY,be,0,0,0,j.width,j.height,b.depth,G,j.data,0,0):t.compressedTexImage3D(a.TEXTURE_2D_ARRAY,be,pe,j.width,j.height,b.depth,0,j.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):_e?t.texSubImage3D(a.TEXTURE_2D_ARRAY,be,0,0,0,j.width,j.height,b.depth,G,oe,j.data):t.texImage3D(a.TEXTURE_2D_ARRAY,be,pe,j.width,j.height,b.depth,0,G,oe,j.data)}else{_e&&De&&t.texStorage2D(a.TEXTURE_2D,ve,pe,fe[0].width,fe[0].height);for(let be=0,Oe=fe.length;be<Oe;be++)j=fe[be],M.format!==ji?G!==null?_e?t.compressedTexSubImage2D(a.TEXTURE_2D,be,0,0,j.width,j.height,G,j.data):t.compressedTexImage2D(a.TEXTURE_2D,be,pe,j.width,j.height,0,j.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):_e?t.texSubImage2D(a.TEXTURE_2D,be,0,0,j.width,j.height,G,oe,j.data):t.texImage2D(a.TEXTURE_2D,be,pe,j.width,j.height,0,G,oe,j.data)}else if(M.isDataArrayTexture)_e?(De&&t.texStorage3D(a.TEXTURE_2D_ARRAY,ve,pe,b.width,b.height,b.depth),t.texSubImage3D(a.TEXTURE_2D_ARRAY,0,0,0,0,b.width,b.height,b.depth,G,oe,b.data)):t.texImage3D(a.TEXTURE_2D_ARRAY,0,pe,b.width,b.height,b.depth,0,G,oe,b.data);else if(M.isData3DTexture)_e?(De&&t.texStorage3D(a.TEXTURE_3D,ve,pe,b.width,b.height,b.depth),t.texSubImage3D(a.TEXTURE_3D,0,0,0,0,b.width,b.height,b.depth,G,oe,b.data)):t.texImage3D(a.TEXTURE_3D,0,pe,b.width,b.height,b.depth,0,G,oe,b.data);else if(M.isFramebufferTexture){if(De)if(_e)t.texStorage2D(a.TEXTURE_2D,ve,pe,b.width,b.height);else{let be=b.width,Oe=b.height;for(let Rt=0;Rt<ve;Rt++)t.texImage2D(a.TEXTURE_2D,Rt,pe,be,Oe,0,G,oe,null),be>>=1,Oe>>=1}}else if(fe.length>0&&re){_e&&De&&t.texStorage2D(a.TEXTURE_2D,ve,pe,fe[0].width,fe[0].height);for(let be=0,Oe=fe.length;be<Oe;be++)j=fe[be],_e?t.texSubImage2D(a.TEXTURE_2D,be,0,0,G,oe,j):t.texImage2D(a.TEXTURE_2D,be,pe,G,oe,j);M.generateMipmaps=!1}else _e?(De&&t.texStorage2D(a.TEXTURE_2D,ve,pe,b.width,b.height),t.texSubImage2D(a.TEXTURE_2D,0,0,0,G,oe,b)):t.texImage2D(a.TEXTURE_2D,0,pe,G,oe,b);x(M,re)&&_(J),D.__version=Y.version,M.onUpdate&&M.onUpdate(M)}T.__version=M.version}function ne(T,M,F,J,z,Y){let D=r.convert(F.format,F.colorSpace),U=r.convert(F.type),k=v(F.internalFormat,D,U,F.colorSpace);if(!i.get(M).__hasExternalTextures){let ie=Math.max(1,M.width>>Y),ee=Math.max(1,M.height>>Y);z===a.TEXTURE_3D||z===a.TEXTURE_2D_ARRAY?t.texImage3D(z,Y,k,ie,ee,M.depth,0,D,U,null):t.texImage2D(z,Y,k,ie,ee,0,D,U,null)}t.bindFramebuffer(a.FRAMEBUFFER,T),Q(M)?l.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,J,z,i.get(F).__webglTexture,0,H(M)):(z===a.TEXTURE_2D||z>=a.TEXTURE_CUBE_MAP_POSITIVE_X&&z<=a.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&a.framebufferTexture2D(a.FRAMEBUFFER,J,z,i.get(F).__webglTexture,Y),t.bindFramebuffer(a.FRAMEBUFFER,null)}function Z(T,M,F){if(a.bindRenderbuffer(a.RENDERBUFFER,T),M.depthBuffer&&!M.stencilBuffer){let J=s===!0?a.DEPTH_COMPONENT24:a.DEPTH_COMPONENT16;if(F||Q(M)){let z=M.depthTexture;z&&z.isDepthTexture&&(z.type===va?J=a.DEPTH_COMPONENT32F:z.type===_a&&(J=a.DEPTH_COMPONENT24));let Y=H(M);Q(M)?l.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,Y,J,M.width,M.height):a.renderbufferStorageMultisample(a.RENDERBUFFER,Y,J,M.width,M.height)}else a.renderbufferStorage(a.RENDERBUFFER,J,M.width,M.height);a.framebufferRenderbuffer(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.RENDERBUFFER,T)}else if(M.depthBuffer&&M.stencilBuffer){let J=H(M);F&&Q(M)===!1?a.renderbufferStorageMultisample(a.RENDERBUFFER,J,a.DEPTH24_STENCIL8,M.width,M.height):Q(M)?l.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,J,a.DEPTH24_STENCIL8,M.width,M.height):a.renderbufferStorage(a.RENDERBUFFER,a.DEPTH_STENCIL,M.width,M.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.RENDERBUFFER,T)}else{let J=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let z=0;z<J.length;z++){let Y=J[z],D=r.convert(Y.format,Y.colorSpace),U=r.convert(Y.type),k=v(Y.internalFormat,D,U,Y.colorSpace),ie=H(M);F&&Q(M)===!1?a.renderbufferStorageMultisample(a.RENDERBUFFER,ie,k,M.width,M.height):Q(M)?l.renderbufferStorageMultisampleEXT(a.RENDERBUFFER,ie,k,M.width,M.height):a.renderbufferStorage(a.RENDERBUFFER,k,M.width,M.height)}}a.bindRenderbuffer(a.RENDERBUFFER,null)}function ae(T){let M=i.get(T),F=T.isWebGLCubeRenderTarget===!0;if(T.depthTexture&&!M.__autoAllocateDepthBuffer){if(F)throw new Error("target.depthTexture not supported in Cube render targets");(function(J,z){if(z&&z.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(a.FRAMEBUFFER,J),!z.depthTexture||!z.depthTexture.isDepthTexture)throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");i.get(z.depthTexture).__webglTexture&&z.depthTexture.image.width===z.width&&z.depthTexture.image.height===z.height||(z.depthTexture.image.width=z.width,z.depthTexture.image.height=z.height,z.depthTexture.needsUpdate=!0),B(z.depthTexture,0);let Y=i.get(z.depthTexture).__webglTexture,D=H(z);if(z.depthTexture.format===tn)Q(z)?l.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,Y,0,D):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_ATTACHMENT,a.TEXTURE_2D,Y,0);else{if(z.depthTexture.format!==Jn)throw new Error("Unknown depthTexture format");Q(z)?l.framebufferTexture2DMultisampleEXT(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,Y,0,D):a.framebufferTexture2D(a.FRAMEBUFFER,a.DEPTH_STENCIL_ATTACHMENT,a.TEXTURE_2D,Y,0)}})(M.__webglFramebuffer,T)}else if(F){M.__webglDepthbuffer=[];for(let J=0;J<6;J++)t.bindFramebuffer(a.FRAMEBUFFER,M.__webglFramebuffer[J]),M.__webglDepthbuffer[J]=a.createRenderbuffer(),Z(M.__webglDepthbuffer[J],T,!1)}else t.bindFramebuffer(a.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=a.createRenderbuffer(),Z(M.__webglDepthbuffer,T,!1);t.bindFramebuffer(a.FRAMEBUFFER,null)}function H(T){return Math.min(n.maxSamples,T.samples)}function Q(T){let M=i.get(T);return s&&T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function de(T,M){let F=T.colorSpace,J=T.format,z=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||T.format===ph||F!==ra&&F!==Wi&&(et.getTransfer(F)===rt?s===!1?e.has("EXT_sRGB")===!0&&J===ji?(T.format=ph,T.minFilter=ri,T.generateMipmaps=!1):M=Hs.sRGBToLinear(M):J===ji&&z===Qa||console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",F)),M}this.allocateTextureUnit=function(){let T=N;return T>=n.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+T+" texture units while this GPU supports only "+n.maxTextures),N+=1,T},this.resetTextureUnits=function(){N=0},this.setTexture2D=B,this.setTexture2DArray=function(T,M){let F=i.get(T);T.version>0&&F.__version!==T.version?ge(F,T,M):t.bindTexture(a.TEXTURE_2D_ARRAY,F.__webglTexture,a.TEXTURE0+M)},this.setTexture3D=function(T,M){let F=i.get(T);T.version>0&&F.__version!==T.version?ge(F,T,M):t.bindTexture(a.TEXTURE_3D,F.__webglTexture,a.TEXTURE0+M)},this.setTextureCube=function(T,M){let F=i.get(T);T.version>0&&F.__version!==T.version?(function(J,z,Y){if(z.image.length!==6)return;let D=le(J,z),U=z.source;t.bindTexture(a.TEXTURE_CUBE_MAP,J.__webglTexture,a.TEXTURE0+Y);let k=i.get(U);if(U.version!==k.__version||D===!0){t.activeTexture(a.TEXTURE0+Y);let ie=et.getPrimaries(et.workingColorSpace),ee=z.colorSpace===Wi?null:et.getPrimaries(z.colorSpace),b=z.colorSpace===Wi||ie===ee?a.NONE:a.BROWSER_DEFAULT_WEBGL;a.pixelStorei(a.UNPACK_FLIP_Y_WEBGL,z.flipY),a.pixelStorei(a.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),a.pixelStorei(a.UNPACK_ALIGNMENT,z.unpackAlignment),a.pixelStorei(a.UNPACK_COLORSPACE_CONVERSION_WEBGL,b);let re=z.isCompressedTexture||z.image[0].isCompressedTexture,G=z.image[0]&&z.image[0].isDataTexture,j=[];for(let Ce=0;Ce<6;Ce++)j[Ce]=re||G?G?z.image[Ce].image:z.image[Ce]:g(z.image[Ce],!1,!0,n.maxCubemapSize),j[Ce]=de(z,j[Ce]);let oe=j[0],pe=f(oe)||s,fe=r.convert(z.format,z.colorSpace),_e=r.convert(z.type),De=v(z.internalFormat,fe,_e,z.colorSpace),ve=s&&z.isVideoTexture!==!0,be=k.__version===void 0||D===!0,Oe,Rt=y(z,oe,pe);if(W(a.TEXTURE_CUBE_MAP,z,pe),re){ve&&be&&t.texStorage2D(a.TEXTURE_CUBE_MAP,Rt,De,oe.width,oe.height);for(let Ce=0;Ce<6;Ce++){Oe=j[Ce].mipmaps;for(let Ye=0;Ye<Oe.length;Ye++){let je=Oe[Ye];z.format!==ji?fe!==null?ve?t.compressedTexSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye,0,0,je.width,je.height,fe,je.data):t.compressedTexImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye,De,je.width,je.height,0,je.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):ve?t.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye,0,0,je.width,je.height,fe,_e,je.data):t.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye,De,je.width,je.height,0,fe,_e,je.data)}}}else{Oe=z.mipmaps,ve&&be&&(Oe.length>0&&Rt++,t.texStorage2D(a.TEXTURE_CUBE_MAP,Rt,De,j[0].width,j[0].height));for(let Ce=0;Ce<6;Ce++)if(G){ve?t.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,0,0,0,j[Ce].width,j[Ce].height,fe,_e,j[Ce].data):t.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,0,De,j[Ce].width,j[Ce].height,0,fe,_e,j[Ce].data);for(let Ye=0;Ye<Oe.length;Ye++){let je=Oe[Ye].image[Ce].image;ve?t.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye+1,0,0,je.width,je.height,fe,_e,je.data):t.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye+1,De,je.width,je.height,0,fe,_e,je.data)}}else{ve?t.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,0,0,0,fe,_e,j[Ce]):t.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,0,De,fe,_e,j[Ce]);for(let Ye=0;Ye<Oe.length;Ye++){let je=Oe[Ye];ve?t.texSubImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye+1,0,0,fe,_e,je.image[Ce]):t.texImage2D(a.TEXTURE_CUBE_MAP_POSITIVE_X+Ce,Ye+1,De,fe,_e,je.image[Ce])}}}x(z,pe)&&_(a.TEXTURE_CUBE_MAP),k.__version=U.version,z.onUpdate&&z.onUpdate(z)}J.__version=z.version})(F,T,M):t.bindTexture(a.TEXTURE_CUBE_MAP,F.__webglTexture,a.TEXTURE0+M)},this.rebindTextures=function(T,M,F){let J=i.get(T);M!==void 0&&ne(J.__webglFramebuffer,T,T.texture,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,0),F!==void 0&&ae(T)},this.setupRenderTarget=function(T){let M=T.texture,F=i.get(T),J=i.get(M);T.addEventListener("dispose",w),T.isWebGLMultipleRenderTargets!==!0&&(J.__webglTexture===void 0&&(J.__webglTexture=a.createTexture()),J.__version=M.version,o.memory.textures++);let z=T.isWebGLCubeRenderTarget===!0,Y=T.isWebGLMultipleRenderTargets===!0,D=f(T)||s;if(z){F.__webglFramebuffer=[];for(let U=0;U<6;U++)if(s&&M.mipmaps&&M.mipmaps.length>0){F.__webglFramebuffer[U]=[];for(let k=0;k<M.mipmaps.length;k++)F.__webglFramebuffer[U][k]=a.createFramebuffer()}else F.__webglFramebuffer[U]=a.createFramebuffer()}else{if(s&&M.mipmaps&&M.mipmaps.length>0){F.__webglFramebuffer=[];for(let U=0;U<M.mipmaps.length;U++)F.__webglFramebuffer[U]=a.createFramebuffer()}else F.__webglFramebuffer=a.createFramebuffer();if(Y)if(n.drawBuffers){let U=T.texture;for(let k=0,ie=U.length;k<ie;k++){let ee=i.get(U[k]);ee.__webglTexture===void 0&&(ee.__webglTexture=a.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(s&&T.samples>0&&Q(T)===!1){let U=Y?M:[M];F.__webglMultisampledFramebuffer=a.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(a.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let k=0;k<U.length;k++){let ie=U[k];F.__webglColorRenderbuffer[k]=a.createRenderbuffer(),a.bindRenderbuffer(a.RENDERBUFFER,F.__webglColorRenderbuffer[k]);let ee=r.convert(ie.format,ie.colorSpace),b=r.convert(ie.type),re=v(ie.internalFormat,ee,b,ie.colorSpace,T.isXRRenderTarget===!0),G=H(T);a.renderbufferStorageMultisample(a.RENDERBUFFER,G,re,T.width,T.height),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+k,a.RENDERBUFFER,F.__webglColorRenderbuffer[k])}a.bindRenderbuffer(a.RENDERBUFFER,null),T.depthBuffer&&(F.__webglDepthRenderbuffer=a.createRenderbuffer(),Z(F.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(a.FRAMEBUFFER,null)}}if(z){t.bindTexture(a.TEXTURE_CUBE_MAP,J.__webglTexture),W(a.TEXTURE_CUBE_MAP,M,D);for(let U=0;U<6;U++)if(s&&M.mipmaps&&M.mipmaps.length>0)for(let k=0;k<M.mipmaps.length;k++)ne(F.__webglFramebuffer[U][k],T,M,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+U,k);else ne(F.__webglFramebuffer[U],T,M,a.COLOR_ATTACHMENT0,a.TEXTURE_CUBE_MAP_POSITIVE_X+U,0);x(M,D)&&_(a.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(Y){let U=T.texture;for(let k=0,ie=U.length;k<ie;k++){let ee=U[k],b=i.get(ee);t.bindTexture(a.TEXTURE_2D,b.__webglTexture),W(a.TEXTURE_2D,ee,D),ne(F.__webglFramebuffer,T,ee,a.COLOR_ATTACHMENT0+k,a.TEXTURE_2D,0),x(ee,D)&&_(a.TEXTURE_2D)}t.unbindTexture()}else{let U=a.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(s?U=T.isWebGL3DRenderTarget?a.TEXTURE_3D:a.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(U,J.__webglTexture),W(U,M,D),s&&M.mipmaps&&M.mipmaps.length>0)for(let k=0;k<M.mipmaps.length;k++)ne(F.__webglFramebuffer[k],T,M,a.COLOR_ATTACHMENT0,U,k);else ne(F.__webglFramebuffer,T,M,a.COLOR_ATTACHMENT0,U,0);x(M,D)&&_(U),t.unbindTexture()}T.depthBuffer&&ae(T)},this.updateRenderTargetMipmap=function(T){let M=f(T)||s,F=T.isWebGLMultipleRenderTargets===!0?T.texture:[T.texture];for(let J=0,z=F.length;J<z;J++){let Y=F[J];if(x(Y,M)){let D=T.isWebGLCubeRenderTarget?a.TEXTURE_CUBE_MAP:a.TEXTURE_2D,U=i.get(Y).__webglTexture;t.bindTexture(D,U),_(D),t.unbindTexture()}}},this.updateMultisampleRenderTarget=function(T){if(s&&T.samples>0&&Q(T)===!1){let M=T.isWebGLMultipleRenderTargets?T.texture:[T.texture],F=T.width,J=T.height,z=a.COLOR_BUFFER_BIT,Y=[],D=T.stencilBuffer?a.DEPTH_STENCIL_ATTACHMENT:a.DEPTH_ATTACHMENT,U=i.get(T),k=T.isWebGLMultipleRenderTargets===!0;if(k)for(let ie=0;ie<M.length;ie++)t.bindFramebuffer(a.FRAMEBUFFER,U.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+ie,a.RENDERBUFFER,null),t.bindFramebuffer(a.FRAMEBUFFER,U.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+ie,a.TEXTURE_2D,null,0);t.bindFramebuffer(a.READ_FRAMEBUFFER,U.__webglMultisampledFramebuffer),t.bindFramebuffer(a.DRAW_FRAMEBUFFER,U.__webglFramebuffer);for(let ie=0;ie<M.length;ie++){Y.push(a.COLOR_ATTACHMENT0+ie),T.depthBuffer&&Y.push(D);let ee=U.__ignoreDepthValues!==void 0&&U.__ignoreDepthValues;if(ee===!1&&(T.depthBuffer&&(z|=a.DEPTH_BUFFER_BIT),T.stencilBuffer&&(z|=a.STENCIL_BUFFER_BIT)),k&&a.framebufferRenderbuffer(a.READ_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.RENDERBUFFER,U.__webglColorRenderbuffer[ie]),ee===!0&&(a.invalidateFramebuffer(a.READ_FRAMEBUFFER,[D]),a.invalidateFramebuffer(a.DRAW_FRAMEBUFFER,[D])),k){let b=i.get(M[ie]).__webglTexture;a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0,a.TEXTURE_2D,b,0)}a.blitFramebuffer(0,0,F,J,0,0,F,J,z,a.NEAREST),c&&a.invalidateFramebuffer(a.READ_FRAMEBUFFER,Y)}if(t.bindFramebuffer(a.READ_FRAMEBUFFER,null),t.bindFramebuffer(a.DRAW_FRAMEBUFFER,null),k)for(let ie=0;ie<M.length;ie++){t.bindFramebuffer(a.FRAMEBUFFER,U.__webglMultisampledFramebuffer),a.framebufferRenderbuffer(a.FRAMEBUFFER,a.COLOR_ATTACHMENT0+ie,a.RENDERBUFFER,U.__webglColorRenderbuffer[ie]);let ee=i.get(M[ie]).__webglTexture;t.bindFramebuffer(a.FRAMEBUFFER,U.__webglFramebuffer),a.framebufferTexture2D(a.DRAW_FRAMEBUFFER,a.COLOR_ATTACHMENT0+ie,a.TEXTURE_2D,ee,0)}t.bindFramebuffer(a.DRAW_FRAMEBUFFER,U.__webglMultisampledFramebuffer)}},this.setupDepthRenderbuffer=ae,this.setupFrameBufferTexture=ne,this.useMultisampledRTT=Q}function k_(a,e,t){let i=t.isWebGL2;return{convert:function(n,r=""){let o,s=et.getTransfer(r);if(n===Qa)return a.UNSIGNED_BYTE;if(n===pm)return a.UNSIGNED_SHORT_4_4_4_4;if(n===mm)return a.UNSIGNED_SHORT_5_5_5_1;if(n===1010)return a.BYTE;if(n===1011)return a.SHORT;if(n===hu)return a.UNSIGNED_SHORT;if(n===dm)return a.INT;if(n===_a)return a.UNSIGNED_INT;if(n===va)return a.FLOAT;if(n===Qr)return i?a.HALF_FLOAT:(o=e.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(n===1021)return a.ALPHA;if(n===ji)return a.RGBA;if(n===1024)return a.LUMINANCE;if(n===1025)return a.LUMINANCE_ALPHA;if(n===tn)return a.DEPTH_COMPONENT;if(n===Jn)return a.DEPTH_STENCIL;if(n===ph)return o=e.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(n===1028)return a.RED;if(n===fm)return a.RED_INTEGER;if(n===1030)return a.RG;if(n===gm)return a.RG_INTEGER;if(n===_m)return a.RGBA_INTEGER;if(n===Cc||n===Rc||n===Lc||n===Pc)if(s===rt){if(o=e.get("WEBGL_compressed_texture_s3tc_srgb"),o===null)return null;if(n===Cc)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Rc)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Lc)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Pc)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else{if(o=e.get("WEBGL_compressed_texture_s3tc"),o===null)return null;if(n===Cc)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Rc)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Lc)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Pc)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}if(n===Od||n===Bd||n===Fd||n===kd){if(o=e.get("WEBGL_compressed_texture_pvrtc"),o===null)return null;if(n===Od)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Bd)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Fd)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===kd)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}if(n===vm)return o=e.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(n===Hd||n===Gd){if(o=e.get("WEBGL_compressed_texture_etc"),o===null)return null;if(n===Hd)return s===rt?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(n===Gd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}if(n===Vd||n===jd||n===Wd||n===qd||n===Xd||n===Yd||n===$d||n===Zd||n===Jd||n===Kd||n===Qd||n===ep||n===tp||n===ip){if(o=e.get("WEBGL_compressed_texture_astc"),o===null)return null;if(n===Vd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===jd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Wd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===qd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Xd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Yd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===$d)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Zd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===Jd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Kd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Qd)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ep)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===tp)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ip)return s===rt?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}if(n===Ic||n===ap||n===np){if(o=e.get("EXT_texture_compression_bptc"),o===null)return null;if(n===Ic)return s===rt?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===ap)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===np)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}if(n===36283||n===rp||n===op||n===sp){if(o=e.get("EXT_texture_compression_rgtc"),o===null)return null;if(n===Ic)return o.COMPRESSED_RED_RGTC1_EXT;if(n===rp)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===op)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===sp)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}return n===en?i?a.UNSIGNED_INT_24_8:(o=e.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):a[n]!==void 0?a[n]:null}}}var Ch=class extends Yt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}},lt=class extends gt{constructor(){super(),this.isGroup=!0,this.type="Group"}},H_={type:"move"},Yr=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new lt,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new lt,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new A,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new A),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new lt,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new A,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new A),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let n=null,r=null,o=null,s=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let g of e.hand.values()){let f=t.getJointPose(g,i),x=this._getHandJoint(c,g);f!==null&&(x.matrix.fromArray(f.transform.matrix),x.matrix.decompose(x.position,x.rotation,x.scale),x.matrixWorldNeedsUpdate=!0,x.jointRadius=f.radius),x.visible=f!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],d=h.position.distanceTo(u.position),p=.02,m=.005;c.inputState.pinching&&d>p+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&d<=p-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));s!==null&&(n=t.getPose(e.targetRaySpace,i),n===null&&r!==null&&(n=r),n!==null&&(s.matrix.fromArray(n.transform.matrix),s.matrix.decompose(s.position,s.rotation,s.scale),s.matrixWorldNeedsUpdate=!0,n.linearVelocity?(s.hasLinearVelocity=!0,s.linearVelocity.copy(n.linearVelocity)):s.hasLinearVelocity=!1,n.angularVelocity?(s.hasAngularVelocity=!0,s.angularVelocity.copy(n.angularVelocity)):s.hasAngularVelocity=!1,this.dispatchEvent(H_)))}return s!==null&&(s.visible=n!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new lt;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Rh=class extends Ma{constructor(e,t){super();let i=this,n=null,r=1,o=null,s="local-floor",l=1,c=null,h=null,u=null,d=null,p=null,m=null,g=t.getContextAttributes(),f=null,x=null,_=[],v=[],y=new ce,C=null,S=new Yt;S.layers.enable(1),S.viewport=new St;let w=new Yt;w.layers.enable(2),w.viewport=new St;let O=[S,w],N=new Ch;N.layers.enable(1),N.layers.enable(2);let B=null,$=null;function R(H){let Q=v.indexOf(H.inputSource);if(Q===-1)return;let de=_[Q];de!==void 0&&(de.update(H.inputSource,H.frame,c||o),de.dispatchEvent({type:H.type,data:H.inputSource}))}function V(){n.removeEventListener("select",R),n.removeEventListener("selectstart",R),n.removeEventListener("selectend",R),n.removeEventListener("squeeze",R),n.removeEventListener("squeezestart",R),n.removeEventListener("squeezeend",R),n.removeEventListener("end",V),n.removeEventListener("inputsourceschange",W);for(let H=0;H<_.length;H++){let Q=v[H];Q!==null&&(v[H]=null,_[H].disconnect(Q))}B=null,$=null,e.setRenderTarget(f),p=null,d=null,u=null,n=null,x=null,ae.stop(),i.isPresenting=!1,e.setPixelRatio(C),e.setSize(y.width,y.height,!1),i.dispatchEvent({type:"sessionend"})}function W(H){for(let Q=0;Q<H.removed.length;Q++){let de=H.removed[Q],T=v.indexOf(de);T>=0&&(v[T]=null,_[T].disconnect(de))}for(let Q=0;Q<H.added.length;Q++){let de=H.added[Q],T=v.indexOf(de);if(T===-1){for(let F=0;F<_.length;F++){if(F>=v.length){v.push(de),T=F;break}if(v[F]===null){v[F]=de,T=F;break}}if(T===-1)break}let M=_[T];M&&M.connect(de)}}this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(H){let Q=_[H];return Q===void 0&&(Q=new Yr,_[H]=Q),Q.getTargetRaySpace()},this.getControllerGrip=function(H){let Q=_[H];return Q===void 0&&(Q=new Yr,_[H]=Q),Q.getGripSpace()},this.getHand=function(H){let Q=_[H];return Q===void 0&&(Q=new Yr,_[H]=Q),Q.getHandSpace()},this.setFramebufferScaleFactor=function(H){r=H,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(H){s=H,i.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(H){c=H},this.getBaseLayer=function(){return d!==null?d:p},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return n},this.setSession=async function(H){if(n=H,n!==null){if(f=e.getRenderTarget(),n.addEventListener("select",R),n.addEventListener("selectstart",R),n.addEventListener("selectend",R),n.addEventListener("squeeze",R),n.addEventListener("squeezestart",R),n.addEventListener("squeezeend",R),n.addEventListener("end",V),n.addEventListener("inputsourceschange",W),g.xrCompatible!==!0&&await t.makeXRCompatible(),C=e.getPixelRatio(),e.getSize(y),n.renderState.layers===void 0||e.capabilities.isWebGL2===!1){let Q={antialias:n.renderState.layers!==void 0||g.antialias,alpha:!0,depth:g.depth,stencil:g.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(n,t,Q),n.updateRenderState({baseLayer:p}),e.setPixelRatio(1),e.setSize(p.framebufferWidth,p.framebufferHeight,!1),x=new oa(p.framebufferWidth,p.framebufferHeight,{format:ji,type:Qa,colorSpace:e.outputColorSpace,stencilBuffer:g.stencil})}else{let Q=null,de=null,T=null;g.depth&&(T=g.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,Q=g.stencil?Jn:tn,de=g.stencil?en:_a);let M={colorFormat:t.RGBA8,depthFormat:T,scaleFactor:r};u=new XRWebGLBinding(n,t),d=u.createProjectionLayer(M),n.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),x=new oa(d.textureWidth,d.textureHeight,{format:ji,type:Qa,depthTexture:new Zs(d.textureWidth,d.textureHeight,de,void 0,void 0,void 0,void 0,void 0,void 0,Q),stencilBuffer:g.stencil,colorSpace:e.outputColorSpace,samples:g.antialias?4:0}),e.properties.get(x).__ignoreDepthValues=d.ignoreDepthValues}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await n.requestReferenceSpace(s),ae.setContext(n),ae.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode};let le=new A,ge=new A;function ne(H,Q){Q===null?H.matrixWorld.copy(H.matrix):H.matrixWorld.multiplyMatrices(Q.matrixWorld,H.matrix),H.matrixWorldInverse.copy(H.matrixWorld).invert()}this.updateCamera=function(H){if(n===null)return;N.near=w.near=S.near=H.near,N.far=w.far=S.far=H.far,B===N.near&&$===N.far||(n.updateRenderState({depthNear:N.near,depthFar:N.far}),B=N.near,$=N.far);let Q=H.parent,de=N.cameras;ne(N,Q);for(let T=0;T<de.length;T++)ne(de[T],Q);de.length===2?(function(T,M,F){le.setFromMatrixPosition(M.matrixWorld),ge.setFromMatrixPosition(F.matrixWorld);let J=le.distanceTo(ge),z=M.projectionMatrix.elements,Y=F.projectionMatrix.elements,D=z[14]/(z[10]-1),U=z[14]/(z[10]+1),k=(z[9]+1)/z[5],ie=(z[9]-1)/z[5],ee=(z[8]-1)/z[0],b=(Y[8]+1)/Y[0],re=D*ee,G=D*b,j=J/(-ee+b),oe=j*-ee;M.matrixWorld.decompose(T.position,T.quaternion,T.scale),T.translateX(oe),T.translateZ(j),T.matrixWorld.compose(T.position,T.quaternion,T.scale),T.matrixWorldInverse.copy(T.matrixWorld).invert();let pe=D+j,fe=U+j,_e=re-oe,De=G+(J-oe),ve=k*U/fe*pe,be=ie*U/fe*pe;T.projectionMatrix.makePerspective(_e,De,ve,be,pe,fe),T.projectionMatrixInverse.copy(T.projectionMatrix).invert()})(N,S,w):N.projectionMatrix.copy(S.projectionMatrix),(function(T,M,F){F===null?T.matrix.copy(M.matrixWorld):(T.matrix.copy(F.matrixWorld),T.matrix.invert(),T.matrix.multiply(M.matrixWorld)),T.matrix.decompose(T.position,T.quaternion,T.scale),T.updateMatrixWorld(!0),T.projectionMatrix.copy(M.projectionMatrix),T.projectionMatrixInverse.copy(M.projectionMatrixInverse),T.isPerspectiveCamera&&(T.fov=2*eo*Math.atan(1/T.projectionMatrix.elements[5]),T.zoom=1)})(H,N,Q)},this.getCamera=function(){return N},this.getFoveation=function(){if(d!==null||p!==null)return l},this.setFoveation=function(H){l=H,d!==null&&(d.fixedFoveation=H),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=H)};let Z=null,ae=new Sm;ae.setAnimationLoop((function(H,Q){if(h=Q.getViewerPose(c||o),m=Q,h!==null){let de=h.views;p!==null&&(e.setRenderTargetFramebuffer(x,p.framebuffer),e.setRenderTarget(x));let T=!1;de.length!==N.cameras.length&&(N.cameras.length=0,T=!0);for(let M=0;M<de.length;M++){let F=de[M],J=null;if(p!==null)J=p.getViewport(F);else{let Y=u.getViewSubImage(d,F);J=Y.viewport,M===0&&(e.setRenderTargetTextures(x,Y.colorTexture,d.ignoreDepthValues?void 0:Y.depthStencilTexture),e.setRenderTarget(x))}let z=O[M];z===void 0&&(z=new Yt,z.layers.enable(M),z.viewport=new St,O[M]=z),z.matrix.fromArray(F.transform.matrix),z.matrix.decompose(z.position,z.quaternion,z.scale),z.projectionMatrix.fromArray(F.projectionMatrix),z.projectionMatrixInverse.copy(z.projectionMatrix).invert(),z.viewport.set(J.x,J.y,J.width,J.height),M===0&&(N.matrix.copy(z.matrix),N.matrix.decompose(N.position,N.quaternion,N.scale)),T===!0&&N.cameras.push(z)}}for(let de=0;de<_.length;de++){let T=v[de],M=_[de];T!==null&&M!==void 0&&M.update(T,Q,c||o)}Z&&Z(H,Q),Q.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:Q}),m=null})),this.setAnimationLoop=function(H){Z=H},this.dispose=function(){}}};function G_(a,e){function t(n,r){n.matrixAutoUpdate===!0&&n.updateMatrix(),r.value.copy(n.matrix)}function i(n,r){n.opacity.value=r.opacity,r.color&&n.diffuse.value.copy(r.color),r.emissive&&n.emissive.value.copy(r.emissive).multiplyScalar(r.emissiveIntensity),r.map&&(n.map.value=r.map,t(r.map,n.mapTransform)),r.alphaMap&&(n.alphaMap.value=r.alphaMap,t(r.alphaMap,n.alphaMapTransform)),r.bumpMap&&(n.bumpMap.value=r.bumpMap,t(r.bumpMap,n.bumpMapTransform),n.bumpScale.value=r.bumpScale,r.side===Ht&&(n.bumpScale.value*=-1)),r.normalMap&&(n.normalMap.value=r.normalMap,t(r.normalMap,n.normalMapTransform),n.normalScale.value.copy(r.normalScale),r.side===Ht&&n.normalScale.value.negate()),r.displacementMap&&(n.displacementMap.value=r.displacementMap,t(r.displacementMap,n.displacementMapTransform),n.displacementScale.value=r.displacementScale,n.displacementBias.value=r.displacementBias),r.emissiveMap&&(n.emissiveMap.value=r.emissiveMap,t(r.emissiveMap,n.emissiveMapTransform)),r.specularMap&&(n.specularMap.value=r.specularMap,t(r.specularMap,n.specularMapTransform)),r.alphaTest>0&&(n.alphaTest.value=r.alphaTest);let o=e.get(r).envMap;if(o&&(n.envMap.value=o,n.flipEnvMap.value=o.isCubeTexture&&o.isRenderTargetTexture===!1?-1:1,n.reflectivity.value=r.reflectivity,n.ior.value=r.ior,n.refractionRatio.value=r.refractionRatio),r.lightMap){n.lightMap.value=r.lightMap;let s=a._useLegacyLights===!0?Math.PI:1;n.lightMapIntensity.value=r.lightMapIntensity*s,t(r.lightMap,n.lightMapTransform)}r.aoMap&&(n.aoMap.value=r.aoMap,n.aoMapIntensity.value=r.aoMapIntensity,t(r.aoMap,n.aoMapTransform))}return{refreshFogUniforms:function(n,r){r.color.getRGB(n.fogColor.value,Mm(a)),r.isFog?(n.fogNear.value=r.near,n.fogFar.value=r.far):r.isFogExp2&&(n.fogDensity.value=r.density)},refreshMaterialUniforms:function(n,r,o,s,l){r.isMeshBasicMaterial||r.isMeshLambertMaterial?i(n,r):r.isMeshToonMaterial?(i(n,r),(function(c,h){h.gradientMap&&(c.gradientMap.value=h.gradientMap)})(n,r)):r.isMeshPhongMaterial?(i(n,r),(function(c,h){c.specular.value.copy(h.specular),c.shininess.value=Math.max(h.shininess,1e-4)})(n,r)):r.isMeshStandardMaterial?(i(n,r),(function(c,h){c.metalness.value=h.metalness,h.metalnessMap&&(c.metalnessMap.value=h.metalnessMap,t(h.metalnessMap,c.metalnessMapTransform)),c.roughness.value=h.roughness,h.roughnessMap&&(c.roughnessMap.value=h.roughnessMap,t(h.roughnessMap,c.roughnessMapTransform)),e.get(h).envMap&&(c.envMapIntensity.value=h.envMapIntensity)})(n,r),r.isMeshPhysicalMaterial&&(function(c,h,u){c.ior.value=h.ior,h.sheen>0&&(c.sheenColor.value.copy(h.sheenColor).multiplyScalar(h.sheen),c.sheenRoughness.value=h.sheenRoughness,h.sheenColorMap&&(c.sheenColorMap.value=h.sheenColorMap,t(h.sheenColorMap,c.sheenColorMapTransform)),h.sheenRoughnessMap&&(c.sheenRoughnessMap.value=h.sheenRoughnessMap,t(h.sheenRoughnessMap,c.sheenRoughnessMapTransform))),h.clearcoat>0&&(c.clearcoat.value=h.clearcoat,c.clearcoatRoughness.value=h.clearcoatRoughness,h.clearcoatMap&&(c.clearcoatMap.value=h.clearcoatMap,t(h.clearcoatMap,c.clearcoatMapTransform)),h.clearcoatRoughnessMap&&(c.clearcoatRoughnessMap.value=h.clearcoatRoughnessMap,t(h.clearcoatRoughnessMap,c.clearcoatRoughnessMapTransform)),h.clearcoatNormalMap&&(c.clearcoatNormalMap.value=h.clearcoatNormalMap,t(h.clearcoatNormalMap,c.clearcoatNormalMapTransform),c.clearcoatNormalScale.value.copy(h.clearcoatNormalScale),h.side===Ht&&c.clearcoatNormalScale.value.negate())),h.iridescence>0&&(c.iridescence.value=h.iridescence,c.iridescenceIOR.value=h.iridescenceIOR,c.iridescenceThicknessMinimum.value=h.iridescenceThicknessRange[0],c.iridescenceThicknessMaximum.value=h.iridescenceThicknessRange[1],h.iridescenceMap&&(c.iridescenceMap.value=h.iridescenceMap,t(h.iridescenceMap,c.iridescenceMapTransform)),h.iridescenceThicknessMap&&(c.iridescenceThicknessMap.value=h.iridescenceThicknessMap,t(h.iridescenceThicknessMap,c.iridescenceThicknessMapTransform))),h.transmission>0&&(c.transmission.value=h.transmission,c.transmissionSamplerMap.value=u.texture,c.transmissionSamplerSize.value.set(u.width,u.height),h.transmissionMap&&(c.transmissionMap.value=h.transmissionMap,t(h.transmissionMap,c.transmissionMapTransform)),c.thickness.value=h.thickness,h.thicknessMap&&(c.thicknessMap.value=h.thicknessMap,t(h.thicknessMap,c.thicknessMapTransform)),c.attenuationDistance.value=h.attenuationDistance,c.attenuationColor.value.copy(h.attenuationColor)),h.anisotropy>0&&(c.anisotropyVector.value.set(h.anisotropy*Math.cos(h.anisotropyRotation),h.anisotropy*Math.sin(h.anisotropyRotation)),h.anisotropyMap&&(c.anisotropyMap.value=h.anisotropyMap,t(h.anisotropyMap,c.anisotropyMapTransform))),c.specularIntensity.value=h.specularIntensity,c.specularColor.value.copy(h.specularColor),h.specularColorMap&&(c.specularColorMap.value=h.specularColorMap,t(h.specularColorMap,c.specularColorMapTransform)),h.specularIntensityMap&&(c.specularIntensityMap.value=h.specularIntensityMap,t(h.specularIntensityMap,c.specularIntensityMapTransform))})(n,r,l)):r.isMeshMatcapMaterial?(i(n,r),(function(c,h){h.matcap&&(c.matcap.value=h.matcap)})(n,r)):r.isMeshDepthMaterial?i(n,r):r.isMeshDistanceMaterial?(i(n,r),(function(c,h){let u=e.get(h).light;c.referencePosition.value.setFromMatrixPosition(u.matrixWorld),c.nearDistance.value=u.shadow.camera.near,c.farDistance.value=u.shadow.camera.far})(n,r)):r.isMeshNormalMaterial?i(n,r):r.isLineBasicMaterial?((function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform))})(n,r),r.isLineDashedMaterial&&(function(c,h){c.dashSize.value=h.dashSize,c.totalSize.value=h.dashSize+h.gapSize,c.scale.value=h.scale})(n,r)):r.isPointsMaterial?(function(c,h,u,d){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.size.value=h.size*u,c.scale.value=.5*d,h.map&&(c.map.value=h.map,t(h.map,c.uvTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)})(n,r,o,s):r.isSpriteMaterial?(function(c,h){c.diffuse.value.copy(h.color),c.opacity.value=h.opacity,c.rotation.value=h.rotation,h.map&&(c.map.value=h.map,t(h.map,c.mapTransform)),h.alphaMap&&(c.alphaMap.value=h.alphaMap,t(h.alphaMap,c.alphaMapTransform)),h.alphaTest>0&&(c.alphaTest.value=h.alphaTest)})(n,r):r.isShadowMaterial?(n.color.value.copy(r.color),n.opacity.value=r.opacity):r.isShaderMaterial&&(r.uniformsNeedUpdate=!1)}}}function V_(a,e,t,i){let n={},r={},o=[],s=t.isWebGL2?a.getParameter(a.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(u,d,p,m){let g=u.value,f=d+"_"+p;if(m[f]===void 0)return m[f]=typeof g=="number"||typeof g=="boolean"?g:g.clone(),!0;{let x=m[f];if(typeof g=="number"||typeof g=="boolean"){if(x!==g)return m[f]=g,!0}else if(x.equals(g)===!1)return x.copy(g),!0}return!1}function c(u){let d={boundary:0,storage:0};return typeof u=="number"||typeof u=="boolean"?(d.boundary=4,d.storage=4):u.isVector2?(d.boundary=8,d.storage=8):u.isVector3||u.isColor?(d.boundary=16,d.storage=12):u.isVector4?(d.boundary=16,d.storage=16):u.isMatrix3?(d.boundary=48,d.storage=48):u.isMatrix4?(d.boundary=64,d.storage=64):u.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",u),d}function h(u){let d=u.target;d.removeEventListener("dispose",h);let p=o.indexOf(d.__bindingPointIndex);o.splice(p,1),a.deleteBuffer(n[d.id]),delete n[d.id],delete r[d.id]}return{bind:function(u,d){let p=d.program;i.uniformBlockBinding(u,p)},update:function(u,d){let p=n[u.id];p===void 0&&((function(f){let x=f.uniforms,_=0,v=16;for(let C=0,S=x.length;C<S;C++){let w=Array.isArray(x[C])?x[C]:[x[C]];for(let O=0,N=w.length;O<N;O++){let B=w[O],$=Array.isArray(B.value)?B.value:[B.value];for(let R=0,V=$.length;R<V;R++){let W=c($[R]),le=_%v;le!==0&&v-le<W.boundary&&(_+=v-le),B.__data=new Float32Array(W.storage/Float32Array.BYTES_PER_ELEMENT),B.__offset=_,_+=W.storage}}}let y=_%v;y>0&&(_+=v-y),f.__size=_,f.__cache={}})(u),p=(function(f){let x=(function(){for(let C=0;C<s;C++)if(o.indexOf(C)===-1)return o.push(C),C;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0})();f.__bindingPointIndex=x;let _=a.createBuffer(),v=f.__size,y=f.usage;return a.bindBuffer(a.UNIFORM_BUFFER,_),a.bufferData(a.UNIFORM_BUFFER,v,y),a.bindBuffer(a.UNIFORM_BUFFER,null),a.bindBufferBase(a.UNIFORM_BUFFER,x,_),_})(u),n[u.id]=p,u.addEventListener("dispose",h));let m=d.program;i.updateUBOMapping(u,m);let g=e.render.frame;r[u.id]!==g&&((function(f){let x=n[f.id],_=f.uniforms,v=f.__cache;a.bindBuffer(a.UNIFORM_BUFFER,x);for(let y=0,C=_.length;y<C;y++){let S=Array.isArray(_[y])?_[y]:[_[y]];for(let w=0,O=S.length;w<O;w++){let N=S[w];if(l(N,y,w,v)===!0){let B=N.__offset,$=Array.isArray(N.value)?N.value:[N.value],R=0;for(let V=0;V<$.length;V++){let W=$[V],le=c(W);typeof W=="number"||typeof W=="boolean"?(N.__data[0]=W,a.bufferSubData(a.UNIFORM_BUFFER,B+R,N.__data)):W.isMatrix3?(N.__data[0]=W.elements[0],N.__data[1]=W.elements[1],N.__data[2]=W.elements[2],N.__data[3]=0,N.__data[4]=W.elements[3],N.__data[5]=W.elements[4],N.__data[6]=W.elements[5],N.__data[7]=0,N.__data[8]=W.elements[6],N.__data[9]=W.elements[7],N.__data[10]=W.elements[8],N.__data[11]=0):(W.toArray(N.__data,R),R+=le.storage/Float32Array.BYTES_PER_ELEMENT)}a.bufferSubData(a.UNIFORM_BUFFER,B,N.__data)}}}a.bindBuffer(a.UNIFORM_BUFFER,null)})(u),r[u.id]=g)},dispose:function(){for(let u in n)a.deleteBuffer(n[u]);o=[],n={},r={}}}}var ao=class{constructor(e={}){let{canvas:t=Kg(),context:i=null,depth:n=!0,stencil:r=!0,alpha:o=!1,antialias:s=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=e,d;this.isWebGLRenderer=!0,d=i!==null?i.getContextAttributes().alpha:o;let p=new Uint32Array(4),m=new Int32Array(4),g=null,f=null,x=[],_=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=xt,this._useLegacyLights=!1,this.toneMapping=xa,this.toneMappingExposure=1;let v=this,y=!1,C=0,S=0,w=null,O=-1,N=null,B=new St,$=new St,R=null,V=new xe(0),W=0,le=t.width,ge=t.height,ne=1,Z=null,ae=null,H=new St(0,0,le,ge),Q=new St(0,0,le,ge),de=!1,T=new er,M=!1,F=!1,J=null,z=new Re,Y=new ce,D=new A,U={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function k(){return w===null?ne:1}let ie,ee,b,re,G,j,oe,pe,fe,_e,De,ve,be,Oe,Rt,Ce,Ye,je,So,fn,To,hi,ti,gn,X=i;function wo(E,q){for(let K=0;K<E.length;K++){let se=E[K],te=t.getContext(se,q);if(te!==null)return te}return null}try{let E={alpha:!0,depth:n,stencil:r,antialias:s,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine","three.js r160"),t.addEventListener("webglcontextlost",Yu,!1),t.addEventListener("webglcontextrestored",$u,!1),t.addEventListener("webglcontextcreationerror",Zu,!1),X===null){let q=["webgl2","webgl","experimental-webgl"];if(v.isWebGL1Renderer===!0&&q.shift(),X=wo(q,E),X===null)throw wo(q)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext<"u"&&X instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),X.getShaderPrecisionFormat===void 0&&(X.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(E){throw console.error("THREE.WebGLRenderer: "+E.message),E}function fr(){ie=new T0(X),ee=new y0(X,ie,e),ie.init(ee),hi=new k_(X,ie,ee),b=new B_(X,ie,ee),re=new A0(X),G=new R_,j=new F_(X,ie,b,G,ee,hi,re),oe=new M0(v),pe=new S0(v),fe=new g0(X,ee),ti=new v0(X,ie,fe,ee),_e=new w0(X,fe,re,ti),De=new P0(X,_e,fe,re),So=new L0(X,ee,j),Ce=new b0(G),ve=new C_(v,oe,pe,ie,ee,ti,Ce),be=new G_(v,G),Oe=new P_,Rt=new U_(ie,ee),je=new _0(v,oe,pe,b,De,d,l),Ye=new O_(v,De,ee),gn=new V_(X,re,ee,b),fn=new x0(X,ie,re,ee),To=new E0(X,ie,re,ee),re.programs=ve.programs,v.capabilities=ee,v.extensions=ie,v.properties=G,v.renderLists=Oe,v.shadowMap=Ye,v.state=b,v.info=re}fr();let Dt=new Rh(v,X);function Yu(E){E.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),y=!0}function $u(){console.log("THREE.WebGLRenderer: Context Restored."),y=!1;let E=re.autoReset,q=Ye.enabled,K=Ye.autoUpdate,se=Ye.needsUpdate,te=Ye.type;fr(),re.autoReset=E,Ye.enabled=q,Ye.autoUpdate=K,Ye.needsUpdate=se,Ye.type=te}function Zu(E){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function Ju(E){let q=E.target;q.removeEventListener("dispose",Ju),(function(K){(function(se){let te=G.get(se).programs;te!==void 0&&(te.forEach((function(me){ve.releaseProgram(me)})),se.isShaderMaterial&&ve.releaseShaderCache(se))})(K),G.remove(K)})(q)}function Ku(E,q,K){E.transparent===!0&&E.side===2&&E.forceSinglePass===!1?(E.side=Ht,E.needsUpdate=!0,Ao(E,q,K),E.side=ba,E.needsUpdate=!0,Ao(E,q,K),E.side=2):Ao(E,q,K)}this.xr=Dt,this.getContext=function(){return X},this.getContextAttributes=function(){return X.getContextAttributes()},this.forceContextLoss=function(){let E=ie.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=ie.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(E){E!==void 0&&(ne=E,this.setSize(le,ge,!1))},this.getSize=function(E){return E.set(le,ge)},this.setSize=function(E,q,K=!0){Dt.isPresenting?console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting."):(le=E,ge=q,t.width=Math.floor(E*ne),t.height=Math.floor(q*ne),K===!0&&(t.style.width=E+"px",t.style.height=q+"px"),this.setViewport(0,0,E,q))},this.getDrawingBufferSize=function(E){return E.set(le*ne,ge*ne).floor()},this.setDrawingBufferSize=function(E,q,K){le=E,ge=q,ne=K,t.width=Math.floor(E*K),t.height=Math.floor(q*K),this.setViewport(0,0,E,q)},this.getCurrentViewport=function(E){return E.copy(B)},this.getViewport=function(E){return E.copy(H)},this.setViewport=function(E,q,K,se){E.isVector4?H.set(E.x,E.y,E.z,E.w):H.set(E,q,K,se),b.viewport(B.copy(H).multiplyScalar(ne).floor())},this.getScissor=function(E){return E.copy(Q)},this.setScissor=function(E,q,K,se){E.isVector4?Q.set(E.x,E.y,E.z,E.w):Q.set(E,q,K,se),b.scissor($.copy(Q).multiplyScalar(ne).floor())},this.getScissorTest=function(){return de},this.setScissorTest=function(E){b.setScissorTest(de=E)},this.setOpaqueSort=function(E){Z=E},this.setTransparentSort=function(E){ae=E},this.getClearColor=function(E){return E.copy(je.getClearColor())},this.setClearColor=function(){je.setClearColor.apply(je,arguments)},this.getClearAlpha=function(){return je.getClearAlpha()},this.setClearAlpha=function(){je.setClearAlpha.apply(je,arguments)},this.clear=function(E=!0,q=!0,K=!0){let se=0;if(E){let te=!1;if(w!==null){let me=w.texture.format;te=me===_m||me===gm||me===fm}if(te){let me=w.texture.type,Ie=me===Qa||me===_a||me===hu||me===en||me===pm||me===mm,ze=je.getClearColor(),Be=je.getClearAlpha(),He=ze.r,We=ze.g,qe=ze.b;Ie?(p[0]=He,p[1]=We,p[2]=qe,p[3]=Be,X.clearBufferuiv(X.COLOR,0,p)):(m[0]=He,m[1]=We,m[2]=qe,m[3]=Be,X.clearBufferiv(X.COLOR,0,m))}else se|=X.COLOR_BUFFER_BIT}q&&(se|=X.DEPTH_BUFFER_BIT),K&&(se|=X.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),X.clear(se)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",Yu,!1),t.removeEventListener("webglcontextrestored",$u,!1),t.removeEventListener("webglcontextcreationerror",Zu,!1),Oe.dispose(),Rt.dispose(),G.dispose(),oe.dispose(),pe.dispose(),De.dispose(),ti.dispose(),gn.dispose(),ve.dispose(),Dt.dispose(),Dt.removeEventListener("sessionstart",Qu),Dt.removeEventListener("sessionend",ed),J&&(J.dispose(),J=null),Na.stop()},this.renderBufferDirect=function(E,q,K,se,te,me){q===null&&(q=U);let Ie=te.isMesh&&te.matrixWorld.determinant()<0,ze=(function(wt,ui,Zt,Xe,$e){ui.isScene!==!0&&(ui=U),j.resetTextureUnits();let gr=ui.fog,Gl=Xe.isMeshStandardMaterial?ui.environment:null,Hf=w===null?v.outputColorSpace:w.isXRRenderTarget===!0?w.texture.colorSpace:ra,Co=(Xe.isMeshStandardMaterial?pe:oe).get(Xe.envMap||Gl),Gf=Xe.vertexColors===!0&&!!Zt.attributes.color&&Zt.attributes.color.itemSize===4,Vf=!!Zt.attributes.tangent&&(!!Xe.normalMap||Xe.anisotropy>0),jf=!!Zt.morphAttributes.position,Wf=!!Zt.morphAttributes.normal,qf=!!Zt.morphAttributes.color,od=xa;Xe.toneMapped&&(w!==null&&w.isXRRenderTarget!==!0||(od=v.toneMapping));let sd=Zt.morphAttributes.position||Zt.morphAttributes.normal||Zt.morphAttributes.color,Xf=sd!==void 0?sd.length:0,Je=G.get(Xe),Yf=f.state.lights;if(M===!0&&(F===!0||wt!==N)){let di=wt===N&&Xe.id===O;Ce.setState(Xe,wt,di)}let bi=!1;Xe.version===Je.__version?Je.needsLights&&Je.lightsStateVersion!==Yf.state.version||Je.outputColorSpace!==Hf||$e.isBatchedMesh&&Je.batching===!1?bi=!0:$e.isBatchedMesh||Je.batching!==!0?$e.isInstancedMesh&&Je.instancing===!1?bi=!0:$e.isInstancedMesh||Je.instancing!==!0?$e.isSkinnedMesh&&Je.skinning===!1?bi=!0:$e.isSkinnedMesh||Je.skinning!==!0?$e.isInstancedMesh&&Je.instancingColor===!0&&$e.instanceColor===null||$e.isInstancedMesh&&Je.instancingColor===!1&&$e.instanceColor!==null||Je.envMap!==Co||Xe.fog===!0&&Je.fog!==gr?bi=!0:Je.numClippingPlanes===void 0||Je.numClippingPlanes===Ce.numPlanes&&Je.numIntersection===Ce.numIntersection?(Je.vertexAlphas!==Gf||Je.vertexTangents!==Vf||Je.morphTargets!==jf||Je.morphNormals!==Wf||Je.morphColors!==qf||Je.toneMapping!==od||ee.isWebGL2===!0&&Je.morphTargetsCount!==Xf)&&(bi=!0):bi=!0:bi=!0:bi=!0:bi=!0:(bi=!0,Je.__version=Xe.version);let Ua=Je.currentProgram;bi===!0&&(Ua=Ao(Xe,ui,$e));let ld=!1,_r=!1,Vl=!1,Ut=Ua.getUniforms(),Oa=Je.uniforms;if(b.useProgram(Ua.program)&&(ld=!0,_r=!0,Vl=!0),Xe.id!==O&&(O=Xe.id,_r=!0),ld||N!==wt){Ut.setValue(X,"projectionMatrix",wt.projectionMatrix),Ut.setValue(X,"viewMatrix",wt.matrixWorldInverse);let di=Ut.map.cameraPosition;di!==void 0&&di.setValue(X,D.setFromMatrixPosition(wt.matrixWorld)),ee.logarithmicDepthBuffer&&Ut.setValue(X,"logDepthBufFC",2/(Math.log(wt.far+1)/Math.LN2)),(Xe.isMeshPhongMaterial||Xe.isMeshToonMaterial||Xe.isMeshLambertMaterial||Xe.isMeshBasicMaterial||Xe.isMeshStandardMaterial||Xe.isShaderMaterial)&&Ut.setValue(X,"isOrthographic",wt.isOrthographicCamera===!0),N!==wt&&(N=wt,_r=!0,Vl=!0)}if($e.isSkinnedMesh){Ut.setOptional(X,$e,"bindMatrix"),Ut.setOptional(X,$e,"bindMatrixInverse");let di=$e.skeleton;di&&(ee.floatVertexTextures?(di.boneTexture===null&&di.computeBoneTexture(),Ut.setValue(X,"boneTexture",di.boneTexture,j)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}$e.isBatchedMesh&&(Ut.setOptional(X,$e,"batchingTexture"),Ut.setValue(X,"batchingTexture",$e._matricesTexture,j));let jl=Zt.morphAttributes;(jl.position!==void 0||jl.normal!==void 0||jl.color!==void 0&&ee.isWebGL2===!0)&&So.update($e,Zt,Ua),(_r||Je.receiveShadow!==$e.receiveShadow)&&(Je.receiveShadow=$e.receiveShadow,Ut.setValue(X,"receiveShadow",$e.receiveShadow)),Xe.isMeshGouraudMaterial&&Xe.envMap!==null&&(Oa.envMap.value=Co,Oa.flipEnvMap.value=Co.isCubeTexture&&Co.isRenderTargetTexture===!1?-1:1),_r&&(Ut.setValue(X,"toneMappingExposure",v.toneMappingExposure),Je.needsLights&&(Mi=Vl,(Fi=Oa).ambientLightColor.needsUpdate=Mi,Fi.lightProbe.needsUpdate=Mi,Fi.directionalLights.needsUpdate=Mi,Fi.directionalLightShadows.needsUpdate=Mi,Fi.pointLights.needsUpdate=Mi,Fi.pointLightShadows.needsUpdate=Mi,Fi.spotLights.needsUpdate=Mi,Fi.spotLightShadows.needsUpdate=Mi,Fi.rectAreaLights.needsUpdate=Mi,Fi.hemisphereLights.needsUpdate=Mi),gr&&Xe.fog===!0&&be.refreshFogUniforms(Oa,gr),be.refreshMaterialUniforms(Oa,Xe,ne,ge,J),Yn.upload(X,nd(Je),Oa,j));var Fi,Mi;if(Xe.isShaderMaterial&&Xe.uniformsNeedUpdate===!0&&(Yn.upload(X,nd(Je),Oa,j),Xe.uniformsNeedUpdate=!1),Xe.isSpriteMaterial&&Ut.setValue(X,"center",$e.center),Ut.setValue(X,"modelViewMatrix",$e.modelViewMatrix),Ut.setValue(X,"normalMatrix",$e.normalMatrix),Ut.setValue(X,"modelMatrix",$e.matrixWorld),Xe.isShaderMaterial||Xe.isRawShaderMaterial){let di=Xe.uniformsGroups;for(let Wl=0,$f=di.length;Wl<$f;Wl++)if(ee.isWebGL2){let cd=di[Wl];gn.update(cd,Ua),gn.bind(cd,Ua)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ua})(E,q,K,se,te);b.setMaterial(se,Ie);let Be=K.index,He=1;if(se.wireframe===!0){if(Be=_e.getWireframeAttribute(K),Be===void 0)return;He=2}let We=K.drawRange,qe=K.attributes.position,ut=We.start*He,yi=(We.start+We.count)*He;me!==null&&(ut=Math.max(ut,me.start*He),yi=Math.min(yi,(me.start+me.count)*He)),Be!==null?(ut=Math.max(ut,0),yi=Math.min(yi,Be.count)):qe!=null&&(ut=Math.max(ut,0),yi=Math.min(yi,qe.count));let $i=yi-ut;if($i<0||$i===1/0)return;let Da;ti.setup(te,se,ze,K,Be);let dt=fn;if(Be!==null&&(Da=fe.get(Be),dt=To,dt.setIndex(Da)),te.isMesh)se.wireframe===!0?(b.setLineWidth(se.wireframeLinewidth*k()),dt.setMode(X.LINES)):dt.setMode(X.TRIANGLES);else if(te.isLine){let wt=se.linewidth;wt===void 0&&(wt=1),b.setLineWidth(wt*k()),te.isLineSegments?dt.setMode(X.LINES):te.isLineLoop?dt.setMode(X.LINE_LOOP):dt.setMode(X.LINE_STRIP)}else te.isPoints?dt.setMode(X.POINTS):te.isSprite&&dt.setMode(X.TRIANGLES);if(te.isBatchedMesh)dt.renderMultiDraw(te._multiDrawStarts,te._multiDrawCounts,te._multiDrawCount);else if(te.isInstancedMesh)dt.renderInstances(ut,$i,te.count);else if(K.isInstancedBufferGeometry){let wt=K._maxInstanceCount!==void 0?K._maxInstanceCount:1/0,ui=Math.min(K.instanceCount,wt);dt.renderInstances(ut,$i,ui)}else dt.render(ut,$i)},this.compile=function(E,q,K=null){K===null&&(K=E),f=Rt.get(K),f.init(),_.push(f),K.traverseVisible((function(te){te.isLight&&te.layers.test(q.layers)&&(f.pushLight(te),te.castShadow&&f.pushShadow(te))})),E!==K&&E.traverseVisible((function(te){te.isLight&&te.layers.test(q.layers)&&(f.pushLight(te),te.castShadow&&f.pushShadow(te))})),f.setupLights(v._useLegacyLights);let se=new Set;return E.traverse((function(te){let me=te.material;if(me)if(Array.isArray(me))for(let Ie=0;Ie<me.length;Ie++){let ze=me[Ie];Ku(ze,K,te),se.add(ze)}else Ku(me,K,te),se.add(me)})),_.pop(),f=null,se},this.compileAsync=function(E,q,K=null){let se=this.compile(E,q,K);return new Promise((te=>{function me(){se.forEach((function(Ie){G.get(Ie).currentProgram.isReady()&&se.delete(Ie)})),se.size!==0?setTimeout(me,10):te(E)}ie.get("KHR_parallel_shader_compile")!==null?me():setTimeout(me,10)}))};let Hl=null;function Qu(){Na.stop()}function ed(){Na.start()}let Na=new Sm;function td(E,q,K,se){if(E.visible===!1)return;if(E.layers.test(q.layers)){if(E.isGroup)K=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update(q);else if(E.isLight)f.pushLight(E),E.castShadow&&f.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||T.intersectsSprite(E)){se&&D.setFromMatrixPosition(E.matrixWorld).applyMatrix4(z);let me=De.update(E),Ie=E.material;Ie.visible&&g.push(E,me,Ie,K,D.z,null)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||T.intersectsObject(E))){let me=De.update(E),Ie=E.material;if(se&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),D.copy(E.boundingSphere.center)):(me.boundingSphere===null&&me.computeBoundingSphere(),D.copy(me.boundingSphere.center)),D.applyMatrix4(E.matrixWorld).applyMatrix4(z)),Array.isArray(Ie)){let ze=me.groups;for(let Be=0,He=ze.length;Be<He;Be++){let We=ze[Be],qe=Ie[We.materialIndex];qe&&qe.visible&&g.push(E,me,qe,K,D.z,We)}}else Ie.visible&&g.push(E,me,Ie,K,D.z,null)}}let te=E.children;for(let me=0,Ie=te.length;me<Ie;me++)td(te[me],q,K,se)}function id(E,q,K,se){let te=E.opaque,me=E.transmissive,Ie=E.transparent;f.setupLightsView(K),M===!0&&Ce.setGlobalState(v.clippingPlanes,K),me.length>0&&(function(ze,Be,He,We){if((He.isScene===!0?He.overrideMaterial:null)!==null)return;let ut=ee.isWebGL2;J===null&&(J=new oa(1,1,{generateMipmaps:!0,type:ie.has("EXT_color_buffer_half_float")?Qr:Qa,minFilter:Is,samples:ut?4:0})),v.getDrawingBufferSize(Y),ut?J.setSize(Y.x,Y.y):J.setSize(Fs(Y.x),Fs(Y.y));let yi=v.getRenderTarget();v.setRenderTarget(J),v.getClearColor(V),W=v.getClearAlpha(),W<1&&v.setClearColor(16777215,.5),v.clear();let $i=v.toneMapping;v.toneMapping=xa,Eo(ze,He,We),j.updateMultisampleRenderTarget(J),j.updateRenderTargetMipmap(J);let Da=!1;for(let dt=0,wt=Be.length;dt<wt;dt++){let ui=Be[dt],Zt=ui.object,Xe=ui.geometry,$e=ui.material,gr=ui.group;if($e.side===2&&Zt.layers.test(We.layers)){let Gl=$e.side;$e.side=Ht,$e.needsUpdate=!0,ad(Zt,He,We,Xe,$e,gr),$e.side=Gl,$e.needsUpdate=!0,Da=!0}}Da===!0&&(j.updateMultisampleRenderTarget(J),j.updateRenderTargetMipmap(J)),v.setRenderTarget(yi),v.setClearColor(V,W),v.toneMapping=$i})(te,me,q,K),se&&b.viewport(B.copy(se)),te.length>0&&Eo(te,q,K),me.length>0&&Eo(me,q,K),Ie.length>0&&Eo(Ie,q,K),b.buffers.depth.setTest(!0),b.buffers.depth.setMask(!0),b.buffers.color.setMask(!0),b.setPolygonOffset(!1)}function Eo(E,q,K){let se=q.isScene===!0?q.overrideMaterial:null;for(let te=0,me=E.length;te<me;te++){let Ie=E[te],ze=Ie.object,Be=Ie.geometry,He=se===null?Ie.material:se,We=Ie.group;ze.layers.test(K.layers)&&ad(ze,q,K,Be,He,We)}}function ad(E,q,K,se,te,me){E.onBeforeRender(v,q,K,se,te,me),E.modelViewMatrix.multiplyMatrices(K.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),te.onBeforeRender(v,q,K,se,E,me),te.transparent===!0&&te.side===2&&te.forceSinglePass===!1?(te.side=Ht,te.needsUpdate=!0,v.renderBufferDirect(K,q,se,te,E,me),te.side=ba,te.needsUpdate=!0,v.renderBufferDirect(K,q,se,te,E,me),te.side=2):v.renderBufferDirect(K,q,se,te,E,me),E.onAfterRender(v,q,K,se,te,me)}function Ao(E,q,K){q.isScene!==!0&&(q=U);let se=G.get(E),te=f.state.lights,me=f.state.shadowsArray,Ie=te.state.version,ze=ve.getParameters(E,te.state,me,q,K),Be=ve.getProgramCacheKey(ze),He=se.programs;se.environment=E.isMeshStandardMaterial?q.environment:null,se.fog=q.fog,se.envMap=(E.isMeshStandardMaterial?pe:oe).get(E.envMap||se.environment),He===void 0&&(E.addEventListener("dispose",Ju),He=new Map,se.programs=He);let We=He.get(Be);if(We!==void 0){if(se.currentProgram===We&&se.lightsStateVersion===Ie)return rd(E,ze),We}else ze.uniforms=ve.getUniforms(E),E.onBuild(K,ze,v),E.onBeforeCompile(ze,v),We=ve.acquireProgram(ze,Be),He.set(Be,We),se.uniforms=ze.uniforms;let qe=se.uniforms;return(E.isShaderMaterial||E.isRawShaderMaterial)&&E.clipping!==!0||(qe.clippingPlanes=Ce.uniform),rd(E,ze),se.needsLights=(function(ut){return ut.isMeshLambertMaterial||ut.isMeshToonMaterial||ut.isMeshPhongMaterial||ut.isMeshStandardMaterial||ut.isShadowMaterial||ut.isShaderMaterial&&ut.lights===!0})(E),se.lightsStateVersion=Ie,se.needsLights&&(qe.ambientLightColor.value=te.state.ambient,qe.lightProbe.value=te.state.probe,qe.directionalLights.value=te.state.directional,qe.directionalLightShadows.value=te.state.directionalShadow,qe.spotLights.value=te.state.spot,qe.spotLightShadows.value=te.state.spotShadow,qe.rectAreaLights.value=te.state.rectArea,qe.ltc_1.value=te.state.rectAreaLTC1,qe.ltc_2.value=te.state.rectAreaLTC2,qe.pointLights.value=te.state.point,qe.pointLightShadows.value=te.state.pointShadow,qe.hemisphereLights.value=te.state.hemi,qe.directionalShadowMap.value=te.state.directionalShadowMap,qe.directionalShadowMatrix.value=te.state.directionalShadowMatrix,qe.spotShadowMap.value=te.state.spotShadowMap,qe.spotLightMatrix.value=te.state.spotLightMatrix,qe.spotLightMap.value=te.state.spotLightMap,qe.pointShadowMap.value=te.state.pointShadowMap,qe.pointShadowMatrix.value=te.state.pointShadowMatrix),se.currentProgram=We,se.uniformsList=null,We}function nd(E){if(E.uniformsList===null){let q=E.currentProgram.getUniforms();E.uniformsList=Yn.seqWithValue(q.seq,E.uniforms)}return E.uniformsList}function rd(E,q){let K=G.get(E);K.outputColorSpace=q.outputColorSpace,K.batching=q.batching,K.instancing=q.instancing,K.instancingColor=q.instancingColor,K.skinning=q.skinning,K.morphTargets=q.morphTargets,K.morphNormals=q.morphNormals,K.morphColors=q.morphColors,K.morphTargetsCount=q.morphTargetsCount,K.numClippingPlanes=q.numClippingPlanes,K.numIntersection=q.numClipIntersection,K.vertexAlphas=q.vertexAlphas,K.vertexTangents=q.vertexTangents,K.toneMapping=q.toneMapping}Na.setAnimationLoop((function(E){Hl&&Hl(E)})),typeof self<"u"&&Na.setContext(self),this.setAnimationLoop=function(E){Hl=E,Dt.setAnimationLoop(E),E===null?Na.stop():Na.start()},Dt.addEventListener("sessionstart",Qu),Dt.addEventListener("sessionend",ed),this.render=function(E,q){if(q!==void 0&&q.isCamera!==!0)return void console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");if(y===!0)return;E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),q.parent===null&&q.matrixWorldAutoUpdate===!0&&q.updateMatrixWorld(),Dt.enabled===!0&&Dt.isPresenting===!0&&(Dt.cameraAutoUpdate===!0&&Dt.updateCamera(q),q=Dt.getCamera()),E.isScene===!0&&E.onBeforeRender(v,E,q,w),f=Rt.get(E,_.length),f.init(),_.push(f),z.multiplyMatrices(q.projectionMatrix,q.matrixWorldInverse),T.setFromProjectionMatrix(z),F=this.localClippingEnabled,M=Ce.init(this.clippingPlanes,F),g=Oe.get(E,x.length),g.init(),x.push(g),td(E,q,0,v.sortObjects),g.finish(),v.sortObjects===!0&&g.sort(Z,ae),this.info.render.frame++,M===!0&&Ce.beginShadows();let K=f.state.shadowsArray;if(Ye.render(K,E,q),M===!0&&Ce.endShadows(),this.info.autoReset===!0&&this.info.reset(),je.render(g,E),f.setupLights(v._useLegacyLights),q.isArrayCamera){let se=q.cameras;for(let te=0,me=se.length;te<me;te++){let Ie=se[te];id(g,E,Ie,Ie.viewport)}}else id(g,E,q);w!==null&&(j.updateMultisampleRenderTarget(w),j.updateRenderTargetMipmap(w)),E.isScene===!0&&E.onAfterRender(v,E,q),ti.resetDefaultState(),O=-1,N=null,_.pop(),f=_.length>0?_[_.length-1]:null,x.pop(),g=x.length>0?x[x.length-1]:null},this.getActiveCubeFace=function(){return C},this.getActiveMipmapLevel=function(){return S},this.getRenderTarget=function(){return w},this.setRenderTargetTextures=function(E,q,K){G.get(E.texture).__webglTexture=q,G.get(E.depthTexture).__webglTexture=K;let se=G.get(E);se.__hasExternalTextures=!0,se.__hasExternalTextures&&(se.__autoAllocateDepthBuffer=K===void 0,se.__autoAllocateDepthBuffer||ie.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),se.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(E,q){let K=G.get(E);K.__webglFramebuffer=q,K.__useDefaultFramebuffer=q===void 0},this.setRenderTarget=function(E,q=0,K=0){w=E,C=q,S=K;let se=!0,te=null,me=!1,Ie=!1;if(E){let ze=G.get(E);ze.__useDefaultFramebuffer!==void 0?(b.bindFramebuffer(X.FRAMEBUFFER,null),se=!1):ze.__webglFramebuffer===void 0?j.setupRenderTarget(E):ze.__hasExternalTextures&&j.rebindTextures(E,G.get(E.texture).__webglTexture,G.get(E.depthTexture).__webglTexture);let Be=E.texture;(Be.isData3DTexture||Be.isDataArrayTexture||Be.isCompressedArrayTexture)&&(Ie=!0);let He=G.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(te=Array.isArray(He[q])?He[q][K]:He[q],me=!0):te=ee.isWebGL2&&E.samples>0&&j.useMultisampledRTT(E)===!1?G.get(E).__webglMultisampledFramebuffer:Array.isArray(He)?He[K]:He,B.copy(E.viewport),$.copy(E.scissor),R=E.scissorTest}else B.copy(H).multiplyScalar(ne).floor(),$.copy(Q).multiplyScalar(ne).floor(),R=de;if(b.bindFramebuffer(X.FRAMEBUFFER,te)&&ee.drawBuffers&&se&&b.drawBuffers(E,te),b.viewport(B),b.scissor($),b.setScissorTest(R),me){let ze=G.get(E.texture);X.framebufferTexture2D(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,X.TEXTURE_CUBE_MAP_POSITIVE_X+q,ze.__webglTexture,K)}else if(Ie){let ze=G.get(E.texture),Be=q||0;X.framebufferTextureLayer(X.FRAMEBUFFER,X.COLOR_ATTACHMENT0,ze.__webglTexture,K||0,Be)}O=-1},this.readRenderTargetPixels=function(E,q,K,se,te,me,Ie){if(!E||!E.isWebGLRenderTarget)return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let ze=G.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Ie!==void 0&&(ze=ze[Ie]),ze){b.bindFramebuffer(X.FRAMEBUFFER,ze);try{let Be=E.texture,He=Be.format,We=Be.type;if(He!==ji&&hi.convert(He)!==X.getParameter(X.IMPLEMENTATION_COLOR_READ_FORMAT))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");let qe=We===Qr&&(ie.has("EXT_color_buffer_half_float")||ee.isWebGL2&&ie.has("EXT_color_buffer_float"));if(!(We===Qa||hi.convert(We)===X.getParameter(X.IMPLEMENTATION_COLOR_READ_TYPE)||We===va&&(ee.isWebGL2||ie.has("OES_texture_float")||ie.has("WEBGL_color_buffer_float"))||qe))return void console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");q>=0&&q<=E.width-se&&K>=0&&K<=E.height-te&&X.readPixels(q,K,se,te,hi.convert(He),hi.convert(We),me)}finally{let Be=w!==null?G.get(w).__webglFramebuffer:null;b.bindFramebuffer(X.FRAMEBUFFER,Be)}}},this.copyFramebufferToTexture=function(E,q,K=0){let se=Math.pow(2,-K),te=Math.floor(q.image.width*se),me=Math.floor(q.image.height*se);j.setTexture2D(q,0),X.copyTexSubImage2D(X.TEXTURE_2D,K,0,0,E.x,E.y,te,me),b.unbindTexture()},this.copyTextureToTexture=function(E,q,K,se=0){let te=q.image.width,me=q.image.height,Ie=hi.convert(K.format),ze=hi.convert(K.type);j.setTexture2D(K,0),X.pixelStorei(X.UNPACK_FLIP_Y_WEBGL,K.flipY),X.pixelStorei(X.UNPACK_PREMULTIPLY_ALPHA_WEBGL,K.premultiplyAlpha),X.pixelStorei(X.UNPACK_ALIGNMENT,K.unpackAlignment),q.isDataTexture?X.texSubImage2D(X.TEXTURE_2D,se,E.x,E.y,te,me,Ie,ze,q.image.data):q.isCompressedTexture?X.compressedTexSubImage2D(X.TEXTURE_2D,se,E.x,E.y,q.mipmaps[0].width,q.mipmaps[0].height,Ie,q.mipmaps[0].data):X.texSubImage2D(X.TEXTURE_2D,se,E.x,E.y,Ie,ze,q.image),se===0&&K.generateMipmaps&&X.generateMipmap(X.TEXTURE_2D),b.unbindTexture()},this.copyTextureToTexture3D=function(E,q,K,se,te=0){if(v.isWebGL1Renderer)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");let me=E.max.x-E.min.x+1,Ie=E.max.y-E.min.y+1,ze=E.max.z-E.min.z+1,Be=hi.convert(se.format),He=hi.convert(se.type),We;if(se.isData3DTexture)j.setTexture3D(se,0),We=X.TEXTURE_3D;else{if(!se.isDataArrayTexture&&!se.isCompressedArrayTexture)return void console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");j.setTexture2DArray(se,0),We=X.TEXTURE_2D_ARRAY}X.pixelStorei(X.UNPACK_FLIP_Y_WEBGL,se.flipY),X.pixelStorei(X.UNPACK_PREMULTIPLY_ALPHA_WEBGL,se.premultiplyAlpha),X.pixelStorei(X.UNPACK_ALIGNMENT,se.unpackAlignment);let qe=X.getParameter(X.UNPACK_ROW_LENGTH),ut=X.getParameter(X.UNPACK_IMAGE_HEIGHT),yi=X.getParameter(X.UNPACK_SKIP_PIXELS),$i=X.getParameter(X.UNPACK_SKIP_ROWS),Da=X.getParameter(X.UNPACK_SKIP_IMAGES),dt=K.isCompressedTexture?K.mipmaps[te]:K.image;X.pixelStorei(X.UNPACK_ROW_LENGTH,dt.width),X.pixelStorei(X.UNPACK_IMAGE_HEIGHT,dt.height),X.pixelStorei(X.UNPACK_SKIP_PIXELS,E.min.x),X.pixelStorei(X.UNPACK_SKIP_ROWS,E.min.y),X.pixelStorei(X.UNPACK_SKIP_IMAGES,E.min.z),K.isDataTexture||K.isData3DTexture?X.texSubImage3D(We,te,q.x,q.y,q.z,me,Ie,ze,Be,He,dt.data):K.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),X.compressedTexSubImage3D(We,te,q.x,q.y,q.z,me,Ie,ze,Be,dt.data)):X.texSubImage3D(We,te,q.x,q.y,q.z,me,Ie,ze,Be,He,dt),X.pixelStorei(X.UNPACK_ROW_LENGTH,qe),X.pixelStorei(X.UNPACK_IMAGE_HEIGHT,ut),X.pixelStorei(X.UNPACK_SKIP_PIXELS,yi),X.pixelStorei(X.UNPACK_SKIP_ROWS,$i),X.pixelStorei(X.UNPACK_SKIP_IMAGES,Da),te===0&&se.generateMipmaps&&X.generateMipmap(We),b.unbindTexture()},this.initTexture=function(E){E.isCubeTexture?j.setTextureCube(E,0):E.isData3DTexture?j.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?j.setTexture2DArray(E,0):j.setTexture2D(E,0),b.unbindTexture()},this.resetState=function(){C=0,S=0,w=null,b.reset(),ti.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=e===uu?"display-p3":"srgb",t.unpackColorSpace=et.workingColorSpace===pl?"display-p3":"srgb"}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===xt?an:xm}set outputEncoding(e){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=e===an?xt:ra}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(e){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=e}},Lh=class extends ao{};Lh.prototype.isWebGL1Renderer=!0;var Js=class a{constructor(e,t=25e-5){this.isFogExp2=!0,this.name="",this.color=new xe(e),this.density=t}clone(){return new a(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Ks=class extends gt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}};var Gx=new A;var Vx=new A,jx=new A,Wx=new A,qx=new ce,Xx=new ce,Yx=new Re,$x=new A,Zx=new A,Jx=new A,Kx=new ce,Qx=new ce,ey=new ce;var ty=new A,iy=new A;var ay=new A,ny=new St,ry=new St,oy=new A,sy=new Re,ly=new A,cy=new si,hy=new Re,uy=new nn;var no=class extends oi{constructor(e=null,t=1,i=1,n,r,o,s,l,c=1003,h=1003,u,d){super(null,o,s,l,c,h,n,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},dy=new Re,py=new Re;var Qs=class extends $t{constructor(e,t,i,n=1){super(e,t,i),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Vn=new Re,Jp=new Re,Ts=[],Kp=new Ni,j_=new Re,jr=new ft,Wr=new si,Gt=class extends ft{constructor(e,t,i){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Qs(new Float32Array(16*i),16),this.instanceColor=null,this.count=i,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<i;n++)this.setMatrixAt(n,j_)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ni),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Vn),Kp.copy(e.boundingBox).applyMatrix4(Vn),this.boundingBox.union(Kp)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new si),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let i=0;i<t;i++)this.getMatrixAt(i,Vn),Wr.copy(e.boundingSphere).applyMatrix4(Vn),this.boundingSphere.union(Wr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,3*e)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,16*e)}raycast(e,t){let i=this.matrixWorld,n=this.count;if(jr.geometry=this.geometry,jr.material=this.material,jr.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Wr.copy(this.boundingSphere),Wr.applyMatrix4(i),e.ray.intersectsSphere(Wr)!==!1))for(let r=0;r<n;r++){this.getMatrixAt(r,Vn),Jp.multiplyMatrices(i,Vn),jr.matrixWorld=Jp,jr.raycast(e,Ts);for(let o=0,s=Ts.length;o<s;o++){let l=Ts[o];l.instanceId=r,l.object=this,t.push(l)}Ts.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Qs(new Float32Array(3*this.instanceMatrix.count),3)),t.toArray(this.instanceColor.array,3*e)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,16*e)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}};var Ph=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t){let i=this.pool,n=this.list;this.index>=i.length&&i.push({start:-1,count:-1,z:-1});let r=i[this.index];n.push(r),this.index++,r.start=e.start,r.count=e.count,r.z=t}reset(){this.list.length=0,this.index=0}};var my=new Re,fy=new Re,gy=new Re,_y=new Re,vy=new er,xy=new Ni,yy=new si,by=new A,My=new Ph,Sy=new ft;var Ty=new A,wy=new A,Ey=new Re,Ay=new nn,Cy=new si;var Ry=new A,Ly=new A;var Py=new Re,Iy=new nn,zy=new si,Ny=new A;var Ea=class extends oi{constructor(e,t,i,n,r,o,s,l,c){super(e,t,i,n,r,o,s,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}},gi=class{constructor(){this.type="Curve",this.arcLengthDivisions=200}getPoint(){return console.warn("THREE.Curve: .getPoint() not implemented."),null}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,n=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(n),t.push(r),n=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t){let i=this.getLengths(),n=0,r=i.length,o;o=t||e*i[r-1];let s,l=0,c=r-1;for(;l<=c;)if(n=Math.floor(l+(c-l)/2),s=i[n]-o,s<0)l=n+1;else{if(!(s>0)){c=n;break}c=n-1}if(n=c,i[n]===o)return n/(r-1);let h=i[n];return(n+(o-h)/(i[n+1]-h))/(r-1)}getTangent(e,t){let n=e-1e-4,r=e+1e-4;n<0&&(n=0),r>1&&(r=1);let o=this.getPoint(n),s=this.getPoint(r),l=t||(o.isVector2?new ce:new A);return l.copy(s).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t){let i=new A,n=[],r=[],o=[],s=new A,l=new Re;for(let p=0;p<=e;p++){let m=p/e;n[p]=this.getTangentAt(m,new A)}r[0]=new A,o[0]=new A;let c=Number.MAX_VALUE,h=Math.abs(n[0].x),u=Math.abs(n[0].y),d=Math.abs(n[0].z);h<=c&&(c=h,i.set(1,0,0)),u<=c&&(c=u,i.set(0,1,0)),d<=c&&i.set(0,0,1),s.crossVectors(n[0],i).normalize(),r[0].crossVectors(n[0],s),o[0].crossVectors(n[0],r[0]);for(let p=1;p<=e;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),s.crossVectors(n[p-1],n[p]),s.length()>Number.EPSILON){s.normalize();let m=Math.acos(Pt(n[p-1].dot(n[p]),-1,1));r[p].applyMatrix4(l.makeRotationAxis(s,m))}o[p].crossVectors(n[p],r[p])}if(t===!0){let p=Math.acos(Pt(r[0].dot(r[e]),-1,1));p/=e,n[0].dot(s.crossVectors(r[0],r[e]))>0&&(p=-p);for(let m=1;m<=e;m++)r[m].applyMatrix4(l.makeRotationAxis(n[m],p*m)),o[m].crossVectors(n[m],r[m])}return{tangents:n,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.6,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ro=class extends gi{constructor(e=0,t=0,i=1,n=1,r=0,o=2*Math.PI,s=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=n,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=s,this.aRotation=l}getPoint(e,t){let i=t||new ce,n=2*Math.PI,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=n;for(;r>n;)r-=n;r<Number.EPSILON&&(r=o?0:n),this.aClockwise!==!0||o||(r===n?r=-n:r-=n);let s=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(s),c=this.aY+this.yRadius*Math.sin(s);if(this.aRotation!==0){let h=Math.cos(this.aRotation),u=Math.sin(this.aRotation),d=l-this.aX,p=c-this.aY;l=d*h-p*u+this.aX,c=d*u+p*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ih=class extends ro{constructor(e,t,i,n,r,o){super(e,t,i,i,n,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function pu(){let a=0,e=0,t=0,i=0;function n(r,o,s,l){a=r,e=s,t=-3*r+3*o-2*s-l,i=2*r-2*o+s+l}return{initCatmullRom:function(r,o,s,l,c){n(o,s,c*(s-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,s,l,c,h,u){let d=(o-r)/c-(s-r)/(c+h)+(s-o)/h,p=(s-o)/h-(l-o)/(h+u)+(l-s)/u;d*=h,p*=h,n(o,s,d,p)},calc:function(r){let o=r*r;return a+e*r+t*o+i*(o*r)}}}var ws=new A,ih=new pu,ah=new pu,nh=new pu,zh=class extends gi{constructor(e=[],t=!1,i="centripetal",n=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=n}getPoint(e,t=new A){let i=t,n=this.points,r=n.length,o=(r-(this.closed?0:1))*e,s,l,c=Math.floor(o),h=o-c;this.closed?c+=c>0?0:(Math.floor(Math.abs(c)/r)+1)*r:h===0&&c===r-1&&(c=r-2,h=1),this.closed||c>0?s=n[(c-1)%r]:(ws.subVectors(n[0],n[1]).add(n[0]),s=ws);let u=n[c%r],d=n[(c+1)%r];if(this.closed||c+2<r?l=n[(c+2)%r]:(ws.subVectors(n[r-1],n[r-2]).add(n[r-1]),l=ws),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,m=Math.pow(s.distanceToSquared(u),p),g=Math.pow(u.distanceToSquared(d),p),f=Math.pow(d.distanceToSquared(l),p);g<1e-4&&(g=1),m<1e-4&&(m=g),f<1e-4&&(f=g),ih.initNonuniformCatmullRom(s.x,u.x,d.x,l.x,m,g,f),ah.initNonuniformCatmullRom(s.y,u.y,d.y,l.y,m,g,f),nh.initNonuniformCatmullRom(s.z,u.z,d.z,l.z,m,g,f)}else this.curveType==="catmullrom"&&(ih.initCatmullRom(s.x,u.x,d.x,l.x,this.tension),ah.initCatmullRom(s.y,u.y,d.y,l.y,this.tension),nh.initCatmullRom(s.z,u.z,d.z,l.z,this.tension));return i.set(ih.calc(h),ah.calc(h),nh.calc(h)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let n=e.points[t];this.points.push(n.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let n=this.points[t];e.points.push(n.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let n=e.points[t];this.points.push(new A().fromArray(n))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Qp(a,e,t,i,n){let r=.5*(i-e),o=.5*(n-t),s=a*a;return(2*t-2*i+r+o)*(a*s)+(-3*t+3*i-2*r-o)*s+r*a+t}function $r(a,e,t,i){return(function(n,r){let o=1-n;return o*o*r})(a,e)+(function(n,r){return 2*(1-n)*n*r})(a,t)+(function(n,r){return n*n*r})(a,i)}function Zr(a,e,t,i,n){return(function(r,o){let s=1-r;return s*s*s*o})(a,e)+(function(r,o){let s=1-r;return 3*s*s*r*o})(a,t)+(function(r,o){return 3*(1-r)*r*r*o})(a,i)+(function(r,o){return r*r*r*o})(a,n)}var el=class extends gi{constructor(e=new ce,t=new ce,i=new ce,n=new ce){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=n}getPoint(e,t=new ce){let i=t,n=this.v0,r=this.v1,o=this.v2,s=this.v3;return i.set(Zr(e,n.x,r.x,o.x,s.x),Zr(e,n.y,r.y,o.y,s.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Nh=class extends gi{constructor(e=new A,t=new A,i=new A,n=new A){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=n}getPoint(e,t=new A){let i=t,n=this.v0,r=this.v1,o=this.v2,s=this.v3;return i.set(Zr(e,n.x,r.x,o.x,s.x),Zr(e,n.y,r.y,o.y,s.y),Zr(e,n.z,r.z,o.z,s.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},tl=class extends gi{constructor(e=new ce,t=new ce){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ce){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ce){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Dh=class extends gi{constructor(e=new A,t=new A){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new A){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new A){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},il=class extends gi{constructor(e=new ce,t=new ce,i=new ce){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ce){let i=t,n=this.v0,r=this.v1,o=this.v2;return i.set($r(e,n.x,r.x,o.x),$r(e,n.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},al=class extends gi{constructor(e=new A,t=new A,i=new A){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new A){let i=t,n=this.v0,r=this.v1,o=this.v2;return i.set($r(e,n.x,r.x,o.x),$r(e,n.y,r.y,o.y),$r(e,n.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},nl=class extends gi{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ce){let i=t,n=this.points,r=(n.length-1)*e,o=Math.floor(r),s=r-o,l=n[o===0?o:o-1],c=n[o],h=n[o>n.length-2?n.length-1:o+1],u=n[o>n.length-3?n.length-1:o+2];return i.set(Qp(s,l.x,c.x,h.x,u.x),Qp(s,l.y,c.y,h.y,u.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let n=e.points[t];this.points.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let n=this.points[t];e.points.push(n.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let n=e.points[t];this.points.push(new ce().fromArray(n))}return this}},rl=Object.freeze({__proto__:null,ArcCurve:Ih,CatmullRomCurve3:zh,CubicBezierCurve:el,CubicBezierCurve3:Nh,EllipseCurve:ro,LineCurve:tl,LineCurve3:Dh,QuadraticBezierCurve:il,QuadraticBezierCurve3:al,SplineCurve:nl}),Uh=class extends gi{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new rl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),n=this.getCurveLengths(),r=0;for(;r<n.length;){if(n[r]>=i){let o=n[r]-i,s=this.curves[r],l=s.getLength(),c=l===0?0:1-o/l;return s.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,n=this.curves.length;i<n;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let n=0,r=this.curves;n<r.length;n++){let o=r[n],s=o.isEllipseCurve?2*e:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(s);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let n=e.curves[t];this.curves.push(n.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let n=this.curves[t];e.curves.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let n=e.curves[t];this.curves.push(new rl[n.type]().fromJSON(n))}return this}},oo=class extends Uh{constructor(e){super(),this.type="Path",this.currentPoint=new ce,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new tl(this.currentPoint.clone(),new ce(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,n){let r=new il(this.currentPoint.clone(),new ce(e,t),new ce(i,n));return this.curves.push(r),this.currentPoint.set(i,n),this}bezierCurveTo(e,t,i,n,r,o){let s=new el(this.currentPoint.clone(),new ce(e,t),new ce(i,n),new ce(r,o));return this.curves.push(s),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new nl(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,n,r,o){let s=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+s,t+l,i,n,r,o),this}absarc(e,t,i,n,r,o){return this.absellipse(e,t,i,i,n,r,o),this}ellipse(e,t,i,n,r,o,s,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,n,r,o,s,l),this}absellipse(e,t,i,n,r,o,s,l){let c=new ro(e,t,i,n,r,o,s,l);if(this.curves.length>0){let u=c.getPoint(0);u.equals(this.currentPoint)||this.lineTo(u.x,u.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},ol=class a extends ct{constructor(e=[new ce(0,-.5),new ce(.5,0),new ce(0,.5)],t=12,i=0,n=2*Math.PI){super(),this.type="LatheGeometry",this.parameters={points:e,segments:t,phiStart:i,phiLength:n},t=Math.floor(t),n=Pt(n,0,2*Math.PI);let r=[],o=[],s=[],l=[],c=[],h=1/t,u=new A,d=new ce,p=new A,m=new A,g=new A,f=0,x=0;for(let _=0;_<=e.length-1;_++)switch(_){case 0:f=e[_+1].x-e[_].x,x=e[_+1].y-e[_].y,p.x=1*x,p.y=-f,p.z=0*x,g.copy(p),p.normalize(),l.push(p.x,p.y,p.z);break;case e.length-1:l.push(g.x,g.y,g.z);break;default:f=e[_+1].x-e[_].x,x=e[_+1].y-e[_].y,p.x=1*x,p.y=-f,p.z=0*x,m.copy(p),p.x+=g.x,p.y+=g.y,p.z+=g.z,p.normalize(),l.push(p.x,p.y,p.z),g.copy(m)}for(let _=0;_<=t;_++){let v=i+_*h*n,y=Math.sin(v),C=Math.cos(v);for(let S=0;S<=e.length-1;S++){u.x=e[S].x*y,u.y=e[S].y,u.z=e[S].x*C,o.push(u.x,u.y,u.z),d.x=_/t,d.y=S/(e.length-1),s.push(d.x,d.y);let w=l[3*S+0]*y,O=l[3*S+1],N=l[3*S+0]*C;c.push(w,O,N)}}for(let _=0;_<t;_++)for(let v=0;v<e.length-1;v++){let y=v+_*e.length,C=y,S=y+e.length,w=y+e.length+1,O=y+1;r.push(C,S,O),r.push(w,O,S)}this.setIndex(r),this.setAttribute("position",new Pe(o,3)),this.setAttribute("uv",new Pe(s,2)),this.setAttribute("normal",new Pe(c,3))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.points,e.segments,e.phiStart,e.phiLength)}},Oh=class a extends ol{constructor(e=1,t=1,i=4,n=8){let r=new oo;r.absarc(0,-t/2,e,1.5*Math.PI,0),r.absarc(0,t/2,e,0,.5*Math.PI),super(r.getPoints(i),n),this.type="CapsuleGeometry",this.parameters={radius:e,length:t,capSegments:i,radialSegments:n}}static fromJSON(e){return new a(e.radius,e.length,e.capSegments,e.radialSegments)}},Bh=class a extends ct{constructor(e=1,t=32,i=0,n=2*Math.PI){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:n},t=Math.max(3,t);let r=[],o=[],s=[],l=[],c=new A,h=new ce;o.push(0,0,0),s.push(0,0,1),l.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let p=i+u/t*n;c.x=e*Math.cos(p),c.y=e*Math.sin(p),o.push(c.x,c.y,c.z),s.push(0,0,1),h.x=(o[d]/e+1)/2,h.y=(o[d+1]/e+1)/2,l.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Pe(o,3)),this.setAttribute("normal",new Pe(s,3)),this.setAttribute("uv",new Pe(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.segments,e.thetaStart,e.thetaLength)}},tr=class a extends ct{constructor(e=1,t=1,i=1,n=32,r=1,o=!1,s=0,l=2*Math.PI){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:n,heightSegments:r,openEnded:o,thetaStart:s,thetaLength:l};let c=this;n=Math.floor(n),r=Math.floor(r);let h=[],u=[],d=[],p=[],m=0,g=[],f=i/2,x=0;function _(v){let y=m,C=new ce,S=new A,w=0,O=v===!0?e:t,N=v===!0?1:-1;for(let $=1;$<=n;$++)u.push(0,f*N,0),d.push(0,N,0),p.push(.5,.5),m++;let B=m;for(let $=0;$<=n;$++){let R=$/n*l+s,V=Math.cos(R),W=Math.sin(R);S.x=O*W,S.y=f*N,S.z=O*V,u.push(S.x,S.y,S.z),d.push(0,N,0),C.x=.5*V+.5,C.y=.5*W*N+.5,p.push(C.x,C.y),m++}for(let $=0;$<n;$++){let R=y+$,V=B+$;v===!0?h.push(V,V+1,R):h.push(V+1,V,R),w+=3}c.addGroup(x,w,v===!0?1:2),x+=w}(function(){let v=new A,y=new A,C=0,S=(t-e)/i;for(let w=0;w<=r;w++){let O=[],N=w/r,B=N*(t-e)+e;for(let $=0;$<=n;$++){let R=$/n,V=R*l+s,W=Math.sin(V),le=Math.cos(V);y.x=B*W,y.y=-N*i+f,y.z=B*le,u.push(y.x,y.y,y.z),v.set(W,S,le).normalize(),d.push(v.x,v.y,v.z),p.push(R,1-N),O.push(m++)}g.push(O)}for(let w=0;w<n;w++)for(let O=0;O<r;O++){let N=g[O][w],B=g[O+1][w],$=g[O+1][w+1],R=g[O][w+1];h.push(N,B,R),h.push(B,$,R),C+=6}c.addGroup(x,C,0),x+=C})(),o===!1&&(e>0&&_(!0),t>0&&_(!1)),this.setIndex(h),this.setAttribute("position",new Pe(u,3)),this.setAttribute("normal",new Pe(d,3)),this.setAttribute("uv",new Pe(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},so=class a extends tr{constructor(e=1,t=1,i=32,n=1,r=!1,o=0,s=2*Math.PI){super(0,e,t,i,n,r,o,s),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:n,openEnded:r,thetaStart:o,thetaLength:s}}static fromJSON(e){return new a(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},on=class a extends ct{constructor(e=[],t=[],i=1,n=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:n};let r=[],o=[];function s(d,p,m,g){let f=g+1,x=[];for(let _=0;_<=f;_++){x[_]=[];let v=d.clone().lerp(m,_/f),y=p.clone().lerp(m,_/f),C=f-_;for(let S=0;S<=C;S++)x[_][S]=S===0&&_===f?v:v.clone().lerp(y,S/C)}for(let _=0;_<f;_++)for(let v=0;v<2*(f-_)-1;v++){let y=Math.floor(v/2);v%2==0?(l(x[_][y+1]),l(x[_+1][y]),l(x[_][y])):(l(x[_][y+1]),l(x[_+1][y+1]),l(x[_+1][y]))}}function l(d){r.push(d.x,d.y,d.z)}function c(d,p){let m=3*d;p.x=e[m+0],p.y=e[m+1],p.z=e[m+2]}function h(d,p,m,g){g<0&&d.x===1&&(o[p]=d.x-1),m.x===0&&m.z===0&&(o[p]=g/2/Math.PI+.5)}function u(d){return Math.atan2(d.z,-d.x)}(function(d){let p=new A,m=new A,g=new A;for(let f=0;f<t.length;f+=3)c(t[f+0],p),c(t[f+1],m),c(t[f+2],g),s(p,m,g,d)})(n),(function(d){let p=new A;for(let m=0;m<r.length;m+=3)p.x=r[m+0],p.y=r[m+1],p.z=r[m+2],p.normalize().multiplyScalar(d),r[m+0]=p.x,r[m+1]=p.y,r[m+2]=p.z})(i),(function(){let d=new A;for(let m=0;m<r.length;m+=3){d.x=r[m+0],d.y=r[m+1],d.z=r[m+2];let g=u(d)/2/Math.PI+.5,f=(p=d,Math.atan2(-p.y,Math.sqrt(p.x*p.x+p.z*p.z))/Math.PI+.5);o.push(g,1-f)}var p;(function(){let m=new A,g=new A,f=new A,x=new A,_=new ce,v=new ce,y=new ce;for(let C=0,S=0;C<r.length;C+=9,S+=6){m.set(r[C+0],r[C+1],r[C+2]),g.set(r[C+3],r[C+4],r[C+5]),f.set(r[C+6],r[C+7],r[C+8]),_.set(o[S+0],o[S+1]),v.set(o[S+2],o[S+3]),y.set(o[S+4],o[S+5]),x.copy(m).add(g).add(f).divideScalar(3);let w=u(x);h(_,S+0,m,w),h(v,S+2,g,w),h(y,S+4,f,w)}})(),(function(){for(let m=0;m<o.length;m+=6){let g=o[m+0],f=o[m+2],x=o[m+4],_=Math.max(g,f,x),v=Math.min(g,f,x);_>.9&&v<.1&&(g<.2&&(o[m+0]+=1),f<.2&&(o[m+2]+=1),x<.2&&(o[m+4]+=1))}})()})(),this.setAttribute("position",new Pe(r,3)),this.setAttribute("normal",new Pe(r.slice(),3)),this.setAttribute("uv",new Pe(o,2)),n===0?this.computeVertexNormals():this.normalizeNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.vertices,e.indices,e.radius,e.details)}},Fh=class a extends on{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,n=1/i;super([-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-n,-i,0,-n,i,0,n,-i,0,n,i,-n,-i,0,-n,i,0,n,-i,0,n,i,0,-i,0,-n,i,0,-n,-i,0,n,i,0,n],[3,11,7,3,7,15,3,15,13,7,19,17,7,17,6,7,6,15,17,4,8,17,8,10,17,10,6,8,0,16,8,16,2,8,2,10,0,12,1,0,1,18,0,18,16,6,10,2,6,2,13,6,13,15,2,16,18,2,18,3,2,3,13,18,1,9,18,9,11,18,11,3,4,14,12,4,12,0,4,0,8,11,9,5,11,5,19,11,19,7,19,5,14,19,14,4,19,4,17,1,12,14,1,14,5,1,5,9],e,t),this.type="DodecahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}},Es=new A,As=new A,rh=new A,Cs=new Ka,kh=class extends ct{constructor(e=null,t=1){if(super(),this.type="EdgesGeometry",this.parameters={geometry:e,thresholdAngle:t},e!==null){let n=Math.pow(10,4),r=Math.cos(qn*t),o=e.getIndex(),s=e.getAttribute("position"),l=o?o.count:s.count,c=[0,0,0],h=["a","b","c"],u=new Array(3),d={},p=[];for(let m=0;m<l;m+=3){o?(c[0]=o.getX(m),c[1]=o.getX(m+1),c[2]=o.getX(m+2)):(c[0]=m,c[1]=m+1,c[2]=m+2);let{a:g,b:f,c:x}=Cs;if(g.fromBufferAttribute(s,c[0]),f.fromBufferAttribute(s,c[1]),x.fromBufferAttribute(s,c[2]),Cs.getNormal(rh),u[0]=`${Math.round(g.x*n)},${Math.round(g.y*n)},${Math.round(g.z*n)}`,u[1]=`${Math.round(f.x*n)},${Math.round(f.y*n)},${Math.round(f.z*n)}`,u[2]=`${Math.round(x.x*n)},${Math.round(x.y*n)},${Math.round(x.z*n)}`,u[0]!==u[1]&&u[1]!==u[2]&&u[2]!==u[0])for(let _=0;_<3;_++){let v=(_+1)%3,y=u[_],C=u[v],S=Cs[h[_]],w=Cs[h[v]],O=`${y}_${C}`,N=`${C}_${y}`;N in d&&d[N]?(rh.dot(d[N].normal)<=r&&(p.push(S.x,S.y,S.z),p.push(w.x,w.y,w.z)),d[N]=null):O in d||(d[O]={index0:c[_],index1:c[v],normal:rh.clone()})}}for(let m in d)if(d[m]){let{index0:g,index1:f}=d[m];Es.fromBufferAttribute(s,g),As.fromBufferAttribute(s,f),p.push(Es.x,Es.y,Es.z),p.push(As.x,As.y,As.z)}this.setAttribute("position",new Pe(p,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}},ir=class extends oo{constructor(e){super(e),this.uuid=cn(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,n=this.holes.length;i<n;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let n=e.holes[t];this.holes.push(n.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let n=this.holes[t];e.holes.push(n.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let n=e.holes[t];this.holes.push(new oo().fromJSON(n))}return this}},W_=function(a,e,t=2){let i=e&&e.length,n=i?e[0]*t:a.length,r=em(a,0,n,t,!0),o=[];if(!r||r.next===r.prev)return o;let s,l,c,h,u,d,p;if(i&&(r=(function(m,g,f,x){let _=[],v,y,C,S,w;for(v=0,y=g.length;v<y;v++)C=g[v]*x,S=v<y-1?g[v+1]*x:m.length,w=em(m,C,S,x,!1),w===w.next&&(w.steiner=!0),_.push(Q_(w));for(_.sort(Z_),v=0;v<_.length;v++)f=J_(_[v],f);return f})(a,e,r,t)),a.length>80*t){s=c=a[0],l=h=a[1];for(let m=t;m<n;m+=t)u=a[m],d=a[m+1],u<s&&(s=u),d<l&&(l=d),u>c&&(c=u),d>h&&(h=d);p=Math.max(c-s,h-l),p=p!==0?32767/p:0}return lo(r,o,t,s,l,p,0),o};function em(a,e,t,i,n){let r,o;if(n===(function(s,l,c,h){let u=0;for(let d=l,p=c-h;d<c;d+=h)u+=(s[p]-s[d])*(s[d+1]+s[p+1]),p=d;return u})(a,e,t,i)>0)for(r=e;r<t;r+=i)o=tm(r,a[r],a[r+1],o);else for(r=t-i;r>=e;r-=i)o=tm(r,a[r],a[r+1],o);return o&&gl(o,o.next)&&(ho(o),o=o.next),o}function sn(a,e){if(!a)return a;e||(e=a);let t,i=a;do if(t=!1,i.steiner||!gl(i,i.next)&&mt(i.prev,i,i.next)!==0)i=i.next;else{if(ho(i),i=e=i.prev,i===i.next)break;t=!0}while(t||i!==e);return e}function lo(a,e,t,i,n,r,o){if(!a)return;!o&&r&&(function(h,u,d,p){let m=h;do m.z===0&&(m.z=Hh(m.x,m.y,u,d,p)),m.prevZ=m.prev,m.nextZ=m.next,m=m.next;while(m!==h);m.prevZ.nextZ=null,m.prevZ=null,(function(g){let f,x,_,v,y,C,S,w,O=1;do{for(x=g,g=null,y=null,C=0;x;){for(C++,_=x,S=0,f=0;f<O&&(S++,_=_.nextZ,_);f++);for(w=O;S>0||w>0&&_;)S!==0&&(w===0||!_||x.z<=_.z)?(v=x,x=x.nextZ,S--):(v=_,_=_.nextZ,w--),y?y.nextZ=v:g=v,v.prevZ=y,y=v;x=_}y.nextZ=null,O*=2}while(C>1)})(m)})(a,i,n,r);let s,l,c=a;for(;a.prev!==a.next;)if(s=a.prev,l=a.next,r?X_(a,i,n,r):q_(a))e.push(s.i/t|0),e.push(a.i/t|0),e.push(l.i/t|0),ho(a),a=l.next,c=l.next;else if((a=l)===c){o?o===1?lo(a=Y_(sn(a),e,t),e,t,i,n,r,2):o===2&&$_(a,e,t,i,n,r):lo(sn(a),e,t,i,n,r,1);break}}function q_(a){let e=a.prev,t=a,i=a.next;if(mt(e,t,i)>=0)return!1;let n=e.x,r=t.x,o=i.x,s=e.y,l=t.y,c=i.y,h=n<r?n<o?n:o:r<o?r:o,u=s<l?s<c?s:c:l<c?l:c,d=n>r?n>o?n:o:r>o?r:o,p=s>l?s>c?s:c:l>c?l:c,m=i.next;for(;m!==e;){if(m.x>=h&&m.x<=d&&m.y>=u&&m.y<=p&&Wn(n,s,r,l,o,c,m.x,m.y)&&mt(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function X_(a,e,t,i){let n=a.prev,r=a,o=a.next;if(mt(n,r,o)>=0)return!1;let s=n.x,l=r.x,c=o.x,h=n.y,u=r.y,d=o.y,p=s<l?s<c?s:c:l<c?l:c,m=h<u?h<d?h:d:u<d?u:d,g=s>l?s>c?s:c:l>c?l:c,f=h>u?h>d?h:d:u>d?u:d,x=Hh(p,m,e,t,i),_=Hh(g,f,e,t,i),v=a.prevZ,y=a.nextZ;for(;v&&v.z>=x&&y&&y.z<=_;){if(v.x>=p&&v.x<=g&&v.y>=m&&v.y<=f&&v!==n&&v!==o&&Wn(s,h,l,u,c,d,v.x,v.y)&&mt(v.prev,v,v.next)>=0||(v=v.prevZ,y.x>=p&&y.x<=g&&y.y>=m&&y.y<=f&&y!==n&&y!==o&&Wn(s,h,l,u,c,d,y.x,y.y)&&mt(y.prev,y,y.next)>=0))return!1;y=y.nextZ}for(;v&&v.z>=x;){if(v.x>=p&&v.x<=g&&v.y>=m&&v.y<=f&&v!==n&&v!==o&&Wn(s,h,l,u,c,d,v.x,v.y)&&mt(v.prev,v,v.next)>=0)return!1;v=v.prevZ}for(;y&&y.z<=_;){if(y.x>=p&&y.x<=g&&y.y>=m&&y.y<=f&&y!==n&&y!==o&&Wn(s,h,l,u,c,d,y.x,y.y)&&mt(y.prev,y,y.next)>=0)return!1;y=y.nextZ}return!0}function Y_(a,e,t){let i=a;do{let n=i.prev,r=i.next.next;!gl(n,r)&&Rm(n,i,i.next,r)&&co(n,r)&&co(r,n)&&(e.push(n.i/t|0),e.push(i.i/t|0),e.push(r.i/t|0),ho(i),ho(i.next),i=a=r),i=i.next}while(i!==a);return sn(i)}function $_(a,e,t,i,n,r){let o=a;do{let s=o.next.next;for(;s!==o.prev;){if(o.i!==s.i&&ev(o,s)){let l=Lm(o,s);return o=sn(o,o.next),l=sn(l,l.next),lo(o,e,t,i,n,r,0),void lo(l,e,t,i,n,r,0)}s=s.next}o=o.next}while(o!==a)}function Z_(a,e){return a.x-e.x}function J_(a,e){let t=(function(n,r){let o,s=r,l=-1/0,c=n.x,h=n.y;do{if(h<=s.y&&h>=s.next.y&&s.next.y!==s.y){let f=s.x+(h-s.y)*(s.next.x-s.x)/(s.next.y-s.y);if(f<=c&&f>l&&(l=f,o=s.x<s.next.x?s:s.next,f===c))return o}s=s.next}while(s!==r);if(!o)return null;let u=o,d=o.x,p=o.y,m,g=1/0;s=o;do c>=s.x&&s.x>=d&&c!==s.x&&Wn(h<p?c:l,h,d,p,h<p?l:c,h,s.x,s.y)&&(m=Math.abs(h-s.y)/(c-s.x),co(s,n)&&(m<g||m===g&&(s.x>o.x||s.x===o.x&&K_(o,s)))&&(o=s,g=m)),s=s.next;while(s!==u);return o})(a,e);if(!t)return e;let i=Lm(t,a);return sn(i,i.next),sn(t,t.next)}function K_(a,e){return mt(a.prev,a,e.prev)<0&&mt(e.next,a,a.next)<0}function Hh(a,e,t,i,n){return(a=1431655765&((a=858993459&((a=252645135&((a=16711935&((a=(a-t)*n|0)|a<<8))|a<<4))|a<<2))|a<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-i)*n|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function Q_(a){let e=a,t=a;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==a);return t}function Wn(a,e,t,i,n,r,o,s){return(n-o)*(e-s)>=(a-o)*(r-s)&&(a-o)*(i-s)>=(t-o)*(e-s)&&(t-o)*(r-s)>=(n-o)*(i-s)}function ev(a,e){return a.next.i!==e.i&&a.prev.i!==e.i&&!(function(t,i){let n=t;do{if(n.i!==t.i&&n.next.i!==t.i&&n.i!==i.i&&n.next.i!==i.i&&Rm(n,n.next,t,i))return!0;n=n.next}while(n!==t);return!1})(a,e)&&(co(a,e)&&co(e,a)&&(function(t,i){let n=t,r=!1,o=(t.x+i.x)/2,s=(t.y+i.y)/2;do n.y>s!=n.next.y>s&&n.next.y!==n.y&&o<(n.next.x-n.x)*(s-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next;while(n!==t);return r})(a,e)&&(mt(a.prev,a,e.prev)||mt(a,e.prev,e))||gl(a,e)&&mt(a.prev,a,a.next)>0&&mt(e.prev,e,e.next)>0)}function mt(a,e,t){return(e.y-a.y)*(t.x-e.x)-(e.x-a.x)*(t.y-e.y)}function gl(a,e){return a.x===e.x&&a.y===e.y}function Rm(a,e,t,i){let n=Ls(mt(a,e,t)),r=Ls(mt(a,e,i)),o=Ls(mt(t,i,a)),s=Ls(mt(t,i,e));return n!==r&&o!==s||!(n!==0||!Rs(a,t,e))||!(r!==0||!Rs(a,i,e))||!(o!==0||!Rs(t,a,i))||!(s!==0||!Rs(t,e,i))}function Rs(a,e,t){return e.x<=Math.max(a.x,t.x)&&e.x>=Math.min(a.x,t.x)&&e.y<=Math.max(a.y,t.y)&&e.y>=Math.min(a.y,t.y)}function Ls(a){return a>0?1:a<0?-1:0}function co(a,e){return mt(a.prev,a,a.next)<0?mt(a,e,a.next)>=0&&mt(a,a.prev,e)>=0:mt(a,e,a.prev)<0||mt(a,a.next,e)<0}function Lm(a,e){let t=new Gh(a.i,a.x,a.y),i=new Gh(e.i,e.x,e.y),n=a.next,r=e.prev;return a.next=e,e.prev=a,t.next=n,n.prev=t,i.next=t,t.prev=i,r.next=i,i.prev=r,i}function tm(a,e,t,i){let n=new Gh(a,e,t);return i?(n.next=i.next,n.prev=i,i.next.prev=n,i.next=n):(n.prev=n,n.next=n),n}function ho(a){a.next.prev=a.prev,a.prev.next=a.next,a.prevZ&&(a.prevZ.nextZ=a.nextZ),a.nextZ&&(a.nextZ.prevZ=a.prevZ)}function Gh(a,e,t){this.i=a,this.x=e,this.y=t,this.prev=null,this.next=null,this.z=0,this.prevZ=null,this.nextZ=null,this.steiner=!1}var ya=class a{static area(e){let t=e.length,i=0;for(let n=t-1,r=0;r<t;n=r++)i+=e[n].x*e[r].y-e[r].x*e[n].y;return .5*i}static isClockWise(e){return a.area(e)<0}static triangulateShape(e,t){let i=[],n=[],r=[];im(e),am(i,e);let o=e.length;t.forEach(im);for(let l=0;l<t.length;l++)n.push(o),o+=t[l].length,am(i,t[l]);let s=W_(i,n);for(let l=0;l<s.length;l+=3)r.push(s.slice(l,l+3));return r}};function im(a){let e=a.length;e>2&&a[e-1].equals(a[0])&&a.pop()}function am(a,e){for(let t=0;t<e.length;t++)a.push(e[t].x),a.push(e[t].y)}var uo=class a extends ct{constructor(e=new ir([new ce(.5,.5),new ce(-.5,.5),new ce(-.5,-.5),new ce(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,n=[],r=[];for(let s=0,l=e.length;s<l;s++)o(e[s]);function o(s){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,u=t.depth!==void 0?t.depth:1,d=t.bevelEnabled===void 0||t.bevelEnabled,p=t.bevelThickness!==void 0?t.bevelThickness:.2,m=t.bevelSize!==void 0?t.bevelSize:p-.1,g=t.bevelOffset!==void 0?t.bevelOffset:0,f=t.bevelSegments!==void 0?t.bevelSegments:3,x=t.extrudePath,_=t.UVGenerator!==void 0?t.UVGenerator:tv,v,y,C,S,w,O=!1;x&&(v=x.getSpacedPoints(h),O=!0,d=!1,y=x.computeFrenetFrames(h,!1),C=new A,S=new A,w=new A),d||(f=0,p=0,m=0,g=0);let N=s.extractPoints(c),B=N.shape,$=N.holes;if(!ya.isClockWise(B)){B=B.reverse();for(let D=0,U=$.length;D<U;D++){let k=$[D];ya.isClockWise(k)&&($[D]=k.reverse())}}let R=ya.triangulateShape(B,$),V=B;for(let D=0,U=$.length;D<U;D++){let k=$[D];B=B.concat(k)}function W(D,U,k){return U||console.error("THREE.ExtrudeGeometry: vec does not exist"),D.clone().addScaledVector(U,k)}let le=B.length,ge=R.length;function ne(D,U,k){let ie,ee,b,re=D.x-U.x,G=D.y-U.y,j=k.x-D.x,oe=k.y-D.y,pe=re*re+G*G,fe=re*oe-G*j;if(Math.abs(fe)>Number.EPSILON){let _e=Math.sqrt(pe),De=Math.sqrt(j*j+oe*oe),ve=U.x-G/_e,be=U.y+re/_e,Oe=((k.x-oe/De-ve)*oe-(k.y+j/De-be)*j)/(re*oe-G*j);ie=ve+re*Oe-D.x,ee=be+G*Oe-D.y;let Rt=ie*ie+ee*ee;if(Rt<=2)return new ce(ie,ee);b=Math.sqrt(Rt/2)}else{let _e=!1;re>Number.EPSILON?j>Number.EPSILON&&(_e=!0):re<-Number.EPSILON?j<-Number.EPSILON&&(_e=!0):Math.sign(G)===Math.sign(oe)&&(_e=!0),_e?(ie=-G,ee=re,b=Math.sqrt(pe)):(ie=re,ee=G,b=Math.sqrt(pe/2))}return new ce(ie/b,ee/b)}let Z=[];for(let D=0,U=V.length,k=U-1,ie=D+1;D<U;D++,k++,ie++)k===U&&(k=0),ie===U&&(ie=0),Z[D]=ne(V[D],V[k],V[ie]);let ae=[],H,Q=Z.concat();for(let D=0,U=$.length;D<U;D++){let k=$[D];H=[];for(let ie=0,ee=k.length,b=ee-1,re=ie+1;ie<ee;ie++,b++,re++)b===ee&&(b=0),re===ee&&(re=0),H[ie]=ne(k[ie],k[b],k[re]);ae.push(H),Q=Q.concat(H)}for(let D=0;D<f;D++){let U=D/f,k=p*Math.cos(U*Math.PI/2),ie=m*Math.sin(U*Math.PI/2)+g;for(let ee=0,b=V.length;ee<b;ee++){let re=W(V[ee],Z[ee],ie);M(re.x,re.y,-k)}for(let ee=0,b=$.length;ee<b;ee++){let re=$[ee];H=ae[ee];for(let G=0,j=re.length;G<j;G++){let oe=W(re[G],H[G],ie);M(oe.x,oe.y,-k)}}}let de=m+g;for(let D=0;D<le;D++){let U=d?W(B[D],Q[D],de):B[D];O?(S.copy(y.normals[0]).multiplyScalar(U.x),C.copy(y.binormals[0]).multiplyScalar(U.y),w.copy(v[0]).add(S).add(C),M(w.x,w.y,w.z)):M(U.x,U.y,0)}for(let D=1;D<=h;D++)for(let U=0;U<le;U++){let k=d?W(B[U],Q[U],de):B[U];O?(S.copy(y.normals[D]).multiplyScalar(k.x),C.copy(y.binormals[D]).multiplyScalar(k.y),w.copy(v[D]).add(S).add(C),M(w.x,w.y,w.z)):M(k.x,k.y,u/h*D)}for(let D=f-1;D>=0;D--){let U=D/f,k=p*Math.cos(U*Math.PI/2),ie=m*Math.sin(U*Math.PI/2)+g;for(let ee=0,b=V.length;ee<b;ee++){let re=W(V[ee],Z[ee],ie);M(re.x,re.y,u+k)}for(let ee=0,b=$.length;ee<b;ee++){let re=$[ee];H=ae[ee];for(let G=0,j=re.length;G<j;G++){let oe=W(re[G],H[G],ie);O?M(oe.x,oe.y+v[h-1].y,v[h-1].x+k):M(oe.x,oe.y,u+k)}}}function T(D,U){let k=D.length;for(;--k>=0;){let ie=k,ee=k-1;ee<0&&(ee=D.length-1);for(let b=0,re=h+2*f;b<re;b++){let G=le*b,j=le*(b+1);J(U+ie+G,U+ee+G,U+ee+j,U+ie+j)}}}function M(D,U,k){l.push(D),l.push(U),l.push(k)}function F(D,U,k){z(D),z(U),z(k);let ie=n.length/3,ee=_.generateTopUV(i,n,ie-3,ie-2,ie-1);Y(ee[0]),Y(ee[1]),Y(ee[2])}function J(D,U,k,ie){z(D),z(U),z(ie),z(U),z(k),z(ie);let ee=n.length/3,b=_.generateSideWallUV(i,n,ee-6,ee-3,ee-2,ee-1);Y(b[0]),Y(b[1]),Y(b[3]),Y(b[1]),Y(b[2]),Y(b[3])}function z(D){n.push(l[3*D+0]),n.push(l[3*D+1]),n.push(l[3*D+2])}function Y(D){r.push(D.x),r.push(D.y)}(function(){let D=n.length/3;if(d){let U=0,k=le*U;for(let ie=0;ie<ge;ie++){let ee=R[ie];F(ee[2]+k,ee[1]+k,ee[0]+k)}U=h+2*f,k=le*U;for(let ie=0;ie<ge;ie++){let ee=R[ie];F(ee[0]+k,ee[1]+k,ee[2]+k)}}else{for(let U=0;U<ge;U++){let k=R[U];F(k[2],k[1],k[0])}for(let U=0;U<ge;U++){let k=R[U];F(k[0]+le*h,k[1]+le*h,k[2]+le*h)}}i.addGroup(D,n.length/3-D,0)})(),(function(){let D=n.length/3,U=0;T(V,U),U+=V.length;for(let k=0,ie=$.length;k<ie;k++){let ee=$[k];T(ee,U),U+=ee.length}i.addGroup(D,n.length/3-D,1)})()}this.setAttribute("position",new Pe(n,3)),this.setAttribute("uv",new Pe(r,2)),this.computeVertexNormals()}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return(function(t,i,n){if(n.shapes=[],Array.isArray(t))for(let r=0,o=t.length;r<o;r++){let s=t[r];n.shapes.push(s.uuid)}else n.shapes.push(t.uuid);return n.options=Object.assign({},i),i.extrudePath!==void 0&&(n.options.extrudePath=i.extrudePath.toJSON()),n})(this.parameters.shapes,this.parameters.options,e)}static fromJSON(e,t){let i=[];for(let r=0,o=e.shapes.length;r<o;r++){let s=t[e.shapes[r]];i.push(s)}let n=e.options.extrudePath;return n!==void 0&&(e.options.extrudePath=new rl[n.type]().fromJSON(n)),new a(i,e.options)}},tv={generateTopUV:function(a,e,t,i,n){let r=e[3*t],o=e[3*t+1],s=e[3*i],l=e[3*i+1],c=e[3*n],h=e[3*n+1];return[new ce(r,o),new ce(s,l),new ce(c,h)]},generateSideWallUV:function(a,e,t,i,n,r){let o=e[3*t],s=e[3*t+1],l=e[3*t+2],c=e[3*i],h=e[3*i+1],u=e[3*i+2],d=e[3*n],p=e[3*n+1],m=e[3*n+2],g=e[3*r],f=e[3*r+1],x=e[3*r+2];return Math.abs(s-h)<Math.abs(o-c)?[new ce(o,1-l),new ce(c,1-u),new ce(d,1-m),new ce(g,1-x)]:[new ce(s,1-l),new ce(h,1-u),new ce(p,1-m),new ce(f,1-x)]}},po=class a extends on{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2;super([-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1],e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}},Vh=class a extends on{constructor(e=1,t=0){super([1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2],e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}},jh=class a extends ct{constructor(e=.5,t=1,i=32,n=1,r=0,o=2*Math.PI){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:n,thetaStart:r,thetaLength:o},i=Math.max(3,i);let s=[],l=[],c=[],h=[],u=e,d=(t-e)/(n=Math.max(1,n)),p=new A,m=new ce;for(let g=0;g<=n;g++){for(let f=0;f<=i;f++){let x=r+f/i*o;p.x=u*Math.cos(x),p.y=u*Math.sin(x),l.push(p.x,p.y,p.z),c.push(0,0,1),m.x=(p.x/t+1)/2,m.y=(p.y/t+1)/2,h.push(m.x,m.y)}u+=d}for(let g=0;g<n;g++){let f=g*(i+1);for(let x=0;x<i;x++){let _=x+f,v=_,y=_+i+1,C=_+i+2,S=_+1;s.push(v,y,S),s.push(y,C,S)}}this.setIndex(s),this.setAttribute("position",new Pe(l,3)),this.setAttribute("normal",new Pe(c,3)),this.setAttribute("uv",new Pe(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}},Wh=class a extends ct{constructor(e=new ir([new ce(0,.5),new ce(-.5,-.5),new ce(.5,-.5)]),t=12){super(),this.type="ShapeGeometry",this.parameters={shapes:e,curveSegments:t};let i=[],n=[],r=[],o=[],s=0,l=0;if(Array.isArray(e)===!1)c(e);else for(let h=0;h<e.length;h++)c(e[h]),this.addGroup(s,l,h),s+=l,l=0;function c(h){let u=n.length/3,d=h.extractPoints(t),p=d.shape,m=d.holes;ya.isClockWise(p)===!1&&(p=p.reverse());for(let f=0,x=m.length;f<x;f++){let _=m[f];ya.isClockWise(_)===!0&&(m[f]=_.reverse())}let g=ya.triangulateShape(p,m);for(let f=0,x=m.length;f<x;f++){let _=m[f];p=p.concat(_)}for(let f=0,x=p.length;f<x;f++){let _=p[f];n.push(_.x,_.y,0),r.push(0,0,1),o.push(_.x,_.y)}for(let f=0,x=g.length;f<x;f++){let _=g[f],v=_[0]+u,y=_[1]+u,C=_[2]+u;i.push(v,y,C),l+=3}}this.setIndex(i),this.setAttribute("position",new Pe(n,3)),this.setAttribute("normal",new Pe(r,3)),this.setAttribute("uv",new Pe(o,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return(function(t,i){if(i.shapes=[],Array.isArray(t))for(let n=0,r=t.length;n<r;n++){let o=t[n];i.shapes.push(o.uuid)}else i.shapes.push(t.uuid);return i})(this.parameters.shapes,e)}static fromJSON(e,t){let i=[];for(let n=0,r=e.shapes.length;n<r;n++){let o=t[e.shapes[n]];i.push(o)}return new a(i,e.curveSegments)}},ln=class a extends ct{constructor(e=1,t=32,i=16,n=0,r=2*Math.PI,o=0,s=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:n,phiLength:r,thetaStart:o,thetaLength:s},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+s,Math.PI),c=0,h=[],u=new A,d=new A,p=[],m=[],g=[],f=[];for(let x=0;x<=i;x++){let _=[],v=x/i,y=0;x===0&&o===0?y=.5/t:x===i&&l===Math.PI&&(y=-.5/t);for(let C=0;C<=t;C++){let S=C/t;u.x=-e*Math.cos(n+S*r)*Math.sin(o+v*s),u.y=e*Math.cos(o+v*s),u.z=e*Math.sin(n+S*r)*Math.sin(o+v*s),m.push(u.x,u.y,u.z),d.copy(u).normalize(),g.push(d.x,d.y,d.z),f.push(S+y,1-v),_.push(c++)}h.push(_)}for(let x=0;x<i;x++)for(let _=0;_<t;_++){let v=h[x][_+1],y=h[x][_],C=h[x+1][_],S=h[x+1][_+1];(x!==0||o>0)&&p.push(v,y,S),(x!==i-1||l<Math.PI)&&p.push(y,C,S)}this.setIndex(p),this.setAttribute("position",new Pe(m,3)),this.setAttribute("normal",new Pe(g,3)),this.setAttribute("uv",new Pe(f,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}},qh=class a extends on{constructor(e=1,t=0){super([1,1,1,-1,-1,1,-1,1,-1,1,-1,-1],[2,1,0,0,3,2,1,3,0,2,3,1],e,t),this.type="TetrahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new a(e.radius,e.detail)}},mo=class a extends ct{constructor(e=1,t=.4,i=12,n=48,r=2*Math.PI){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:n,arc:r},i=Math.floor(i),n=Math.floor(n);let o=[],s=[],l=[],c=[],h=new A,u=new A,d=new A;for(let p=0;p<=i;p++)for(let m=0;m<=n;m++){let g=m/n*r,f=p/i*Math.PI*2;u.x=(e+t*Math.cos(f))*Math.cos(g),u.y=(e+t*Math.cos(f))*Math.sin(g),u.z=t*Math.sin(f),s.push(u.x,u.y,u.z),h.x=e*Math.cos(g),h.y=e*Math.sin(g),d.subVectors(u,h).normalize(),l.push(d.x,d.y,d.z),c.push(m/n),c.push(p/i)}for(let p=1;p<=i;p++)for(let m=1;m<=n;m++){let g=(n+1)*p+m-1,f=(n+1)*(p-1)+m-1,x=(n+1)*(p-1)+m,_=(n+1)*p+m;o.push(g,f,_),o.push(f,x,_)}this.setIndex(o),this.setAttribute("position",new Pe(s,3)),this.setAttribute("normal",new Pe(l,3)),this.setAttribute("uv",new Pe(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc)}},Xh=class a extends ct{constructor(e=1,t=.4,i=64,n=8,r=2,o=3){super(),this.type="TorusKnotGeometry",this.parameters={radius:e,tube:t,tubularSegments:i,radialSegments:n,p:r,q:o},i=Math.floor(i),n=Math.floor(n);let s=[],l=[],c=[],h=[],u=new A,d=new A,p=new A,m=new A,g=new A,f=new A,x=new A;for(let v=0;v<=i;++v){let y=v/i*r*Math.PI*2;_(y,r,o,e,p),_(y+.01,r,o,e,m),f.subVectors(m,p),x.addVectors(m,p),g.crossVectors(f,x),x.crossVectors(g,f),g.normalize(),x.normalize();for(let C=0;C<=n;++C){let S=C/n*Math.PI*2,w=-t*Math.cos(S),O=t*Math.sin(S);u.x=p.x+(w*x.x+O*g.x),u.y=p.y+(w*x.y+O*g.y),u.z=p.z+(w*x.z+O*g.z),l.push(u.x,u.y,u.z),d.subVectors(u,p).normalize(),c.push(d.x,d.y,d.z),h.push(v/i),h.push(C/n)}}for(let v=1;v<=i;v++)for(let y=1;y<=n;y++){let C=(n+1)*(v-1)+(y-1),S=(n+1)*v+(y-1),w=(n+1)*v+y,O=(n+1)*(v-1)+y;s.push(C,S,O),s.push(S,w,O)}function _(v,y,C,S,w){let O=Math.cos(v),N=Math.sin(v),B=C/y*v,$=Math.cos(B);w.x=S*(2+$)*.5*O,w.y=S*(2+$)*N*.5,w.z=S*Math.sin(B)*.5}this.setIndex(s),this.setAttribute("position",new Pe(l,3)),this.setAttribute("normal",new Pe(c,3)),this.setAttribute("uv",new Pe(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new a(e.radius,e.tube,e.tubularSegments,e.radialSegments,e.p,e.q)}},Yh=class a extends ct{constructor(e=new al(new A(-1,-1,0),new A(-1,1,0),new A(1,1,0)),t=64,i=1,n=8,r=!1){super(),this.type="TubeGeometry",this.parameters={path:e,tubularSegments:t,radius:i,radialSegments:n,closed:r};let o=e.computeFrenetFrames(t,r);this.tangents=o.tangents,this.normals=o.normals,this.binormals=o.binormals;let s=new A,l=new A,c=new ce,h=new A,u=[],d=[],p=[],m=[];function g(f){h=e.getPointAt(f/t,h);let x=o.normals[f],_=o.binormals[f];for(let v=0;v<=n;v++){let y=v/n*Math.PI*2,C=Math.sin(y),S=-Math.cos(y);l.x=S*x.x+C*_.x,l.y=S*x.y+C*_.y,l.z=S*x.z+C*_.z,l.normalize(),d.push(l.x,l.y,l.z),s.x=h.x+i*l.x,s.y=h.y+i*l.y,s.z=h.z+i*l.z,u.push(s.x,s.y,s.z)}}(function(){for(let f=0;f<t;f++)g(f);g(r===!1?t:0),(function(){for(let f=0;f<=t;f++)for(let x=0;x<=n;x++)c.x=f/t,c.y=x/n,p.push(c.x,c.y)})(),(function(){for(let f=1;f<=t;f++)for(let x=1;x<=n;x++){let _=(n+1)*(f-1)+(x-1),v=(n+1)*f+(x-1),y=(n+1)*f+x,C=(n+1)*(f-1)+x;m.push(_,v,C),m.push(v,y,C)}})()})(),this.setIndex(m),this.setAttribute("position",new Pe(u,3)),this.setAttribute("normal",new Pe(d,3)),this.setAttribute("uv",new Pe(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON();return e.path=this.parameters.path.toJSON(),e}static fromJSON(e){return new a(new rl[e.path.type]().fromJSON(e.path),e.tubularSegments,e.radius,e.radialSegments,e.closed)}},$h=class extends ct{constructor(e=null){if(super(),this.type="WireframeGeometry",this.parameters={geometry:e},e!==null){let t=[],i=new Set,n=new A,r=new A;if(e.index!==null){let o=e.attributes.position,s=e.index,l=e.groups;l.length===0&&(l=[{start:0,count:s.count,materialIndex:0}]);for(let c=0,h=l.length;c<h;++c){let u=l[c],d=u.start;for(let p=d,m=d+u.count;p<m;p+=3)for(let g=0;g<3;g++){let f=s.getX(p+g),x=s.getX(p+(g+1)%3);n.fromBufferAttribute(o,f),r.fromBufferAttribute(o,x),nm(n,r,i)===!0&&(t.push(n.x,n.y,n.z),t.push(r.x,r.y,r.z))}}}else{let o=e.attributes.position;for(let s=0,l=o.count/3;s<l;s++)for(let c=0;c<3;c++){let h=3*s+c,u=3*s+(c+1)%3;n.fromBufferAttribute(o,h),r.fromBufferAttribute(o,u),nm(n,r,i)===!0&&(t.push(n.x,n.y,n.z),t.push(r.x,r.y,r.z))}}this.setAttribute("position",new Pe(t,3))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}};function nm(a,e,t){let i=`${a.x},${a.y},${a.z}-${e.x},${e.y},${e.z}`,n=`${e.x},${e.y},${e.z}-${a.x},${a.y},${a.z}`;return t.has(i)!==!0&&t.has(n)!==!0&&(t.add(i),t.add(n),!0)}var Dy=Object.freeze({__proto__:null,BoxGeometry:Ta,CapsuleGeometry:Oh,CircleGeometry:Bh,ConeGeometry:so,CylinderGeometry:tr,DodecahedronGeometry:Fh,EdgesGeometry:kh,ExtrudeGeometry:uo,IcosahedronGeometry:po,LatheGeometry:ol,OctahedronGeometry:Vh,PlaneGeometry:wa,PolyhedronGeometry:on,RingGeometry:jh,ShapeGeometry:Wh,SphereGeometry:ln,TetrahedronGeometry:qh,TorusGeometry:mo,TorusKnotGeometry:Xh,TubeGeometry:Yh,WireframeGeometry:$h});var sl=class extends rn{constructor(e){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new xe(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new xe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=0,this.normalScale=new ce(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}};function Ps(a,e,t){return!a||!t&&a.constructor===e?a:typeof e.BYTES_PER_ELEMENT=="number"?new e(a):Array.prototype.slice.call(a)}function iv(a){return ArrayBuffer.isView(a)&&!(a instanceof DataView)}var ar=class{constructor(e,t,i,n){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,n=t[i],r=t[i-1];t:{e:{let o;i:{a:if(!(e<n)){for(let s=i+2;;){if(n===void 0){if(e<r)break a;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===s)break;if(r=n,n=t[++i],e<n)break e}o=t.length;break i}if(e>=r)break t;{let s=t[1];e<s&&(i=2,r=s);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(n=r,r=t[--i-1],e>=r)break e}o=i,i=0}}for(;i<o;){let s=i+o>>>1;e<t[s]?o=s:i=s+1}if(n=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,n)}return this.interpolate_(i,r,e,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,n=this.valueSize,r=e*n;for(let o=0;o!==n;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Zh=class extends ar{constructor(e,t,i,n){super(e,t,i,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:lp,endingEnd:lp}}intervalChanged_(e,t,i){let n=this.parameterPositions,r=e-2,o=e+1,s=n[r],l=n[o];if(s===void 0)switch(this.getSettings_().endingStart){case cp:r=e,s=2*t-i;break;case hp:r=n.length-2,s=t+n[r]-n[r+1];break;default:r=e,s=i}if(l===void 0)switch(this.getSettings_().endingEnd){case cp:o=e,l=2*i-t;break;case hp:o=1,l=i+n[1]-n[0];break;default:o=e-1,l=t}let c=.5*(i-t),h=this.valueSize;this._weightPrev=c/(t-s),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,n){let r=this.resultBuffer,o=this.sampleValues,s=this.valueSize,l=e*s,c=l-s,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,p=this._weightNext,m=(i-t)/(n-t),g=m*m,f=g*m,x=-d*f+2*d*g-d*m,_=(1+d)*f+(-1.5-2*d)*g+(-.5+d)*m+1,v=(-1-p)*f+(1.5+p)*g+.5*m,y=p*f-p*g;for(let C=0;C!==s;++C)r[C]=x*o[h+C]+_*o[c+C]+v*o[l+C]+y*o[u+C];return r}},Jh=class extends ar{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let r=this.resultBuffer,o=this.sampleValues,s=this.valueSize,l=e*s,c=l-s,h=(i-t)/(n-t),u=1-h;for(let d=0;d!==s;++d)r[d]=o[c+d]*u+o[l+d]*h;return r}},Kh=class extends ar{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e){return this.copySampleValue_(e-1)}},zi=class{constructor(e,t,i,n){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Ps(t,this.TimeBufferType),this.values=Ps(i,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Ps(e.times,Array),values:Ps(e.values,Array)};let n=e.getInterpolation();n!==e.DefaultInterpolation&&(i.interpolation=n)}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Kh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Jh(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Zh(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case zs:t=this.InterpolantFactoryMethodDiscrete;break;case Ns:t=this.InterpolantFactoryMethodLinear;break;case zc:t=this.InterpolantFactoryMethodSmooth}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0){if(e===this.DefaultInterpolation)throw new Error(i);this.setInterpolation(this.DefaultInterpolation)}return console.warn("THREE.KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return zs;case this.InterpolantFactoryMethodLinear:return Ns;case this.InterpolantFactoryMethodSmooth:return zc}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,n=t.length;i!==n;++i)t[i]*=e}return this}trim(e,t){let i=this.times,n=i.length,r=0,o=n-1;for(;r!==n&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==n){r>=o&&(o=Math.max(o,1),r=o-1);let s=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*s,o*s)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!=0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,n=this.values,r=i.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let s=0;s!==r;s++){let l=i[s];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,s,l),e=!1;break}if(o!==null&&o>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,s,l,o),e=!1;break}o=l}if(n!==void 0&&iv(n))for(let s=0,l=n.length;s!==l;++s){let c=n[s];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,s,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),n=this.getInterpolation()===zc,r=e.length-1,o=1;for(let s=1;s<r;++s){let l=!1,c=e[s];if(c!==e[s+1]&&(s!==1||c!==e[0]))if(n)l=!0;else{let h=s*i,u=h-i,d=h+i;for(let p=0;p!==i;++p){let m=t[h+p];if(m!==t[u+p]||m!==t[d+p]){l=!0;break}}}if(l){if(s!==o){e[o]=e[s];let h=s*i,u=o*i;for(let d=0;d!==i;++d)t[u+d]=t[h+d]}++o}}if(r>0){e[o]=e[r];for(let s=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[s+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=new this.constructor(this.name,e,t);return i.createInterpolant=this.createInterpolant,i}};zi.prototype.TimeBufferType=Float32Array,zi.prototype.ValueBufferType=Float32Array,zi.prototype.DefaultInterpolation=Ns;var Za=class extends zi{};Za.prototype.ValueTypeName="bool",Za.prototype.ValueBufferType=Array,Za.prototype.DefaultInterpolation=zs,Za.prototype.InterpolantFactoryMethodLinear=void 0,Za.prototype.InterpolantFactoryMethodSmooth=void 0;var Qh=class extends zi{};Qh.prototype.ValueTypeName="color";var eu=class extends zi{};eu.prototype.ValueTypeName="number";var tu=class extends ar{constructor(e,t,i,n){super(e,t,i,n)}interpolate_(e,t,i,n){let r=this.resultBuffer,o=this.sampleValues,s=this.valueSize,l=(i-t)/(n-t),c=e*s;for(let h=c+s;c!==h;c+=4)qi.slerpFlat(r,0,o,c-s,o,c,l);return r}},Jr=class extends zi{InterpolantFactoryMethodLinear(e){return new tu(this.times,this.values,this.getValueSize(),e)}};Jr.prototype.ValueTypeName="quaternion",Jr.prototype.DefaultInterpolation=Ns,Jr.prototype.InterpolantFactoryMethodSmooth=void 0;var Ja=class extends zi{};Ja.prototype.ValueTypeName="string",Ja.prototype.ValueBufferType=Array,Ja.prototype.DefaultInterpolation=zs,Ja.prototype.InterpolantFactoryMethodLinear=void 0,Ja.prototype.InterpolantFactoryMethodSmooth=void 0;var iu=class extends zi{};iu.prototype.ValueTypeName="vector";var au=class{constructor(e,t,i){let n=this,r,o=!1,s=0,l=0,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this.itemStart=function(h){l++,o===!1&&n.onStart!==void 0&&n.onStart(h,s,l),o=!0},this.itemEnd=function(h){s++,n.onProgress!==void 0&&n.onProgress(h,s,l),s===l&&(o=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(h){n.onError!==void 0&&n.onError(h)},this.resolveURL=function(h){return r?r(h):h},this.setURLModifier=function(h){return r=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=c.length;u<d;u+=2){let p=c[u],m=c[u+1];if(p.global&&(p.lastIndex=0),p.test(h))return m}return null}}},av=new au,nu=class{constructor(e){this.manager=e!==void 0?e:av,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let i=this;return new Promise((function(n,r){i.load(e,n,t,r)}))}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};nu.DEFAULT_MATERIAL_NAME="__DEFAULT";var ll=class extends gt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new xe(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}},cl=class extends ll{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(gt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new xe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}},oh=new Re,rm=new A,om=new A,ru=class{constructor(e){this.camera=e,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ce(512,512),this.map=null,this.mapPass=null,this.matrix=new Re,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new er,this._frameExtents=new ce(1,1),this._viewportCount=1,this._viewports=[new St(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,i=this.matrix;rm.setFromMatrixPosition(e.matrixWorld),t.position.copy(rm),om.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(om),t.updateMatrixWorld(),oh.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(oh),i.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),i.multiply(oh)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),this.mapSize.x===512&&this.mapSize.y===512||(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}};var Uy=new Re,Oy=new A,By=new A;var ou=class extends ru{constructor(){super(new Ys(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},hl=class extends ll{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(gt.DEFAULT_UP),this.updateMatrix(),this.target=new gt,this.shadow=new ou}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}};var Fy=new Re,ky=new Re,Hy=new Re;var Gy=new A,Vy=new qi,jy=new A,Wy=new A;var qy=new A,Xy=new qi,Yy=new A,$y=new A;var mu="\\[\\]\\.:\\/",nv=new RegExp("["+mu+"]","g"),sh="[^"+mu+"]",rv="[^"+mu.replace("\\.","")+"]",ov=new RegExp("^"+/((?:WC+[\/:])*)/.source.replace("WC",sh)+/(WCOD+)?/.source.replace("WCOD",rv)+/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",sh)+/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",sh)+"$"),sv=["material","materials","bones","map"],st=class a{constructor(e,t,i){this.path=t,this.parsedPath=i||a.parseTrackName(t),this.node=a.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new a.Composite(e,t,i):new a(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(nv,"")}static parseTrackName(e){let t=ov.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=i.nodeName&&i.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){let r=i.nodeName.substring(n+1);sv.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,n),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let s=r[o];if(s.name===t||s.uuid===t)return s;let l=i(s.children);if(l)return l}return null},n=i(e.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let n=0,r=i.length;n!==r;++n)e[t++]=i[n]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let n=0,r=i.length;n!==r;++n)i[n]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,r=i.length;n!==r;++n)i[n]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let n=0,r=i.length;n!==r;++n)i[n]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,n=t.propertyName,r=t.propertyIndex;if(e||(e=a.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e)return void console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.materials)return void console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);e=e.material.materials;break;case"bones":if(!e.skeleton)return void console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material)return void console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);if(!e.material.map)return void console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);e=e.material.map;break;default:if(e[i]===void 0)return void console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);e=e[i]}if(c!==void 0){if(e[c]===void 0)return void console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);e=e[c]}}let o=e[n];if(o===void 0){let c=t.nodeName;return void console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+n+" but it wasn't found.",e)}let s=this.Versioning.None;this.targetObject=e,e.needsUpdate!==void 0?s=this.Versioning.NeedsUpdate:e.matrixWorldNeedsUpdate!==void 0&&(s=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(n==="morphTargetInfluences"){if(!e.geometry)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);if(!e.geometry.morphAttributes)return void console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=n;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][s]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};st.Composite=class{constructor(a,e,t){let i=t||st.parseTrackName(e);this._targetGroup=a,this._bindings=a.subscribe_(e,i)}getValue(a,e){this.bind();let t=this._targetGroup.nCachedObjects_,i=this._bindings[t];i!==void 0&&i.getValue(a,e)}setValue(a,e){let t=this._bindings;for(let i=this._targetGroup.nCachedObjects_,n=t.length;i!==n;++i)t[i].setValue(a,e)}bind(){let a=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=a.length;e!==t;++e)a[e].bind()}unbind(){let a=this._bindings;for(let e=this._targetGroup.nCachedObjects_,t=a.length;e!==t;++e)a[e].unbind()}},st.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3},st.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2},st.prototype.GetterByBindingType=[st.prototype._getValue_direct,st.prototype._getValue_array,st.prototype._getValue_arrayElement,st.prototype._getValue_toArray],st.prototype.SetterByBindingTypeAndVersioning=[[st.prototype._setValue_direct,st.prototype._setValue_direct_setNeedsUpdate,st.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[st.prototype._setValue_array,st.prototype._setValue_array_setNeedsUpdate,st.prototype._setValue_array_setMatrixWorldNeedsUpdate],[st.prototype._setValue_arrayElement,st.prototype._setValue_arrayElement_setNeedsUpdate,st.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[st.prototype._setValue_fromArray,st.prototype._setValue_fromArray_setNeedsUpdate,st.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var Zy=new Float32Array(1);var ul=class{constructor(e,t,i=0,n=1/0){this.ray=new nn(e,t),this.near=i,this.far=n,this.camera=null,this.layers=new to,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(e,t){this.ray.set(e,t)}setFromCamera(e,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(e.x,e.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(e.x,e.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(e,t=!0,i=[]){return su(e,this,i,t),i.sort(sm),i}intersectObjects(e,t=!0,i=[]){for(let n=0,r=e.length;n<r;n++)su(e[n],this,i,t);return i.sort(sm),i}};function sm(a,e){return a.distance-e.distance}function su(a,e,t,i){if(a.layers.test(e.layers)&&a.raycast(e,t),i===!0){let n=a.children;for(let r=0,o=n.length;r<o;r++)su(n[r],e,t,!0)}}var Jy=new ce;var Ky=new A,Qy=new A;var e1=new A;var t1=new A,i1=new Re,a1=new Re;var n1=new A,r1=new xe,o1=new xe;var s1=new A,l1=new A,c1=new A;var h1=new A,u1=new io;var d1=new Ni;var p1=new A;typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"160"}})),typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="160");function Im(a,e=!1){let t=a[0].index!==null,i=new Set(Object.keys(a[0].attributes)),n=new Set(Object.keys(a[0].morphAttributes)),r={},o={},s=a[0].morphTargetsRelative,l=new ct,c=0;for(let h=0;h<a.length;++h){let u=a[h],d=0;if(t!==(u.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let p in u.attributes){if(!i.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+p+'" attribute exists among all geometries, or in none of them.'),null;r[p]===void 0&&(r[p]=[]),r[p].push(u.attributes[p]),d++}if(d!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(s!==u.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let p in u.morphAttributes){if(!n.has(p))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[p]===void 0&&(o[p]=[]),o[p].push(u.morphAttributes[p])}if(e){let p;if(t)p=u.index.count;else if(u.attributes.position!==void 0)p=u.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,p,h),c+=p}}if(t){let h=0,u=[];for(let d=0;d<a.length;++d){let p=a[d].index;for(let m=0;m<p.count;++m)u.push(p.getX(m)+h);h+=a[d].attributes.position.count}l.setIndex(u)}for(let h in r){let u=Pm(r[h]);if(!u)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,u)}for(let h in o){let u=o[h][0].length;if(u===0)break;l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let d=0;d<u;++d){let p=[];for(let g=0;g<o[h].length;++g)p.push(o[h][g][d]);let m=Pm(p);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(m)}}return l}function Pm(a){let e,t,i,n=-1,r=0;for(let c=0;c<a.length;++c){let h=a[c];if(h.isInterleavedBufferAttribute)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. InterleavedBufferAttributes are not supported."),null;if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=h.normalized),i!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(n===-1&&(n=h.gpuType),n!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.array.length}let o=new e(r),s=0;for(let c=0;c<a.length;++c)o.set(a[c].array,s),s+=a[c].array.length;let l=new $t(o,t,i);return n!==void 0&&(l.gpuType=n),l}var ye=a=>{let e=Math.sin(a*127.1+311.7)*43758.5453;return e-Math.floor(e)},vl=class{constructor(e){this.geos={caja:new Ta(1,1,1),roca:new po(.65,0),bola:new ln(.5,8,6),palo:new tr(.5,.5,1,7),cono:new so(.5,1,7),tela:new wa(1,1),aro:new mo(.5,.035,4,24)};let t=new ir;t.moveTo(-.44,-.44),t.lineTo(.44,-.44),t.lineTo(.44,.44),t.lineTo(-.44,.44),t.closePath(),this.geos.sillar=new uo(t,{depth:.88,bevelEnabled:!0,bevelThickness:.055,bevelSize:.055,bevelSegments:1,steps:1}),this.geos.sillar.translate(0,0,-.44),this.materiales=new Map,this.niebla=e,this.dummy=new gt,this.piedra=this.textura("#ded6c4",!1),this.madera=this.textura("#78502c",!0);let i=document.createElement("canvas");i.width=i.height=64;let n=i.getContext("2d"),r=n.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,"#17130db0"),r.addColorStop(1,"#17130d00"),n.fillStyle=r,n.fillRect(0,0,64,64),this.sombraTex=new Ea(i)}textura(e,t){let i=document.createElement("canvas");i.width=i.height=256;let n=i.getContext("2d");n.fillStyle=e,n.fillRect(0,0,256,256);for(let o=0;o<7e3;o++)n.fillStyle=o%2?"#fff2cf20":"#3b2a1925",n.fillRect(ye(o)*256,ye(o+4e3)*256,t?20+ye(o+8)*40:1+ye(o+9)*5,t?1:2);if(!t&&e!=="#bfb9a6")for(let o=0;o<4;o++){n.fillStyle="#514d4438",n.fillRect(0,o*64,256,3);for(let s=0;s<4;s++)n.fillRect(s*80+o%2*40,o*64,2,64)}let r=new Ea(i);return r.colorSpace=xt,r.wrapS=r.wrapT=Kr,r}mat(e,t="",i=!1){let n=e+t+i;if(this.materiales.has(n))return this.materiales.get(n);let r=i?new Sa({color:e,side:lu}):new sl({color:e,map:t==="piedra"?this.piedra:t==="madera"?this.madera:null,roughness:1,side:lu});return this.velar(r),this.materiales.set(n,r),r}velar(e){let t=this.niebla;return e.onBeforeCompile=i=>{Object.assign(i.uniforms,{mapaNiebla:t.textura,medioNiebla:t.medio,ladoNiebla:t.lado,nocheVista:t.noche}),i.vertexShader=`varying vec3 posicionMundo;
`+i.vertexShader,i.vertexShader=i.vertexShader.replace("#include <project_vertex>",`#include <project_vertex>
vec4 posN=vec4(transformed,1.0);
#ifdef USE_INSTANCING
posN=instanceMatrix*posN;
#endif
posicionMundo=(modelMatrix*posN).xyz;`),i.fragmentShader=`uniform float nocheVista; uniform sampler2D mapaNiebla; uniform float medioNiebla; uniform float ladoNiebla; varying vec3 posicionMundo;
`+i.fragmentShader,i.fragmentShader=i.fragmentShader.replace("#include <fog_fragment>",`#include <fog_fragment>
gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*vec3(.82,.94,1.16),${e.isMeshBasicMaterial?"0.0":"nocheVista*.45"});
vec2 uvN=(posicionMundo.xz+medioNiebla)/ladoNiebla;
vec2 paso=vec2(2.0/ladoNiebla);
float nf=0.0;
for(int iy=-1;iy<=1;iy++) for(int ix=-1;ix<=1;ix++)
 nf+=texture2D(mapaNiebla,clamp(uvN+vec2(float(ix),float(iy))*paso,0.001,0.999)).r/9.0;
vec3 colorVisible=gl_FragColor.rgb;
float lum=dot(gl_FragColor.rgb,vec3(.299,.587,.114));
vec3 explorado=mix(vec3(lum)*vec3(.90,.99,1.12),gl_FragColor.rgb,.25)*.55;
float nube=.5+.25*sin(posicionMundo.x*.09+sin(posicionMundo.z*.07))+.25*sin(posicionMundo.z*.13);
vec3 sombraN=vec3(.006,.012,.026)+vec3(.004,.007,.012)*nube;
gl_FragColor.rgb=mix(sombraN,explorado,smoothstep(.02,.49,nf));
gl_FragColor.rgb=mix(gl_FragColor.rgb,colorVisible,smoothstep(.51,.96,nf));`)},e.customProgramCacheKey=()=>"niebla-jerusalen-v3",e}pieza(e,t,i,n,r,o,s,l,c,h=""){let u=new ft(this.geos[t],this.mat(i,h));return u.position.set(n,r,o),u.scale.set(s,l,c),e.add(u),u}caja(e,t,i,n,r,o,s,l,c=""){return this.pieza(e,"caja",t,i,n,r,o,s,l,c)}lote(e,t,i,n,r=""){let o=new Gt(this.geos[t],this.mat(i,r),n.length),s=this.dummy;return n.forEach((l,c)=>{s.position.set(l[0],l[1],l[2]),s.scale.set(l[3],l[4],l[5]),s.rotation.set(l[6]||0,l[7]||0,l[8]||0),s.updateMatrix(),o.setMatrixAt(c,s.matrix),o.setColorAt(c,new xe().setRGB(.79+ye(c+21)*.21,.78+ye(c+21)*.19,.74+ye(c+21)*.22))}),e.add(o),o}sombra(e,t){let i=this.materialSombra(),n=new ft(this.geos.tela,i);n.rotation.x=-Math.PI/2,n.position.y=.04,n.scale.set(t*1.8,t*1.6,1),e.add(n)}materialSombra(){return this.sombraMat||(this.sombraMat=new Sa({map:this.sombraTex,transparent:!0,depthWrite:!1}),this.velar(this.sombraMat)),this.sombraMat}compactar(e){e.updateMatrixWorld(!0);let t=e.matrixWorld.clone().invert(),i=new Map,n=[];e.traverse(o=>{if(!o.isMesh||!Object.values(this.geos).includes(o.geometry))return;let s=o.geometry.uuid+o.material.uuid,l=i.get(s);l||(l={geo:o.geometry,mat:o.material,items:[]},i.set(s,l));let c=new Re().multiplyMatrices(t,o.matrixWorld);if(o.isInstancedMesh)for(let h=0;h<o.count;h++){let u=new Re;o.getMatrixAt(h,u);let d=new xe(1,1,1);o.instanceColor&&o.getColorAt(h,d),l.items.push({m:new Re().multiplyMatrices(c,u),c:d})}else l.items.push({m:c,c:new xe(1,1,1)});n.push(o)});for(let o of n)o.parent.remove(o),o.isInstancedMesh&&o.dispose();let r=new Map;for(let o of i.values()){if(e.isScene&&o.items.length<4&&!o.mat.transparent){r.has(o.mat)||r.set(o.mat,[]);for(let l of o.items){let c=o.geo.clone().applyMatrix4(l.m);if(c.index){let u=c;c=c.toNonIndexed(),u.dispose()}let h=[];for(let u=0;u<c.attributes.position.count;u++)h.push(l.c.r,l.c.g,l.c.b);c.setAttribute("color",new Pe(h,3)),r.get(o.mat).push(c)}continue}let s=new Gt(o.geo,o.mat,o.items.length);o.items.forEach((l,c)=>{s.setMatrixAt(c,l.m),s.setColorAt(c,l.c)}),e.add(s)}for(let[o,s]of r){let l=Im(s);for(let h of s)h.dispose();let c=o.clone();c.vertexColors=!0,this.velar(c),e.add(new ft(l,c))}}bandera(e,t,i,n,r="#355f88"){this.caja(e,"#68482c",t,i,n,.09,3,.09),this.caja(e,r,t+.53,i+.8,n,1.05,.7,.035),this.caja(e,"#e4d4a7",t+.53,i+.55,n,.95,.08,.04)}casa(e,t,i,n,r,o){this.caja(e,"#ded1ac",t,o/2,i,n,o,r,"piedra"),this.caja(e,"#ead7ab",t,o+.1,i,n+.25,.22,r+.25,"piedra");for(let l of[-1,1])this.caja(e,"#cfb98a",t+l*n/2,o+.35,i,.16,.5,r+.3,"piedra");this.caja(e,"#302a23",t,o*.32,i+r/2+.015,.7,o*.64,.04);for(let l=0;l<4;l++)this.caja(e,"#63482e",t-n*.4+l*n*.26,o-.14,i,n*.08,.15,r+.48,"madera");let s=this.caja(e,"#3c3730",t+n*.28,o*.64,i+r/2+.03,.4,.5,.04);if(s.material=this.mat("#ffbf65","",!0),!this.ventanaMat){this.ventanaMat=s.material;let l=this.ventanaMat.onBeforeCompile;this.ventanaMat.onBeforeCompile=c=>{l(c),c.fragmentShader=c.fragmentShader.replace("vec2 uvN=",`gl_FragColor.rgb=mix(vec3(.025,.023,.02),vec3(1.0,.42,.08),nocheVista);
vec2 uvN=`)},this.ventanaMat.customProgramCacheKey=()=>"ventanas-v2"}for(let l of[-1,1])this.caja(e,"#b9a383",t+l*.43,o*.32,i+r/2+.06,.16,o*.66,.18,"piedra");this.caja(e,"#caba99",t,o*.66,i+r/2+.08,1.1,.23,.23,"piedra");for(let l=0;l<7;l++)this.caja(e,"#c3ae89",t+n/2+.45,(l+1)*o/14,i-r/2+l*r/8,.85,(l+1)*o/7,r/8,"piedra");for(let l=0;l<3;l++)this.pieza(e,"bola","#a96d48",t-n*.35+l*.55,.36,i+r/2+.5,.46,.65,.46),this.pieza(e,"palo","#584536",t-n*.35+l*.55,.68,i+r/2+.5,.23,.08,.23)}edificio(e,t){let i=new lt,n=new lt,r=new lt;i.add(n,r),this.sombra(i,t),this.caja(i,"#a79570",0,.12,0,t+.4,.24,t+.4,"piedra");let o=2.7;if(e==="granja"){o=.9,this.caja(n,"#77593a",0,.04,0,t,.08,t);let s=[];for(let l=0;l<160;l++){let c=(l%16-7.5)*t/17,h=(Math.floor(l/16)-4.5)*t/11;s.push([c,.5,h,.06,.8,.06,0,0,.08*Math.sin(l)])}i.userData.cultivo=this.lote(n,"palo","#d7b453",s),this.lote(n,"bola","#e5c566",s.map(l=>[l[0],.91,l[2],.18,.3,.16])),i.userData.espigas=n.children.at(-1)}else if(e==="gobernador"){o=4.5,this.casa(n,0,-t*.28,t,t*.44,4),this.casa(n,-t*.34,t*.12,t*.3,t*.6,3),this.casa(n,t*.34,t*.12,t*.3,t*.6,3),this.caja(n,"#ba8150",0,2.7,1.9,2.8,.08,2);for(let s of[-1.3,1.3])this.caja(n,"#775232",s,1.35,2.7,.12,2.7,.12);this.bandera(n,2,5,-1)}else if(e==="torre"){o=7,this.casa(n,0,0,t*.8,t*.8,6);for(let s of[-1,0,1])for(let l of[-1,1])this.caja(n,"#ddc79b",s,6.6,l,.6,.9,.6,"piedra");this.bandera(n,0,7,0)}else if(this.casa(n,-t*.15,-t*.2,t*.68,t*.55,2.7),e!=="casa"){this.caja(n,e==="cuartel"?"#547a9b":"#c39a61",.5,2.4,t*.26,t*.8,.1,t*.45);for(let s of[-t*.3,t*.45])this.caja(n,"#6f4a2a",s,1.2,t*.45,.1,2.4,.1)}if(e==="aserradero"||e==="taller"){for(let s=0;s<6;s++){let l=this.pieza(n,"palo","#76502d",-.8+s%3*.6,.3+Math.floor(s/3)*.45,1.1,.5,2.7,.5,"madera");l.rotation.z=Math.PI/2}this.caja(n,"#936339",1,.85,0,1.5,.15,.8),this.caja(n,"#9daca5",1,1.05,0,1.5,.06,.12),e==="taller"&&(this.caja(n,"#815632",1.4,.9,1.6,1.1,1.8,.16,"madera"),this.caja(n,"#343c3d",1.4,1,1.7,1.1,.12,.07))}if(e==="deposito"&&(this.lote(n,"sillar","#e1c99b",Array.from({length:12},(s,l)=>[-1.2+l%4*.65,.35+Math.floor(l/4)*.5,1,.6,.48,.8]),"piedra"),this.caja(n,"#77512c",1.5,2,0,.17,4,.17),this.caja(n,"#77512c",.4,3.8,0,2.5,.16,.16),this.caja(n,"#4d4032",-.6,2.6,0,.035,2.3,.035)),e==="molino"){let s=this.pieza(n,"palo","#a4987b",0,.3,1.1,1.6,.4,1.6);this.caja(n,"#766044",0,.6,1.1,1.8,.09,.16);for(let l=0;l<4;l++)this.pieza(n,"bola","#c9b488",1.4+l*.13,.4,1+l%2*.6,.55,.8,.5)}if(e==="cuartel"){this.bandera(n,2.1,3.2,1);for(let s=0;s<5;s++)this.caja(n,"#645032",-2+s*.5,1,2,.06,2,.06),this.pieza(n,"cono","#a4adb0",-2+s*.5,2.1,2,.2,.35,.2),this.pieza(n,"bola","#416a8e",-2+s*.5,.6,2.1,.5,.7,.15)}for(let s of[-t*.52,t*.52])for(let l of[-t*.52,t*.52]){this.caja(r,"#88643c",s,o*.55,l,.1,o*1.1,.1);for(let c=.7;c<o;c+=.8)this.caja(r,"#88643c",0,c,l,t*1.15,.08,.14)}return e!=="granja"&&this.compactar(n),this.compactar(r),i.userData.cuerpo=n,i.userData.andamio=r,i.userData.alto=o,i}tramo(e){let t=new lt,i=new lt,n=[],r=[],o=Math.hypot(e.b.x-e.a.x,e.b.z-e.a.z);t.add(i);let s=["hananeel","hornos","ancho","valientes"].includes(e.nombre),l=s?8.8:5.8,c=Math.max(2,Math.ceil(o/1.15)),h=o/c;for(let x=0;x<(s?14:9);x++)for(let _=0;_<c+x%2;_++){let v=Math.max(-o/2,-o/2+(_-x%2*.5)*h),y=Math.min(o/2,-o/2+(_+1-x%2*.5)*h),C=(v+y)/2;e.tipo==="puerta"&&Math.abs(C)<o*.29&&x<7||n.push([C,x*.62+.32,0,y-v-.035,.58,(s?4.6:2.6)+(1-x/14)*.8,0,(ye(x*77+_)-.5)*.025,0])}n.push([0,l-.13,0,o+.16,.23,s?4.9:2.9]);for(let x=0;x<c;x+=2)for(let _ of[-1,1])n.push([-o/2+(x+.5)*h,l+.4,_*(s?2.1:1.25),h*.8,.8,.4]);if(e.tipo==="puerta")for(let x of[-1,1])for(let _=0;_<9;_++)n.push([x*o*.34,_*.62+.31,.1,o*.16,.59,4.1]);n.sort((x,_)=>x[1]+x[4]*.5-_[1]-_[4]*.5),t.userData.bloques=this.lote(i,"sillar","#ddd2b9",n,"piedra"),t.userData.lista=n;let u=new lt;if(i.add(u),e.tipo==="puerta")for(let x of[-1,1])this.caja(u,"#807c6e",x*o*.4,l/2,0,o*.19,l-.2,2.5);else this.caja(u,"#807c6e",0,l/2,0,o-.05,l-.2,s?4.3:2.5);t.userData.mortero=u,t.userData.muro=i,t.userData.alto=l;for(let x=0;x<Math.ceil(o*3);x++)r.push([(ye(x+1)-.5)*o,.12+ye(x+2)*.35,(ye(x+3)-.5)*4,.4+ye(x+4)*.9,.3+ye(x+5)*.6,.5+ye(x+6)*.6,ye(x),ye(x+9)*4,ye(x+12)]);t.userData.escombros=new lt,t.add(t.userData.escombros),this.lote(t.userData.escombros,"sillar","#645e55",r,"piedra"),this.lote(t.userData.escombros,"roca","#969083",r.map(x=>[x[0],x[1]*.5,x[2]*1.4,x[3]*.5,x[4]*.45,x[5]*.6,x[6],x[7],x[8]]),"piedra"),this.lote(t.userData.escombros,"caja","#2c2926",Array.from({length:3},(x,_)=>[(ye(_+10)-.5)*o,.24,(ye(_+14)-.5)*3,.22,.22,2+ye(_)*2,0,ye(_)*5,.12]),"madera");let d=new lt;for(let x=0;x<4;x++){let _=this.caja(d,"#453b32",-.4+x*.23,1+x*.52,.85,.055,.8,.025);_.rotation.z=x%2?.5:-.3}if(t.add(d),t.userData.grietas=d,e.tipo==="puerta"){t.userData.hojas=[];for(let x of[-1,1]){let _=new lt;_.position.set(x*o*.29,0,0),t.add(_),this.caja(_,"#8a6036",-x*o*.145,2.1,0,o*.29,4.2,.38,"madera");for(let v of[.6,2.6])this.caja(_,"#a18450",-x*o*.145,v,.14,o*.29,.16,.08);for(let v=1;v<4;v++)this.caja(_,"#513a26",-x*o*.29*v/4,2.1,.21,.025,4.1,.015);for(let v of[.6,2.6])for(let y=0;y<5;y++)this.pieza(_,"bola","#b49a64",-x*o*.29*(y+.5)/5,v,.24,.085,.085,.05);this.pieza(_,"aro","#b49a64",-x*.35,1.75,.25,.25,.25,.25),t.userData.hojas.push(_)}}let p=new lt;t.add(p);let m=this.pieza(p,"cono","#ffbd50",0,l+.7,1.2,.36,.9,.36);if(m.material=this.mat("#ffc46a","",!0),this.caja(i,"#51422f",0,l-.1,1.3,.14,1,.14,"madera"),!this.resplandorMat){let x=document.createElement("canvas");x.width=x.height=128;let _=x.getContext("2d"),v=_.createRadialGradient(64,64,0,64,64,64);v.addColorStop(0,"#ffad4888"),v.addColorStop(.3,"#ff941e38"),v.addColorStop(1,"#ff730000"),_.fillStyle=v,_.fillRect(0,0,128,128),this.resplandorMat=new Sa({map:new Ea(x),transparent:!0,depthWrite:!1,blending:cm}),this.velar(this.resplandorMat)}let g=new ft(this.geos.tela,this.resplandorMat);g.rotation.x=-Math.PI/2,g.position.set(0,.16,2),g.scale.set(12,10,1),p.add(g);let f=new ft(this.geos.bola,this.resplandorMat);return f.position.set(0,l+.7,1.2),f.scale.set(1.4,1.9,1.4),p.add(f),t.userData.antorcha=p,t.userData.llama=m,this.sombra(t,o*.95),t}recurso(e){let t=new lt;if(this.sombra(t,e.tipo==="arbol"?3:2),e.tipo==="arbol"||e.tipo==="olivo"){let i=Number(e.id)||(e.x||0)*17+(e.z||0)*31,n=ye(i+91);if(e.tipo==="olivo"){for(let r=0;r<4;r++){let o=this.pieza(t,"palo","#75634e",Math.sin(r*1.3)*.17,.32+r*.48,0,.48-r*.055,.72,.43-r*.045,"madera");o.rotation.z=Math.sin(r*1.7)*.35}for(let r=0;r<7;r++){let o=r*2.4,s=Math.sin(o),l=Math.cos(o);this.pieza(t,"palo","#786852",s*.65,1.65,l*.65,.16,1.6,.16,"madera").rotation.set(l*.7,0,-s*.7),this.pieza(t,"bola",r%2?"#87917a":"#727f69",s*1.25,2.15+ye(r+i)*.45,l*1.15,2+ye(r+8)*.6,1+ye(r+3)*.45,1.8+ye(r+5)*.5)}}else{let r=.75+n*.65,o=.75+ye(i+2)*.4;this.pieza(t,"palo","#735435",0,1.5*r,0,.4,3*r,.4,"madera");let s=[];for(let l=0;l<3;l++)s.push([Math.sin(l+n)*.14,(2.5+l*.95)*r,0,(3.4-l*.7)*o,(2.7-l*.25)*r,(3.4-l*.7)*o]);this.lote(t,"cono",["#526844","#647452","#465e48"][Math.floor(n*3)],s)}}else if(e.tipo==="oveja"){this.pieza(t,"bola","#e7dfc8",0,.65,0,.8,.9,1.4),this.pieza(t,"bola","#665849",0,.75,.7,.4,.5,.5);for(let i of[-.25,.25])for(let n of[-.4,.4])this.caja(t,"#75614c",i,.25,n,.1,.5,.1)}else if(e.tipo==="escombros"){let i=[];for(let n=0;n<28;n++)i.push([(ye(n+3)-.5)*3.4,.12+ye(n+8)*.65,(ye(n+5)-.5)*3,.4+ye(n)*.9,.18+ye(n+2)*.35,.4+ye(n+9)*.6,ye(n)*.8,ye(n+3)*6,ye(n+5)*.3]);this.lote(t,"sillar","#77746b",i.slice(0,14),"piedra"),this.lote(t,"roca","#9a978a",i.slice(14),"piedra"),this.lote(t,"caja","#302b27",[[.3,.42,.3,.18,.16,3,0,.7,.1],[-.7,.3,-.4,.16,.17,2.5,0,-.9,.1]],"madera")}else if(this.lote(t,e.tipo==="cantera"?"roca":"sillar",e.tipo==="cantera"?"#c6c1ae":"#66625a",Array.from({length:e.tipo==="cantera"?8:17},(i,n)=>[(ye(n+3)-.5)*3.4,.15+ye(n+8)*.5,(ye(n+5)-.5)*3,.8+ye(n+1),.7+ye(n+2),.8+ye(n+9),ye(n),ye(n+3),0]),"piedra"),e.tipo==="cantera")for(let i=0;i<4;i++)this.caja(t,"#796e59",-.7+i*.38,.9,1,.025,.7,.03);return t}};var xl=class{constructor(e){this.vista=e,this.cache=new WeakMap,this.lotes=new Map,this.matriz=new Re}partes(e){let t=this.cache.get(e);if(t)return t;e.updateMatrixWorld(!0);let i=e.matrixWorld.clone().invert();return t=[],e.traverse(n=>{if(!n.isMesh)return;let r=new Re().multiplyMatrices(i,n.matrixWorld);if(n.isInstancedMesh)for(let o=0;o<n.count;o++){let s=new Re,l=new xe(1,1,1);n.getMatrixAt(o,s),n.instanceColor&&n.getColorAt(o,l),t.push({geo:n.geometry,mat:n.material,m:new Re().multiplyMatrices(r,s),c:l})}else t.push({geo:n.geometry,mat:n.material,m:r,c:new xe(1,1,1)})}),this.cache.set(e,t),t}dibujar(e){let t=[],i=new Map;for(let n of e.values())if(n.userData.tipo==="recurso"){n.updateMatrixWorld(!0);let r=this.partes(n);t.push([n,r]);for(let o of r)o.key=o.geo.uuid+o.mat.uuid,i.set(o.key,(i.get(o.key)||0)+1),this.lotes.has(o.key)||this.lotes.set(o.key,{geo:o.geo,mat:o.mat,malla:null,cap:0})}for(let[n,r]of this.lotes){let o=i.get(n)||0;o>r.cap&&(r.malla&&(this.vista.escena.remove(r.malla),r.malla.dispose()),r.cap=2**Math.ceil(Math.log2(Math.max(16,o))),r.malla=new Gt(r.geo,r.mat,r.cap),r.malla.instanceMatrix.setUsage(ml),r.malla.frustumCulled=!1,this.vista.escena.add(r.malla)),r.malla&&(r.malla.count=0)}for(let[n,r]of t)for(let o of r){let s=this.lotes.get(o.key).malla;this.matriz.multiplyMatrices(n.matrixWorld,o.m),s.setMatrixAt(s.count,this.matriz),s.setColorAt(s.count++,o.c)}for(let n of this.lotes.values())n.malla&&(n.malla.instanceMatrix.needsUpdate=!0,n.malla.instanceColor.needsUpdate=!0)}},yl=class{constructor(e){this.vista=e,this.lotes=new Map,this.local=new Re,this.mundo=new Re,this.color=new xe}dibujar(e){let t=new Map;for(let i of e){i.updateMatrixWorld(!0);let n=r=>{if(!(r!==i&&!r.visible)){if(r.isMesh){let o=r.geometry.uuid+r.material.uuid;t.has(o)||t.set(o,{geo:r.geometry,mat:r.material,objetos:[],n:0});let s=t.get(o);s.objetos.push(r),s.n+=r.isInstancedMesh?r.count:1}for(let o of r.children)n(o)}};n(i),i.visible=!1}for(let i of this.lotes.values())i.malla.count=0;for(let[i,n]of t){if(!n.n)continue;let r=this.lotes.get(i);if(!r||r.cap<n.n){r&&(this.vista.escena.remove(r.malla),r.malla.dispose());let s=2**Math.ceil(Math.log2(Math.max(16,n.n))),l=new Gt(n.geo,n.mat,s);l.frustumCulled=!1,this.vista.escena.add(l),r={malla:l,cap:s},this.lotes.set(i,r)}let o=r.malla;o.count=0;for(let s of n.objetos){let l=s.isInstancedMesh?s.count:1;for(let c=0;c<l;c++)this.color.setRGB(1,1,1),s.isInstancedMesh?(s.getMatrixAt(c,this.local),this.mundo.multiplyMatrices(s.matrixWorld,this.local),s.instanceColor&&s.getColorAt(c,this.color)):this.mundo.copy(s.matrixWorld),o.setMatrixAt(o.count,this.mundo),o.setColorAt(o.count++,this.color)}o.instanceMatrix.needsUpdate=!0,o.instanceColor.needsUpdate=!0}}};var lv={samaria:"#b02e40",amon:"#8e329b",arabes:"#c67a29",asdod:"#788c2f"},bl=class{constructor(e){this.v=e,this.lotes={},this.raiz=new gt,this.local=new gt,this.matriz=new Re,this.color=new xe,this.capacidad=0}reservar(e){if(!(e<=this.capacidad)){this.capacidad=2**Math.ceil(Math.log2(Math.max(64,e)));for(let t of Object.values(this.lotes))this.v.escena.remove(t),t.dispose();for(let t of["caja","cono","bola","palo","aro","sombra"]){let i=new Gt(t==="sombra"?this.v.arte.geos.tela:this.v.arte.geos[t],t==="sombra"?this.v.arte.materialSombra():this.v.arte.mat("#ffffff"),this.capacidad*18);i.instanceMatrix.setUsage(ml),i.frustumCulled=!1,this.v.escena.add(i),this.lotes[t]=i}}}pieza(e,t,i,n,r,o,s,l,c=0,h=0,u=0){let d=this.lotes[e],p=d.count++,m=this.local;m.position.set(i,n,r),m.rotation.set(c,h,u),m.scale.set(o,s,l),m.updateMatrix(),this.matriz.multiplyMatrices(this.raiz.matrix,m.matrix),d.setMatrixAt(p,this.matriz),d.setColorAt(p,this.color.set(t))}dibujar(e,t){this.reservar(e.unidades.size+e.enemigos.size);for(let i of Object.values(this.lotes))i.count=0;for(let[i,n]of[[!1,e.unidades],[!0,e.enemigos]])for(let r of n.values()){if(r.accion==="guarnecido"||i&&this.v.visibilidad(r.x,r.z)!==2)continue;let o=r.accion,s=t*(o==="herido"?4:9)+Number(r.id||0)*1.7,l=["camina","huye","herido","saquea"].includes(o),c=l?Math.sin(s)*.65:0,h=["tala","pica","construye","ataca","incendia","cosecha"].includes(o),u=h?Math.sin(s)*.9:0,d=i?lv[r.faccion]||"#944739":"#256695",p=r.tipo==="nehemias",m=r.tipo==="jinete"||r.tipo==="jinete_arabe",g=m?1.25:0;if(this.raiz.position.set(r.x,this.v.altura(r.x,r.z)+(l?Math.abs(Math.sin(s))*.04:0),r.z),this.raiz.rotation.set(o==="herido"?.12:0,r.dir||0,o==="herido"?.13:0),this.raiz.scale.setScalar(p?1.32:1.14),this.raiz.updateMatrix(),this.pieza("sombra","#ffffff",0,.045,0,m?2.8:1.5,m?3.5:1.5,1,-Math.PI/2),m){let _=r.tipo==="jinete_arabe";this.pieza("bola",_?"#b18d58":"#79583d",0,1,0,.9,1,1.8),this.pieza("palo","#98734b",0,1.35,.65,.35,.9,.35,-.4),this.pieza("bola","#98734b",0,1.8,.95,.4,.45,.7);for(let v of[-.3,.3])for(let y of[-.6,.6])this.pieza("palo","#735339",v,.5,y,.13,.9,.13,c*(y>0?1:-1));_&&this.pieza("bola","#b18d58",0,1.65,-.2,.65,.65,.65),this.pieza("caja",d,0,1.5,-.1,.95,.12,.8)}this.pieza("cono",i?d:"#e8d5af",0,.85+g,0,.68,.95,.52),this.pieza("caja",d,0,1.08+g,0,.56,.15,.42),this.pieza("bola","#b98e61",0,1.58+g,0,.43,.5,.43),this.pieza("bola",i?"#342c2a":"#e6d8b7",0,1.78+g,-.02,.5,.25,.48),this.pieza("caja","#5b4435",0,1.47+g,.16,.27,.14,.12);for(let _ of[-1,1]){this.pieza("palo","#a77b51",_*.15,.32+g,0,.14,.61,.14,c*_);let v=o==="ora"?-2.7:o==="toca"?-1.7:o==="dispara"?-1.5:h?-.7+u:c*-_*.7;this.pieza("palo",i?d:"#dfcba4",_*.35,(o==="ora"?1.7:1.07)+g,Math.sin(v)*-.24,.15,.66,.15,v,0,o==="ora"?_*.4:0)}i&&(this.pieza("cono","#3d3137",0,2.02+g,0,.57,.55,.57),this.pieza("bola",d,-.42,.95+g,.18,.62,.85,.17),this.pieza("caja","#3a292c",0,1.02+g,-.25,.7,1.05,.09,.13)),p&&(this.pieza("caja","#31577d",0,1+g,-.24,.65,1.15,.09,.15),this.pieza("aro","#dfb755",0,.08,0,2,2,2,Math.PI/2));let f=1.2+g,x=.42;if(r.tipo==="lancero"||m)this.pieza("palo","#745335",.46,1.35+g,.2,.07,2.5,.07),this.pieza("cono","#b7c3c2",.46,2.7+g,.2,.19,.35,.19);else if(r.tipo==="arquero"||o==="dispara")r.tipo==="hondero"?this.pieza("aro","#765b3e",.4,f+.3,.4,.6,.8,.5,Math.sin(s)):(this.pieza("aro","#825d30",.45,f,.48,.7,1.2,.4,0,0,.2),this.pieza("palo","#cbb68d",.45,f,.48,.025,1,.025));else if(o==="toca")this.pieza("cono","#c6a56a",.3,1.55,.62,.4,.7,.4,Math.PI/2);else if(h){let _=-.6+u;this.pieza("palo","#73502f",.43,f,x,.07,.85,.07,_),o==="cosecha"?this.pieza("aro","#b3bbb4",.43,f+.35,x,.45,.5,.15,_):this.pieza("caja",o==="construye"?"#6c5b45":"#a1aaa5",.43,f+.35,x,.47,.2,.13,_)}(r.armado||r.tipo==="cabecilla")&&this.pieza("caja","#aeb8b8",-.35,.8,.12,.09,.7,.08,0,0,-.3),(r.carga||o==="saquea")&&this.pieza("bola",r.carga?.recurso==="piedra"?"#9d9d8d":r.carga?.recurso==="madera"?"#805a35":"#cbb079",0,.95,-.45,.65,.65,.4),o==="herido"&&this.pieza("caja","#f4e5ca",.35,1,.05,.19,.2,.3),r.tipo==="cabecilla"&&(this.pieza("palo","#705334",-.5,1.9,-.1,.07,2.8,.07),this.pieza("caja",d,-.15,3,-.1,.8,.6,.04))}for(let i of Object.values(this.lotes))i.instanceMatrix.needsUpdate=!0,i.instanceColor&&(i.instanceColor.needsUpdate=!0)}};var Qt=(a,e,t)=>Math.max(e,Math.min(t,a)),Ml=class{constructor(e,t){this.canvas=e,this.datos=t,this.estado=null,this.t=0,this.seleccion=new Set,this.objetos=new Map,this.tramos=new Map,this.efectos=[],this.eventosVistos=new WeakSet,this.portada=!1,this.centro={x:0,z:0},this.distancia=100,this.giro=.34,this.rayo=new ul,this.vector=new A,this.tamano=new ce,this.renderer=new ao({canvas:e,antialias:!0,alpha:!1,preserveDrawingBuffer:globalThis.location?.search.includes("captura")||!1,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,1.5)),this.renderer.outputColorSpace=xt,this.renderer.toneMapping=cu,this.renderer.toneMappingExposure=1.12,this.escena=new Ks,this.escena.background=new xe("#d6c59e"),this.escena.fog=new Js("#d6c59e",.0026),this.cieloMaterial=new Di({side:Ht,depthWrite:!1,uniforms:{cenit:{value:new xe("#8ca6b1")},horizonte:{value:new xe("#e3d1aa")}},vertexShader:"varying float alto;void main(){alto=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",fragmentShader:"uniform vec3 cenit;uniform vec3 horizonte;varying float alto;void main(){gl_FragColor=vec4(mix(horizonte,cenit,smoothstep(-.05,.8,alto)),1.);}"});let i=new ft(new ln(500,24,16),this.cieloMaterial);i.renderOrder=-10,this.escena.add(i),this.camera=new Yt(38,1,.5,1100),this.ambiente=new cl("#f4e8cf","#7c7259",2.1),this.sol=new hl("#ffddb0",2.5),this.sol.position.set(-60,100,-35),this.escena.add(this.ambiente,this.sol);let n=new no(new Uint8Array([255,255,255,255]),1,1);n.needsUpdate=!0,this.niebla={textura:{value:n},medio:{value:t.MAPA.medio},lado:{value:t.MAPA.lado},noche:{value:0}},this.arte=new vl(this.niebla),this.personas=new bl(this),this.recursosLote=new xl(this),this.arquitecturaLote=new yl(this),this.crearTerreno(),this.decorado(),this.arte.compactar(this.escena),this.crearAyudas(),this.redimensionar()}altura(e,t){return this.datos.relieve(e,t)}crearTerreno(){let e=this.arte,t=new wa(760,760,300,300);t.rotateX(-Math.PI/2);let i=t.attributes.position,n=[];for(let h=0;h<i.count;h++){let u=i.getX(h),d=i.getZ(h),p=Math.hypot(u,d),m=this.altura(u,d);p>140&&(m+=(Math.sin(u*.034)*Math.cos(d*.023)*7+Math.sin(u*.067+d*.019)*3)*Math.min(1,(p-140)/80)),i.setY(h,m);let g=this.datos.dentroDeLaCiudad(u,d),f=Math.sin(u*.17+Math.sin(d*.12)*2)*Math.cos(d*.21)*.5+.5,x=Math.hypot(this.altura(u+1,d)-this.altura(u-1,d),this.altura(u,d+1)-this.altura(u,d-1)),_=new xe(g?"#af9872":"#a49569");_.lerp(new xe("#c9c5ad"),Qt(x*.85+f*.32,0,.9)),_.lerp(new xe("#a07455"),Math.max(0,Math.sin(u*.055+d*.083+Math.sin(d*.11)))*.65),_.lerp(new xe("#a9a16a"),Math.max(0,Math.cos(d*.09+Math.sin(u*.08)*2))*.38),_.offsetHSL(0,0,(f-.5)*.1),n.push(_.r,_.g,_.b)}t.setAttribute("color",new Pe(n,3)),t.computeVertexNormals();let r=e.mat("#ffffff").clone();e.velar(r),r.vertexColors=!0,r.map=e.textura("#bfb9a6",!1),r.map.repeat.set(160,160),r.bumpMap=r.map,r.bumpScale=.16,this.terreno=new ft(t,r),this.escena.add(this.terreno);let o=document.createElement("canvas");o.width=o.height=64;let s=o.getContext("2d");for(let h=0;h<64;h++)for(let u=0;u<64;u++){let d=Math.sin(h/63*Math.PI),p=Math.min(1,u/6,(63-u)/6),m=Math.floor(255*Math.pow(d,.6)*p*(.7+ye(h+u*64)*.3));s.fillStyle=`rgb(${m},${m},${m})`,s.fillRect(h,u,1,1)}let l=e.mat("#a28b68").clone();e.velar(l),l.alphaMap=new Ea(o),l.transparent=!0,l.opacity=.66,l.depthWrite=!1;let c=[];for(let h of this.datos.MURO.filter(u=>u.puerta))c.push(u=>({x:-3+(h.x+3)*u*1.4+Math.sin(u*Math.PI)*1.3,z:h.z*(.7+.3*u*1.4)+Math.sin(u*Math.PI)*1.5}));c.push(h=>({x:-3+Math.sin(h*6)*1.5,z:-49+h*104}));for(let h of c){let u=[],d=[],p=[];for(let f=0;f<=100;f++){let x=f/100,_=h(x),v=h(x+.001),y=Math.hypot(v.x-_.x,v.z-_.z),C=-(v.z-_.z)/y,S=(v.x-_.x)/y;for(let w of[-1,1]){let O=_.x+C*w*1.2,N=_.z+S*w*1.2;u.push(O,this.altura(O,N)+.22,N),d.push(w<0?0:1,x)}if(f<100){let w=f*2;p.push(w,w+1,w+2,w+1,w+3,w+2)}}let g=new ct;g.setAttribute("position",new Pe(u,3)),g.setAttribute("uv",new Pe(d,2)),g.setIndex(p),g.computeVertexNormals(),this.escena.add(new ft(g,l))}}decorado(){let e=this.arte,t=new lt,i=this.datos.TEMPLO;t.position.set(i.x,this.altura(i.x,i.z),i.z),this.escena.add(t),e.caja(t,"#ded0ac",0,.3,0,16,.6,15,"piedra"),e.casa(t,0,-2,8,9,6),e.caja(t,"#eee1bd",0,6.5,-2,8.5,.6,9.5,"piedra");for(let m of[-3,3])e.caja(t,"#d6bd84",m,2.5,3.3,.8,5,.8,"piedra");e.caja(t,"#9a7744",0,2.2,2.55,2.5,4.4,.08);for(let m=0;m<5;m++)e.caja(t,"#dfcda6",0,.12+m*.12,5-m*.35,8,.24,1.5,"piedra");for(let m of this.datos.AGUA){let g=new lt;g.position.set(m.x,this.altura(m.x,m.z),m.z),this.escena.add(g),e.pieza(g,"palo","#d2bc8e",0,.05,0,m.r*2+.6,.25,m.r*2+.6,"piedra"),e.pieza(g,"palo","#263e45",0,.2,0,m.r*2,.08,m.r*2);let f=[],x=Math.max(16,Math.ceil(m.r*9));for(let _=0;_<x;_++){let v=_/x*Math.PI*2;f.push([Math.cos(v)*(m.r+.12),.36,Math.sin(v)*(m.r+.12),.52,.5,Math.PI*2*(m.r+.12)/x*.96,0,-v,0])}e.lote(g,"sillar","#b9ae94",f,"piedra");for(let _=0;_<5;_++)e.pieza(g,"bola",_%2?"#53646a":"#40565e",(_-2)*m.r*.22,.247,Math.sin(_*2)*m.r*.45,m.r*.48,.012,.06+m.r*.055)}let n=this.datos.DECORADO;for(let{x:m,z:g,rot:f}of n.ruinas){let x=new lt;x.position.set(m,this.altura(m,g),g),x.rotation.y=f,this.escena.add(x),e.lote(x,"sillar","#b5a17b",Array.from({length:12},(_,v)=>[-1.7+v%4,Math.floor(v/4)*.45+.22,v%2?1.4:-1.4,.9,.43,.55]),"piedra")}for(let{x:m,z:g,casa:f,an:x,al:_}of n.barrios){let v=new lt;if(v.position.set(m,this.altura(m,g),g),this.escena.add(v),e.sombra(v,6),f)e.casa(v,0,0,x,4,_);else{for(let y=0;y<4;y++)for(let C=0;C<5;C++)e.caja(v,"#b8ad94",-2+C,y*.5+.25,-2,.96,.47,.7,"piedra");e.caja(v,"#a89c82",-2,.7,0,.65,1.4,4,"piedra")}}for(let m of[-1,1])for(let g=0;g<6;g++)e.pieza(t,"palo","#e3ddc8",m*6.5,1.8,-5+g*2,.48,3,.48,"piedra"),e.caja(t,"#d4c8ae",m*6.5,3.4,0,.9,.4,12,"piedra");e.caja(t,"#a79a81",0,1.1,7,2.5,1.4,2,"piedra");let r=new lt;r.position.set(n.ciudadela.x,this.altura(n.ciudadela.x,n.ciudadela.z),n.ciudadela.z),this.escena.add(r),e.casa(r,0,0,12,5,5.2),e.casa(r,-6,0,3.8,6,7),e.casa(r,6,0,3.8,6,7),e.bandera(r,0,7,0);let o=[],s=[];for(let{x:m,z:g,sx:f,sy:x,sz:_,rot:v,mata:y}of n.rocas)o.push([m,this.altura(m,g)+.1,g,f,x,_,0,v,0]),y&&s.push([m,this.altura(m,g)+.2,g,.6,.4,.6]);e.lote(this.escena,"roca","#b9a37c",o,"piedra"),e.lote(this.escena,"bola","#828159",s);let l=[],c=[];for(let m=0;m<3200;m++){let g=(ye(m+3300)-.5)*240,f=(ye(m+7100)-.5)*240;if(this.datos.dentroDeLaCiudad(g,f))continue;if(Math.sin(g*.12+Math.sin(f*.09))*Math.cos(f*.14)>.25)for(let _=0;_<3;_++)l.push([g+_*.12,this.altura(g,f)+.18,f,.07,.25+ye(m)*.3,.05,0,_,.3-_*.3]);m%9===0&&c.push([g,this.altura(g,f)+.04,f,1+ye(m)*2,.16,1+ye(m+5)*2,0,ye(m)*6,0])}e.lote(this.escena,"caja","#b6a16c",l),e.lote(this.escena,"roca","#cac6b4",c,"piedra");for(let{x:m,z:g}of n.olivos){let f=e.recurso({tipo:"olivo"});f.position.set(m,this.altura(m,g),g),this.escena.add(f)}let h=[];for(let{x:m,z:g,ang:f}of n.terrazas)for(let x=0;x<2;x++)h.push([m,this.altura(m,g)+.2+x*.38,g,.9,.37,.65,0,-f-Math.PI/2,0]);e.lote(this.escena,"sillar","#b8b29b",h,"piedra");let u=[];for(let m=0;m<420;m++){let g=-100+ye(m+440)*220,f=48+Math.sin(g*.035)*6+(ye(m+890)-.5)*5;u.push([f,this.altura(f,g)+.08,g,.3+ye(m)*.7,.13+ye(m+5)*.25,.4+ye(m+9)*.5])}e.lote(this.escena,"roca","#cac7b7",u,"piedra");let d=[],p=[];for(let{x:m,z:g,h:f,w:x}of n.cipreses){let _=this.altura(m,g);d.push([m,_+f*.4,g,.28,f*.8,.28]),p.push([m,_+f*.7,g,x,f,x])}e.lote(this.escena,"palo","#715336",d,"madera"),e.lote(this.escena,"cono","#536749",p);for(let{x:m,z:g}of n.palmeras){let f=this.altura(m,g);e.pieza(this.escena,"palo","#826044",m,f+2.6,g,.35,5.2,.35);for(let x=0;x<7;x++)e.pieza(this.escena,"bola","#677b49",m+Math.sin(x)*1.1,f+5,g+Math.cos(x)*1.1,.55,.18,3,0,x,Math.sin(x)*.25)}}crearAyudas(){this.anillos=new Gt(this.arte.geos.aro,this.arte.mat("#66c4e5","",!0),512),this.anillos.frustumCulled=!1,this.escena.add(this.anillos),this.barras=new Gt(this.arte.geos.caja,this.arte.mat("#ffffff","",!0),2048),this.barras.frustumCulled=!1,this.escena.add(this.barras),this.fx=new Gt(this.arte.geos.bola,this.arte.mat("#ffffff","",!0),1024),this.fx.frustumCulled=!1,this.escena.add(this.fx),this.proys=new Gt(this.arte.geos.palo,this.arte.mat("#534638"),512),this.proys.frustumCulled=!1,this.escena.add(this.proys),this.dummy=new gt,this.color=new xe}visibilidad(e,t){let i=this.estado?.niebla;if(!i)return 2;let n=Math.floor((e+this.datos.MAPA.medio)/i.celda),r=Math.floor((t+this.datos.MAPA.medio)/i.celda);return n<0||r<0||n>=i.ancho||r>=i.alto?0:i.datos[r*i.ancho+n]}sincronizar(e){this.estado=e;let t=e.niebla;if(t){if(this.fogAncho!==t.ancho||this.fogAlto!==t.alto){this.niebla.textura.value.dispose(),this.fogDatos=new Uint8Array(t.ancho*t.alto*4);let r=new no(this.fogDatos,t.ancho,t.alto);r.minFilter=r.magFilter=ri,r.needsUpdate=!0,this.niebla.textura.value=r,this.fogAncho=t.ancho,this.fogAlto=t.alto,this.niebla.lado.value=t.ancho*t.celda}let n=!1;for(let r=0;r<t.datos.length;r++){let o=t.datos[r]*127.5|0;this.fogDatos[r*4]!==o&&(this.fogDatos.fill(o,r*4,r*4+3),this.fogDatos[r*4+3]=255,n=!0)}n&&(this.niebla.textura.value.needsUpdate=!0)}let i=new Set;for(let[n,r]of[["edificio",e.edificios],["recurso",e.recursos]])for(let o of r.values()){let s=n+":"+o.id;i.add(s);let l=this.objetos.get(s);if(l||(l=n==="edificio"?this.arte.edificio(o.tipo,this.datos.EDIFICIOS[o.tipo]?.tam||3):this.arte.recurso(o),l.userData.tipo=n,l.userData.id=o.id,this.objetos.set(s,l),n==="edificio"&&this.escena.add(l)),l.userData.estado=o,l.position.set(o.x,this.altura(o.x,o.z),o.z),n==="edificio"){let c=Qt(o.avance??1,0,1);if(l.userData.cuerpo.scale.y=Math.max(.025,c),l.userData.cuerpo.visible=c>.03,l.userData.andamio.visible=c<1,l.userData.andamio.scale.y=.25+c*.75,l.userData.cultivo){let h=Math.round(160*Qt(o.comida/(this.datos.EDIFICIOS.granja.comida||175),0,1));l.userData.cultivo.count=h,l.userData.espigas.count=h}}else{let c=Qt(o.cant/(o.cantMax||o.cant||1),0,1);l.scale.setScalar(o.tipo==="oveja"?1:.3+.7*Math.sqrt(c)),o.tipo==="oveja"&&(l.rotation.y=o.dir||0)}}for(let[n,r]of this.objetos)i.has(n)||(r.userData.estado.tipo==="arbol"&&this.toconesCount!==128&&(this.toconesCount=(this.toconesCount||0)+1,this.arte.pieza(this.escena,"palo","#785338",r.position.x,r.position.y+.18,r.position.z,.55,.36,.55)),this.quitar(r),this.objetos.delete(n));for(let n of e.tramos){let r=this.tramos.get(n.id);r||(r=this.arte.tramo(n),r.position.set((n.a.x+n.b.x)/2,this.altura((n.a.x+n.b.x)/2,(n.a.z+n.b.z)/2),(n.a.z+n.b.z)/2),r.rotation.y=-Math.atan2(n.b.z-n.a.z,n.b.x-n.a.x),r.userData.tipo="tramo",r.userData.id=n.id,this.tramos.set(n.id,r),this.escena.add(r)),r.userData.estado=n;let o=r.userData,s=Qt(n.avance,0,1);o.avanceObjetivo=s,o.avanceVisual??(o.avanceVisual=s),s<o.avanceVisual&&(o.avanceVisual=s),this.actualizarMuro(o)}for(let n of e.eventos||[])this.eventosVistos.has(n)||(this.eventosVistos.add(n),this.emitir(n))}actualizarMuro(e){let t=e.estado,i=e.avanceVisual;if(e.muro.visible=i>.12,e.muro.scale.y=1,e.mortero.scale.y=Math.max(.02,Math.floor(i*(e.alto/.62))*.62/e.alto),e.bloques.count=i>=1?e.lista.length:e.lista.reduce((n,r)=>n+ +(r[1]+r[4]*.5<=i*(e.alto+.85)),0),e.conteoAnterior!==e.bloques.count&&(e.bloques.computeBoundingSphere(),e.conteoAnterior=e.bloques.count),e.escombros.scale.y=1-i*.65+(1-t.hp/(t.hpMax||1))*.6,e.grietas.visible=t.hp<t.hpMax*.7&&i>.8,e.antorcha.visible=i>=1&&this.esNoche(),e.hojas)for(let n=0;n<2;n++)e.hojas[n].visible=!!t.hojas,e.hojas[n].rotation.y=t.abierta?(n?1:-1)*1.25:0}quitar(e){this.escena.remove(e),e.traverse(t=>{t.isInstancedMesh&&t.dispose()});for(let t of e.userData.materialesFantasma||[])t.dispose()}esNoche(){let e=this.estado?.hora??.4,t=this.datos.NOCHE;return e>=(t?.desde??.72)&&e<(t?.hasta??.97)}emitir(e){let t=["trompeta","oracion","exhortar","tramo_completo","terminado","hojas"].includes(e.tipo),i=t?"#ffe0a0":e.tipo==="pica"?"#ffe5a3":e.tipo==="tala"?"#b48a50":e.tipo==="golpe"?"#fff1cc":"#c8b895";if(t){this.efectos.push({x:e.x,z:e.z,t:0,dur:2,onda:!0,color:i});return}for(let n=0;n<9;n++)this.efectos.push({x:e.x,z:e.z,t:0,dur:.8,dx:(ye(n+this.t)-.5)*3,dz:(ye(n+50+this.t)-.5)*3,dy:1+ye(n)*2,color:i});this.efectos.length>700&&this.efectos.splice(0,this.efectos.length-700)}render(e){e=Qt(Number.isFinite(e)?e:0,0,.1),this.t+=e,this.portada&&(this.giro+=e*.035),this.actualizarCamara();for(let t of this.tramos.values()){let i=t.userData;i.avanceVisual=Math.min(i.avanceObjetivo,i.avanceVisual+e*.24),this.actualizarMuro(i)}if(this.estado){let t=this.estado.hora??.4,i=this.esNoche(),n=!i&&(t<.14||t>.59),r=(c,h,u)=>{let d=Qt((u-c)/(h-c),0,1);return d*d*(3-2*d)},o=this.datos.NOCHE||{desde:.79,hasta:.96},s=r(o.desde-.045,o.desde+.025,t)*(1-r(o.hasta-.025,o.hasta+.04,t)),l=new xe(n?"#c5a37e":"#d5c5a4").lerp(new xe("#17263e"),s);this.niebla.noche.value=s,this.cieloMaterial.uniforms.cenit.value.set(n?"#9f8d9d":"#8da7b6").lerp(new xe("#061127"),s),this.cieloMaterial.uniforms.horizonte.value.copy(l),this.escena.background.copy(l),this.escena.fog.color.copy(l),this.ambiente.color.set("#fff1d8").lerp(new xe("#b2c6eb"),s),this.ambiente.intensity=nr.lerp(1.5,1.6,s),this.sol.color.set(n?"#ffc27a":"#ffe1ae").lerp(new xe("#bccdeb"),s),this.sol.intensity=nr.lerp(n?3:2.5,2,s),this.sol.position.set(Math.cos(t*6.28)*90,70,-60),this.personas.dibujar(this.estado,this.t),this.dibujarAyudas(e),this.recursosLote.dibujar(this.objetos),this.arquitecturaLote.dibujar([...this.tramos.values(),...[...this.objetos.values()].filter(c=>c.userData.tipo==="edificio")])}this.renderer.render(this.escena,this.camera)}instancia(e,t,i,n,r,o,s,l,c=0,h=0,u=0){if(e.count>=e.instanceMatrix.count)return;let d=this.dummy;d.position.set(t,i,n),d.scale.set(r,o,s),d.rotation.set(c,h,u),d.updateMatrix(),e.setMatrixAt(e.count,d.matrix),e.setColorAt(e.count++,this.color.set(l))}dibujarAyudas(e){this.anillos.count=this.barras.count=this.fx.count=this.proys.count=0;let t=this.estado;this.halos||(this.halos=new Gt(this.arte.geos.tela,this.arte.resplandorMat,256),this.halos.frustumCulled=!1,this.escena.add(this.halos)),this.halos.count=0;let i=(n,r,o,s)=>{if(r==="enemigo"&&this.visibilidad(n.x,n.z)!==2||n.accion==="guarnecido")return;let l=this.seleccion.has(n.id)||this.seleccion.has(r+":"+n.id),c=this.altura(n.x,n.z);if(l&&this.instancia(this.anillos,n.x,c+.13,n.z,s*2,s*2,s*2,"#78d0e7",Math.PI/2),(l||n.hp<n.hpMax)&&n.hpMax&&this.visibilidad(n.x,n.z)===2){let h=new A(n.x,c+o+.6,n.z),u=new A(1,0,0).applyQuaternion(this.camera.quaternion),d=Qt(n.hp/n.hpMax,0,1),p=r==="edificio"?3:1.1;this.instancia(this.barras,h.x,h.y,h.z,p,.14,.04,"#242a2a",0,this.giro),h.addScaledVector(u,-p*(1-d)*.5),this.instancia(this.barras,h.x,h.y+.015,h.z+.025,p*d,.09,.065,d<.3?"#db8a64":"#9ac78b",0,this.giro)}};for(let n of t.unidades.values())i(n,"unidad",n.tipo==="jinete"?3:2,.6);for(let n of t.enemigos.values())i(n,"enemigo",2,.6);for(let n of this.objetos.values()){let r=n.userData.estado;if(n.userData.tipo==="edificio"){i(r,"edificio",n.userData.alto,this.datos.EDIFICIOS[r.tipo]?.tam*.65||2);let o=r.fuego||0;(o>0||(r.avance??1)>=1&&this.esNoche())&&this.instancia(this.halos,r.x,this.altura(r.x,r.z)+.2,r.z,8+o*8,8+o*8,1,"#ffb15b",-Math.PI/2);for(let s=0;s<(o>0?7:r.trabajando?3:0);s++){let l=(this.t*.6+s/7)%1,c=r.x+Math.sin(s*2)*o,h=this.altura(r.x,r.z)+n.userData.alto*(r.avance||.2);this.instancia(this.fx,c,h+.2+l*3,r.z+Math.cos(s)*o,.4+l,.6+l*2,.4+l,o&&l<.5?"#ffac45":"#7b766c")}}else r.tipo==="oveja"&&(n.rotation.x=Math.sin(this.t*1.5+Number(r.id))*.08)}for(let n of this.tramos.values()){let r=n.userData.estado;if(this.seleccion.has("tramo:"+r.id)||this.seleccion.has(r.id)&&![this.estado.unidades,this.estado.enemigos,this.estado.edificios,this.estado.recursos].some(o=>o.has(r.id))){let o=n.position.x,s=n.position.z;this.instancia(this.anillos,o,n.position.y+.1,s,3,3,3,"#78d0e7",Math.PI/2)}n.userData.antorcha.visible&&(n.userData.llama.scale.y=.8+Math.sin(this.t*13+r.id)*.12)}this.efectos=this.efectos.filter(n=>{if(n.t+=e,n.t>=n.dur)return!1;let r=n.t/n.dur,o=this.altura(n.x,n.z);return n.onda?this.instancia(this.anillos,n.x,o+.18,n.z,1+r*12,1+r*12,1+r*12,n.color,Math.PI/2):this.instancia(this.fx,n.x+n.dx*n.t,o+.3+n.dy*n.t-n.t*n.t*2,n.z+n.dz*n.t,.12*(1-r),.12*(1-r),.12*(1-r),n.color),!0});for(let n of t.proyectiles||[]){let r=Qt(n.t/n.dur,0,1),o=nr.lerp(n.de.x,n.a.x,r),s=nr.lerp(n.de.z,n.a.z,r),l=nr.lerp(this.altura(n.de.x,n.de.z),this.altura(n.a.x,n.a.z),r)+1.5+Math.sin(r*Math.PI)*9,c=Math.hypot(n.a.x-n.de.x,n.a.z-n.de.z),h=Math.atan2(Math.PI*9*Math.cos(r*Math.PI),c);this.instancia(this.proys,o,l,s,.06,n.tipo==="flecha"?.9:.2,.06,"#725337",Math.PI/2-h,Math.atan2(n.a.x-n.de.x,n.a.z-n.de.z))}for(let n of[this.halos,this.anillos,this.barras,this.fx,this.proys])n.instanceMatrix.needsUpdate=!0,n.instanceColor&&(n.instanceColor.needsUpdate=!0)}actualizarCamara(){let e=this.altura(this.centro.x,this.centro.z);this.camera.position.set(this.centro.x+Math.sin(this.giro)*this.distancia*.64,e+this.distancia*.77,this.centro.z+Math.cos(this.giro)*this.distancia*.64),this.camera.lookAt(this.centro.x,e,this.centro.z),this.camera.updateMatrixWorld()}redimensionar(){let e=Math.max(1,this.canvas.clientWidth||this.canvas.width),t=Math.max(1,this.canvas.clientHeight||this.canvas.height);this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix(),this.actualizarCamara()}moverCamara(e,t){this.centro.x=Qt(this.centro.x+Math.cos(this.giro)*e+Math.sin(this.giro)*t,-110,110),this.centro.z=Qt(this.centro.z-Math.sin(this.giro)*e+Math.cos(this.giro)*t,-110,110),this.actualizarCamara()}zoom(e){e>0&&(this.distancia=Qt(this.distancia/e,20,255)),this.actualizarCamara()}girar(e){this.giro+=e,this.actualizarCamara()}centrar(e,t){this.centro.x=Qt(e,-110,110),this.centro.z=Qt(t,-110,110),this.actualizarCamara()}get camara(){return{x:this.centro.x,z:this.centro.z,zoom:100/this.distancia,giro:this.giro}}modoPortada(e){!!e!==this.portada&&(e?(this.guardada={...this.camara,distancia:this.distancia},this.centro={x:0,z:0},this.distancia=175):this.guardada&&(this.centro={x:this.guardada.x,z:this.guardada.z},this.giro=this.guardada.giro,this.distancia=this.guardada.distancia),this.portada=!!e,this.actualizarCamara())}prepararRayo(e,t){this.rayo.setFromCamera(new ce(e/this.canvas.clientWidth*2-1,1-t/this.canvas.clientHeight*2),this.camera)}pantallaASuelo(e,t){this.prepararRayo(e,t);let i=this.rayo.intersectObject(this.terreno,!1)[0];return i?{x:i.point.x,z:i.point.z}:null}sueloAPantalla(e,t){let i=this.vector.set(e,this.altura(e,t),t).project(this.camera);return{x:(i.x+1)*this.canvas.clientWidth/2,y:(1-i.y)*this.canvas.clientHeight/2,visible:i.z>=-1&&i.z<=1&&Math.abs(i.x)<=1&&Math.abs(i.y)<=1}}esquinasVista(){let e=this.canvas.clientWidth,t=this.canvas.clientHeight;return[[0,0],[e,0],[e,t],[0,t]].map(([i,n])=>this.pantallaASuelo(i,n))}elegir(e,t){if(!this.estado)return null;this.prepararRayo(e,t);let i=null,n=1/0,r=new si;for(let[l,c]of[["unidad",this.estado.unidades],["enemigo",this.estado.enemigos]])for(let h of c.values()){if(h.accion==="guarnecido"||l==="enemigo"&&this.visibilidad(h.x,h.z)!==2||this.visibilidad(h.x,h.z)===0)continue;r.center.set(h.x,this.altura(h.x,h.z)+1,h.z),r.radius=h.tipo.includes("jinete")?1.2:.85;let u=this.rayo.ray.intersectSphere(r,new A);if(u){let d=u.distanceTo(this.camera.position);d<n&&(n=d,i={tipo:l,id:h.id})}}if(i)return i;let o=[...this.objetos.values(),...this.tramos.values()];for(let l of o)l.updateMatrixWorld(!0);let s=this.rayo.intersectObjects(o,!0);for(let l of s){let c=l.object;for(;c&&!c.userData.tipo;)c=c.parent;if(c&&this.visibilidad(l.point.x,l.point.z)>0)return{tipo:c.userData.tipo,id:c.userData.id}}return null}elegirRect(e,t,i,n){if(!this.estado)return[];let r=[];for(let o of this.estado.unidades.values()){if(o.accion==="guarnecido")continue;let s=this.sueloAPantalla(o.x,o.z);s.visible&&s.x>=Math.min(e,i)&&s.x<=Math.max(e,i)&&s.y>=Math.min(t,n)&&s.y<=Math.max(t,n)&&r.push(o.id)}return r}fantasma(e,t,i,n){if(!e){this.ghost&&this.quitar(this.ghost),this.ghost=null;return}if(!this.ghost||this.ghost.userData.tipoEdificio!==e){this.ghost&&this.quitar(this.ghost);let r=this.datos.EDIFICIOS[e]?.tam||3,o=this.arte.edificio(e,r),s=new Map;o.userData.andamio.visible=!1,o.traverse(l=>{if(!l.material)return;let c=l.material;if(!s.has(c)){let h=c.clone();h.transparent=!0,h.opacity=.42,h.depthWrite=!1,this.arte.velar(h),s.set(c,h)}l.material=s.get(c)}),o.userData.fantasma=!0,o.userData.tipoEdificio=e,o.userData.materialesFantasma=[...s.values()],this.ghost=o,this.escena.add(o)}for(let r of this.ghost.userData.materialesFantasma)r.color.set(n?"#73dca0":"#ed7969");this.ghost.position.set(t,this.altura(t,i)+.1,i)}marcar(e,t,i){this.efectos.push({x:e,z:t,t:0,dur:1,onda:!0,color:i==="atacar"?"#ee846c":i==="recolectar"?"#e9c372":i==="reunir"?"#cbb4f1":"#9fd9df"})}resaltar(e){this.seleccion=new Set(e)}destruir(){let e=new Set,t=new Set,i=new Set;this.escena.traverse(n=>{n.geometry&&e.add(n.geometry),n.material&&t.add(n.material),n.isInstancedMesh&&n.dispose()});for(let n of this.arte.materiales.values())t.add(n);for(let n of Object.values(this.arte.geos))e.add(n);for(let n of t){for(let r of Object.values(n))r?.isTexture&&i.add(r);n.dispose()}for(let n of e)n.dispose();for(let n of i)n.dispose();this.niebla.textura.value.dispose(),this.renderer.dispose()}};var Sl={es:{titulo:"Nehem\xEDas: 52 d\xEDas",subtitulo:"Reconstruye el muro de Jerusal\xE9n",jugar:"Jugar",continuar:"Continuar",como:"C\xF3mo se juega",opciones:"Opciones",creditos:"Cr\xE9ditos",volver:"Volver",salir_verbo:"M\xE1s juegos",idioma:"Idioma",aviso_titulo:"Antes de empezar",aviso:["Este juego est\xE1 basado en el libro de Nehem\xEDas (cap\xEDtulos 1 al 7 y 12). La historia, las personas, las puertas y los enemigos son los de la Biblia, y las citas son textuales.","Las batallas son una adaptaci\xF3n para el juego: en la Biblia hubo burlas, amenazas e intrigas, y el pueblo trabaj\xF3 con un arma a mano. Aqu\xED los invasores nunca mueren: cuando pierden, huyen. Los nuestros quedan heridos y se recuperan en la casa del gobernador."],entendido:"Entendido",dificultad:"Elige la dificultad",facil:"F\xE1cil",normal:"Normal",dificil:"Dif\xEDcil",facil_d:"D\xEDas m\xE1s largos, invasiones peque\xF1as. Para aprender o jugar en familia.",normal_d:"El reto pensado: 52 d\xEDas alcanzan si organizas bien a tu gente.",dificil_d:"D\xEDas cortos e invasiones grandes. Para quien ya conoce la estrategia en tiempo real.",saltar:"Saltar",siguiente:"Siguiente",empezar:"Empezar",prologo_jugable:"Jugar la inspecci\xF3n de noche (aprendes los controles)",saltar_inspeccion:"Ir directo a la reconstrucci\xF3n",cargando:"Preparando Jerusal\xE9n\u2026",dia:"D\xEDa",de:"de",noche_txt:"Noche",animo_txt:"\xC1nimo",poblacion_txt:"Poblaci\xF3n",comida:"Comida",madera:"Madera",piedra:"Piedra",objetivos:"Objetivos",menu:"Men\xFA",pausa:"Pausa",pausado:"En pausa",reanudar:"Reanudar",guardar_salir:"Guardar y salir",reiniciar:"Empezar de nuevo",velocidad:"Velocidad",obj_tramos:"Levanta los {de} tramos del muro ({n}/{de})",obj_marcos:"Reconstruye las {de} puertas ({n}/{de})",obj_hojas:"Cuelga sus hojas, cerraduras y cerrojos ({n}/{de})",obj_gobernador:"Que no incendien la casa del gobernador",obj_animo:"Que el pueblo no pierda el \xE1nimo",obj_plazo:"Termina antes de que acabe el d\xEDa 52",ocioso:"Aldeanos sin trabajo",brujula:"Br\xFAjula: N norte, S sur, E oriente, O poniente",br_n:"N",br_s:"S",br_e:"E",br_o:"O",ninguno_ocioso:"Nadie est\xE1 sin trabajo",vida:"Vida",ataque:"Ataque",armadura:"Armadura",alcance:"Alcance",carga:"Lleva",entrenando:"Entrenando",investigando:"Investigando",cola:"En cola",guarnicion:"Adentro",construyendo:"En construcci\xF3n",avance:"Avance",reservas:"Quedan",familia_tramo:"Lo reparan: {familia}",tramo_estado_ruinas:"En ruinas",tramo_estado_entero:"Entero",tramo_estado_danado:"Da\xF1ado",puerta_sin_hojas:"Sin hojas: por aqu\xED entra cualquiera",puerta_con_hojas:"Con hojas y cerrojos",seleccion_varios:"{n} seleccionados",costo:"Cuesta",requiere:"Requiere",tecla:"Tecla",listo:"Listo",recarga:"Lista en {s} s",accion_quieto:"Esperando",accion_camina:"Caminando",accion_tala:"Talando",accion_pica:"Picando piedra",accion_cosecha:"Recogiendo comida",accion_construye:"Construyendo",accion_ataca:"Peleando",accion_dispara:"Disparando",accion_herido:"Herido: va a curarse",accion_guarnecido:"Adentro",accion_ora:"Orando",accion_toca:"Tocando la trompeta",accion_huye:"Huyendo",accion_saquea:"Lleva lo robado",accion_incendia:"Prendiendo fuego",o_mover:"Mover",o_detener:"Detener",o_atacar_mover:"Avanzar atacando",o_defender:"Defender este lugar",o_construir:"Construir",o_reparar:"Reparar",o_hojas:"Colgar las hojas de una puerta",o_guarnecer:"Entrar a resguardo",o_desguarnecer:"Sacar a todos",o_reunion:"Punto de reuni\xF3n",o_cancelar:"Cancelar",o_refugio:"\xA1A resguardo! (todos los aldeanos)",o_volver:"Volver",o_construir_muro:"Levantar el muro",o_construir_d:"Edificios: elige uno y col\xF3calo en el terreno.",o_muro_d:"Toca un tramo del muro o una puerta: tus aldeanos lo levantan con piedra y un poco de madera a medida que trabajan.",o_hojas_d:"Toca una puerta ya reconstruida para colgarle las hojas (necesitas \xABPuertas, cerraduras y cerrojos\xBB del taller).",o_reunion_d:"Toca el terreno, un recurso o una granja: lo que se entrene ir\xE1 ah\xED.",o_mover_d:"Toca el terreno.",o_atacar_mover_d:"Avanzan y pelean con todo enemigo que vean en el camino.",o_defender_d:"Se quedan cuidando ese punto y atacan a quien se acerque.",u_aldeano:"Aldeano",u_lancero:"Lancero",u_arquero:"Arquero",u_jinete:"Jinete del rey",u_nehemias:"Nehem\xEDas",u_saqueador:"Saqueador",u_hondero:"Hondero",u_jinete_arabe:"Jinete \xE1rabe",u_cabecilla:"Cabecilla",u_aldeano_d:"Recoge comida, madera y piedra, construye y levanta el muro. Si lo atacan y no est\xE1 armado, corre a resguardarse.",u_lancero_d:"Soldado de a pie con lanza y escudo. Fuerte de cerca.",u_arquero_d:"Dispara desde lejos. Ponlo detr\xE1s de los lanceros o del muro.",u_jinete_d:"Oficiales y jinetes que el rey envi\xF3 con Nehem\xEDas (Neh 2:9). R\xE1pidos y fuertes; no se pueden entrenar m\xE1s.",u_nehemias_d:"El copero del rey, ahora gobernador. Cerca de \xE9l se trabaja mejor. Puede orar, exhortar y tocar la trompeta.",b_gobernador:"Casa del gobernador",b_casa:"Casa",b_aserradero:"Aserradero",b_deposito:"Dep\xF3sito de piedra",b_molino:"Era y molino",b_granja:"Granja",b_cuartel:"Cuartel de la guardia",b_taller:"Taller del carpintero",b_torre:"Torre de vig\xEDa",b_gobernador_d:"Aqu\xED se entrenan aldeanos y se entrega todo. Dispara flechas; con gente adentro, m\xE1s. Si la incendian, se pierde la partida.",b_casa_d:"+5 de poblaci\xF3n.",b_aserradero_d:"Punto de entrega de madera. Mejoras para le\xF1adores.",b_deposito_d:"Punto de entrega de piedra. Ponlo junto a la cantera o a los escombros.",b_molino_d:"Punto de entrega de comida. Necesario para las granjas.",b_granja_d:"Campo de cultivo. Cuando se agota se vuelve a sembrar solo si tienes madera.",b_cuartel_d:"Entrena lanceros y arqueros. Mejoras de la guardia.",b_taller_d:"Hace las puertas: sin \xABPuertas, cerraduras y cerrojos\xBB no se pueden colgar las hojas.",b_torre_d:"Dispara a los enemigos cercanos. Con gente adentro dispara m\xE1s.",r_arbol:"\xC1rbol",r_cantera:"Cantera",r_escombros:"Escombros",r_olivo:"Olivo",r_oveja:"Oveja",r_escombros_d:"\xABTodav\xEDa quedan demasiados escombros\xBB (Neh 4:10). De aqu\xED sale piedra para el muro.",muro:"Muro",puerta:"Puerta",p_ovejas:"Puerta de las Ovejas",p_pescado:"Puerta del Pescado",p_vieja:"Puerta Vieja",p_valle:"Puerta del Valle",p_basurero:"Puerta del Basurero",p_fuente:"Puerta de la Fuente",p_aguas:"Puerta de las Aguas",p_caballos:"Puerta de los Caballos",p_oriental:"Puerta Oriental",p_inspeccion:"Puerta de la Inspecci\xF3n",t_hananeel:"Torre de Hananeel",t_hornos:"Torre de los Hornos",t_ancho:"Muro Ancho",t_valientes:"Casa de los Valientes",f_eliasib:"Eliasib y los sacerdotes",f_jerico:"Los hombres de Jeric\xF3",f_zacur:"Zacur hijo de Imri",f_senaa:"Los hijos de Senaa",f_meremot:"Meremot hijo de Ur\xEDas",f_mesulam:"Mesulam hijo de Berequ\xEDas",f_sadoc:"Sadoc hijo de Baan\xE1",f_tecoa:"Los de Tecoa",f_joiada:"Joiada y Mesulam",f_gabaon:"Los hombres de Gaba\xF3n y Mizpa",f_uziel:"Uziel el orfebre y Hanan\xEDas el perfumista",f_refaias:"Refa\xEDas hijo de Hur",f_jedaias:"Jeda\xEDas, frente a su casa",f_malquias_harim:"Malqu\xEDas y Hasub",f_salum_hijas:"Salum y sus hijas",f_hanun_zanoa:"Han\xFAn y los de Zanoa",f_malquias_recab:"Malqu\xEDas hijo de Recab",f_salum_colhoze:"Salum hijo de Colhoze",f_nehemias_azbuc:"Nehem\xEDas hijo de Azbuc",f_levitas:"Los levitas con Reh\xFAm",f_hasabias:"Hasab\xEDas de Keila",f_bavai:"Bavai hijo de Henadad",f_ezer:"Ezer hijo de Jes\xFAa",f_baruc:"Baruc, con entusiasmo",f_meremot2:"Meremot, otro tramo",f_sacerdotes:"Los sacerdotes de los alrededores",f_benjamin_hasub:"Benjam\xEDn y Hasub",f_azarias:"Azar\xEDas, junto a su casa",f_binui:"Bin\xFAi hijo de Henadad",f_palal:"Palal y Peda\xEDas",f_servidores_ofel:"Los servidores del templo de Ofel",f_tecoa2:"Los de Tecoa, otro tramo",f_sacerdotes_caballos:"Los sacerdotes, cada uno frente a su casa",f_sadoc_imer:"Sadoc hijo de Imer",f_semaias_guardian:"Sema\xEDas, guardi\xE1n de la puerta Oriental",f_hananias_hanun:"Hanan\xEDas y Han\xFAn",f_malquias_orfebre:"Malqu\xEDas el orfebre",f_orfebres_comerciantes:"Los orfebres y los comerciantes",fa_samaria:"Sanbalat y el ej\xE9rcito de Samaria (norte)",fa_amon:"Tob\xEDas y los amonitas (oriente)",fa_arabes:"Gesem y los \xE1rabes (sur)",fa_asdod:"Los de Asdod (poniente)",fa_samaria_c:"el norte",fa_amon_c:"el oriente",fa_arabes_c:"el sur",fa_asdod_c:"el poniente",tec_cartas_rey:"Cartas del rey",tec_cartas_rey_d:"Asaf, el encargado del bosque del rey, env\xEDa una caravana con 120 de madera cada 4 d\xEDas (Neh 2:8).",tec_guardia_noche:"Guardia de d\xEDa y de noche",tec_guardia_noche_d:"De noche se ve m\xE1s lejos y las torres y la casa del gobernador disparan m\xE1s lejos (Neh 4:9, 22).",tec_hachas:"Hachas afiladas",tec_hachas_d:"+20 % de madera por le\xF1ador.",tec_carretillas:"Carretillas",tec_carretillas_d:"Cada aldeano lleva 5 m\xE1s por viaje.",tec_picos:"Picos de cantero",tec_picos_d:"+20 % de piedra.",tec_cestas:"Cestas para escombros",tec_cestas_d:"+30 % de piedra sacada de los escombros (Neh 4:10).",tec_arado:"Arado",tec_arado_d:"Las granjas dan 100 de comida m\xE1s.",tec_yugo:"Yugo de bueyes",tec_yugo_d:"+15 % de comida en las granjas.",tec_escudos:"Escudos",tec_escudos_d:"+1 de armadura para lanceros, arqueros y jinetes (Neh 4:16).",tec_corazas:"Corazas",tec_corazas_d:"+15 de vida para lanceros, arqueros y jinetes (Neh 4:16).",tec_mitad:"Con una mano en la obra",tec_mitad_d:"Los aldeanos trabajan con un arma a mano: pelean si los atacan, aunque trabajan un poco m\xE1s lento (Neh 4:17-18). Se habilita cuando el muro llega a la mitad.",tec_cerrojos:"Puertas, cerraduras y cerrojos",tec_cerrojos_d:"Permite colgar las hojas de las puertas (Neh 3:3).",tec_andamios:"Andamios",tec_andamios_d:"+20 % de velocidad al construir.",h_orar:"Orar",h_orar_d:"\xABPero nosotros oramos a nuestro Dios\xBB (Neh 4:9). +18 de \xE1nimo.",h_exhortar:"Exhortar",h_exhortar_d:"\xAB\xA1No les tengan miedo!\xBB (Neh 4:14). Los nuestros cercanos pelean un 25 % mejor durante 30 s.",h_trompeta:"Tocar la trompeta",h_trompeta_d:"\xABCuando oigan el sonido de la trompeta, re\xFAnanse con nosotros\xBB (Neh 4:20). Todos los soldados acuden a donde est\xE1 Nehem\xEDas.",h_bloqueada:"Se habilita cuando el muro llega a la mitad.",m_amanece:"Amanece el d\xEDa {dia}.",m_sin_entrega:"No hay d\xF3nde entregar {recurso}.",m_falta:"Falta {recurso}.",m_falta_cerrojos:"Primero investiga \xABPuertas, cerraduras y cerrojos\xBB en el taller.",m_no_llega:"No pueden llegar hasta all\xED.",m_granja_resembrada:"Se volvi\xF3 a sembrar una granja.",m_granja_agotada:"Una granja se agot\xF3 y no hay madera para volver a sembrarla.",m_edificio_listo:"{tipo}: terminado.",m_hojas_puestas:"{puerta}: hojas, cerraduras y cerrojos colocados.",m_marco_puerta:"{puerta}: reconstruida. Falta colgarle las hojas.",m_herido:"Hirieron a un {tipo}.",m_nehemias_herido:"\xA1Hirieron a Nehem\xEDas! El pueblo se desanima.",m_recuperado:"Un {tipo} se recuper\xF3.",m_lleno:"Ya no cabe nadie m\xE1s adentro.",m_oleada_llega:"\xA1Llegan los enemigos por {de}!",m_robo:"Robaron {cant} de {recurso}.",m_incendio:"\xA1Fuego en {tipo}! Manda aldeanos a apagarlo.",m_puerta_rota:"\xA1Rompieron las hojas de la {puerta}!",m_brecha_abierta:"\xA1Abrieron una brecha en el muro!",m_botin_recuperado:"Recuperamos {cant} de {recurso}.",m_botin_perdido:"Se llevaron {cant} de {recurso}.",m_oleada_rechazada:"Rechazamos el ataque. \xABDios lo hab\xEDa frustrado\xBB (Neh 4:15).",m_aviso_vecinos_primero:"Los jud\xEDos que viven cerca de los enemigos vienen a avisar: \xABNos atacar\xE1n desde todas partes\xBB (Neh 4:12). Atacar\xE1n por {de}.",m_aviso_vecinos:"Los vecinos avisan: se acercan enemigos por {de}.",m_hambre:"No hay comida: el pueblo pasa hambre.",m_sin_animo:"\xA1El pueblo perdi\xF3 el \xE1nimo! Si sigue as\xED dos d\xEDas, abandonar\xE1n la obra.",m_nehemias_vuelve:"Nehem\xEDas volvi\xF3 a Jerusal\xE9n.",m_decision_buena:"Respondiste como Nehem\xEDas.",m_decision_mala:"No era la respuesta de Nehem\xEDas: el pueblo lo nota.",m_habilidad_orar:"Nehem\xEDas ora con el pueblo.",m_habilidad_exhortar:"\xAB\xA1No les tengan miedo!\xBB",m_habilidad_trompeta:"\xA1Suena la trompeta! Los soldados acuden.",m_tecnologia_lista:"Listo: {tec}.",m_edificio_perdido:"Perdimos {tipo}.",m_fuego_apagado:"Apagaron el fuego.",m_requiere:"Primero construye: {tipo}.",m_cola_llena:"La cola est\xE1 llena.",m_poblacion:"No hay lugar: construye casas.",m_no:"No se puede.",m_no_ahora:"Ahora no se puede.",m_sitio_borde:"Muy cerca del borde del mapa.",m_sitio_ocupado:"Ese lugar est\xE1 ocupado.",m_sitio_muro:"Muy cerca del muro: deja paso para los constructores.",m_aldeanos_huyen:"Atacan a los aldeanos: corren a resguardarse.",m_caravana:"Lleg\xF3 una caravana del bosque del rey: +{cant} de madera.",m_historia_inicio:"\xAB\xA1Levant\xE9monos y reconstruyamos!\xBB (Neh 2:18). Manda a tus aldeanos a recoger piedra de los escombros y a levantar el muro.",m_historia_escolta:"Los jinetes del rey vinieron con Nehem\xEDas (Neh 2:9). \xDAsalos para vigilar.",m_historia_burla:"Sanbalat, Tob\xEDas y Gesem se burlan: \xAB\xBFQu\xE9 est\xE1n haciendo? \xBFPiensan rebelarse contra el rey?\xBB (Neh 2:19).",m_historia_zorra:"Tob\xEDas: \xAB\xA1Hasta una zorra derribar\xEDa ese muro de piedra que est\xE1n construyendo!\xBB (Neh 4:3).",m_historia_mitad:"\xABTodo el muro alcanz\xF3 la mitad de su altura, porque el pueblo trabajaba con entusiasmo\xBB (Neh 4:6). Los enemigos conspiran: ya puedes armar a los aldeanos y tocar la trompeta.",m_historia_cansancio:"\xABLas fuerzas de los trabajadores se agotan y todav\xEDa quedan demasiados escombros\xBB (Neh 4:10). Ora con el pueblo.",m_historia_cerrado:"Ya no queda ninguna brecha, aunque faltan las hojas de las puertas (Neh 6:1).",m_historia_ultimos:"Quedan pocos d\xEDas. \xA1\xC1nimo!",d_clamor_t:"El clamor del pueblo",d_clamor_cita:"\xABEstamos hipotecando nuestros campos, vi\xF1edos y casas para conseguir grano durante esta escasez\xBB.",d_clamor_ref:"Nehem\xEDas 5:3",d_clamor_texto:"Algunos nobles prestan con intereses a sus propios hermanos, y las familias pierden sus campos. \xBFQu\xE9 haces?",d_clamor_perdonar:"\xABDevu\xE9lvanles hoy mismo sus campos, vi\xF1edos, olivares y casas\xBB (Neh 5:11). Cuesta 150 de comida.",d_clamor_callar:"No es momento: primero el muro.",d_ono_t:"Una invitaci\xF3n al valle de Ono",d_ono_cita:"\xABVen, reun\xE1monos en una de las aldeas del valle de Ono\xBB. Pero ellos planeaban hacerme da\xF1o.",d_ono_ref:"Nehem\xEDas 6:2",d_ono_texto:"Sanbalat y Gesem invitan a Nehem\xEDas a conversar lejos de Jerusal\xE9n.",d_ono_no_ir:"\xABEstoy realizando una obra muy importante y no puedo ir\xBB (Neh 6:3).",d_ono_ir:"Ir a conversar con ellos (Nehem\xEDas se ausenta dos d\xEDas).",d_carta_t:"Una carta abierta",d_carta_cita:"\xABSe rumorea entre las naciones\u2026 que t\xFA y los jud\xEDos planean rebelarse. Por eso reconstruyes el muro\xBB.",d_carta_ref:"Nehem\xEDas 6:6",d_carta_texto:"Por quinta vez llega el siervo de Sanbalat, esta vez con una carta abierta que todos pueden leer.",d_carta_nada_cierto:"\xABNada de lo que afirmas es cierto. Todo es producto de tu imaginaci\xF3n\xBB (Neh 6:8).",d_carta_ir_conversar:"Ir a aclararlo con ellos (Nehem\xEDas se ausenta dos d\xEDas).",d_semaias_t:"Sema\xEDas, encerrado en su casa",d_semaias_cita:"\xABReun\xE1monos dentro del templo\u2026 y cerremos las puertas, porque vienen a matarte\xBB.",d_semaias_ref:"Nehem\xEDas 6:10",d_semaias_texto:"Sema\xEDas dice que habla de parte de Dios y aconseja a Nehem\xEDas esconderse en el templo.",d_semaias_no_entrare:"\xAB\xBFDebe huir un hombre como yo?\u2026 \xA1No entrar\xE9!\xBB (Neh 6:11).",d_semaias_esconderse:"Esconderse en el templo esta noche.",d_buena_nota:"As\xED respondi\xF3 Nehem\xEDas.",d_mala_nota:"Nehem\xEDas respondi\xF3 de otra manera:",victoria_t:"\xA1El muro est\xE1 terminado!",victoria_cita:"\xABEl muro qued\xF3 terminado el d\xEDa veinticinco del mes de Elul, despu\xE9s de cincuenta y dos d\xEDas de trabajo\xBB.",victoria_ref:"Nehem\xEDas 6:15",victoria_texto:"\xABCuando nuestros enemigos y todas las naciones vecinas se enteraron\u2026 comprendieron que esta obra se hab\xEDa realizado con la ayuda de nuestro Dios\xBB (Neh 6:16).",dedicacion:"La dedicaci\xF3n del muro",dedicacion_cita:"\xABAquel d\xEDa ofrecieron numerosos sacrificios y celebraron con alegr\xEDa\u2026 y el j\xFAbilo de Jerusal\xE9n se escuchaba desde muy lejos\xBB.",dedicacion_ref:"Nehem\xEDas 12:43",derrota_t:"La obra se detuvo",derrota_gobernador:"Incendiaron la casa del gobernador.",derrota_animo:"El pueblo perdi\xF3 el \xE1nimo y abandon\xF3 la obra: \xABSe desanimar\xE1n y no terminar\xE1n la obra\xBB (Neh 6:9).",derrota_tiempo:"Pasaron los 52 d\xEDas y el muro no se termin\xF3.",derrota_consejo:"Consejo: pon m\xE1s aldeanos a sacar piedra de los escombros y a levantar el muro, construye torres junto a las puertas y usa \xABOrar\xBB cuando el \xE1nimo baje.",resultados:"Resultados",terminado_en:"Terminado el d\xEDa {dia}",estadisticas:"Estad\xEDsticas",e_recogido:"Recogido",e_entrenados:"Aldeanos y soldados entrenados",e_heridos:"Heridos",e_rechazadas:"Ataques rechazados",e_decisiones:"Decisiones como Nehem\xEDas",e_tecs:"Mejoras investigadas",e_animo_perdido:"Lo que m\xE1s desanim\xF3 al pueblo",e_avance:"Avance del muro por d\xEDa",e_animo:"\xC1nimo por d\xEDa",c_heridos:"heridos",c_invasores:"enemigos en la ciudad",c_hambre:"hambre",c_burlas:"burlas",c_cansancio:"cansancio",c_incendios:"incendios",c_robos:"robos",c_edificios:"edificios perdidos",c_muro_roto:"brechas abiertas",c_decisiones:"decisiones",jugar_otra:"Jugar otra vez",ir_portada:"Ir a la portada",ver_mapa:"Ver la ciudad",pr1_t:"Susa, la fortaleza",pr1:"\xABEl muro de Jerusal\xE9n est\xE1 derribado y sus puertas fueron destruidas por el fuego\xBB.",pr1_ref:"Nehem\xEDas 1:3",pr1_x:"Nehem\xEDas es copero del rey Artajerjes, en Persia. Cuando le cuentan c\xF3mo est\xE1 Jerusal\xE9n, llora, ayuna y ora durante d\xEDas.",pr2_t:"Ante el rey",pr2:"\xABEnv\xEDeme a Jud\xE1, a la ciudad donde est\xE1n sepultados mis antepasados, para que pueda reconstruirla\xBB.",pr2_ref:"Nehem\xEDas 2:5",pr2_x:"El rey nota su tristeza. Nehem\xEDas ora al Dios de los cielos y le pide permiso para ir.",pr3_t:"Las cartas del rey",pr3:"\xABEl rey me concedi\xF3 lo que ped\xED, porque la bondadosa mano de mi Dios estaba sobre m\xED\xBB.",pr3_ref:"Nehem\xEDas 2:8",pr3_x:"Lleva cartas para los gobernadores y para Asaf, el encargado del bosque del rey, que le dar\xE1 madera para las puertas y el muro. Lo acompa\xF1an oficiales y jinetes.",pr4_t:"Jerusal\xE9n en ruinas",pr4:"\xABUstedes ven la dif\xEDcil situaci\xF3n en que nos encontramos: Jerusal\xE9n est\xE1 en ruinas\u2026 Vengan, reconstruyamos el muro\xBB.",pr4_ref:"Nehem\xEDas 2:17",pr4_x:"Sanbalat el horonita, Tob\xEDas el amonita y Gesem el \xE1rabe se enteran y se disgustan. Pero el pueblo responde: \xAB\xA1Levant\xE9monos y reconstruyamos!\xBB.",insp_t:"La inspecci\xF3n de noche",insp_cita:"\xABSal\xED de noche por la puerta del Valle hacia la fuente del Drag\xF3n y la puerta del Basurero\xBB.",insp_ref:"Nehem\xEDas 2:13",insp_1:"Haz clic sobre Nehem\xEDas para seleccionarlo (o arrastra un recuadro alrededor de \xE9l).",insp_2:"Ahora haz clic derecho en el terreno, junto a la puerta del Valle (la luz al poniente, a tu izquierda: la \xABO\xBB de la br\xFAjula), para que camine hasta all\xED.",insp_3:"Mueve la c\xE1mara con las flechas del teclado (o llevando el rat\xF3n al borde de la pantalla). La rueda acerca y aleja.",insp_4:"Sigue hasta la fuente del Drag\xF3n.",insp_5:"Ahora a la puerta del Basurero.",insp_6:"Pasa por la puerta de la Fuente y el estanque del Rey.",insp_7:"\xABAs\xED que sub\xED de noche por el arroyo mientras inspeccionaba el muro\xBB (Neh 2:15). Sube por el arroyo.",insp_8:"Regresa y entra por la puerta del Valle.",insp_fin:"Ya viste c\xF3mo est\xE1 el muro. Ma\xF1ana se lo contar\xE1s al pueblo.",g_paso:"Paso {n} de {de}",g_saltar:"Saltar la gu\xEDa",g_1:"Los seis hombres que se\xF1ala la onda, junto a la casa del gobernador, son tus <b>aldeanos</b>: sacan piedra, cortan madera y levantan el muro. Arrastra un recuadro con el bot\xF3n izquierdo sobre ellos para seleccionarlos.",g_2:"Con los aldeanos seleccionados, haz <b>clic derecho</b> sobre los <b>escombros</b> (las piedras ca\xEDdas que se\xF1ala la onda). Sacar\xE1n piedra y la llevar\xE1n a la casa del gobernador.",g_3:"Ahora, el <b>muro</b>. Haz clic sobre <b>dos o tres</b> aldeanos (May\xFAs + clic para sumar) y luego clic derecho sobre un tramo ca\xEDdo (o usa \xABLevantar el muro\xBB, tecla W). El muro gasta piedra mientras crece: deja a los dem\xE1s sac\xE1ndola de los escombros.",g_4:"Necesitas m\xE1s manos. Los aldeanos nuevos salen de la <b>casa del gobernador</b>: haz clic sobre ella y pulsa \xABAldeano\xBB (tecla Q). Cada uno cuesta 50 de comida.",g_5:"La <b>comida</b> sale de las ovejas y los olivos, y la <b>madera</b>, de los \xE1rboles. Manda a un par de aldeanos a recoger comida con clic derecho.",g_6:"Cada <b>casa</b> da lugar a 5 personas m\xE1s (mira el contador de poblaci\xF3n arriba). Selecciona un aldeano, pulsa \xABConstruir\xBB (Q), luego \xABCasa\xBB (Q), y haz clic en un lugar libre.",g_7:"Los enemigos llegar\xE1n desde afuera, y los vecinos te avisar\xE1n con un c\xEDrculo rojo en el minimapa. Defiende con los jinetes, con Nehem\xEDas y, m\xE1s adelante, con lanceros y arqueros del cuartel. Si el \xE1nimo baja, selecciona a Nehem\xEDas y usa \xABOrar\xBB (Z). \xA1Que la obra no se detenga!",insp_tactil:"En pantalla t\xE1ctil: toca para seleccionar, toca el terreno para mover, arrastra con un dedo para mover la c\xE1mara y pellizca para acercar.",ayuda_t:"C\xF3mo se juega",ayuda:[["Objetivo","Levanta los 28 tramos del muro y las 10 puertas, y cu\xE9lgales sus hojas antes de que termine el d\xEDa 52."],["Recursos","Selecciona aldeanos y haz clic derecho en un recurso: \xE1rboles (madera), escombros y cantera (piedra), ovejas, olivos y granjas (comida). Llevan la carga a la casa del gobernador o al dep\xF3sito m\xE1s cercano."],["El muro","Con aldeanos seleccionados, clic derecho sobre un tramo del muro. Gastan piedra y un poco de madera mientras trabajan. Varios aldeanos juntos terminan m\xE1s r\xE1pido."],["Las puertas","Primero se reconstruye el marco de piedra; despu\xE9s, con \xABPuertas, cerraduras y cerrojos\xBB (taller), se cuelgan las hojas. Una puerta sin hojas es un hueco por donde entra el enemigo."],["Invasiones","Los vecinos avisan antes de cada ataque (se\xF1al en el minimapa). Los enemigos buscan la brecha m\xE1s cercana. Entrena lanceros y arqueros en el cuartel, construye torres y usa la trompeta de Nehem\xEDas."],["\xC1nimo","El \xE1nimo acelera o frena el trabajo. Sube al terminar tramos y puertas, al rechazar ataques y al orar. Baja con burlas, hambre, heridos, incendios y enemigos dentro de la ciudad."],["Rat\xF3n","Clic: seleccionar \xB7 Arrastrar: seleccionar un grupo \xB7 Doble clic: todos los del mismo tipo \xB7 May\xFAs+clic: sumar \xB7 Clic derecho: orden seg\xFAn lo que tocas."],["Teclado","Flechas: c\xE1mara \xB7 Rueda: acercar \xB7 Q W E R T / A S D F G / Z X C V B: botones de \xF3rdenes \xB7 Ctrl+1\u20269: guardar grupo, 1\u20269: elegirlo \xB7 . (punto): aldeano sin trabajo \xB7 H: casa del gobernador \xB7 Espacio: ir al \xFAltimo aviso \xB7 F3 o P: pausa \xB7 Esc: men\xFA o cancelar."],["Pantalla t\xE1ctil","Toca para seleccionar y para ordenar \xB7 Un dedo arrastra la c\xE1mara \xB7 Mant\xE9n presionado y arrastra para seleccionar un grupo \xB7 Pellizca para acercar."]],creditos_t:"Cr\xE9ditos",creditos_lista:["Un juego de Verbo \xB7 verbobiblia.com","Basado en el libro de Nehem\xEDas. Citas de la Biblia Verbo.","Gr\xE1ficos hechos en c\xF3digo (three.js). M\xFAsica de Luxmara. Efectos de sonido de Kenney (CC0)."],musica:"M\xFAsica",efectos:"Efectos",voces:"Voces",pantalla_completa:"Pantalla completa",desplazamiento_borde:"Mover la c\xE1mara con el borde de la pantalla",guardado:"Partida guardada",confirmar_reiniciar:"\xBFEmpezar de nuevo? Se pierde la partida en curso.",si:"S\xED",no_txt:"No"}};Sl.en={titulo:"Nehemiah: 52 Days",subtitulo:"Rebuild the wall of Jerusalem",jugar:"Play",continuar:"Continue",como:"How to play",opciones:"Options",creditos:"Credits",volver:"Back",salir_verbo:"More games",idioma:"Language",aviso_titulo:"Before you begin",aviso:["This game is based on the book of Nehemiah (chapters 1\u20137 and 12). The story, people, gates and enemies come from the Bible, and the quotations are word for word.","The battles are adapted for the game: in the Bible there was mockery, threats and plots, and the people worked with a weapon at hand. Here the invaders never die: when they lose, they run away. Our people get wounded and recover at the governor\u2019s house."],entendido:"Got it",dificultad:"Choose the difficulty",facil:"Easy",normal:"Normal",dificil:"Hard",facil_d:"Longer days, small raids. To learn or to play as a family.",normal_d:"The intended challenge: 52 days are enough if you organize your people well.",dificil_d:"Short days and large raids. For those who already know real-time strategy.",saltar:"Skip",siguiente:"Next",empezar:"Start",prologo_jugable:"Play the night inspection (learn the controls)",saltar_inspeccion:"Go straight to the rebuilding",cargando:"Preparing Jerusalem\u2026",dia:"Day",de:"of",noche_txt:"Night",animo_txt:"Morale",poblacion_txt:"Population",comida:"Food",madera:"Wood",piedra:"Stone",objetivos:"Objectives",menu:"Menu",pausa:"Pause",pausado:"Paused",reanudar:"Resume",guardar_salir:"Save and quit",reiniciar:"Start over",velocidad:"Speed",obj_tramos:"Raise the {de} sections of the wall ({n}/{de})",obj_marcos:"Rebuild the {de} gates ({n}/{de})",obj_hojas:"Install their doors, bolts and bars ({n}/{de})",obj_gobernador:"Do not let them burn the governor\u2019s house",obj_animo:"Keep the people\u2019s morale up",obj_plazo:"Finish before day 52 ends",ocioso:"Idle villagers",brujula:"Compass: north, south, east and west",br_n:"N",br_s:"S",br_e:"E",br_o:"W",ninguno_ocioso:"Nobody is idle",vida:"Health",ataque:"Attack",armadura:"Armor",alcance:"Range",carga:"Carrying",entrenando:"Training",investigando:"Researching",cola:"Queue",guarnicion:"Inside",construyendo:"Under construction",avance:"Progress",reservas:"Left",familia_tramo:"Repaired by: {familia}",tramo_estado_ruinas:"In ruins",tramo_estado_entero:"Whole",tramo_estado_danado:"Damaged",puerta_sin_hojas:"No doors: anyone can walk in",puerta_con_hojas:"Doors, bolts and bars in place",seleccion_varios:"{n} selected",costo:"Cost",requiere:"Requires",tecla:"Key",listo:"Ready",recarga:"Ready in {s} s",accion_quieto:"Waiting",accion_camina:"Walking",accion_tala:"Chopping",accion_pica:"Quarrying stone",accion_cosecha:"Gathering food",accion_construye:"Building",accion_ataca:"Fighting",accion_dispara:"Shooting",accion_herido:"Wounded: going to recover",accion_guarnecido:"Inside",accion_ora:"Praying",accion_toca:"Sounding the horn",accion_huye:"Running away",accion_saquea:"Carrying loot",accion_incendia:"Setting fire",o_mover:"Move",o_detener:"Stop",o_atacar_mover:"Attack-move",o_defender:"Guard this place",o_construir:"Build",o_reparar:"Repair",o_hojas:"Install a gate\u2019s doors",o_guarnecer:"Take shelter",o_desguarnecer:"Let everyone out",o_reunion:"Rally point",o_cancelar:"Cancel",o_refugio:"Take cover! (all villagers)",o_volver:"Back",o_construir_muro:"Raise the wall",o_construir_d:"Buildings: choose one and place it on the ground.",o_muro_d:"Click a wall section or a gate: your villagers raise it using stone and a little wood as they work.",o_hojas_d:"Click a rebuilt gate to hang its doors (you need \u201CDoors, Bolts and Bars\u201D from the workshop).",o_reunion_d:"Click the ground, a resource or a farm: newly trained units will go there.",o_mover_d:"Click the ground.",o_atacar_mover_d:"They advance and fight every enemy they see on the way.",o_defender_d:"They stay guarding that spot and attack anyone who comes close.",u_aldeano:"Villager",u_lancero:"Spearman",u_arquero:"Archer",u_jinete:"King\u2019s horseman",u_nehemias:"Nehemiah",u_saqueador:"Raider",u_hondero:"Slinger",u_jinete_arabe:"Arab rider",u_cabecilla:"Ringleader",u_aldeano_d:"Gathers food, wood and stone, builds and raises the wall. If attacked while unarmed, runs to take cover.",u_lancero_d:"Foot soldier with spear and shield. Strong up close.",u_arquero_d:"Shoots from afar. Keep behind spearmen or the wall.",u_jinete_d:"Officers and horsemen the king sent with Nehemiah (Neh 2:9). Fast and strong; no more can be trained.",u_nehemias_d:"The king\u2019s cupbearer, now governor. People work better near him. He can pray, encourage and sound the horn.",b_gobernador:"Governor\u2019s house",b_casa:"House",b_aserradero:"Lumber yard",b_deposito:"Stone yard",b_molino:"Threshing floor",b_granja:"Farm",b_cuartel:"Guard barracks",b_taller:"Carpenter\u2019s workshop",b_torre:"Watchtower",b_gobernador_d:"Trains villagers and accepts everything. Shoots arrows; more with people inside. If it burns, the game is lost.",b_casa_d:"+5 population.",b_aserradero_d:"Wood drop-off. Upgrades for woodcutters.",b_deposito_d:"Stone drop-off. Place it by the quarry or the rubble.",b_molino_d:"Food drop-off. Needed for farms.",b_granja_d:"A planted field. When exhausted it is replanted automatically if you have wood.",b_cuartel_d:"Trains spearmen and archers. Guard upgrades.",b_taller_d:"Makes the gates: without \u201CDoors, Bolts and Bars\u201D no doors can be hung.",b_torre_d:"Shoots nearby enemies. Shoots more with people inside.",r_arbol:"Tree",r_cantera:"Quarry",r_escombros:"Rubble",r_olivo:"Olive tree",r_oveja:"Sheep",r_escombros_d:"\u201CThere is so much rubble\u201D (Neh 4:10). This is where stone for the wall comes from.",muro:"Wall",puerta:"Gate",p_ovejas:"Sheep Gate",p_pescado:"Fish Gate",p_vieja:"Old Gate",p_valle:"Valley Gate",p_basurero:"Dung Gate",p_fuente:"Fountain Gate",p_aguas:"Water Gate",p_caballos:"Horse Gate",p_oriental:"East Gate",p_inspeccion:"Inspection Gate",t_hananeel:"Tower of Hananel",t_hornos:"Tower of the Ovens",t_ancho:"Broad Wall",t_valientes:"House of the Mighty",f_eliasib:"Eliashib and the priests",f_jerico:"The men of Jericho",f_zacur:"Zaccur son of Imri",f_senaa:"The sons of Hassenaah",f_meremot:"Meremoth son of Uriah",f_mesulam:"Meshullam son of Berechiah",f_sadoc:"Zadok son of Baana",f_tecoa:"The Tekoites",f_joiada:"Joiada and Meshullam",f_gabaon:"The men of Gibeon and Mizpah",f_uziel:"Uzziel the goldsmith and Hananiah the perfumer",f_refaias:"Rephaiah son of Hur",f_jedaias:"Jedaiah, opposite his house",f_malquias_harim:"Malchijah and Hasshub",f_salum_hijas:"Shallum and his daughters",f_hanun_zanoa:"Hanun and the people of Zanoah",f_malquias_recab:"Malchijah son of Rechab",f_salum_colhoze:"Shallun son of Col-hozeh",f_nehemias_azbuc:"Nehemiah son of Azbuk",f_levitas:"The Levites under Rehum",f_hasabias:"Hashabiah of Keilah",f_bavai:"Binnui son of Henadad\u2019s brothers",f_ezer:"Ezer son of Jeshua",f_baruc:"Baruch, diligently",f_meremot2:"Meremoth, another section",f_sacerdotes:"The priests of the surrounding area",f_benjamin_hasub:"Benjamin and Hasshub",f_azarias:"Azariah, beside his house",f_binui:"Binnui son of Henadad",f_palal:"Palal and Pedaiah",f_servidores_ofel:"The temple servants on Ophel",f_tecoa2:"The Tekoites, another section",f_sacerdotes_caballos:"The priests, each opposite his house",f_sadoc_imer:"Zadok son of Immer",f_semaias_guardian:"Shemaiah, keeper of the East Gate",f_hananias_hanun:"Hananiah and Hanun",f_malquias_orfebre:"Malchijah the goldsmith",f_orfebres_comerciantes:"The goldsmiths and merchants",fa_samaria:"Sanballat and the army of Samaria (north)",fa_amon:"Tobiah and the Ammonites (east)",fa_arabes:"Geshem and the Arabs (south)",fa_asdod:"The Ashdodites (west)",fa_samaria_c:"the north",fa_amon_c:"the east",fa_arabes_c:"the south",fa_asdod_c:"the west",tec_cartas_rey:"The King\u2019s Letters",tec_cartas_rey_d:"Asaph, keeper of the king\u2019s forest, sends a caravan with 120 wood every 4 days (Neh 2:8).",tec_guardia_noche:"Guard Day and Night",tec_guardia_noche_d:"See farther at night; towers and the governor\u2019s house shoot farther (Neh 4:9, 22).",tec_hachas:"Sharpened Axes",tec_hachas_d:"+20% wood per woodcutter.",tec_carretillas:"Carts",tec_carretillas_d:"Each villager carries 5 more per trip.",tec_picos:"Stonecutter\u2019s Picks",tec_picos_d:"+20% stone.",tec_cestas:"Rubble Baskets",tec_cestas_d:"+30% stone from rubble (Neh 4:10).",tec_arado:"Plow",tec_arado_d:"Farms yield 100 more food.",tec_yugo:"Ox Yoke",tec_yugo_d:"+15% food from farms.",tec_escudos:"Shields",tec_escudos_d:"+1 armor for spearmen, archers and horsemen (Neh 4:16).",tec_corazas:"Armor",tec_corazas_d:"+15 health for spearmen, archers and horsemen (Neh 4:16).",tec_mitad:"One Hand on the Work",tec_mitad_d:"Villagers work with a weapon at hand: they fight back when attacked, though they work a little slower (Neh 4:17-18). Unlocked when the wall reaches half its height.",tec_cerrojos:"Doors, Bolts and Bars",tec_cerrojos_d:"Allows hanging the gates\u2019 doors (Neh 3:3).",tec_andamios:"Scaffolding",tec_andamios_d:"+20% building speed.",h_orar:"Pray",h_orar_d:"\u201CSo we prayed to our God\u201D (Neh 4:9). +18 morale.",h_exhortar:"Encourage",h_exhortar_d:"\u201CDo not be afraid of them\u201D (Neh 4:14). Nearby allies fight 25% better for 30 s.",h_trompeta:"Sound the horn",h_trompeta_d:"\u201CWherever you hear the sound of the horn, rally to us there\u201D (Neh 4:20). All soldiers come to Nehemiah.",h_bloqueada:"Unlocked when the wall reaches half its height.",m_amanece:"Day {dia} dawns.",m_sin_entrega:"There is nowhere to drop off {recurso}.",m_falta:"Not enough {recurso}.",m_falta_cerrojos:"First research \u201CDoors, Bolts and Bars\u201D at the workshop.",m_no_llega:"They cannot get there.",m_granja_resembrada:"A farm was replanted.",m_granja_agotada:"A farm ran out and there is no wood to replant it.",m_edificio_listo:"{tipo}: finished.",m_hojas_puestas:"{puerta}: doors, bolts and bars installed.",m_marco_puerta:"{puerta}: rebuilt. Its doors still need hanging.",m_herido:"A {tipo} was wounded.",m_nehemias_herido:"Nehemiah was wounded! The people lose heart.",m_recuperado:"A {tipo} recovered.",m_lleno:"There is no more room inside.",m_oleada_llega:"Enemies are coming from {de}!",m_robo:"They stole {cant} {recurso}.",m_incendio:"Fire at the {tipo}! Send villagers to put it out.",m_puerta_rota:"They broke the doors of the {puerta}!",m_brecha_abierta:"They opened a breach in the wall!",m_botin_recuperado:"We recovered {cant} {recurso}.",m_botin_perdido:"They got away with {cant} {recurso}.",m_oleada_rechazada:"We drove them back. \u201CGod had frustrated it\u201D (Neh 4:15).",m_aviso_vecinos_primero:"The Jews who live near the enemy come to warn us: \u201CWherever you turn, they will attack us\u201D (Neh 4:12). They will come from {de}.",m_aviso_vecinos:"The neighbors warn us: enemies approach from {de}.",m_hambre:"There is no food: the people are hungry.",m_sin_animo:"The people have lost heart! If it lasts two days, they will abandon the work.",m_nehemias_vuelve:"Nehemiah is back in Jerusalem.",m_decision_buena:"You answered as Nehemiah did.",m_decision_mala:"That was not Nehemiah\u2019s answer: the people notice.",m_habilidad_orar:"Nehemiah prays with the people.",m_habilidad_exhortar:"\u201CDo not be afraid of them!\u201D",m_habilidad_trompeta:"The horn sounds! The soldiers rally.",m_tecnologia_lista:"Done: {tec}.",m_edificio_perdido:"We lost the {tipo}.",m_fuego_apagado:"The fire is out.",m_requiere:"Build this first: {tipo}.",m_cola_llena:"The queue is full.",m_poblacion:"No room: build houses.",m_no:"Not possible.",m_no_ahora:"Not right now.",m_sitio_borde:"Too close to the edge of the map.",m_sitio_ocupado:"That spot is taken.",m_sitio_muro:"Too close to the wall: leave room for the builders.",m_aldeanos_huyen:"Villagers under attack: they run for cover.",m_caravana:"A caravan arrived from the king\u2019s forest: +{cant} wood.",m_historia_inicio:"\u201CLet us start rebuilding\u201D (Neh 2:18). Send your villagers to gather stone from the rubble and raise the wall.",m_historia_escolta:"The king\u2019s horsemen came with Nehemiah (Neh 2:9). Use them as scouts.",m_historia_burla:"Sanballat, Tobiah and Geshem mock us: \u201CWhat is this you are doing? Are you rebelling against the king?\u201D (Neh 2:19).",m_historia_zorra:"Tobiah: \u201CIf even a fox were to climb up on what they are building, it would break down their wall of stones!\u201D (Neh 4:3).",m_historia_mitad:"\u201CWe rebuilt the wall until all of it was joined together up to half its height, for the people had a mind to work\u201D (Neh 4:6). The enemies conspire: you can now arm the villagers and sound the horn.",m_historia_cansancio:"\u201CThe strength of the laborer fails, and there is so much rubble\u201D (Neh 4:10). Pray with the people.",m_historia_cerrado:"Not a gap is left, though the gates still have no doors (Neh 6:1).",m_historia_ultimos:"Only a few days left. Take heart!",d_clamor_t:"The outcry of the people",d_clamor_cita:"\u201CWe are mortgaging our fields, our vineyards, and our homes to get grain during the famine.\u201D",d_clamor_ref:"Nehemiah 5:3",d_clamor_texto:"Some nobles lend at interest to their own brothers, and families are losing their fields. What do you do?",d_clamor_perdonar:"\u201CPlease restore to them immediately their fields, vineyards, olive groves, and houses\u201D (Neh 5:11). Costs 150 food.",d_clamor_callar:"Not now: the wall comes first.",d_ono_t:"An invitation to the plain of Ono",d_ono_cita:"\u201CCome, let us meet together in one of the villages on the plain of Ono.\u201D But they were planning to harm me.",d_ono_ref:"Nehemiah 6:2",d_ono_texto:"Sanballat and Geshem invite Nehemiah to talk far from Jerusalem.",d_ono_no_ir:"\u201CI am doing a great work and cannot come down\u201D (Neh 6:3).",d_ono_ir:"Go and talk with them (Nehemiah is away for two days).",d_carta_t:"An unsealed letter",d_carta_cita:"\u201CIt is reported among the nations\u2026 that you and the Jews are plotting to revolt, and this is why you are building the wall.\u201D",d_carta_ref:"Nehemiah 6:6",d_carta_texto:"For the fifth time Sanballat\u2019s servant arrives, now with an open letter for everyone to read.",d_carta_nada_cierto:"\u201CThere is nothing to these rumors you are spreading; you are inventing them in your own mind\u201D (Neh 6:8).",d_carta_ir_conversar:"Go and clear it up with them (Nehemiah is away for two days).",d_semaias_t:"Shemaiah, shut in his house",d_semaias_cita:"\u201CLet us meet at the house of God inside the temple. Let us shut the temple doors because they are coming to kill you.\u201D",d_semaias_ref:"Nehemiah 6:10",d_semaias_texto:"Shemaiah claims to speak for God and advises Nehemiah to hide in the temple.",d_semaias_no_entrare:"\u201CShould a man like me run away?\u2026 I will not go!\u201D (Neh 6:11).",d_semaias_esconderse:"Hide in the temple tonight.",d_buena_nota:"That is how Nehemiah answered.",d_mala_nota:"Nehemiah answered differently:",victoria_t:"The wall is finished!",victoria_cita:"\u201CSo the wall was completed in fifty-two days, on the twenty-fifth of Elul.\u201D",victoria_ref:"Nehemiah 6:15",victoria_texto:"\u201CWhen all our enemies heard about this, all the surrounding nations were afraid and disheartened, for they realized that this task had been accomplished by our God\u201D (Neh 6:16).",dedicacion:"The dedication of the wall",dedicacion_cita:"\u201COn that day they offered great sacrifices, rejoicing because God had given them great joy\u2026 so that the joy of Jerusalem was heard from afar.\u201D",dedicacion_ref:"Nehemiah 12:43",derrota_t:"The work came to a halt",derrota_gobernador:"They burned the governor\u2019s house.",derrota_animo:"The people lost heart and abandoned the work: \u201CTheir hands will be weakened in the work, and it will never be finished\u201D (Neh 6:9).",derrota_tiempo:"The 52 days passed and the wall was not finished.",derrota_consejo:"Tip: put more villagers on the rubble and on the wall, build towers by the gates, and use \u201CPray\u201D when morale drops.",resultados:"Results",terminado_en:"Finished on day {dia}",estadisticas:"Statistics",e_recogido:"Gathered",e_entrenados:"Villagers and soldiers trained",e_heridos:"Wounded",e_rechazadas:"Raids repelled",e_decisiones:"Answered like Nehemiah",e_tecs:"Upgrades researched",e_animo_perdido:"What discouraged the people most",e_avance:"Wall progress by day",e_animo:"Morale by day",c_heridos:"wounded",c_invasores:"enemies in the city",c_hambre:"hunger",c_burlas:"mockery",c_cansancio:"weariness",c_incendios:"fires",c_robos:"theft",c_edificios:"buildings lost",c_muro_roto:"breaches",c_decisiones:"decisions",jugar_otra:"Play again",ir_portada:"Back to title",ver_mapa:"View the city",pr1_t:"Susa, the citadel",pr1:"\u201CThe wall of Jerusalem is broken down, and its gates have been burned with fire.\u201D",pr1_ref:"Nehemiah 1:3",pr1_x:"Nehemiah is cupbearer to King Artaxerxes in Persia. When he hears about Jerusalem, he weeps, fasts and prays for days.",pr2_t:"Before the king",pr2:"\u201CI ask that you send me to Judah, to the city where my fathers are buried, so that I may rebuild it.\u201D",pr2_ref:"Nehemiah 2:5",pr2_x:"The king notices his sadness. Nehemiah prays to the God of heaven and asks for leave to go.",pr3_t:"The king\u2019s letters",pr3:"\u201CBecause the gracious hand of my God was upon me, the king granted my requests.\u201D",pr3_ref:"Nehemiah 2:8",pr3_x:"He carries letters for the governors and for Asaph, keeper of the king\u2019s forest, who will give timber for the gates and the wall. Officers and horsemen go with him.",pr4_t:"Jerusalem in ruins",pr4:"\u201CYou see the trouble we are in. Jerusalem lies in ruins\u2026 Come, let us rebuild the wall of Jerusalem.\u201D",pr4_ref:"Nehemiah 2:17",pr4_x:"Sanballat the Horonite, Tobiah the Ammonite and Geshem the Arab hear of it and are displeased. But the people reply: \u201CLet us start rebuilding.\u201D",insp_t:"The night inspection",insp_cita:"\u201CI went out at night through the Valley Gate toward the Well of the Serpent and the Dung Gate.\u201D",insp_ref:"Nehemiah 2:13",insp_1:"Click Nehemiah to select him (or drag a box around him).",insp_2:"Now right-click the ground by the Valley Gate (the light to the west, on your left: the \u201CW\u201D on the compass) to walk there.",insp_3:"Move the camera with the arrow keys (or by moving the mouse to the screen edge). The wheel zooms in and out.",insp_4:"Go on to the Well of the Serpent.",insp_5:"Now to the Dung Gate.",insp_6:"Pass by the Fountain Gate and the King\u2019s Pool.",insp_7:"\u201CSo I went up the valley by night and inspected the wall\u201D (Neh 2:15). Go up the valley.",insp_8:"Head back and enter through the Valley Gate.",insp_fin:"You have seen the state of the wall. Tomorrow you will tell the people.",g_paso:"Step {n} of {de}",g_saltar:"Skip the guide",g_1:"The six men marked by the ripple, next to the governor\u2019s house, are your <b>villagers</b>: they quarry stone, cut wood and raise the wall. Drag a box over them with the left button to select them.",g_2:"With the villagers selected, <b>right-click</b> the <b>rubble</b> (the fallen stones marked by the ripple). They will gather stone and carry it to the governor\u2019s house.",g_3:"Now the <b>wall</b>. Click <b>two or three</b> villagers (Shift + click to add more), then right-click a broken section (or use \u201CRaise the wall\u201D, key W). The wall spends stone as it grows: keep the others gathering it from the rubble.",g_4:"You need more hands. New villagers come from the <b>governor\u2019s house</b>: click it and press \u201CVillager\u201D (key Q). Each one costs 50 food.",g_5:"<b>Food</b> comes from sheep and olive trees, and <b>wood</b> from trees. Send a couple of villagers to gather food with a right-click.",g_6:"Each <b>house</b> makes room for 5 more people (see the population counter at the top). Select a villager, press \u201CBuild\u201D (Q), then \u201CHouse\u201D (Q), and click on a free spot.",g_7:"Enemies will come from outside, and your neighbors will warn you with a red circle on the minimap. Defend with the horsemen, with Nehemiah and, later on, with spearmen and archers from the barracks. If morale drops, select Nehemiah and use \u201CPray\u201D (Z). Do not let the work stop!",insp_tactil:"On a touch screen: tap to select, tap the ground to move, drag with one finger to move the camera and pinch to zoom.",ayuda_t:"How to play",ayuda:[["Goal","Raise the 28 sections of the wall and the 10 gates, and hang their doors before day 52 ends."],["Resources","Select villagers and right-click a resource: trees (wood), rubble and quarry (stone), sheep, olive trees and farms (food). They carry it to the governor\u2019s house or the nearest yard."],["The wall","With villagers selected, right-click a wall section. They spend stone and a little wood as they work. Several villagers together finish faster."],["The gates","First the stone frame is rebuilt; then, with \u201CDoors, Bolts and Bars\u201D (workshop), the doors are hung. A gate without doors is a hole the enemy walks through."],["Raids","Neighbors warn before each attack (marker on the minimap). Enemies look for the nearest breach. Train spearmen and archers at the barracks, build towers and use Nehemiah\u2019s horn."],["Morale","Morale speeds up or slows down work. It rises when you finish sections and gates, repel raids and pray. It drops with mockery, hunger, wounded, fires and enemies inside the city."],["Mouse","Click: select \xB7 Drag: select a group \xB7 Double-click: all of the same type \xB7 Shift+click: add \xB7 Right-click: command depending on what you click."],["Keyboard","Arrows: camera \xB7 Wheel: zoom \xB7 Q W E R T / A S D F G / Z X C V B: command buttons \xB7 Ctrl+1\u20269: save group, 1\u20269: select it \xB7 . (period): idle villager \xB7 H: governor\u2019s house \xB7 Space: go to last alert \xB7 F3 or P: pause \xB7 Esc: menu or cancel."],["Touch screen","Tap to select and to give orders \xB7 One finger drags the camera \xB7 Press and hold, then drag to select a group \xB7 Pinch to zoom."]],creditos_t:"Credits",creditos_lista:["A Verbo game \xB7 verbobiblia.com","Based on the book of Nehemiah. Quotations from the Berean Standard Bible.","Graphics made in code (three.js). Music by Luxmara. Sound effects by Kenney (CC0)."],musica:"Music",efectos:"Effects",voces:"Voices",pantalla_completa:"Full screen",desplazamiento_borde:"Move the camera with the screen edge",guardado:"Game saved",confirmar_reiniciar:"Start over? The current game will be lost.",si:"Yes",no_txt:"No"};var or="es";function fo(a){or=Sl[a]?a:"es";try{localStorage.setItem("nehemias-idioma",or)}catch{}document.documentElement.lang=or}function sr(){return or}function zm(){let a=new URLSearchParams(location.search).get("lang"),e=null;try{e=localStorage.getItem("nehemias-idioma")}catch{}return a||e||(navigator.language||"es").slice(0,2)}function P(a,e={}){let t=Sl[or][a]??Sl.es[a]??a;return typeof t!="string"?t:t.replace(/\{(\w+)\}/g,(i,n)=>{let r=e[n];return r===void 0?"":n==="recurso"?P(r).toLowerCase():n==="tipo"?P("b_"+r)!=="b_"+r?P("b_"+r):P("u_"+r):n==="puerta"?P("p_"+r):n==="tec"?P("tec_"+r):n==="familia"?P("f_"+r):n==="de"&&Array.isArray(r)?r.map(o=>P("fa_"+o+"_c")).join(or==="es"?" y ":" and "):r})}var L={e:null,vista:null,sel:null,modo:null,grupos:{},bordeActivo:!0,alHacer:()=>{},ultimoAviso:null,bloqueado:!1,tutorial:null};var wl=a=>{let e=document.getElementById("lienzo").getBoundingClientRect();return{x:a.clientX-e.left,y:a.clientY-e.top}};function _t(a){L.sel=a&&(a.tipo!=="unidades"||a.ids.length)?a:null,L.modo=null,L.vista&&(L.vista.fantasma(null),L.vista.resaltar(cv())),L.alHacer("seleccion"),L.tutorial&&L.tutorial("seleccion",L.sel)}function cv(){let a=L.sel;return a?a.tipo==="unidades"?a.ids.map(e=>"unidad:"+e):[a.tipo+":"+a.id]:[]}function Ui(){return L.sel&&L.sel.tipo==="unidades"?L.sel.ids.filter(a=>L.e.unidades.has(a)):[]}function lr(){return L.sel&&L.sel.tipo==="edificio"?L.e.edificios.get(L.sel.id):null}function ci(a){L.modo=a,(!a||a.tipo!=="colocar")&&L.vista.fantasma(null),L.alHacer("modo")}function Nm(a,e,t){let i=L.e,n=L.vista;if(L.modo){Dm(a,e);return}let r=n.elegir(a.x,a.y);if(!r){e||_t(null);return}if(r.tipo==="unidad"){let o=i.unidades.get(r.id);if(!o)return;if(t){let s=[...i.unidades.values()].filter(l=>l.tipo===o.tipo&&l.accion!=="guarnecido"&&hv(l)).map(l=>l.id);_t({tipo:"unidades",ids:s});return}if(e&&L.sel&&L.sel.tipo==="unidades"){let s=L.sel.ids.includes(o.id)?L.sel.ids.filter(l=>l!==o.id):[...L.sel.ids,o.id];_t({tipo:"unidades",ids:s});return}_t({tipo:"unidades",ids:[o.id]});return}_t({tipo:r.tipo,id:r.id})}function hv(a){let e=L.vista.sueloAPantalla(a.x,a.z),t=document.getElementById("lienzo");return e.visible&&e.x>=0&&e.y>=0&&e.x<=t.clientWidth&&e.y<=t.clientHeight-uv()}var uv=()=>document.getElementById("panel")?.offsetHeight||0;function Dm(a,e){let t=L.e,i=L.vista,n=L.modo,r=Ui();if(n.tipo==="colocar"){let c=i.pantallaASuelo(a.x,a.y);if(!c)return;let h=lc(t,r,n.edificio,c.x,c.z);h?(i.marcar(h.x,h.z,"construir"),L.audio?.("colocar"),e||ci(null)):L.audio?.("error");return}let o=i.elegir(a.x,a.y),s=i.pantallaASuelo(a.x,a.y),l=n.accion;if(l==="tramo"||l==="hojas"){if(!o||o.tipo!=="tramo"){L.audio?.("error");return}l==="hojas"?Mc(t,r,o.id):Zi(t,r,{tipo:"tramo",id:o.id});let c=t.tramos[o.id];i.marcar((c.a.x+c.b.x)/2,(c.a.z+c.b.z)/2,"construir")}else if(l==="reunion"){let c=lr();if(!c)return;ts(t,c.id,o&&(o.tipo==="recurso"||o.tipo==="edificio")?o:{x:s.x,z:s.z}),i.marcar(s.x,s.z,"reunir")}else s&&(l==="mover"&&Zi(t,r,{tipo:"suelo",x:s.x,z:s.z}),l==="atacar_mover"&&vc(t,r,s.x,s.z),l==="defender"&&xc(t,r,s.x,s.z),i.marcar(s.x,s.z,l==="mover"?"mover":l==="defender"?"reunir":"atacar"));L.audio?.("orden"),e||ci(null)}function Um(a){let e=L.e,t=L.vista;if(L.modo){ci(null);return}let i=t.elegir(a.x,a.y),n=t.pantallaASuelo(a.x,a.y),r=lr();if(r&&(Me[r.tipo].entrena||[]).length){if(!n)return;ts(e,r.id,i&&(i.tipo==="recurso"||i.tipo==="edificio")?i:{x:n.x,z:n.z}),t.marcar(n.x,n.z,"reunir"),L.audio?.("orden"),L.alHacer("orden");return}let o=Ui();if(!o.length)return;let s=i&&i.tipo!=="unidad"?i:n?{tipo:"suelo",x:n.x,z:n.z}:null;if(i&&i.tipo==="unidad"&&n&&(s={tipo:"suelo",x:n.x,z:n.z}),!s)return;let l=Zi(e,o,s);if(l){let c=s.tipo==="suelo"?s:dv(s);c&&t.marcar(c.x,c.z,l==="construir"?"construir":l==="recolectar"?"recolectar":l==="atacar"?"atacar":"mover"),L.audio?.("orden",{clase:l,ids:o}),L.tutorial&&L.tutorial("orden",s)}L.alHacer("orden")}function dv(a){let e=L.e;if(a.tipo==="tramo"){let i=e.tramos[a.id];return{x:(i.a.x+i.b.x)/2,z:(i.a.z+i.b.z)/2}}let t={recurso:e.recursos,edificio:e.edificios,enemigo:e.enemigos,unidad:e.unidades}[a.tipo];return t&&t.get(a.id)}var It=null,hn=null,Tl=0,Aa={x:-1,y:-1,dentro:!1};function El(a){return a.target&&a.target.id==="lienzo"}function pv(a){if(!L.e||L.bloqueado||a.pointerType==="touch"||!El(a))return;let e=wl(a);a.button===0&&(It={x0:e.x,y0:e.y,x:e.x,y:e.y,mayus:a.shiftKey,activo:!1}),a.button===1&&(hn={x:a.clientX,y:a.clientY},a.preventDefault()),a.button===2&&Um(e)}function mv(a){if(a.pointerType==="touch"||(Aa={x:a.clientX,y:a.clientY,dentro:!0},!L.e))return;let e=wl(a);if(hn){let t=L.vista.camara.zoom||1;L.vista.moverCamara(-(a.clientX-hn.x)*.12/t,-(a.clientY-hn.y)*.12/t),hn={x:a.clientX,y:a.clientY}}if(It){It.x=e.x,It.y=e.y,!It.activo&&Math.hypot(e.x-It.x0,e.y-It.y0)>6&&!L.modo&&(It.activo=!0);let t=document.getElementById("recuadro");if(It.activo){let i=document.getElementById("lienzo").getBoundingClientRect();t.hidden=!1,t.style.left=i.left+Math.min(It.x0,e.x)+"px",t.style.top=i.top+Math.min(It.y0,e.y)+"px",t.style.width=Math.abs(e.x-It.x0)+"px",t.style.height=Math.abs(e.y-It.y0)+"px"}}if(L.modo&&L.modo.tipo==="colocar"&&El(a)){let t=L.vista.pantallaASuelo(e.x,e.y);if(t){let i=Math.round(t.x*2)/2,n=Math.round(t.z*2)/2;L.vista.fantasma(L.modo.edificio,i,n,Go(L.e,pt(L.e),L.modo.edificio,i,n)===!0&&Mn(L.e,L.modo.edificio).ok)}}}function fv(a){if(a.pointerType==="touch"||(a.button===1&&(hn=null),a.button!==0||!It))return;let e=It;if(It=null,document.getElementById("recuadro").hidden=!0,!L.e)return;if(e.activo){let n=L.vista.elegirRect(e.x0,e.y0,e.x,e.y);n.length?(_t({tipo:"unidades",ids:e.mayus&&L.sel&&L.sel.tipo==="unidades"?[...new Set([...L.sel.ids,...n])]:n}),L.audio?.("seleccion",{ids:n})):e.mayus||_t(null);return}let t=performance.now(),i=t-Tl<320;Tl=t,El(a)&&(Nm({x:e.x,y:e.y},e.mayus,i),L.sel&&L.sel.tipo==="unidades"&&L.audio?.("seleccion",{ids:L.sel.ids}))}var li=new Map,Ne=null;function gv(a){if(!(!L.e||L.bloqueado||a.pointerType!=="touch"||!El(a))){if(li.set(a.pointerId,{x:a.clientX,y:a.clientY}),li.size===1){let e=wl(a);Ne={tipo:"toque",x0:e.x,y0:e.y,x:e.x,y:e.y,t:performance.now(),sx:a.clientX,sy:a.clientY},Ne.largo=setTimeout(()=>{Ne&&Ne.tipo==="toque"&&(Ne.tipo="recuadro",navigator.vibrate?.(20))},420)}else if(li.size===2){Ne&&clearTimeout(Ne.largo);let[e,t]=[...li.values()];Ne={tipo:"pellizco",d:Math.hypot(e.x-t.x,e.y-t.y),cx:(e.x+t.x)/2,cy:(e.y+t.y)/2}}}}function _v(a){if(a.pointerType!=="touch"||!li.has(a.pointerId)||!Ne)return;li.set(a.pointerId,{x:a.clientX,y:a.clientY});let e=L.vista.camara.zoom||1;if(Ne.tipo==="pellizco"&&li.size>=2){let[i,n]=[...li.values()],r=Math.hypot(i.x-n.x,i.y-n.y),o=(i.x+n.x)/2,s=(i.y+n.y)/2;L.vista.zoom(r/Ne.d),L.vista.moverCamara(-(o-Ne.cx)*.12/e,-(s-Ne.cy)*.12/e),Ne.d=r,Ne.cx=o,Ne.cy=s;return}let t=wl(a);if(Ne.tipo==="toque"&&Math.hypot(t.x-Ne.x0,t.y-Ne.y0)>12&&(clearTimeout(Ne.largo),Ne.tipo="arrastre"),Ne.tipo==="arrastre"&&(L.vista.moverCamara(-(a.clientX-Ne.sx)*.12/e,-(a.clientY-Ne.sy)*.12/e),Ne.sx=a.clientX,Ne.sy=a.clientY),Ne.tipo==="recuadro"){Ne.x=t.x,Ne.y=t.y;let i=document.getElementById("recuadro"),n=document.getElementById("lienzo").getBoundingClientRect();i.hidden=!1,i.style.left=n.left+Math.min(Ne.x0,t.x)+"px",i.style.top=n.top+Math.min(Ne.y0,t.y)+"px",i.style.width=Math.abs(t.x-Ne.x0)+"px",i.style.height=Math.abs(t.y-Ne.y0)+"px"}}function vv(a){if(!(a.pointerType!=="touch"||!li.has(a.pointerId))&&(li.delete(a.pointerId),!!Ne)){if(clearTimeout(Ne.largo),Ne.tipo==="recuadro"){document.getElementById("recuadro").hidden=!0;let e=L.vista.elegirRect(Ne.x0,Ne.y0,Ne.x,Ne.y);e.length&&_t({tipo:"unidades",ids:e})}else if(Ne.tipo==="toque"&&li.size===0){let e={x:Ne.x0,y:Ne.y0},t=L.vista.elegir(e.x,e.y),i=t&&(t.tipo==="unidad"||t.tipo==="edificio");if(L.modo)Dm(e,!1);else if(!i&&(Ui().length||lr()&&(Me[lr().tipo].entrena||[]).length&&t==null))Um(e);else{let n=performance.now(),r=n-Tl<350;Tl=n,Nm(e,!1,r)}}li.size===0&&(Ne=null)}}var Al=new Map;function xv(a){if(!L.e||L.bloqueado)return;let e=a.key,t=L.e,i=L.vista;if(e==="Escape"){if(L.modo){ci(null),a.preventDefault();return}L.abrirMenu?.(),a.preventDefault();return}if(e==="F3"||e==="p"||e==="P"){L.pausar?.(),a.preventDefault();return}if(/^[0-9]$/.test(e)){if(a.ctrlKey||a.metaKey){L.grupos[e]=Ui(),a.preventDefault();return}let r=(L.grupos[e]||[]).filter(o=>t.unidades.has(o));if(r.length){if(L.sel&&L.sel.tipo==="unidades"&&L.sel.ids.join()===r.join()&&performance.now()-(L._grupoT||0)<400){let o=t.unidades.get(r[0]);i.centrar(o.x,o.z)}L._grupoT=performance.now(),_t({tipo:"unidades",ids:r})}return}if(e==="."||e===","){fu();return}if(e==="h"||e==="H"){let r=Ot(t);r&&(i.centrar(r.x,r.z),_t({tipo:"edificio",id:r.id}));return}if(e===" "){L.ultimoAviso&&i.centrar(L.ultimoAviso.x,L.ultimoAviso.z),a.preventDefault();return}if(e.startsWith("Arrow")){if(!Ca.has(e)&&!a.repeat){let r=6/Math.sqrt(i.camara.zoom||1);i.moverCamara(e==="ArrowLeft"?-r:e==="ArrowRight"?r:0,e==="ArrowUp"?-r:e==="ArrowDown"?r:0),L.tutorial&&L.tutorial("camara")}Ca.add(e),a.preventDefault();return}if(e==="Delete"&&lr()){Or(t,lr().id),_t(null);return}let n=Al.get(e.toUpperCase());n&&!a.ctrlKey&&!a.metaKey&&!a.altKey&&(n(),a.preventDefault())}var Ca=new Set;function yv(a){Ca.delete(a.key)}var bv=0;function fu(){let a=Br(L.e);if(!a.length)return;let e=a[bv++%a.length];_t({tipo:"unidades",ids:[e.id]}),L.vista.centrar(e.x,e.z)}function Om(a){if(!L.vista||L.bloqueado)return;let e=46*a/Math.sqrt(L.vista.camara.zoom||1),t=0,i=0;if(Ca.has("ArrowLeft")&&(t-=1),Ca.has("ArrowRight")&&(t+=1),Ca.has("ArrowUp")&&(i-=1),Ca.has("ArrowDown")&&(i+=1),L.bordeActivo&&Aa.dentro&&!It&&!hn&&document.hasFocus()){let n=innerWidth,r=innerHeight,o=6;Aa.x<=o&&(t-=1),Aa.x>=n-o&&(t+=1),Aa.y<=o&&(i-=1),Aa.y>=r-o&&(i+=1)}(t||i)&&(L.vista.moverCamara(t*e,i*e),L.tutorial&&L.tutorial("camara"))}function Bm(){let a=document.getElementById("lienzo");addEventListener("pointerdown",e=>{pv(e),gv(e)}),addEventListener("pointermove",e=>{mv(e),_v(e)}),addEventListener("pointerup",e=>{fv(e),vv(e)}),addEventListener("pointercancel",e=>{li.delete(e.pointerId),Ne=null,It=null,document.getElementById("recuadro").hidden=!0}),document.addEventListener("mouseleave",()=>{Aa.dentro=!1}),addEventListener("blur",()=>{Ca.clear(),Aa.dentro=!1}),a.addEventListener("contextmenu",e=>e.preventDefault()),a.addEventListener("wheel",e=>{!L.vista||L.bloqueado||(L.vista.zoom(e.deltaY<0?1.12:1/1.12),e.preventDefault(),L.tutorial&&L.tutorial("camara"))},{passive:!1}),addEventListener("keydown",xv),addEventListener("keyup",yv)}var I={tinta:"#30251e",crema:"#efdcb1",luz:"#fff0c9",ocre:"#c99648",bronce:"#b77b3e",madera:"#895531",azul:"#435879",azulLuz:"#8297b1",piel:"#d2a477",rojo:"#a4553b"},he=(a,e=I.crema,t="")=>`<path d="${a}" fill="${e}" ${t}/>`,zt=(a,e,t,i,n=I.crema,r="")=>`<rect x="${a}" y="${e}" width="${t}" height="${i}" rx="1" fill="${n}" ${r}/>`,Tt=(a,e,t,i=I.crema,n="")=>`<circle cx="${a}" cy="${e}" r="${t}" fill="${i}" ${n}/>`,Ra=(a,e,t,i,n=I.crema)=>`<ellipse cx="${a}" cy="${e}" rx="${t}" ry="${i}" fill="${n}"/>`,Se=(a,e=I.tinta,t=2.5)=>he(a,"none",`stroke="${e}" stroke-width="${t}"`),ke=(a,e="")=>`<g${e?` transform="${e}"`:""}>${a}</g>`,Cl=(a,e,t=0)=>ke(he("M-7 15V-3H-14L0-18 14-3H7V15Z",I.ocre),`translate(${a} ${e}) rotate(${t})`),gu=()=>he("M30 39 29 14 33 4 37 14 35 39Z",I.crema)+he("M23 38H42V43H35V56H29V43H23Z",I.bronce),_u=()=>zt(29,23,7,34,I.madera)+he("M16 12 45 9 49 23 19 28Z",I.ocre)+Se("M21 16 41 14",I.luz),Mv=()=>zt(29,22,6,36,I.madera)+he("M7 25Q29 0 56 22L40 17 31 21 12 30Z",I.bronce),Fm=()=>zt(29,10,6,47,I.madera)+he("M32 15 15 9 10 31 30 28 39 31 43 17Z",I.crema)+Se("M15 13 12 27",I.luz),Rl=()=>he("M13 14 32 7 51 14 48 37Q44 49 32 57 20 49 16 37Z",I.azul)+he("M19 18 32 13 45 18 42 36Q39 44 32 50 25 44 22 36Z",I.ocre)+Tt(32,30,6,I.bronce),vu=()=>he("M15 10H49L44 49Q44 57 36 55H12Q20 54 18 47L21 18H15Q8 18 10 13Q11 10 15 10Z",I.crema)+he("M40 10Q37 18 44 18H51Q57 10 49 10ZM12 46Q4 46 9 54H37Q29 54 32 46Z",I.ocre),km=()=>he("M42 7Q21 19 34 38 42 50 55 44 45 62 26 54 7 46 11 26 14 11 30 7Z",I.crema),Hm=()=>he("M32 4Q37 20 46 27 57 43 43 55 25 66 14 49 6 35 24 20L23 34Q35 25 32 4Z",I.ocre)+he("M31 31Q44 44 35 54 21 56 22 44Z",I.luz),Ll=()=>he("M7 33 20 22H48L57 32V52H7Z",I.ocre)+he("M7 33H36L48 22H20ZM36 33H57V52H36Z",I.crema)+Se("M10 38H31",I.luz),Gm=()=>he("M8 32 39 13 55 22 23 44Z",I.madera)+he("M10 45 42 26 56 35 24 57Z",I.madera)+Ra(16,38,9,10,I.ocre)+Ra(18,51,9,8,I.crema)+Se("M13 35Q22 31 21 42M15 49Q22 45 22 53",I.madera,2),Sv=(a=32,e=19)=>Tt(a,e,8,I.piel)+he(`M${a-9} ${e}Q${a-10} ${e-12} ${a} ${e-11}Q${a+10} ${e-11} ${a+9} ${e}L${a+4} ${e-5}H${a-5}Z`,I.crema),Xi=(a=I.crema)=>he("M21 31 13 49 21 52 24 42 22 58H43L40 42 46 51 52 47 42 31Z",a)+Sv()+he("M24 31 32 42 40 31",I.azul)+Se("M24 47H41",I.madera),Tv=()=>he("M16 55 19 20H14V9H22V15H28V9H36V15H42V9H50V20H45L48 55Z",I.crema)+he("M38 20H45L48 55H38Z",I.ocre)+zt(27,27,10,12,I.tinta)+Se("M19 44H46M20 23H43M23 44V54M35 39V44"),cr=()=>he("M9 27 20 19H49L55 25V55H9Z",I.ocre)+zt(9,27,35,28)+he("M7 20H46V29H7Z",I.crema)+he("M46 20 56 15V25L46 29Z",I.ocre)+he("M7 20 18 14H56L46 20Z",I.luz)+zt(23,37,12,18,I.madera)+zt(13,34,6,7,I.azul)+Se("M11 50H20M37 32H43",I.ocre,2),xu=()=>he("M6 57V10H20V16H44V10H58V57H45V30Q32 17 19 30V57Z",I.crema)+he("M19 57V30Q32 17 45 30V57Z",I.madera)+Se("M32 26V56M21 38H43M21 49H43",I.bronce,4)+Se("M9 24H17M47 24H55M8 44H17M47 44H56",I.ocre),Vm=(a=!1)=>he("M26 56 29 33 20 23 25 22 33 32 42 21 45 23 36 39 39 56Z",I.madera)+he(a?"M8 28Q3 18 17 15 18 3 31 10 46 2 49 14 62 18 54 29 43 39 32 32 16 40 8 28Z":"M8 33 19 20H13L27 7H36L51 21H45L57 35 40 40H24Z",a?"#8d9462":"#6f8058")+Se("M16 23 24 19M31 16 39 14",I.crema,2)+(a?Tt(16,28,2,I.tinta)+Tt(41,24,2,I.tinta)+Tt(32,15,2,I.tinta):""),jm=()=>Se("M22 56 31 13M31 56 40 10M39 57 47 23",I.ocre,3)+[0,1,2].map(a=>ke(he("M0 1Q-12-10-8-14 1-12 0 1ZM1-1Q0-16 8-18 14-13 1-1Z",I.crema),`translate(${27+a*7} ${35-a*5})`)).join("")+he("M18 43 43 46 42 52 18 49Z",I.azul),wv=()=>he("M7 18 14 41H47L55 18Z",I.ocre)+Se("M15 24H49M19 18 23 40M33 18V40M46 18 42 40",I.madera)+Se("M7 11 16 47H53",I.madera,4)+Tt(23,51,7,I.madera)+Tt(46,51,7,I.madera)+Tt(23,51,2,I.ocre)+Tt(46,51,2,I.ocre),Pl=()=>he("M8 12 23 8Q17 31 28 40 40 50 51 27L58 31Q49 64 25 53 4 44 8 12Z",I.ocre)+he("M8 12 23 8 23 15 8 20Z",I.crema)+Se("M16 24Q12 47 34 49M25 38 20 45M36 43 35 52",I.crema,3),Wm=()=>he("M29 34 15 14 40 6 41 32Z",I.crema)+he("M29 30 36 27 53 51 47 56Z",I.madera),qm=(a=!1)=>he(a?"M7 41 15 32 24 34 29 28 37 34 44 33 45 18 51 13 58 19 56 25 51 24 51 42 45 48 43 58H38L37 46H23L20 58H15L16 44 10 48Z":"M7 39 15 30 37 31 43 18 51 16 58 27 54 33 48 30 46 44 42 57H37V44H24L21 57H15L17 41 11 47Z",a?I.ocre:I.madera)+he("M23 31 22 22 27 18H34L37 35 31 42 27 40 30 33Z",I.azul)+Tt(29,13,6,I.piel)+he("M22 11 24 5H34L37 14 29 10Z",I.crema)+Se("M38 7 41 33",I.bronce,3)+Se("M48 24 35 29",I.ocre,2),Ev={comida:jm(),madera:Gm(),piedra:Ll(),poblacion:ke(Xi(I.ocre),"translate(-4 5) scale(.78)")+ke(Xi(I.azul),"translate(23 8) scale(.78)"),animo:Hm(),dia:Tt(32,32,13,I.ocre)+Se("M32 5V12M32 52V59M5 32H12M52 32H59M13 13 18 18M46 46 51 51M13 51 18 46M46 18 51 13",I.crema,4)+he("M23 31Q23 21 33 22","none",`stroke="${I.luz}" stroke-width="3"`),noche:km(),aldeano:Xi()+Se("M12 31 9 57",I.madera,4)+he("M6 22 16 23 15 34 8 35Z",I.bronce),lancero:Xi(I.azul)+Se("M52 16V58",I.madera,4)+he("M47 17 52 3 57 17Z",I.crema)+Ra(16,43,10,13,I.bronce),arquero:Xi(I.ocre)+he("M45 14Q65 34 45 56L52 35Z",I.madera)+Se("M45 14 43 35 45 56",I.crema,1.8)+Se("M31 35H59",I.crema,2)+he("M60 35 54 31V39Z",I.crema),jinete:qm(),nehemias:Xi(I.azul)+he("M21 29 15 54 25 57 29 34Z",I.ocre)+ke(vu(),"translate(29 27) scale(.45)"),saqueador:Xi(I.rojo)+he("M22 14 30 5 42 13 43 25 35 19 26 20Z",I.madera)+ke(gu(),"translate(29 4) scale(.55) rotate(18 32 32)"),hondero:Xi(I.ocre)+Se("M43 34 52 18 44 7M52 18 58 7",I.madera,3)+Ra(51,6,7,3,I.bronce),jinete_arabe:qm(!0),cabecilla:Xi(I.rojo)+he("M20 12 24 5 32 9 40 5 44 12 40 17H24Z",I.bronce)+he("M24 25 32 31 40 25 38 36 32 39 26 35Z",I.madera)+Se("M53 19V58",I.madera,4)+he("M48 19 53 5 58 19Z",I.crema),gobernador:ke(cr(),"translate(-1 10) scale(1 .82)")+he("M20 23V10H47V23Z",I.crema)+zt(18,7,31,6,I.ocre)+zt(28,14,9,9,I.azul)+Se("M12 29H42",I.luz),casa:cr(),aserradero:ke(cr(),"translate(5 -4) scale(.85)")+ke(Gm(),"translate(0 27) scale(.65)")+he("M29 46 47 27 53 32 50 36 46 35 45 40 41 39 39 44 35 43 34 48Z",I.crema),deposito:ke(cr(),"translate(1 -7)")+ke(Ll(),"translate(16 29) scale(.68)"),molino:Ra(32,48,26,10,I.madera)+Ra(32,43,24,10,I.ocre)+he("M13 39V32Q32 18 51 32V39Q32 53 13 39Z",I.crema)+Ra(32,31,19,8,I.ocre)+Tt(32,31,4,I.tinta)+Se("M32 30 43 12 52 12",I.madera,5),granja:he("M5 46 25 23 59 34 39 58Z",I.madera)+Se("M12 47 31 28M22 51 40 31M32 54 50 34",I.ocre,3)+ke(jm(),"translate(6 -3) scale(.8)"),cuartel:ke(cr(),"translate(-2 6) scale(.9)")+Se("M47 7V37",I.madera,3)+he("M48 8H59L55 15 59 22H48Z",I.azul)+ke(Rl(),"translate(16 25) scale(.5)"),taller:ke(cr(),"translate(-2 -4) scale(.85)")+ke(_u(),"translate(20 21) scale(.65) rotate(30 32 32)")+zt(6,49,31,5,I.madera)+Se("M10 54V60M33 54V60",I.madera,3),torre:Tv(),muro:he("M5 55V19H13V26H21V19H29V26H37V19H45V26H53V19H59V55Z",I.crema)+he("M5 46H59V55H5Z",I.ocre)+Se("M6 36H58M6 46H58M18 27V36M40 27V36M28 36V46M48 36V46M17 46V54M38 46V54"),puerta:xu(),arbol:Vm(),cantera:he("M4 48 15 17 34 10 52 23 60 51Z",I.ocre)+he("M15 17 34 10 31 29 12 35ZM31 29 52 23 48 45 27 44Z",I.crema)+Se("M33 14 31 29 27 44M12 35 31 29 48 45",I.madera)+ke(Ll(),"translate(20 28) scale(.65)"),escombros:he("M5 53 9 40 22 37 27 49 39 35 53 40 59 54Z",I.ocre)+he("M17 36 22 23 36 27 38 40 27 45ZM39 49 47 44 58 48 54 57H40ZM5 52 14 46 25 50 21 58H7Z",I.crema)+Se("M23 28 29 37 36 30",I.ocre),olivo:Vm(!0),oveja:he("M17 42 16 56H22L25 43M39 42 41 56H47L46 40",I.madera)+he("M9 34Q5 25 14 21 13 12 24 14 31 6 38 15 50 12 51 24 60 29 52 37 51 49 40 46 29 53 23 46 11 47Z",I.crema)+he("M43 23 54 22 59 30 55 41 46 42 42 34 37 29Z",I.madera)+Tt(52,29,2,I.luz)+Se("M16 26Q21 20 25 24M29 18Q35 15 38 21",I.luz,3),mover:Cl(32,32,90),detener:he("M21 8H43L56 21V43L43 56H21L8 43V21Z",I.ocre)+zt(21,21,22,22,I.crema),atacar_mover:ke(gu(),"translate(-8 0) rotate(35 32 32)")+ke(Cl(32,32,90),"translate(18 21) scale(.65)"),defender:Rl(),construir:ke(Ll(),"translate(0 28) scale(1 .55)")+ke(_u(),"translate(4 -2) rotate(30 32 32) scale(.85)"),reparar:ke(_u(),"rotate(-35 32 32)")+ke(Wm(),"rotate(20 32 32)"),hojas:he("M14 7 50 12V58L14 53Z",I.madera)+Se("M25 10V54M38 12V56",I.ocre,2)+he("M14 18 50 23V29L14 24ZM14 39 50 44V50L14 45Z",I.bronce)+Tt(42,35,4,I.tinta)+Tt(19,22,1.5,I.crema)+Tt(19,43,1.5,I.crema),guarnecer:ke(xu(),"translate(20 0) scale(.7 1)")+ke(Cl(32,32,90),"translate(-1 15) scale(.72)"),desguarnecer:ke(xu(),"translate(0 0) scale(.7 1)")+ke(Cl(32,32,90),"translate(20 15) scale(.72)"),reunion:Se("M18 8V57",I.madera,5)+he("M20 9Q33 4 44 12L56 9 50 30Q36 36 21 26Z",I.azul)+Se("M25 13Q34 11 42 15",I.azulLuz,3)+Ra(18,57,11,3,I.ocre),cancelar:he("M14 8 32 26 50 8 57 15 39 33 56 50 49 57 32 40 15 57 8 50 25 33 7 15Z",I.rojo)+Se("M15 14 32 31 49 14",I.ocre,3),refugio:Pl()+Se("M37 11 40 5M47 15 53 9M52 23 60 20",I.crema,3),ocioso:ke(Xi(),"translate(-5 3) scale(.9)")+he("M42 17Q40 7 50 7 63 9 57 20L51 25V30","none",`stroke="${I.ocre}" stroke-width="6"`)+Tt(51,39,3,I.ocre),volver:he("M25 9 6 26 25 42V31H39Q51 31 49 43 47 51 34 52V59Q60 58 58 37 57 22 39 21H25Z",I.ocre)+Se("M13 26 22 18M29 25H40Q53 25 54 37",I.luz,2),cartas_rey:vu()+he("M38 39 34 59 42 55 49 59 46 39Z",I.azul)+Tt(42,39,8,I.bronce)+he("M38 39 41 42 46 36","none",`stroke="${I.luz}"`),guardia_noche:ke(km(),"translate(24 -1) scale(.65)")+he("M14 29 24 31 29 57 21 59Z",I.madera)+ke(Hm(),"translate(-1 0) scale(.6)")+Se("M14 31 24 29M16 36 25 34",I.bronce,4),hachas:ke(Fm(),"rotate(-28 32 32)")+ke(Fm(),"translate(8 3) rotate(28 32 32) scale(.9)"),carretillas:wv(),picos:Mv(),cestas:he("M10 29H54L49 56H15Z",I.ocre)+he("M18 29Q18 3 32 6 46 3 46 29","none",`stroke="${I.madera}" stroke-width="5"`)+Se("M12 36H52M14 45H50M23 31 25 55M33 31V55M43 31 40 55",I.madera,2),arado:Se("M8 20 37 35 51 54M37 35 51 14M47 15H58M24 29 16 50",I.madera,6)+he("M43 45 51 54 59 56 36 59Z",I.crema)+Se("M9 17 23 24",I.ocre,2),yugo:he("M6 19Q32 10 58 19V28Q32 20 6 28Z",I.madera)+he("M12 27V41Q12 56 23 56 34 56 32 39V26H26V40Q28 50 23 50 18 50 18 41V27ZM37 26V41Q37 56 48 56 59 56 57 39V27H51V40Q53 50 48 50 43 50 43 41V26Z",I.ocre)+Se("M10 20Q32 15 54 20",I.crema,2),escudos:ke(Rl(),"translate(-2 -1) scale(.85)")+ke(Rl(),"translate(23 19) scale(.68)"),corazas:he("M18 8 27 7Q32 19 37 7L46 8 49 23 44 29 48 54Q32 61 16 54L20 29 15 23Z",I.bronce)+he("M24 20 32 24 40 20 41 43 32 50 23 43Z",I.ocre)+Se("M19 31H45M19 39H45M18 48H46",I.crema,2)+Se("M32 25V52",I.madera,2),mitad:ke(gu(),"rotate(40 32 32)")+ke(Wm(),"rotate(-20 32 32)"),cerrojos:zt(6,19,44,10,I.bronce)+zt(13,13,7,23,I.madera)+zt(39,13,7,23,I.madera)+Tt(22,46,8,I.ocre)+Tt(22,46,3,I.tinta)+he("M29 43H57V49H52V55H46V49H29Z",I.bronce),andamios:Se("M12 57V8M49 57V8M12 15H49M12 36H49M12 55H49M13 16 48 54M48 16 13 54",I.madera,4)+zt(6,30,51,6,I.ocre)+Se("M25 7V26M36 7V26",I.madera,3),orar:he("M18 57 21 35 13 25 8 10Q10 5 13 9L19 21 24 23 21 12Q23 8 26 13L32 32 38 13Q41 8 43 12L40 23 45 21 51 9Q54 5 56 10L51 25 43 35 46 57Z",I.piel)+he("M17 46 29 49 28 59H15ZM35 49 47 46 49 59H36Z",I.azul)+Se("M32 5V12M21 3 24 8M43 3 40 8",I.ocre,3),exhortar:he("M16 55 18 38 12 29 13 22Q15 18 20 22V13Q23 8 27 13V10Q31 6 35 11 40 7 43 13 48 11 50 17V33L42 43V55Z",I.piel)+he("M15 48H44V59H15Z",I.azul)+Se("M22 23V31M29 14V25M36 14V25M43 18V27",I.madera,2)+Se("M53 9 58 5M55 20H61M53 31 59 35",I.ocre,3),trompeta:Pl(),menu:[14,29,44].map(a=>zt(11,a,42,7,I.crema)).join(""),objetivos:vu()+Se("M24 23H38M23 31H37M22 39H35",I.madera,2)+Se("M25 22 27 24 31 20M24 30 26 32 30 28",I.azul,2.5),pausa:zt(13,10,14,45,I.ocre)+zt(37,10,14,45,I.ocre)+Se("M17 14V49M41 14V49",I.crema,3),velocidad:he("M7 12 30 32 7 52ZM32 12 56 32 32 52Z",I.ocre)+Se("M11 19 25 32M36 19 50 32",I.crema,2),sonido:ke(Pl(),"translate(-4 3) scale(.85)")+Se("M45 12Q55 19 50 28M51 6Q66 18 57 33",I.crema,3),sin_sonido:ke(Pl(),"translate(-4 3) scale(.85)")+Se("M42 10 58 29M58 10 42 29",I.rojo,5)},yu=Object.freeze(Object.fromEntries(Object.entries(Ev).map(([a,e])=>{let t=`icono-${a}-luz`,i=e.replaceAll(`fill="${I.crema}"`,`fill="url(#${t}-caliza)"`).replaceAll(`fill="${I.ocre}"`,`fill="url(#${t}-ocre)"`);return[a,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${a.replaceAll("_"," ")}"><defs><linearGradient id="${t}-caliza" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="${I.luz}"/><stop offset="1" stop-color="#c6ab79"/></linearGradient><linearGradient id="${t}-ocre" x1="0" y1="0" x2=".85" y2="1"><stop stop-color="#e6bf70"/><stop offset="1" stop-color="#a36b32"/></linearGradient></defs><g stroke="${I.tinta}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${i}</g></svg>`]})));var ht=a=>document.getElementById(a),_i=a=>yu[a]||yu.cancelar||"",go=["Q","W","E","R","T","A","S","D","F","G","Z","X","C","V","B"],Av=["comida","madera","piedra"];function zl(a=document){a.querySelectorAll("[data-icono]").forEach(e=>{(!e.dataset.pintado||e.dataset.pintado!==e.dataset.icono)&&(e.innerHTML=_i(e.dataset.icono)+(e.querySelector("b")?e.querySelector("b").outerHTML:""),e.dataset.pintado=e.dataset.icono)})}function bu(a){for(let l of Av){let c=ht("r-"+l),h=Math.floor(a.recursosJugador[l]);c.querySelector("b").textContent=h,c.classList.toggle("bajo",h<20)}let e=ht("r-pob");e.querySelector("b").textContent=`${a.pob}/${a.pobMax}`,e.classList.toggle("bajo",a.pob>=a.pobMax);let t=ht("r-animo");t.querySelector("b").textContent=Math.round(a.animo),t.querySelector(".barrita span").style.width=Math.round(a.animo)+"%",t.querySelector(".barrita span").style.backgroundPosition=`${-(100-a.animo)*.7}px 0`,t.classList.toggle("bajo",a.animo<25);let i=ht("r-dia"),n=Gi(a);i.classList.toggle("noche",n);let r=i.querySelector("i");r.dataset.icono!==(n?"noche":"dia")&&(r.dataset.icono=n?"noche":"dia",r.innerHTML=_i(r.dataset.icono)),i.querySelector("b").textContent=`${P("dia")} ${Math.min(a.dia,ca)} ${P("de")} ${ca}`,i.querySelector(".reloj span").style.width=Math.round(a.hora*100)+"%",ht("b-velocidad").textContent=(a.velocidad||1)+"\xD7";let o=Br(a).length,s=ht("b-ocioso");s.classList.toggle("nadie",!o),s.querySelector("b").textContent=o}var Xm=new WeakSet;function Zm(a){let e=ht("avisos");for(let t of a.mensajes){if(Xm.has(t)||(Xm.add(t),t.clave==="amanece"&&a.dia>1&&a.dia%1===0&&!t.datos.importante&&a.dia%5!==0))continue;let i=document.createElement("div");i.className="aviso"+(t.peligro?" peligro":"")+(t.clave.startsWith("historia")?" historia":""),i.textContent=P("m_"+t.clave,t.datos),t.x!=null&&(i.onclick=()=>L.vista.centrar(t.x,t.z),L.ultimoAviso={x:t.x,z:t.z}),e.prepend(i),L.audio?.("aviso",t);let n=t.clave.startsWith("historia")?16e3:t.peligro?9e3:6e3;for(setTimeout(()=>{i.classList.add("sale"),setTimeout(()=>i.remove(),700)},n);e.children.length>6;)e.lastChild.remove()}}function Jm(){ht("avisos").innerHTML=""}function Mu(a){let e=ht("objetivos");if(e.hidden)return;let t=Ko(a).map(i=>`<li class="${i.hecho?"hecho":""}">${P(i.clave,{n:i.n,de:i.de})}</li>`).join("");e.innerHTML=`<h3>${P("objetivos")}</h3><ul>${t}<li>${P("obj_plazo")}</li></ul>
    <div class="cita">\xAB${P("d_ono_no_ir").split("\xBB")[0].replace("\xAB","")}\xBB</div>`}function Il(a,e){let t=Math.max(0,Math.min(1,a/e));return`<div class="vida"><span class="barra"><span style="width:${t*100}%;background:${t>.5?"var(--verde)":t>.25?"var(--oro)":"var(--rojo)"}"></span></span>${Math.ceil(a)}/${Math.ceil(e)}</div>`}var Cv=(a,e)=>`<div class="costo">${Object.entries(a||{}).map(([t,i])=>`<span class="${e&&e.recursosJugador[t]<i?"falta":""}"><i>${_i(t)}</i>${i}</span>`).join("")}</div>`;function Su(a){let e=ht("info"),t=L.sel;if(!t){e.innerHTML=`<div class="bienvenida">${P("subtitulo")}. ${P("m_historia_inicio")}</div>`;return}if(t.tipo==="unidades"){let i=t.ids.map(r=>a.unidades.get(r)).filter(Boolean);if(!i.length){_t(null);return}if(i.length===1){let r=i[0],o=Ze[r.tipo],s=ot?`<div class="stats"><span>${P("ataque")} <b>${o.ataque+(r.armado?3:0)}</b></span><span>${P("armadura")} <b>${o.armadura+(r.armado?1:0)}</b></span>${o.alcance>2?`<span>${P("alcance")} <b>${o.alcance}</b></span>`:""}${r.carga?`<span>${P("carga")} <b>${Math.floor(r.carga.cant)} ${P(r.carga.recurso).toLowerCase()}</b></span>`:""}</div>`:"";e.innerHTML=`<div class="retrato">${_i(r.tipo)}</div><div class="datos"><h2>${P("u_"+r.tipo)}</h2>
        <div class="sub">${r.ausente?"\u2014":P("accion_"+r.accion)}</div>${Il(r.hp,r.hpMax)}${s}<div class="desc">${P("u_"+r.tipo+"_d")}</div></div>`;return}let n=i.slice(0,40).map(r=>`<button data-id="${r.id}" title="${P("u_"+r.tipo)}">${_i(r.tipo)}<span class="hp"><span style="width:${r.hp/r.hpMax*100}%"></span></span></button>`).join("");e.innerHTML=`<div class="datos"><h2>${P("seleccion_varios",{n:i.length})}</h2><div class="grupo">${n}</div></div>`,e.querySelectorAll(".grupo button").forEach(r=>{r.onclick=o=>{let s=+r.dataset.id;o.shiftKey?_t({tipo:"unidades",ids:t.ids.filter(l=>l!==s)}):_t({tipo:"unidades",ids:[s]})}});return}if(t.tipo==="edificio"){let i=a.edificios.get(t.id);if(!i){_t(null);return}let n=Me[i.tipo],r="";if(i.avance<1&&(r+=`<div class="sub">${P("construyendo")} \xB7 ${P("avance")} ${Math.floor(i.avance*100)} %</div>`),i.tipo==="granja"&&i.avance>=1&&(r+=`<div class="stats"><span>${P("reservas")} <b>${Math.floor(i.comida)}</b> ${P("comida").toLowerCase()}</span></div>`),i.cola.length||i.investigando){let o=i.cola.map((l,c)=>`<button data-cola="${c}" title="${P("o_cancelar")}">${_i(l)}${c===0?`<span class="progreso" style="width:${(i.progreso||0)*100}%"></span>`:""}</button>`).join(""),s=i.investigando?`<button data-inv="1" title="${P("o_cancelar")}">${_i(i.investigando)}<span class="progreso" style="width:${(i.progresoTec||0)*100}%"></span></button>`:"";r+=`<div class="sub">${i.investigando?P("investigando")+": "+P("tec_"+i.investigando):P("entrenando")}</div><div class="cola">${s}${o}</div>`}n.guarnicion&&(r+=`<div class="stats"><span>${P("guarnicion")} <b>${i.guarnicion.length}/${n.guarnicion}</b></span></div>`),e.innerHTML=`<div class="retrato">${_i(i.tipo)}</div><div class="datos"><h2>${P("b_"+i.tipo)}</h2>${Il(i.hp,i.hpMax)}${r}<div class="desc">${P("b_"+i.tipo+"_d")}</div></div>`,e.querySelectorAll("[data-cola]").forEach(o=>{o.onclick=()=>{wc(a,i.id,+o.dataset.cola),Oi()}}),e.querySelectorAll("[data-inv]").forEach(o=>{o.onclick=()=>{Ec(a,i.id),Oi()}});return}if(t.tipo==="tramo"){let i=a.tramos[t.id],n=i.tipo==="puerta"?P("p_"+i.nombre):i.nombre?P("t_"+i.nombre):P("muro"),r=i.avance<1?`${P("tramo_estado_ruinas")} \xB7 ${P("avance")} ${Math.floor(i.avance*100)} %`:i.hp<i.hpMax?P("tramo_estado_danado"):P("tramo_estado_entero"),o=i.tipo==="puerta"?`<div class="sub">${i.hojas?P("puerta_con_hojas"):P("puerta_sin_hojas")}</div>`:"",s=pi[i.tipo];e.innerHTML=`<div class="retrato">${_i(i.tipo==="puerta"?"puerta":"muro")}</div><div class="datos"><h2>${n}</h2><div class="sub">${r}</div>
      ${i.avance>=1?Il(i.hp,i.hpMax):""}${o}<div class="desc">${P("familia_tramo",{familia:i.familia})}</div>
      <div class="desc">${P("costo")}: ${Object.entries(s.costo).map(([l,c])=>`${c} ${P(l).toLowerCase()}`).join(", ")}</div></div>`;return}if(t.tipo==="recurso"){let i=a.recursos.get(t.id);if(!i){_t(null);return}e.innerHTML=`<div class="retrato">${_i(i.tipo)}</div><div class="datos"><h2>${P("r_"+i.tipo)}</h2><div class="stats"><span>${P("reservas")} <b>${Math.floor(i.cant)}</b></span></div>${i.tipo==="escombros"?`<div class="desc">${P("r_escombros_d")}</div>`:""}</div>`;return}if(t.tipo==="enemigo"){let i=a.enemigos.get(t.id);if(!i){_t(null);return}e.innerHTML=`<div class="retrato">${_i(i.tipo)}</div><div class="datos"><h2>${P("u_"+i.tipo)}</h2><div class="sub">${P("fa_"+i.faccion)} \xB7 ${P("accion_"+i.accion)}</div>${Il(i.hp,i.hpMax)}</div>`}}function Rv(a){let e=L.sel,t=[];if(!e)return t;if(e.tipo==="unidades"){let i=Ui().map(s=>a.unidades.get(s)).filter(Boolean),n=i.some(s=>s.tipo==="aldeano"),r=i.some(s=>s.tipo!=="aldeano"&&s.tipo!=="nehemias"),o=i.some(s=>s.tipo==="nehemias");if(L.pagina==="edificios"&&n){for(let s of["casa","aserradero","deposito","molino","granja","cuartel","taller","torre"]){let l=Mn(a,s);t[go.indexOf(Me[s].tecla)]={icono:s,titulo:P("b_"+s),desc:P("b_"+s+"_d"),costo:Me[s].costo,no:!l.ok&&l.motivo==="requiere"?P("m_requiere",{tipo:l.requiere}):null,activo:L.modo&&L.modo.edificio===s,hacer:()=>{if(!l.ok){L.audio?.("error"),l.motivo==="falta"&&Km(P("m_falta",{recurso:Object.keys(l.falta)[0]}));return}ci({tipo:"colocar",edificio:s})}}}return t[14]={icono:"volver",titulo:P("o_volver"),hacer:()=>{L.pagina=null,ci(null),Oi()}},t}if(n&&(t[0]={icono:"construir",titulo:P("o_construir"),desc:P("o_construir_d"),hacer:()=>{L.pagina="edificios",Oi()}},t[1]={icono:"muro",titulo:P("o_construir_muro"),desc:P("o_muro_d"),activo:L.modo?.accion==="tramo",costo:pi.muro.costo,hacer:()=>ci({tipo:"objetivo",accion:"tramo"})},t[2]={icono:"hojas",titulo:P("o_hojas"),desc:P("o_hojas_d"),costo:pi.hojas.costo,activo:L.modo?.accion==="hojas",no:ot(a,"cerrojos")?null:P("m_falta_cerrojos"),hacer:()=>ci({tipo:"objetivo",accion:"hojas"})},t[7]={icono:"refugio",titulo:P("o_refugio"),hacer:()=>{Ur(a,i.filter(s=>s.tipo==="aldeano").map(s=>s.id))}}),o)for(let[s,l]of Object.entries(Sr)){let c=l.requiereHito&&!a.hitos[l.requiereHito],h=Math.max(0,Math.ceil(a.habilidades[s]-a.t));t[go.indexOf(l.tecla)+10]={icono:s,titulo:P("h_"+s),desc:P("h_"+s+"_d"),recarga:h||null,no:c?P("h_bloqueada"):null,hacer:()=>{es(a,s).ok?L.audio?.("habilidad_"+s):L.audio?.("error")}}}if(r||o||!n){let s=n?3:0;t[s]={icono:"mover",titulo:P("o_mover"),desc:P("o_mover_d"),activo:L.modo?.accion==="mover",hacer:()=>ci({tipo:"objetivo",accion:"mover"})},(r||o)&&(t[n?4:1]={icono:"atacar_mover",titulo:P("o_atacar_mover"),desc:P("o_atacar_mover_d"),activo:L.modo?.accion==="atacar_mover",hacer:()=>ci({tipo:"objetivo",accion:"atacar_mover"})},n||(t[2]={icono:"defender",titulo:P("o_defender"),desc:P("o_defender_d"),activo:L.modo?.accion==="defender",hacer:()=>ci({tipo:"objetivo",accion:"defender"})}))}return t[5]={icono:"detener",titulo:P("o_detener"),hacer:()=>yc(a,Ui())},n||(t[6]={icono:"guarnecer",titulo:P("o_guarnecer"),hacer:()=>Ur(a,Ui())}),t}if(e.tipo==="edificio"){let i=a.edificios.get(e.id);if(!i)return t;let n=Me[i.tipo];if(i.avance<1)return t[14]={icono:"cancelar",titulo:P("o_cancelar"),hacer:()=>{Or(a,i.id),_t(null)}},t;let r=0;for(let o of n.entrena||[]){let s=Zo(a,i,o);t[r++]={icono:o,titulo:P("u_"+o),desc:P("u_"+o+"_d"),costo:Ze[o].costo,no:s.motivo==="poblacion"?P("m_poblacion"):null,hacer:()=>{Sc(a,i.id,o)?L.audio?.("entrenar"):L.audio?.("error"),Oi()}}}for(let o of n.investiga||[]){if(a.tecnologias[o])continue;let s=Jo(a,i,o),l=Hi[o];t[r++]={icono:o,titulo:P("tec_"+o),desc:P("tec_"+o+"_d"),costo:l.costo,no:s.motivo==="hito"?P("h_bloqueada"):s.motivo==="ocupado"?P("m_no_ahora"):null,hacer:()=>{Tc(a,i.id,o)?L.audio?.("investigar"):L.audio?.("error"),Oi()}}}(n.entrena||[]).length&&(t[5]={icono:"reunion",titulo:P("o_reunion"),desc:P("o_reunion_d"),activo:L.modo?.accion==="reunion",hacer:()=>ci({tipo:"objetivo",accion:"reunion"})}),n.guarnicion&&(t[6]={icono:"desguarnecer",titulo:P("o_desguarnecer"),no:i.guarnicion.length?null:" ",hacer:()=>bc(a,i.id)}),i.tipo==="gobernador"&&(t[7]={icono:"refugio",titulo:P("o_refugio"),hacer:()=>Ur(a,[...a.unidades.values()].filter(o=>o.tipo==="aldeano").map(o=>o.id))})}return t}var Ym="";function Tu(a,e=!1){let t=Rv(a),i=JSON.stringify(t.map(r=>r&&[r.icono,!!r.activo,!!r.no,r.recarga,r.costo&&Object.entries(r.costo).map(([o,s])=>a.recursosJugador[o]>=s).join()]));if(!e&&i===Ym)return;Ym=i;let n=ht("ordenes");n.innerHTML="",Al.clear();for(let r=0;r<15;r++){let o=t[r],s=document.createElement("button");if(s.className="orden"+(o?"":" vacia")+(o&&o.activo?" activa":"")+(o&&(o.no||o.costo&&Object.entries(o.costo).some(([l,c])=>a.recursosJugador[l]<c))?" no":""),o){s.innerHTML=_i(o.icono)+`<span class="tecla">${go[r]}</span>`+(o.recarga?`<span class="recarga">${o.recarga}</span>`:"");let l=()=>{if(o.no&&o.no.trim()){Km(o.no),L.audio?.("error");return}o.hacer(),L.audio?.("clic"),Oi()};s.onclick=l,Al.set(go[r],l),s.onpointerenter=c=>Lv(c,o,go[r],a),s.onpointerleave=()=>{ht("tooltip").hidden=!0}}n.appendChild(s)}}function Lv(a,e,t,i){let n=ht("tooltip");n.innerHTML=`<h4>${e.titulo}</h4>${e.costo?Cv(e.costo,i):""}${e.desc?`<div>${e.desc}</div>`:""}${e.no&&e.no.trim()?`<div class="nota">${e.no}</div>`:""}<div class="tecla">${P("tecla")}: ${t}</div>`,n.hidden=!1;let r=a.currentTarget.getBoundingClientRect();n.style.left=Math.max(8,Math.min(innerWidth-330,r.left-140))+"px",n.style.top=Math.max(8,r.top-n.offsetHeight-10)+"px"}function Nl(){document.querySelectorAll("[data-tip]").forEach(a=>{a.onpointerenter=()=>{let e=ht("tooltip");e.innerHTML=`<h4>${P(a.dataset.tip)}</h4>`,e.hidden=!1;let t=a.getBoundingClientRect();e.style.left=Math.min(innerWidth-200,t.left)+"px",e.style.top=t.bottom+6+"px"},a.onpointerleave=()=>{ht("tooltip").hidden=!0}})}var $m=null;function Km(a){let e=ht("pista");e.textContent=a,e.hidden=!1,clearTimeout($m),$m=setTimeout(()=>{e.hidden=!L.modo,L.modo&&Qm()},2200)}function Qm(){let a=ht("pista");if(!L.modo){a.hidden=!0;return}a.hidden=!1,a.textContent=L.modo.tipo==="colocar"?`${P("b_"+L.modo.edificio)} \u2014 ${P("o_construir_d")}`:P({tramo:"o_muro_d",hojas:"o_hojas_d",reunion:"o_reunion_d",mover:"o_mover_d",atacar_mover:"o_atacar_mover_d",defender:"o_defender_d"}[L.modo.accion])}function Oi(){let a=L.e;a&&(Su(a),Tu(a,!0),Qm())}function ef(a){zl(),Nl(),ht("b-ocioso").onclick=()=>fu(),ht("b-objetivos").onclick=()=>{ht("objetivos").hidden=!ht("objetivos").hidden,Mu(L.e)},ht("b-pausa").onclick=()=>a.pausar(),ht("b-menu").onclick=()=>a.menu(),ht("b-velocidad").onclick=()=>{let e=L.e;e.velocidad=e.velocidad===1?1.5:e.velocidad===1.5?2:1,bu(e)},L.alHacer=e=>{e==="seleccion"&&(L.pagina=null),Oi()}}var yt=220,hr=vt.medio,_o=null,La,we,vo,wu,tt=a=>(a+hr)/vt.lado*yt,Dl=a=>a/yt*vt.lado-hr;function Pv(){_o=document.createElement("canvas"),_o.width=_o.height=yt;let a=_o.getContext("2d"),e=a.createImageData(yt,yt);for(let t=0;t<yt;t++)for(let i=0;i<yt;i++){let n=Dl(i+.5),r=Dl(t+.5),o=yr(n,r),s=yr(n+1,r)-o,l=yr(n,r+1)-o,c=Math.max(.55,Math.min(1.25,1-s*.35-l*.35)),h=190,u=166,d=118;o<1.5&&(h=160,u=140,d=100),o>11&&(h=205,u=186,d=140);let p=(t*yt+i)*4;e.data[p]=h*c,e.data[p+1]=u*c,e.data[p+2]=d*c,e.data[p+3]=255}a.putImageData(e,0,0),a.fillStyle="#5c86a8";for(let t of br)a.beginPath(),a.arc(tt(t.x),tt(t.z),t.r/vt.lado*yt+.6,0,Math.PI*2),a.fill();a.fillStyle="#d8c9a2",a.beginPath(),a.arc(tt(Si.x),tt(Si.z),Si.r/vt.lado*yt,0,Math.PI*2),a.fill(),vo=document.createElement("canvas"),vo.width=vo.height=110,wu=vo.getContext("2d")}function af(){La=document.getElementById("minimapa"),we=La.getContext("2d"),Pv();let a=!1,e=t=>{let i=La.getBoundingClientRect(),n=Dl((t.clientX-i.left)/i.width*yt),r=Dl((t.clientY-i.top)/i.height*yt);return{x:n,z:r}};La.addEventListener("pointerdown",t=>{if(!L.e)return;let i=e(t);if(t.button===2){let n=Ui();n.length&&(Zi(L.e,n,{tipo:"suelo",x:i.x,z:i.z}),L.vista.marcar(i.x,i.z,"mover"),L.audio?.("orden"));return}a=!0,L.vista.centrar(i.x,i.z),La.setPointerCapture(t.pointerId),L.tutorial&&L.tutorial("camara")}),La.addEventListener("pointermove",t=>{if(a){let i=e(t);L.vista.centrar(i.x,i.z)}}),La.addEventListener("pointerup",()=>{a=!1}),La.addEventListener("contextmenu",t=>t.preventDefault())}function nf(a,e){if(!we)return;we.drawImage(_o,0,0);let t=a.niebla,i=(s,l)=>t.datos[Math.floor((l+hr)/t.celda)*t.ancho+Math.floor((s+hr)/t.celda)];for(let s of a.recursos.values())i(s.x,s.z)&&(we.fillStyle=s.tipo==="arbol"?"#3f6b35":s.tipo==="olivo"?"#7c9a4d":s.tipo==="oveja"?"#f4efe0":s.tipo==="escombros"?"#5b5248":"#a49c90",we.fillRect(tt(s.x)-1,tt(s.z)-1,2,2));we.lineCap="round";for(let s of a.tramos){let l=s.avance>=1&&s.hp>0;we.strokeStyle=s.tipo==="puerta"?s.hojas?"#f3d58f":l?"#c79a52":"#c0482f":l?s.hp<s.hpMax*.5?"#d98f5b":"#f4ead2":"#c0482f",we.lineWidth=s.tipo==="puerta"?3.2:l?2.4:1.6,we.globalAlpha=l?1:.55+.45*s.avance,we.beginPath(),we.moveTo(tt(s.a.x),tt(s.a.z)),we.lineTo(tt(s.b.x),tt(s.b.z)),we.stroke()}we.globalAlpha=1;for(let s of a.edificios.values()){let l=Math.max(3,Me[s.tipo].tam/vt.lado*yt);we.fillStyle=s.fuego>0?Math.floor(e*4)%2?"#ff7a2f":"#3e6aa8":s.avance<1?"#7d93b5":"#3e6aa8",we.fillRect(tt(s.x)-l/2,tt(s.z)-l/2,l,l),we.strokeStyle="#0a1830",we.lineWidth=.6,we.strokeRect(tt(s.x)-l/2,tt(s.z)-l/2,l,l)}let n=new Set(Ui());for(let s of a.unidades.values())s.accion!=="guarnecido"&&(we.fillStyle=n.has(s.id)?"#ffffff":s.tipo==="nehemias"?"#f3d58f":s.tipo==="aldeano"?"#8fb6ea":"#4f8fe8",we.fillRect(tt(s.x)-1.2,tt(s.z)-1.2,2.6,2.6));for(let s of a.enemigos.values())i(s.x,s.z)===2&&(we.fillStyle=s.accion==="huye"?"#a76a5a":"#e0402a",we.fillRect(tt(s.x)-1.4,tt(s.z)-1.4,3,3));let r=wu.createImageData(t.ancho,t.alto);for(let s=0;s<t.datos.length;s++)r.data[s*4+3]=t.datos[s]===0?245:t.datos[s]===1?105:0,r.data[s*4]=8,r.data[s*4+1]=8,r.data[s*4+2]=14;wu.putImageData(r,0,0),we.imageSmoothingEnabled=!0,we.drawImage(vo,0,0,t.ancho,t.alto,0,0,yt,yt);for(let s of a.alertas||[]){let l=4+e*10%8;we.strokeStyle="#ff5a3c",we.lineWidth=2,we.beginPath(),we.arc(tt(s.x),tt(s.z),l,0,Math.PI*2),we.stroke()}if(L.ultimoAviso&&L.ultimoAviso.hasta>e){we.strokeStyle="#ffd36b",we.lineWidth=1.5;let s=3+e*12%6;we.beginPath(),we.arc(tt(L.ultimoAviso.x),tt(L.ultimoAviso.z),s,0,Math.PI*2),we.stroke()}if(L.metaMini){let s=3+e*6%5;we.strokeStyle="#ffe9a8",we.lineWidth=2,we.beginPath(),we.arc(tt(L.metaMini.x),tt(L.metaMini.z),s,0,Math.PI*2),we.stroke()}let o=L.vista.esquinasVista?L.vista.esquinasVista():null;if(o&&o.length===4&&o.every(Boolean)){we.strokeStyle="#ffffffd0",we.lineWidth=1.2,we.beginPath();let s=l=>Math.max(-hr,Math.min(hr,l));o.forEach((l,c)=>c?we.lineTo(tt(s(l.x)),tt(s(l.z))):we.moveTo(tt(s(l.x)),tt(s(l.z)))),we.closePath(),we.stroke()}we.font="bold 12px Georgia, serif",we.textAlign="center",we.textBaseline="middle",we.lineWidth=3,we.strokeStyle="#000000b0";for(let[s,l,c]of[["n",yt/2,9],["s",yt/2,yt-9],["e",yt-8,yt/2],["o",8,yt/2]])we.fillStyle=s==="n"?"#f3d58f":"#efe2c4",we.strokeText(P("br_"+s),l,c),we.fillText(P("br_"+s),l,c)}var Iv={n:0,e:Math.PI/2,s:Math.PI,o:-Math.PI/2},tf="";function rf(a){let e=document.getElementById("brujula");if(!e)return;let t=a.toFixed(3)+P("br_o")+e.clientWidth;if(t===tf)return;tf=t;let i=e.clientWidth*.34;e.querySelector(".aguja").style.transform=`rotate(${a}rad)`;for(let n of e.querySelectorAll("b")){let r=a+Iv[n.dataset.br];n.textContent=P("br_"+n.dataset.br),n.style.transform=`translate(${(Math.sin(r)*i).toFixed(1)}px, ${(-Math.cos(r)*i).toFixed(1)}px)`}}var Ve=(a,e)=>({es:a,en:e}),Ul={aldeano:{sel:[Ve("\xBFS\xED?","Yes?"),Ve("Aqu\xED estoy.","Here I am."),Ve("\xBFQu\xE9 hacemos?","What shall we do?")],orden:[Ve("Voy.","On my way."),Ve("En seguida.","Right away."),Ve("Con gusto.","Gladly.")],trabajo:[Ve("\xA1Manos a la obra!","To work!"),Ve("Piedra sobre piedra.","Stone upon stone."),Ve("Lo levantaremos.","We will raise it.")]},lancero:{sel:[Ve("\xBF\xD3rdenes?","Orders?"),Ve("Listo para defender.","Ready to defend."),Ve("Lanza en mano.","Spear in hand.")],orden:[Ve("A la orden.","As you say."),Ve("Entendido.","Understood."),Ve("Vamos.","Moving.")],ataque:[Ve("\xA1Por nuestras familias!","For our families!"),Ve("\xA1A ellos!","At them!")]},arquero:{sel:[Ve("\xBFS\xED?","Yes?"),Ve("Arco listo.","Bow ready."),Ve("Los veo desde aqu\xED.","I can see them from here.")],orden:[Ve("En camino.","On my way."),Ve("Entendido.","Understood.")],ataque:[Ve("\xA1Flechas!","Loose!"),Ve("\xA1Apunten!","Take aim!")]},jinete:{sel:[Ve("\xBFMi se\xF1or?","My lord?"),Ve("Jinetes del rey.","The king\u2019s horsemen.")],orden:[Ve("\xA1Al galope!","Riding out!"),Ve("En seguida.","At once.")],ataque:[Ve("\xA1A la carga!","Charge!"),Ve("\xA1Adelante!","Forward!")]},nehemias:{sel:[Ve("\xBFQu\xE9 necesitas?","What do you need?"),Ve("Sigamos con la obra.","Let us keep building."),Ve("Dios nos ayudar\xE1.","God will help us.")],orden:[Ve("Vamos.","Let us go."),Ve("Adelante.","Onward."),Ve("No tengan miedo.","Do not be afraid.")],ataque:[Ve("\xA1Defiendan la ciudad!","Defend the city!")]}};var zv="sonidos/",cf={tala:["fx/impacto_1"],pica:["fx/piedra_1","fx/piedra_2","fx/piedra_3"],construye:["fx/piedra_2","fx/piedra_3","fx/impacto_2"],golpe:["fx/espada_1","fx/espada_2","fx/impacto_2"],herido:["fx/dolor"],huye:["fx/caer"],derribado:["fx/caer"],terminado:["fx/objeto"],tramo_completo:["fx/nivel"],hojas:["fx/puerta_cerrar"],entrenado:["fx/aparicion"],oracion:["fx/bendicion"],exhortar:["fx/onda"],caravana:["fx/objeto"],robo:["fx/caer"],fuego:["fx/amb_fogata"],apagado:["fx/sanar"],cimientos:["fx/piedra_1"],clic:["fx/objeto"],colocar:["fx/piedra_1"],orden:["fx/paso_tierra_1"],entrenar:["fx/objeto"],investigar:["fx/escudo"],mision:["fx/mision"],alarma:["fx/desenvainar"]},Nv={tala:.25,pica:.25,construye:.22,golpe:.35,herido:.35,huye:.3,terminado:.5,tramo_completo:.45,hojas:.6,entrenado:.35,oracion:.6,exhortar:.6,caravana:.5,robo:.4,fuego:.3,apagado:.4,cimientos:.4,clic:.18,colocar:.4,orden:.3,entrenar:.25,investigar:.35,mision:.6,alarma:.55,derribado:.5},Dv={portada:"musica/tema_lugar",juego:["musica/tema_constructor","musica/tema_ciudad_central"],batalla:"musica/tema_duelo",victoria:"musica/stinger_victoria",derrota:"musica/stinger_derrota"},Te=null,ur=new Map,Eu=new Map,Ia,sa,xo,yo,Au=null,Pa=null,Cu={},ei={musica:.55,efectos:.8,voces:.9};try{Object.assign(ei,JSON.parse(localStorage.getItem("nehemias-volumen")||"{}"))}catch{}addEventListener("verboads:inicio",()=>Te?.suspend());addEventListener("verboads:fin",()=>Te?.resume());function hf(){if(Te){Te.state==="suspended"&&Te.resume();return}let a=window.AudioContext||window.webkitAudioContext;if(a&&(Te=new a,Ia=Te.createGain(),Ia.gain.value=ei.musica,Ia.connect(Te.destination),sa=Te.createGain(),sa.gain.value=ei.efectos,sa.connect(Te.destination),xo=Te.createGain(),xo.gain.value=ei.efectos*.5,xo.connect(Te.destination),yo=Te.createGain(),yo.gain.value=ei.voces,yo.connect(Te.destination),Pa)){let e=Pa;Pa=null,la(e)}}function uf(a){Object.assign(ei,a);try{localStorage.setItem("nehemias-volumen",JSON.stringify(ei))}catch{}Ia&&(Ia.gain.value=ei.musica*(dr?.35:1),sa.gain.value=ei.efectos,xo.gain.value=ei.efectos*.5,yo.gain.value=ei.voces)}var df=()=>({...ei});function un(a){if(ur.has(a))return Promise.resolve(ur.get(a));if(Eu.has(a))return Eu.get(a);let e=fetch(zv+a+".mp3").then(t=>t.arrayBuffer()).then(t=>Te.decodeAudioData(t)).then(t=>(ur.set(a,t),t)).catch(()=>null);return Eu.set(a,e),e}function Uv(a,e=1,t=sa,i=1){if(!Te)return null;let n=ur.get(a);if(!n)return un(a),null;let r=Te.createBufferSource(),o=Te.createGain();return r.buffer=n,r.playbackRate.value=i,o.gain.value=e,r.connect(o),o.connect(t),r.start(),{s:r,g:o}}var of=new Map;function dn(a,e=1){if(!Te)return;if(a==="error"){Ov(180,.12,.12);return}if(a==="habilidad_trompeta"||a==="trompeta"){gf();return}if(a==="aviso_peligro"){Bv();return}let t=cf[a];if(!t)return;let i=Te.currentTime;(of.get(a)||0)>i-.07||(of.set(a,i),Uv(t[Math.floor(Math.random()*t.length)],(Nv[a]||.4)*e,sa,.94+Math.random()*.12))}function pf(a,e,t){if(!Te||!a.eventos.length)return;let i={};for(let n of a.eventos){if(i[n.tipo]=(i[n.tipo]||0)+1,i[n.tipo]>3)continue;if(n.tipo==="trompeta"){gf();continue}let r=Math.hypot(n.x-e.x,n.z-e.z),o=n.tipo==="tramo_completo"||n.tipo==="hojas"||n.tipo==="caravana"||n.tipo==="oracion"?1:Math.max(0,1-r/(55/Math.sqrt(e.zoom||1)));o<=.02||t&&!t(n.x,n.z)&&n.tipo!=="oracion"||dn(n.tipo,o)}}function la(a){if(a===Pa||(Pa=a,!Te))return;let e=Au;if(e&&(e.g.gain.setTargetAtTime(0,Te.currentTime,.8),setTimeout(()=>{try{e.s.stop()}catch{}},4e3)),Au=null,!a)return;let t=Dv[a];Array.isArray(t)&&(t=t[Math.floor(Math.random()*t.length)]);let i=a==="victoria"||a==="derrota";un(t).then(n=>{if(!n||Pa!==a)return;let r=Te.createBufferSource(),o=Te.createGain();r.buffer=n,r.loop=!i,o.gain.value=0,r.connect(o),o.connect(Ia),r.start(),o.gain.setTargetAtTime(a==="batalla"?.9:.75,Te.currentTime,1.2),Au={s:r,g:o},i&&(r.onended=()=>{Pa===a&&(Pa=null,la("portada"))})})}function mf(a,e){if(!Te)return;let t={"fx/amb_pajaros":a?0:.35,"fx/amb_grillos":a?.4:0,"fx/amb_viento":.18,"fx/amb_fogata":e?.5:0};for(let[i,n]of Object.entries(t)){let r=Cu[i];if(!r&&n>0){let o=ur.get(i);if(!o){un(i);continue}let s=Te.createBufferSource(),l=Te.createGain();s.buffer=o,s.loop=!0,l.gain.value=0,s.connect(l),l.connect(xo),s.start(),r=Cu[i]={s,g:l}}r&&r.g.gain.setTargetAtTime(n,Te.currentTime,1.5)}}function ff(){if(Te)for(let a of Object.values(Cu))a.g.gain.setTargetAtTime(0,Te.currentTime,.4)}function Ov(a,e,t){let i=Te.createOscillator(),n=Te.createGain();i.type="square",i.frequency.value=a,n.gain.value=t,n.gain.setTargetAtTime(0,Te.currentTime+e*.5,e*.3),i.connect(n),n.connect(sa),i.start(),i.stop(Te.currentTime+e+.2)}function gf(){if(!Te)return;let a=Te.currentTime;[[0,1.1],[1.25,.5],[1.85,1.6]].forEach(([e,t])=>{let i=Te.createOscillator(),n=Te.createOscillator(),r=Te.createBiquadFilter(),o=Te.createGain(),s=Te.createOscillator(),l=Te.createGain();i.type="sawtooth",n.type="square",i.frequency.setValueAtTime(196,a+e),i.frequency.exponentialRampToValueAtTime(233,a+e+.12),i.frequency.setValueAtTime(233,a+e+t*.7),i.frequency.exponentialRampToValueAtTime(311,a+e+t),n.frequency.value=98,s.frequency.value=5.5,l.gain.value=3,s.connect(l),l.connect(i.frequency),r.type="bandpass",r.frequency.value=900,r.Q.value=1.2,o.gain.setValueAtTime(0,a+e),o.gain.linearRampToValueAtTime(.32,a+e+.08),o.gain.setValueAtTime(.3,a+e+t-.1),o.gain.linearRampToValueAtTime(0,a+e+t+.05);let c=Te.createGain();c.gain.value=.25,i.connect(r),n.connect(c),c.connect(r),r.connect(o),o.connect(sa),[i,n,s].forEach(h=>{h.start(a+e),h.stop(a+e+t+.2)})})}function Bv(){let a=Te.currentTime,e=Te.createOscillator(),t=Te.createBiquadFilter(),i=Te.createGain();e.type="sawtooth",e.frequency.setValueAtTime(110,a),e.frequency.linearRampToValueAtTime(123,a+1.4),t.type="lowpass",t.frequency.value=600,i.gain.setValueAtTime(0,a),i.gain.linearRampToValueAtTime(.25,a+.3),i.gain.linearRampToValueAtTime(0,a+1.6),e.connect(t),t.connect(i),i.connect(sa),e.start(a),e.stop(a+1.8)}function _f(){if(Te){for(let a of Object.values(cf))a.forEach(un);["fx/amb_pajaros","fx/amb_grillos","fx/amb_viento"].forEach(un)}}var Ru=null,sf=0,dr=null,Ol=0,lf=new Map;function vf(a,e){let t=ur.get(a),i=Te.createBufferSource();return i.buffer=t,i.connect(yo),i.start(),e&&(i.onended=e),i}async function Lu(a,e){if(!Te||dr)return;let t=Ul[a]?.[e]||Ul[a]?.orden;if(!t)return;let i=a+e,n=lf.get(i),r=Math.floor(Math.random()*t.length);t.length>1&&r===n&&(r=(r+1)%t.length),lf.set(i,r);let o=Ul[a][e]?e:"orden",s=`voces/${sr()}/${a}_${o}_${r}`,l=++sf;if(!(!await un(s)||l!==sf)){try{Ru?.stop()}catch{}Ru=vf(s)}}async function Pu(a){if(!Te)return;pr();let e=`voces/${sr()}/narrador_${a}`,t=Ol;if(!(!await un(e)||t!==Ol)){try{Ru?.stop()}catch{}dr=vf(e,()=>{t===Ol&&pr()}),Ia.gain.setTargetAtTime(ei.musica*.35,Te.currentTime,.3)}}function pr(){if(Ol++,dr){try{dr.stop()}catch{}dr=null}Te&&Ia.gain.setTargetAtTime(ei.musica,Te.currentTime,.4)}var Iu=()=>document.getElementById("pantallas"),Ee=a=>String(a).replace(/[&<>"]/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[e]);function Yi(){Iu().innerHTML="",L.bloqueado=!1}function vi(a,e="velo"){Iu().innerHTML=`<div class="pantalla ${e}">${a}</div>`,L.bloqueado=!0;let t=Iu().firstElementChild;return t.querySelectorAll("button").forEach(i=>i.addEventListener("click",()=>dn("clic"),{capture:!0})),t}var nt=(a,e,t="")=>`<button class="boton ${t}" data-b="${a}">${Ee(e)}</button>`;function Bi(a,e){a.querySelectorAll("[data-b]").forEach(t=>{t.onclick=()=>e[t.dataset.b]?.()})}function bo({hayGuardada:a,jugar:e,continuar:t,alCambiarIdioma:i}){let n=vi(`<div class="portada">
      <div class="antetitulo">Verbo \xB7 ${Ee(P("dia"))} 1 \u2014 52</div>
      <h1>${Ee(P("titulo"))}</h1>
      <div class="lema">${Ee(P("subtitulo"))}</div>
      <div class="menu-principal">
        ${nt("jugar",P("jugar"),"principal")}
        ${a?nt("continuar",P("continuar")):""}
        ${nt("como",P("como"))}${nt("opciones",P("opciones"))}${nt("creditos",P("creditos"))}
      </div>
      <div class="idiomas">${["es","en"].map(r=>`<button data-l="${r}" class="${sr()===r?"activo":""}">${r.toUpperCase()}</button>`).join("")}</div>
    </div>
    <div class="pie-portada"><a href="/juegos/">${Ee(P("salir_verbo"))}</a> \xB7 verbobiblia.com</div>`,"portada-capa");n.style.background="linear-gradient(180deg, #0c0a0866 0%, #0c0a0800 35%, #0c0a0800 60%, #0c0a08bb 100%)",Bi(n,{jugar:e,continuar:t,como:()=>Sf(()=>bo({hayGuardada:a,jugar:e,continuar:t,alCambiarIdioma:i})),opciones:()=>Nu(()=>bo({hayGuardada:a,jugar:e,continuar:t,alCambiarIdioma:i})),creditos:()=>kv(()=>bo({hayGuardada:a,jugar:e,continuar:t,alCambiarIdioma:i}))}),n.querySelectorAll("[data-l]").forEach(r=>{r.onclick=()=>{fo(r.dataset.l),i()}})}function xf(a){let e=vi(`<div class="hoja"><h2>${Ee(P("aviso_titulo"))}</h2>${P("aviso").map(t=>`<p>${Ee(t)}</p>`).join("")}
    <div class="acciones">${nt("ok",P("entendido"),"principal")}</div></div>`);Bi(e,{ok:a})}function yf(a,e){let t=vi(`<div class="hoja"><h2>${Ee(P("dificultad"))}</h2><div class="opciones-dif">
    ${["facil","normal","dificil"].map(i=>`<button data-d="${i}" class="${i==="normal"?"elegida":""}"><b>${Ee(P(i))}</b>${Ee(P(i+"_d"))}</button>`).join("")}
    </div><div class="acciones">${nt("volver",P("volver"))}</div></div>`);t.querySelectorAll("[data-d]").forEach(i=>{i.onclick=()=>a(i.dataset.d)}),Bi(t,{volver:e})}function bf(a){let e=["pr1","pr2","pr3","pr4"],t=0,i=()=>{let n=e[t];Pu(n);let r=t===e.length-1,o=vi(`<div class="historia-panel"><h2>${Ee(P(n+"_t"))}</h2><div class="cita">${Ee(P(n))}</div><span class="ref">${Ee(P(n+"_ref"))}</span>
      <p>${Ee(P(n+"_x"))}</p><div class="acciones">
      ${r?nt("insp",P("prologo_jugable"),"principal")+nt("directo",P("saltar_inspeccion")):nt("sig",P("siguiente"),"principal")+nt("saltar",P("saltar"))}
      </div><div class="puntos">${e.map((s,l)=>`<span class="${l===t?"activo":""}"></span>`).join("")}</div></div>`,"velo");Bi(o,{sig:()=>{t++,i()},saltar:()=>{t=e.length-1,i()},insp:()=>{pr(),a(!0)},directo:()=>{pr(),a(!1)}})};i()}function Mf(a,e,t){let i=a.decision.clave,n=Sn[i],r=[...n.opciones].sort(()=>Math.random()-.5);vi(`<div class="hoja decision"><h2>${Ee(P("d_"+i+"_t"))}</h2>
    <div class="cita">${Ee(P("d_"+i+"_cita"))}</div><span class="ref">${Ee(P("d_"+i+"_ref"))}</span>
    <p>${Ee(P("d_"+i+"_texto"))}</p>
    ${r.map(s=>`<button class="opcion" data-o="${s}">${Ee(P("d_"+i+"_"+s))}</button>`).join("")}</div>`).querySelectorAll("[data-o]").forEach(s=>{s.onclick=()=>{let l=e(s.dataset.o),c=l&&l.buena?P("d_buena_nota"):`${P("d_mala_nota")} ${P("d_"+i+"_"+n.buena)}`,h=vi(`<div class="hoja decision"><h2>${Ee(P("d_"+i+"_t"))}</h2><p>${Ee(c)}</p>
      <div class="acciones">${nt("ok",P("reanudar"),"principal")}</div></div>`);dn(l&&l.buena?"mision":"error"),Bi(h,{ok:()=>{Yi(),t()}})}})}function zu({reanudar:a,guardarSalir:e,reiniciar:t}){let i=vi(`<div class="hoja"><h2>${Ee(P("pausado"))}</h2><div class="menu-principal">
    ${nt("reanudar",P("reanudar"),"principal")}${nt("como",P("como"))}${nt("opciones",P("opciones"))}
    ${nt("guardar",P("guardar_salir"))}${nt("reiniciar",P("reiniciar"))}</div></div>`),n=()=>zu({reanudar:a,guardarSalir:e,reiniciar:t});Bi(i,{reanudar:()=>{Yi(),a()},como:()=>Sf(n),opciones:()=>Nu(n),guardar:e,reiniciar:()=>{let r=vi(`<div class="hoja"><p>${Ee(P("confirmar_reiniciar"))}</p><div class="acciones">${nt("no",P("no_txt"))}${nt("si",P("si"),"principal")}</div></div>`);Bi(r,{no:n,si:t})}})}function Sf(a){let e=vi(`<div class="hoja"><h2>${Ee(P("ayuda_t"))}</h2><dl>${P("ayuda").map(([t,i])=>`<dt>${Ee(t)}</dt><dd>${Ee(i)}</dd>`).join("")}</dl>
    <div class="acciones">${nt("volver",P("volver"),"principal")}</div></div>`);Bi(e,{volver:a})}function kv(a){let e=vi(`<div class="hoja"><h2>${Ee(P("creditos_t"))}</h2>${P("creditos_lista").map(t=>`<p>${Ee(t)}</p>`).join("")}
    <div class="acciones">${nt("volver",P("volver"),"principal")}</div></div>`);Bi(e,{volver:a})}function Nu(a){let e=df(),t=vi(`<div class="hoja opciones"><h2>${Ee(P("opciones"))}</h2>
    <label>${Ee(P("musica"))}<input type="range" min="0" max="1" step="0.05" value="${e.musica}" data-v="musica"></label>
    <label>${Ee(P("efectos"))}<input type="range" min="0" max="1" step="0.05" value="${e.efectos}" data-v="efectos"></label>
    <label>${Ee(P("voces"))}<input type="range" min="0" max="1" step="0.05" value="${e.voces}" data-v="voces"></label>
    <label>${Ee(P("desplazamiento_borde"))}<input type="checkbox" data-borde ${L.bordeActivo?"checked":""}></label>
    <label>${Ee(P("idioma"))}<span class="idiomas">${["es","en"].map(i=>`<button data-l="${i}" class="${sr()===i?"activo":""}">${i.toUpperCase()}</button>`).join("")}</span></label>
    <div class="acciones">${nt("completa",P("pantalla_completa"))}${nt("volver",P("volver"),"principal")}</div></div>`);t.querySelectorAll("[data-v]").forEach(i=>{i.oninput=()=>uf({[i.dataset.v]:+i.value})}),t.querySelector("[data-borde]").onchange=i=>{L.bordeActivo=i.target.checked;try{localStorage.setItem("nehemias-borde",i.target.checked?"1":"0")}catch{}},t.querySelectorAll("[data-l]").forEach(i=>{i.onclick=()=>{fo(i.dataset.l),L.alCambiarIdioma?.(),Nu(a)}}),Bi(t,{volver:a,completa:()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen?.()}})}function Tf(a,{otra:e,portadaFn:t,verCiudad:i}){let n=a.resultado,r=a.estadisticas,o=Ga(a),s=(a.decisiones||[]).filter(g=>g.buena).length,l=(a.decisiones||[]).length,c=Object.entries(r.animoPerdido||{}).sort((g,f)=>f[1]-g[1]).slice(0,3).map(([g])=>P("c_"+g)).join(", ")||"\u2014",h=[[P("e_recogido")+" \xB7 "+P("piedra").toLowerCase(),Math.round(r.recogido.piedra)],[P("e_recogido")+" \xB7 "+P("madera").toLowerCase(),Math.round(r.recogido.madera)],[P("e_recogido")+" \xB7 "+P("comida").toLowerCase(),Math.round(r.recogido.comida)],[P("e_entrenados"),r.entrenados],[P("e_rechazadas"),`${r.rechazadas}/${r.oleadas}`],[P("e_heridos"),r.heridos],[P("e_decisiones"),`${s}/${l}`],[P("e_tecs"),Object.keys(a.tecnologias).length]],u=n.gano?`<h2>${Ee(P("victoria_t"))}</h2><div class="cita">${Ee(P("victoria_cita"))}</div><span class="ref">${Ee(P("victoria_ref"))}</span><p>${Ee(P("victoria_texto"))}</p>
       <p><b>${Ee(P("terminado_en",{dia:n.dia}))}</b></p><h3 style="font-family:var(--serif);margin:14px 0 4px">${Ee(P("dedicacion"))}</h3>
       <div class="cita" style="font-size:18px">${Ee(P("dedicacion_cita"))}</div><span class="ref">${Ee(P("dedicacion_ref"))}</span>`:`<h2>${Ee(P("derrota_t"))}</h2><p>${Ee(P("derrota_"+n.motivo))}</p><p>${Ee(P("derrota_consejo"))}</p>
       <p>${Ee(P("obj_tramos",{n:o.tramos,de:o.totalTramos}))} \xB7 ${Ee(P("obj_hojas",{n:o.hojas,de:o.totalPuertas}))}</p>`,d=vi(`<div class="hoja final">${u}<h3 style="font-family:var(--serif);margin:16px 0 6px">${Ee(P("estadisticas"))}</h3>
    <div class="resumen">${h.map(([g,f])=>`<div class="dato"><b>${Ee(f)}</b><span>${Ee(g)}</span></div>`).join("")}</div>
    <p style="font-size:14px">${Ee(P("e_animo_perdido"))}: ${Ee(c)}</p>
    <p style="font-size:13px;margin:10px 0 4px">${Ee(P("e_avance"))} / ${Ee(P("e_animo"))}</p><canvas width="660" height="150"></canvas>
    <div class="acciones">${nt("ciudad",P("ver_mapa"))}${nt("portada",P("ir_portada"))}${nt("otra",P("jugar_otra"),"principal")}</div></div>`,"velo");Hv(d.querySelector("canvas"),r.avancePorDia.concat([Math.round(Tn(a)*1e3)/10]),r.animoPorDia.concat([Math.round(a.animo)])),Pu(n.gano?"victoria":"derrota_"+n.motivo),window.VerboVotos&&d.querySelector(".acciones").before(window.VerboVotos.boton("nehemias"));let p=()=>window.VerboAds?window.VerboAds.pausa("nehemias-final"):Promise.resolve(),m=(g,f)=>()=>{pr(),f?p().then(g):g()};Bi(d,{otra:m(e,!0),portada:m(t,!0),ciudad:m(()=>{Yi(),i()})})}function Hv(a,e,t){let i=a.getContext("2d"),n=a.width,r=a.height,o=Math.max(52,e.length);i.clearRect(0,0,n,r),i.strokeStyle="#c4a87366",i.lineWidth=1;for(let l=0;l<=4;l++){let c=10+(r-20)*l/4;i.beginPath(),i.moveTo(30,c),i.lineTo(n-8,c),i.stroke()}i.fillStyle="#6b5330",i.font="11px sans-serif",i.fillText("100",4,14),i.fillText("0",14,r-8);let s=(l,c)=>{i.strokeStyle=c,i.lineWidth=2.5,i.beginPath(),l.forEach((h,u)=>{let d=30+(n-40)*(u/(o-1)),p=10+(r-20)*(1-h/100);u?i.lineTo(d,p):i.moveTo(d,p)}),i.stroke()};s(t,"#7a8fb8"),s(e,"#8a5d1e"),i.fillStyle="#8a5d1e",i.fillText("\u25A0 "+P("e_avance"),n-330,r-6),i.fillStyle="#7a8fb8",i.fillText("\u25A0 "+P("e_animo"),n-150,r-6)}var Bl=[{clave:"insp_2",x:-37,z:18},{clave:"insp_4",x:-46,z:38},{clave:"insp_5",x:-17,z:58},{clave:"insp_6",x:-2,z:70},{clave:"insp_7",x:26,z:52},{clave:"insp_8",x:-26,z:14}];function wf(a){let e=Fa(a);e.prologo=!0,e.niebla.datos.fill(0);let t=2;for(let i of[...e.unidades.values()])i.tipo!=="nehemias"&&(i.tipo==="aldeano"&&t-- >0||e.unidades.delete(i.id));return Va(e),e}function Ef(a,{consejo:e,alTerminar:t}){let i=En(a),n=0,r=!1,o=0,s=!1,l=(c,h=!1)=>e(h?`<span class="cita">${P("insp_cita")}</span>${P("insp_ref")}<br><br>${P(c)}`:P(c));return l("insp_1",!0),L.tutorial=c=>{c==="seleccion"&&n===0&&L.sel&&L.sel.tipo==="unidades"&&L.sel.ids.includes(i.id)&&(n=1,l("insp_3")),c==="camara"&&n===1&&(r=!0)},function(h){if(!s){for(let u of a.unidades.values())u===i||u.accion==="guarnecido"||Math.hypot(u.x-i.x,u.z-i.z)>4&&(!u.orden||u.orden.tipo!=="mover"||Math.hypot(u.orden.x-i.x,u.orden.z-i.z)>3)&&Zi(a,[u.id],{tipo:"suelo",x:i.x+(u.id%2?1.5:-1.5),z:i.z+1.5});if(n===1&&r&&(n=2,l(Bl[0].clave)),n>=2){let u=Bl[n-2];L.metaMini=u,h-o>1.4&&(o=h,L.vista.marcar(u.x,u.z,"reunir")),Math.hypot(i.x-u.x,i.z-u.z)<5&&(n++,n-2>=Bl.length?(s=!0,L.metaMini=null,L.tutorial=null,l("insp_fin"),setTimeout(t,3500)):l(Bl[n-2].clave))}}}}function Af(a,e){let t=a.niebla.datos,i=e.niebla.datos;for(let n=0;n<t.length;n++)t[n]&&!i[n]&&(i[n]=1)}var Rf="nehemias-guia-hecha",Lf=()=>{try{return localStorage.getItem(Rf)==="1"}catch{return!1}},Vv=()=>{try{localStorage.setItem(Rf,"1")}catch{}},kl=a=>[...a.unidades.values()].filter(e=>e.tipo==="aldeano");function Fl(a,e,t){let i=null,n=1/0;for(let r of a){let o=Math.hypot(r.x-e,r.z-t);o<n&&(n=o,i=r)}return i}var Pf=(a,e,t)=>{let i=a.niebla;return i.datos[Math.floor((t+110)/i.celda)*i.ancho+Math.floor((e+110)/i.celda)]>0},Cf=(a,...e)=>[...a.recursos.values()].filter(t=>e.includes(t.tipo)&&Pf(a,t.x,t.z)),Du=(a,e)=>kl(a).some(t=>t.orden&&e(t.orden));function If(a,{consejo:e,alTerminar:t}){let i=Ot(a),n=kl(a).length,r=[{clave:"g_1",donde:()=>{let p=kl(a);return p.length?{x:p.reduce((m,g)=>m+g.x,0)/p.length,z:p.reduce((m,g)=>m+g.z,0)/p.length}:null},listo:()=>L.sel&&L.sel.tipo==="unidades"&&L.sel.ids.some(p=>a.unidades.get(p)?.tipo==="aldeano")},{clave:"g_2",donde:()=>Fl(Cf(a,"escombros"),i.x,i.z),listo:()=>Du(a,p=>p.tipo==="recolectar"&&p.tipoRec==="escombros")},{clave:"g_3",donde:()=>{let p=a.tramos.filter(m=>m.avance<1).map(m=>({x:(m.a.x+m.b.x)/2,z:(m.a.z+m.b.z)/2}));return Fl(p.filter(m=>Pf(a,m.x,m.z)),i.x,i.z)||Fl(p,i.x,i.z)},listo:()=>Du(a,p=>p.tipo==="tramo")},{clave:"g_4",donde:()=>i,listo:()=>i.cola.includes("aldeano")||kl(a).length>n},{clave:"g_5",donde:()=>Fl(Cf(a,"oveja","olivo"),i.x,i.z),listo:()=>Du(a,p=>p.tipo==="recolectar"&&["oveja","olivo","arbol","granja"].includes(p.tipoRec))},{clave:"g_6",donde:()=>({x:i.x-9,z:i.z+7}),listo:()=>[...a.edificios.values()].some(p=>p.tipo==="casa")},{clave:"g_7",donde:()=>null,listo:p=>(l+=p)>16}],o=-1,s=0,l=0,c=null,h=!1,u=()=>{h||(h=!0,L.metaMini=null,Vv(),document.getElementById("consejo").hidden=!0,t())},d=()=>{if(o++,o>=r.length){u();return}e(`<span class="paso">${P("g_paso",{n:o+1,de:r.length})}</span>${P(r[o].clave)}<button class="saltar-guia" type="button">${P("g_saltar")}</button>`),document.querySelector("#consejo .saltar-guia").onclick=u;let p=r[o].donde();p&&o>0&&L.vista.centrar(p.x,p.z)};return d(),function(m){if(h||a.resultado)return;let g=c===null?0:Math.min(.2,m-c);c=m;let f=r[o],x=f.donde();L.metaMini=x?{x:x.x,z:x.z}:null,x&&m-s>1.3&&(s=m,L.vista.marcar(x.x,x.z,"reunir")),f.listo(g)&&d()}}var Hu="nehemias-partida-v1",za=a=>document.getElementById(a);fo(zm());try{L.bordeActivo=localStorage.getItem("nehemias-borde")!=="0"}catch{}var Vt=new Ml(za("lienzo"),Zl);L.vista=Vt;addEventListener("resize",()=>Vt.redimensionar());Bm();af();ef({pausar:Of,menu:qu});L.audio=(a,e)=>{if(a==="aviso"){e.peligro&&/oleada_llega|aviso_vecinos|incendio|brecha|puerta_rota|nehemias_herido/.test(e.clave)&&dn("aviso_peligro");return}if(a==="seleccion"){let t=zf(e?.ids);t&&Lu(t,"sel");return}if(a==="orden"&&e?.ids){let t=zf(e.ids),i=e.clase;t&&Lu(t,i==="atacar"?"ataque":(i==="construir"||i==="recolectar")&&t==="aldeano"?"trabajo":"orden")}dn(a)};function zf(a){if(!a||!L.e)return null;let e={};for(let t of a){let i=L.e.unidades.get(t);i&&(e[i.tipo]=(e[i.tipo]||0)+1)}return e.nehemias?"nehemias":Object.keys(e).sort((t,i)=>e[i]-e[t])[0]||null}L.abrirMenu=qu;L.pausar=Of;L.alCambiarIdioma=()=>{zl(),Nl(),L.e&&xi==="juego"&&Oi()};var xi="portada",Le=null,pn=null,mr="normal",Gu=Va(Fa("normal"));Gu.hora=.68;Gu.niebla.datos.fill(2);var Df=()=>{hf(),_f()};addEventListener("pointerdown",Df,{once:!0});addEventListener("keydown",Df,{once:!0});function mn(){xi="portada",Le=null,L.e=null,pn=null,L.tutorial=null,za("hud").hidden=!0,za("consejo").hidden=!0,Vt.modoPortada(!0),la("portada"),ff(),bo({hayGuardada:!!Bf(),jugar:()=>xf(()=>yf(Vu,mn)),continuar:Wv,alCambiarIdioma:()=>{L.alCambiarIdioma(),mn()}})}function Vu(a){mr=a,bf(e=>e?jv():ju())}function jv(){Yi(),Le=wf(mr),L.e=Le,xi="inspeccion",Wu();let a=En(Le);Vt.centrar(a.x,a.z),pn=Ef(Le,{consejo:Uf,alTerminar:()=>ju(Le)}),la("portada")}function ju(a=null){Yi(),za("consejo").hidden=!0,L.metaMini=null,L.tutorial=null,pn=null,Le=Va(Fa(mr)),a&&Af(a,Le),L.e=Le,xi="juego",Wu();let e=Ot(Le);Vt.centrar(e.x,e.z+4),la("juego"),(!Lf()||a)&&(pn=If(Le,{consejo:Uf,alTerminar:()=>{pn=null}})),Mo()}function Wv(){let a=Bf();if(!a)return;try{Le=Va(Fo(a))}catch{Xu(),mn();return}Yi(),L.e=Le,xi="juego",mr=Le.dificultad,Wu();let e=Ot(Le)||En(Le);e&&Vt.centrar(e.x,e.z+4),la("juego")}function Wu(){Vt.modoPortada(!1),za("hud").hidden=!1,za("objetivos").hidden=!0,Jm(),_t(null),L.grupos={},zl(),Nl(),Oi()}function Uf(a){let e=za("consejo");e.innerHTML=a,e.hidden=!1}function Of(){if(!(!Le||xi==="final")){if(Le.pausa){Le.pausa=!1,Yi();return}Le.pausa=!0,qu()}}function qu(){!Le||xi==="final"||(Le.pausa=!0,zu({reanudar:()=>{Le.pausa=!1},guardarSalir:()=>{Le.pausa=!1,xi==="juego"&&Mo(),mn()},reiniciar:()=>{Xu(),Le=null,Yi(),Vu(mr)}}))}function Mo(){if(!(!Le||xi!=="juego"||Le.resultado))try{localStorage.setItem(Hu,Bo(Le))}catch{}}function Bf(){try{return localStorage.getItem(Hu)}catch{return null}}function Xu(){try{localStorage.removeItem(Hu)}catch{}}addEventListener("visibilitychange",()=>{document.hidden&&Mo()});addEventListener("pagehide",Mo);var Nf=performance.now(),Uu=0,Ou=0,Bu=0,Fu=0,ku=!1,qv=(a,e)=>{let t=Le.niebla,i=Math.floor((e+110)/t.celda)*t.ancho+Math.floor((a+110)/t.celda);return t.datos[i]===2},Xv=new URLSearchParams(location.search).get("bucle")==="temporizador",Ff=Xv?a=>setTimeout(()=>a(performance.now()),33):requestAnimationFrame;function kf(a){Ff(kf);let e=Math.min(.1,(a-Nf)/1e3);Nf=a;let t=a/1e3;if(!Le){Vt.sincronizar(Gu),Vt.render(e);return}if(L.bloqueado?Le.eventos=[]:gc(Le,e),Om(e),pn&&pn(t),Vt.sincronizar(Le),Vt.render(e),pf(Le,Vt.camara,qv),Uu-=e,Ou-=e,Bu-=e,Uu<=0){Uu=.2,bu(Le),Zm(Le),Su(Le),Tu(Le),Mu(Le);let i=!1;for(let r of Le.edificios.values())r.fuego>0&&Math.hypot(r.x-Vt.camara.x,r.z-Vt.camara.z)<30&&(i=!0);mf(Gi(Le),i),[...Le.enemigos.values()].some(r=>r.accion!=="huye"&&Math.hypot(r.x,r.z-2)<75)?Fu=12:Fu-=.2,xi==="juego"&&la(Fu>0?"batalla":"juego")}Ou<=0&&(Ou=.15,nf(Le,t)),rf(Vt.camara.giro),Bu<=0&&(Bu=30,Mo()),Le.decision&&!ku&&(ku=!0,Mf(Le,i=>Qo(Le,i),()=>{ku=!1})),Le.resultado&&xi==="juego"&&(xi="final",Xu(),la(Le.resultado.gano?"victoria":"derrota"),setTimeout(()=>Tf(Le,{otra:()=>{Yi(),Vu(mr)},portadaFn:mn,verCiudad:()=>{za("panel").hidden=!1}}),1800))}window.nehemias={get e(){return Le},S:ua,ui:L,vista:Vt,empezarPartida:ju,irPortada:mn};mn();Ff(kf);
/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
