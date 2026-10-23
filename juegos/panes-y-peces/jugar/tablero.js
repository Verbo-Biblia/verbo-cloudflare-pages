// Lógica del tablero de «combina 3» (sin pantalla: se prueba en node con pruebas/bot.mjs).
// La pantalla (juego.js) le pide jugadas y recibe «fases» que solo tiene que animar.
//
// Mapa de un nivel (una cadena por fila):
//   '.' casilla normal · '#' hueco · 'c' / 'C' capa de 1 / 2 golpes (debajo de la pieza)
//   'p' / 'P' bloque de 1 / 2 golpes (ocupa la casilla; se rompe con combinaciones al lado o explosiones)
// Piezas: tipo 0..n-1 (las del tema), 'E' estrella (especial de 5), 'K' cesta (se baja hasta el fondo).
// Especiales de una pieza normal: 'fila', 'columna', 'bomba'.

export function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clave = (r, c) => r * 100 + c;
const deClave = k => [Math.floor(k / 100), k % 100];

export class Tablero {
  constructor(nivel, azar = Math.random) {
    this.nivel = nivel;
    this.azar = azar;
    this.filas = nivel.mapa.length;
    this.cols = nivel.mapa[0].length;
    this.tipos = nivel.tipos;
    this.movs = nivel.movimientos;
    this.puntos = 0;
    this.recogidas = {};
    this.cestasBajadas = 0;
    this.cestasPorSalir = 0;
    this.sigId = 1;
    const bajar = nivel.objetivos.find(o => o.tipo === 'bajar');
    this.cestasPorSalir = bajar ? bajar.n : 0;
    this.cestasALaVez = nivel.cestasALaVez || 2;

    this.celdas = nivel.mapa.map(fila => [...fila].map(ch => ({
      activa: ch !== '#',
      capa: ch === 'c' ? 1 : ch === 'C' ? 2 : 0,
      bloque: ch === 'p' ? 1 : ch === 'P' ? 2 : 0,
      pieza: null,
    })));
    this.llenarSinGrupos();
    // Las primeras cestas salen arriba desde el comienzo.
    const arriba = [];
    for (let c = 0; c < this.cols; c++) {
      const r = this.celdas.findIndex(f => f[c].activa);
      if (r >= 0 && !this.celdas[r][c].bloque) arriba.push([r, c]);
    }
    for (let i = 0; i < Math.min(this.cestasALaVez, this.cestasPorSalir) && arriba.length; i++) {
      const [r, c] = arriba.splice(Math.floor(this.azar() * arriba.length), 1)[0];
      this.celdas[r][c].pieza = this.nuevaPieza('K');
      this.cestasPorSalir--;
    }
    if (!this.hayMovimiento()) this.mezclarEstado();
  }

  // ---------- ayudas ----------
  celda(r, c) { return r >= 0 && r < this.filas && c >= 0 && c < this.cols ? this.celdas[r][c] : null; }
  pieza(r, c) { return this.celda(r, c)?.pieza || null; }
  nuevaPieza(tipo, esp = null) { return { id: this.sigId++, tipo, esp }; }
  tipoAzar() { return Math.floor(this.azar() * this.tipos); }
  cestasEnTablero() { let n = 0; this.recorrer((r, c, cel) => { if (cel.pieza?.tipo === 'K') n++; }); return n; }
  recorrer(fn) { for (let r = 0; r < this.filas; r++) for (let c = 0; c < this.cols; c++) fn(r, c, this.celdas[r][c]); }
  // Tipo con el que una pieza combina (las especiales también; la estrella y la cesta no).
  color(r, c) { const p = this.pieza(r, c); return p && typeof p.tipo === 'number' ? p.tipo : -1; }

  llenarSinGrupos() {
    this.recorrer((r, c, cel) => {
      if (!cel.activa || cel.bloque) return;
      let t, intentos = 0;
      do { t = this.tipoAzar(); intentos++; } while (intentos < 30 && (
        (this.color(r, c - 1) === t && this.color(r, c - 2) === t) ||
        (this.color(r - 1, c) === t && this.color(r - 2, c) === t)));
      cel.pieza = this.nuevaPieza(t);
    });
  }

  // ---------- combinaciones ----------
  // Devuelve los grupos: { celdas: [[r,c]...], esp: null|'fila'|'columna'|'bomba'|'E' }
  grupos() {
    const corridas = [];
    for (let r = 0; r < this.filas; r++) {
      for (let c = 0; c < this.cols;) {
        const t = this.color(r, c); let n = 1;
        while (t >= 0 && this.color(r, c + n) === t) n++;
        if (t >= 0 && n >= 3) corridas.push({ h: true, celdas: Array.from({ length: n }, (_, i) => [r, c + i]) });
        c += n;
      }
    }
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.filas;) {
        const t = this.color(r, c); let n = 1;
        while (t >= 0 && this.color(r + n, c) === t) n++;
        if (t >= 0 && n >= 3) corridas.push({ h: false, celdas: Array.from({ length: n }, (_, i) => [r + i, c]) });
        r += n;
      }
    }
    // Las corridas que comparten una casilla forman un solo grupo (L o T).
    const padre = corridas.map((_, i) => i);
    const raiz = i => (padre[i] === i ? i : (padre[i] = raiz(padre[i])));
    const duenno = new Map();
    corridas.forEach((cor, i) => cor.celdas.forEach(([r, c]) => {
      const k = clave(r, c);
      if (duenno.has(k)) padre[raiz(i)] = raiz(duenno.get(k)); else duenno.set(k, i);
    }));
    const porRaiz = new Map();
    corridas.forEach((cor, i) => { const k = raiz(i); if (!porRaiz.has(k)) porRaiz.set(k, []); porRaiz.get(k).push(cor); });
    return [...porRaiz.values()].map(cors => {
      const set = new Map();
      cors.forEach(cor => cor.celdas.forEach(([r, c]) => set.set(clave(r, c), [r, c])));
      const larga = cors.reduce((a, b) => (b.celdas.length > a.celdas.length ? b : a));
      let esp = null;
      if (larga.celdas.length >= 5) esp = 'E';
      else if (cors.some(x => x.h) && cors.some(x => !x.h)) esp = 'bomba';
      else if (larga.celdas.length === 4) esp = larga.h ? 'fila' : 'columna';
      return { celdas: [...set.values()], esp, larga };
    });
  }

  // Casillas que barre un especial.
  alcance(esp, r, c, radio = 1) {
    const out = [];
    if (esp === 'fila') for (let x = 0; x < this.cols; x++) out.push([r, x]);
    else if (esp === 'columna') for (let y = 0; y < this.filas; y++) out.push([y, c]);
    else if (esp === 'bomba') {
      for (let y = r - radio; y <= r + radio; y++) for (let x = c - radio; x <= c + radio; x++) if (this.celda(y, x)) out.push([y, x]);
    }
    return out;
  }

  // ---------- una jugada ----------
  // a, b = [r, c]. Devuelve null si no vale; si vale, { fases } para animar.
  jugar(a, b) {
    const [ar, ac] = a, [br, bc] = b;
    if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1 || this.movs <= 0) return null;
    const ca = this.celda(ar, ac), cb = this.celda(br, bc);
    if (!ca?.pieza || !cb?.pieza || ca.bloque || cb.bloque) return null;
    const pa = ca.pieza, pb = cb.pieza;
    ca.pieza = pb; cb.pieza = pa;

    let inicial = null;
    if ((pa.tipo === 'E' || pb.tipo === 'E') && pa.tipo !== 'K' && pb.tipo !== 'K') inicial = this.comboEstrella(pa, pb, [br, bc]);
    else if (pa.esp && pb.esp) inicial = this.comboEspeciales(pa, pb, [br, bc]);
    if (!inicial && !this.grupos().length) { ca.pieza = pa; cb.pieza = pb; return null; }
    this.movs--;
    return { fases: this.cascada(inicial, [a, b]) };
  }

  comboEstrella(pa, pb, [r, c]) {
    const est = pa.tipo === 'E' ? pa : pb, otra = est === pa ? pb : pa;
    // La otra pieza, si es especial, estalla como las de su tipo que se transforman.
    const fase = { efectos: [{ tipo: 'estrella', r, c }], borrar: new Set(), activadas: new Set([est.id]), transformar: [] };
    const lugar = this.dondeEsta(est.id); fase.borrar.add(clave(...lugar));
    if (otra.tipo === 'E') {
      this.recorrer((y, x, cel) => { if (cel.activa) fase.borrar.add(clave(y, x)); });
      fase.activadas.add(otra.id);
      fase.efectos.push({ tipo: 'todo' });
      return fase;
    }
    fase.borrar.add(clave(...this.dondeEsta(otra.id)));
    const t = otra.tipo;
    this.recorrer((y, x, cel) => {
      const p = cel.pieza;
      if (!p || p.tipo !== t) return;
      if (otra.esp) {
        const esp = otra.esp === 'bomba' ? 'bomba' : (this.azar() < 0.5 ? 'fila' : 'columna');
        if (p !== otra) { p.esp = esp; fase.transformar.push({ id: p.id, esp }); }
      }
      fase.borrar.add(clave(y, x));
      fase.efectos.push({ tipo: 'rayo', de: [r, c], a: [y, x] });
    });
    return fase;
  }

  comboEspeciales(pa, pb, [r, c]) {
    const fase = { efectos: [], borrar: new Set(), activadas: new Set([pa.id, pb.id]), transformar: [] };
    const bombas = [pa, pb].filter(p => p.esp === 'bomba').length;
    let celdas;
    if (bombas === 2) { celdas = this.alcance('bomba', r, c, 2); fase.efectos.push({ tipo: 'bomba', r, c, radio: 2 }); }
    else if (bombas === 1) {
      celdas = [];
      for (let d = -1; d <= 1; d++) {
        celdas.push(...this.alcance('fila', r + d, c).filter(([y]) => y >= 0 && y < this.filas));
        celdas.push(...this.alcance('columna', r, c + d).filter(([, x]) => x >= 0 && x < this.cols));
        if (r + d >= 0 && r + d < this.filas) fase.efectos.push({ tipo: 'fila', r: r + d });
        if (c + d >= 0 && c + d < this.cols) fase.efectos.push({ tipo: 'columna', c: c + d });
      }
    } else {
      celdas = [...this.alcance('fila', r, c), ...this.alcance('columna', r, c)];
      fase.efectos.push({ tipo: 'fila', r }, { tipo: 'columna', c });
    }
    celdas.forEach(([y, x]) => fase.borrar.add(clave(y, x)));
    fase.borrar.add(clave(...this.dondeEsta(pa.id))); fase.borrar.add(clave(...this.dondeEsta(pb.id)));
    return fase;
  }

  dondeEsta(id) {
    for (let r = 0; r < this.filas; r++) for (let c = 0; c < this.cols; c++) if (this.celdas[r][c].pieza?.id === id) return [r, c];
    return null;
  }

  // Combina, rompe, hace caer y repite hasta que el tablero queda quieto. inicial = fase de un combo de especiales.
  cascada(inicial = null, intercambio = null) {
    const fases = [];
    let combo = 0;
    while (true) {
      const grupos = this.grupos();
      if (!grupos.length && !inicial) break;
      const fase = {
        efectos: inicial ? inicial.efectos : [], transformar: inicial ? inicial.transformar : [],
        borradas: [], nuevas: [], capas: [], bloques: [], cestas: [], caidas: [], puntos: 0, combo,
      };
      const borrar = inicial ? new Set(inicial.borrar) : new Set();
      const activadas = inicial ? new Set(inicial.activadas) : new Set();
      const vecinasDeGrupo = new Set();
      const nuevas = [];
      for (const g of grupos) {
        g.celdas.forEach(([r, c]) => {
          borrar.add(clave(r, c));
          for (const [dy, dx] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) vecinasDeGrupo.add(clave(r + dy, c + dx));
        });
        fase.puntos += 60 * (g.celdas.length - 2) * (combo + 1);
        if (g.esp) {
          let lugar = null;
          if (intercambio) lugar = intercambio.find(([r, c]) => g.celdas.some(([y, x]) => y === r && x === c));
          if (!lugar) {
            // En una L o T, la esquina donde se cruzan; si no, el medio de la corrida más larga.
            const cuenta = new Map();
            g.celdas.forEach(([r, c]) => {
              const n = g.celdas.filter(([y, x]) => y === r || x === c).length;
              cuenta.set(clave(r, c), n);
            });
            lugar = g.esp === 'bomba'
              ? deClave([...cuenta.entries()].sort((a, b) => b[1] - a[1])[0][0])
              : g.larga.celdas[Math.floor(g.larga.celdas.length / 2)];
          }
          const tipo = this.color(...lugar);
          nuevas.push({ r: lugar[0], c: lugar[1], tipo: g.esp === 'E' ? 'E' : tipo, esp: g.esp === 'E' ? null : g.esp });
          fase.puntos += g.esp === 'E' ? 300 : 120;
        }
      }
      // Los especiales que caen dentro de lo que se borra estallan (y pueden encadenarse).
      const cola = [...borrar];
      while (cola.length) {
        const k = cola.pop();
        const [r, c] = deClave(k);
        const p = this.pieza(r, c);
        if (!p || activadas.has(p.id)) continue;
        let celdas = [];
        if (p.esp) {
          activadas.add(p.id);
          celdas = this.alcance(p.esp, r, c);
          fase.efectos.push(p.esp === 'bomba' ? { tipo: 'bomba', r, c, radio: 1 } : p.esp === 'fila' ? { tipo: 'fila', r } : { tipo: 'columna', c });
        } else if (p.tipo === 'E') {
          activadas.add(p.id);
          const t = this.colorMasComun();
          this.recorrer((y, x, cel) => {
            if (cel.pieza?.tipo === t) { celdas.push([y, x]); fase.efectos.push({ tipo: 'rayo', de: [r, c], a: [y, x] }); }
          });
        }
        for (const [y, x] of celdas) {
          const kk = clave(y, x);
          if (!borrar.has(kk)) { borrar.add(kk); cola.push(kk); }
        }
      }
      // Borrar piezas, gastar capas y romper bloques.
      const bloquesGolpeados = new Set();
      for (const k of borrar) {
        const [r, c] = deClave(k);
        const cel = this.celda(r, c);
        if (!cel?.activa) continue;
        if (cel.bloque) { bloquesGolpeados.add(k); continue; }
        const p = cel.pieza;
        if (!p || p.tipo === 'K') continue;
        fase.borradas.push({ id: p.id, r, c, tipo: p.tipo });
        if (typeof p.tipo === 'number') this.recogidas[p.tipo] = (this.recogidas[p.tipo] || 0) + 1;
        if (!this.nuevaEn(nuevas, r, c)) fase.puntos += 20;
        cel.pieza = null;
        if (cel.capa) { cel.capa--; fase.capas.push({ r, c, capa: cel.capa }); fase.puntos += 40; }
      }
      for (const k of vecinasDeGrupo) bloquesGolpeados.add(k);
      for (const k of bloquesGolpeados) {
        const [r, c] = deClave(k);
        const cel = this.celda(r, c);
        if (cel?.bloque) { cel.bloque--; fase.bloques.push({ r, c, bloque: cel.bloque }); fase.puntos += 50; }
      }
      for (const n of nuevas) {
        const cel = this.celdas[n.r][n.c];
        if (cel.pieza) continue;
        cel.pieza = this.nuevaPieza(n.tipo, n.esp);
        fase.nuevas.push({ ...n, pieza: cel.pieza });
      }
      this.puntos += fase.puntos;
      this.caer(fase);
      fases.push(fase);
      inicial = null; intercambio = null; combo++;
      if (combo > 60) break; // seguro contra bucles
    }
    return fases;
  }

  nuevaEn(nuevas, r, c) { return nuevas.some(n => n.r === r && n.c === c); }

  colorMasComun() {
    const n = new Array(this.tipos).fill(0);
    this.recorrer((r, c) => { const t = this.color(r, c); if (t >= 0) n[t]++; });
    return n.indexOf(Math.max(...n));
  }

  // ---------- caída ----------
  // Arriba en la misma columna, saltando huecos ('#'); null si es el borde superior.
  arriba(r, c) { for (let y = r - 1; y >= 0; y--) if (this.celdas[y][c].activa) return y; return null; }
  abajo(r, c) { for (let y = r + 1; y < this.filas; y++) if (this.celdas[y][c].activa) return y; return null; }
  // ¿Le puede llegar algo desde arriba (pieza que cae o pieza nueva) sin que la tape un bloque?
  recibeDeArriba(r, c) {
    for (let y = this.arriba(r, c); y !== null; y = this.arriba(y, c)) {
      const cel = this.celdas[y][c];
      if (cel.bloque) return false;
      if (cel.pieza) return true;
    }
    return true;
  }

  caer(fase) {
    for (let vuelta = 0; vuelta < 80; vuelta++) {
      const pasos = [];
      for (let r = this.filas - 1; r >= 0; r--) {
        for (let c = 0; c < this.cols; c++) {
          const cel = this.celdas[r][c];
          if (!cel.activa || cel.bloque || cel.pieza) continue;
          const y = this.arriba(r, c);
          if (y === null) {
            cel.pieza = this.piezaQueSale();
            pasos.push({ id: cel.pieza.id, pieza: cel.pieza, a: [r, c], nueva: true });
            continue;
          }
          const sup = this.celdas[y][c];
          if (sup.pieza && !sup.bloque) {
            if (sup.pieza._movida === vuelta) continue;
            cel.pieza = sup.pieza; sup.pieza = null; cel.pieza._movida = vuelta;
            pasos.push({ id: cel.pieza.id, de: [y, c], a: [r, c] });
            continue;
          }
          if (this.recibeDeArriba(r, c)) continue;
          // Tapada por un bloque: entra en diagonal una pieza vecina que ya no puede bajar por su columna.
          for (const dx of [-1, 1]) {
            const x = c + dx, yy = r - 1;
            const v = this.celda(yy, x);
            if (!v?.activa || v.bloque || !v.pieza || v.pieza._movida === vuelta) continue;
            const deb = this.abajo(yy, x);
            const libreAbajo = deb !== null && !this.celdas[deb][x].bloque && !this.celdas[deb][x].pieza;
            if (libreAbajo) continue;
            cel.pieza = v.pieza; v.pieza = null; cel.pieza._movida = vuelta;
            pasos.push({ id: cel.pieza.id, de: [yy, x], a: [r, c] });
            break;
          }
        }
      }
      if (!pasos.length) {
        // ¿Alguna cesta llegó al fondo de su columna?
        const fuera = [];
        this.recorrer((r, c, cel) => {
          if (cel.pieza?.tipo === 'K' && this.abajo(r, c) === null) fuera.push({ id: cel.pieza.id, r, c });
        });
        if (!fuera.length) break;
        fuera.forEach(({ r, c }) => { this.celdas[r][c].pieza = null; this.cestasBajadas++; this.puntos += 500; fase.puntos += 500; });
        fase.cestas.push(...fuera);
        fase.caidas.push({ cestas: fuera });
        continue;
      }
      fase.caidas.push(pasos);
    }
    this.recorrer((r, c, cel) => { if (cel.pieza) delete cel.pieza._movida; });
  }

  piezaQueSale() {
    if (this.cestasPorSalir > 0 && this.cestasEnTablero() < this.cestasALaVez && this.azar() < 0.2) {
      this.cestasPorSalir--;
      return this.nuevaPieza('K');
    }
    return this.nuevaPieza(this.tipoAzar());
  }

  // ---------- jugadas posibles y mezcla ----------
  hayMovimiento() {
    for (let r = 0; r < this.filas; r++) for (let c = 0; c < this.cols; c++) {
      for (const [dr, dc] of [[0, 1], [1, 0]]) {
        const a = this.celda(r, c), b = this.celda(r + dr, c + dc);
        if (!a?.pieza || !b?.pieza || a.bloque || b.bloque) continue;
        const pa = a.pieza, pb = b.pieza;
        if ((pa.tipo === 'E' || pb.tipo === 'E') && pa.tipo !== 'K' && pb.tipo !== 'K') return [[r, c], [r + dr, c + dc]];
        if (pa.esp && pb.esp) return [[r, c], [r + dr, c + dc]];
        a.pieza = pb; b.pieza = pa;
        const hay = this.grupoEn(r, c) || this.grupoEn(r + dr, c + dc);
        a.pieza = pa; b.pieza = pb;
        if (hay) return [[r, c], [r + dr, c + dc]];
      }
    }
    return null;
  }

  grupoEn(r, c) {
    const t = this.color(r, c);
    if (t < 0) return false;
    let h = 1, v = 1;
    for (let x = c - 1; this.color(r, x) === t; x--) h++;
    for (let x = c + 1; this.color(r, x) === t; x++) h++;
    for (let y = r - 1; this.color(y, c) === t; y--) v++;
    for (let y = r + 1; this.color(y, c) === t; y++) v++;
    return h >= 3 || v >= 3;
  }

  // Reparte de nuevo las piezas normales (sin especiales ni cestas) hasta que no haya grupos y sí jugadas.
  mezclarEstado() {
    const lugares = [];
    this.recorrer((r, c, cel) => { if (cel.pieza && typeof cel.pieza.tipo === 'number' && !cel.pieza.esp) lugares.push([r, c]); });
    let piezas = lugares.map(([r, c]) => this.celdas[r][c].pieza);
    for (let intento = 0; intento < 300; intento++) {
      for (let i = piezas.length - 1; i > 0; i--) { const j = Math.floor(this.azar() * (i + 1)); [piezas[i], piezas[j]] = [piezas[j], piezas[i]]; }
      lugares.forEach(([r, c], i) => { this.celdas[r][c].pieza = piezas[i]; });
      if (!this.grupos().length && this.hayMovimiento()) return true;
      if (intento > 150) piezas.forEach(p => { p.tipo = this.tipoAzar(); });
    }
    return false;
  }

  mezclar() {
    this.mezclarEstado();
    const pasos = [];
    this.recorrer((r, c, cel) => { if (cel.pieza) pasos.push({ id: cel.pieza.id, a: [r, c], tipo: cel.pieza.tipo }); });
    return pasos;
  }

  // ---------- objetivos ----------
  progreso(o) {
    if (o.tipo === 'puntos') return Math.min(this.puntos, o.n);
    if (o.tipo === 'recoger') return Math.min(this.recogidas[o.pieza] || 0, o.n);
    if (o.tipo === 'bajar') return Math.min(this.cestasBajadas, o.n);
    let n = 0;
    this.recorrer((r, c, cel) => { if (o.tipo === 'capas' ? cel.capa : cel.bloque) n++; });
    return n; // capas / bloques: cuántos quedan
  }

  cumplido(o) {
    if (o.tipo === 'capas' || o.tipo === 'bloques') return this.progreso(o) === 0;
    return this.progreso(o) >= o.n;
  }

  estado() {
    if (this.nivel.objetivos.every(o => this.cumplido(o))) return 'ganado';
    return this.movs <= 0 ? 'perdido' : 'jugando';
  }

  estrellas() {
    const [, e2, e3] = this.nivel.estrellas;
    return this.puntos >= e3 ? 3 : this.puntos >= e2 ? 2 : 1;
  }

  // Al ganar, cada movimiento que sobra se vuelve un especial que estalla (premio de puntos).
  premioFinal() {
    const transformar = [], borrar = new Set();
    while (this.movs > 0) {
      const libres = [];
      this.recorrer((r, c, cel) => { if (cel.pieza && typeof cel.pieza.tipo === 'number' && !cel.pieza.esp) libres.push([r, c]); });
      this.movs--;
      if (!libres.length) continue;
      const [r, c] = libres[Math.floor(this.azar() * libres.length)];
      const p = this.celdas[r][c].pieza;
      p.esp = this.azar() < 0.5 ? 'fila' : 'columna';
      transformar.push({ id: p.id, esp: p.esp });
      borrar.add(clave(r, c));
    }
    // Las especiales que quedaron en el tablero también estallan.
    this.recorrer((r, c, cel) => { if (cel.pieza?.esp || cel.pieza?.tipo === 'E') borrar.add(clave(r, c)); });
    if (!borrar.size) return [];
    return this.cascada({ efectos: [], borrar, activadas: new Set(), transformar });
  }
}
