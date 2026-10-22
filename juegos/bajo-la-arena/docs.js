import { t } from './textos.js';
/* Documentos del expediente: el texto vive en cases.json y aquí se dibuja.
   Lo comparten el juego (app.js) y el editor (editor.js). */

export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

export function wrapText(text = '', maxChars, maxLines) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    if ((line + ' ' + word).trim().length > maxChars) { lines.push(line); line = word; }
    else line = (line + ' ' + word).trim();
  }
  if (line) lines.push(line);
  if (maxLines <= 0) return [];
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, ' …'); }
  return lines;
}

const svgLines = (lines, x, y, step, attrs = '') => lines.map((line, index) => `<text x="${x}" y="${y + index * step}" ${attrs}>${escapeHtml(line)}</text>`).join('');

function svgStamp(text, x, y, angle) {
  if (!text) return '';
  const width = text.length * 10.5 + 24;
  return `<g class="doc-stamp" transform="rotate(${angle} ${x} ${y})"><rect x="${x - width / 2}" y="${y - 17}" width="${width}" height="32" rx="3"/><text x="${x}" y="${y + 5}" text-anchor="middle">${escapeHtml(text)}</text></g>`;
}

export function docSvg(doc, fit = 'meet') {
  const open = (kind) => `<svg class="doc-svg doc-${kind}" viewBox="0 0 400 300" preserveAspectRatio="xMidYMin ${fit}" role="img">`;

  if (doc.kind === 'fax') {
    const body = wrapText(doc.body, 46, 7);
    return `${open('fax')}
      <rect class="paper" width="400" height="300"/>
      <text class="mono small" x="18" y="22">${escapeHtml(doc.header || '')}</text>
      <line class="rule dashed" x1="18" x2="382" y1="32" y2="32"/>
      <text class="mono heading" x="18" y="64">FAX</text>
      <text class="mono" x="18" y="88"><tspan class="dim">${t('doc.de')}</tspan> ${escapeHtml(doc.from || '')}</text>
      <text class="mono" x="18" y="106"><tspan class="dim">${t('doc.para')}</tspan> ${escapeHtml(doc.to || '')}</text>
      <line class="rule" x1="18" x2="382" y1="118" y2="118"/>
      ${svgLines(body, 18, 142, 19, 'class="mono"')}
      ${svgStamp(doc.stamp, 318, 64, -7)}
    </svg>`;
  }

  if (doc.kind === 'nota') {
    const body = wrapText(doc.body, 40, 9);
    const ruled = Array.from({ length: 12 }, (_, index) => `<line class="ruled" x1="0" x2="400" y1="${52 + index * 22}" y2="${52 + index * 22}"/>`).join('');
    return `${open('nota')}
      <rect class="paper" width="400" height="300"/>
      ${ruled}
      <line class="margin" x1="40" x2="40" y1="0" y2="300"/>
      <rect class="tape" x="160" y="-6" width="80" height="24" transform="rotate(-3 200 6)"/>
      <text class="hand heading" x="52" y="46">${escapeHtml(doc.header || '')}</text>
      ${svgLines(body, 52, 70, 22, 'class="hand"')}
      <text class="hand" x="372" y="${Math.min(290, 70 + body.length * 22 + 8)}" text-anchor="end">${escapeHtml(doc.footer || '')}</text>
    </svg>`;
  }

  if (doc.kind === 'atestado') {
    const fields = (doc.fields || []).slice(0, 4);
    const body = wrapText(doc.body, 44, 13);
    const cell = (label, value, x, y) => `<rect class="box" x="${x}" y="${y}" width="160" height="34"/><text class="mono tiny dim" x="${x + 6}" y="${y + 12}">${escapeHtml(label).toUpperCase()}</text><text class="mono cell-value" x="${x + 6}" y="${y + 28}">${escapeHtml(value)}</text>`;
    const footer = wrapText(doc.footer, 46, 2);
    return `<svg class="doc-svg doc-atestado" viewBox="0 0 360 500" preserveAspectRatio="xMidYMin ${fit}" role="img">
      <rect class="paper" width="360" height="500"/>
      <rect class="carbon" width="360" height="500"/>
      <circle class="seal" cx="36" cy="40" r="18"/><path class="seal" d="M36 26l4 9 10 1-8 6 3 10-9-6-9 6 3-10-8-6 10-1z"/>
      <text class="mono micro strong" x="62" y="34">${t('doc.institucion')}</text>
      <text class="mono micro" x="62" y="48">${t('doc.dependencia')}</text>
      <rect class="box" x="258" y="20" width="84" height="34"/>
      <text class="mono micro dim" x="264" y="32">${t('doc.numInforme')}</text>
      <text class="mono strong" x="264" y="48">${escapeHtml(doc.number || '')}</text>
      <text class="mono heading" x="180" y="92" text-anchor="middle" letter-spacing="6">${escapeHtml(doc.header || t('doc.informePolicial'))}</text>
      <text class="mono small dim" x="180" y="110" text-anchor="middle">${escapeHtml(doc.subtitle || '')}</text>
      ${fields.map(([label, value], index) => cell(label, value, 18 + (index % 2) * 164, 122 + Math.floor(index / 2) * 38)).join('')}
      <text class="mono tiny strong" x="18" y="218">${t('doc.exposicion')}</text>
      ${svgLines(body, 18, 238, 15.5, 'class="mono body-small"')}
      <line class="rule" x1="18" x2="342" y1="${238 + body.length * 15.5}" y2="${238 + body.length * 15.5}"/>
      ${svgLines(footer, 18, 238 + body.length * 15.5 + 18, 14, 'class="mono tiny"')}
      ${doc.annotation ? `<g class="annotation" transform="rotate(-4 20 ${268 + body.length * 15.5 + 40})"><text class="pen" x="20" y="${268 + body.length * 15.5 + 40}">${escapeHtml(doc.annotation)}</text><path d="M20 ${268 + body.length * 15.5 + 46}c50 4 110 2 160-2"/></g>` : ''}
      <path class="signature" d="M230 486c14-22 22-2 30-12s10-18 18-4 12 8 22-6 16 4 28-2"/>
      <text class="mono micro dim" x="18" y="492">Mod. 23-B · Imprenta Nacional</text>
      ${svgStamp(doc.stamp, 270, 452, -9)}
    </svg>`;
  }

  if (doc.kind === 'periodico') {
    const headline = wrapText(doc.headline, 22, 3);
    const hasPhoto = Boolean(doc.caption);
    const bodyTop = 150 + headline.length * 28 + (hasPhoto ? 96 : 0);
    const perColumn = Math.max(0, Math.floor((462 - bodyTop) / 13));
    const words = wrapText(doc.body, 25, perColumn * 2);
    const edge = Array.from({ length: 19 }, (_, index) => `${index * 20},${index % 2 ? 474 : 468}`).join(' ');
    return `<svg class="doc-svg doc-periodico" viewBox="0 0 360 480" preserveAspectRatio="xMidYMin ${fit}" role="img">
      <polygon class="paper" points="0,6 360,0 360,470 ${edge.split(' ').reverse().join(' ')} 0,470"/>
      <text class="masthead" x="180" y="48" text-anchor="middle">${escapeHtml(doc.header || '')}</text>
      <line class="rule" x1="16" x2="344" y1="60" y2="60"/><line class="rule" x1="16" x2="344" y1="63" y2="63"/>
      <text class="dateline" x="180" y="78" text-anchor="middle">${escapeHtml(doc.date || '')}</text>
      <line class="rule" x1="16" x2="344" y1="86" y2="86"/>
      <text class="section-name" x="16" y="108">${escapeHtml((doc.section || t('doc.sucesos')).toUpperCase())}</text>
      ${svgLines(headline, 16, 138, 28, 'class="headline"')}
      ${hasPhoto ? `<rect class="halftone" x="16" y="${150 + headline.length * 28 - 14}" width="328" height="76"/><text class="caption" x="16" y="${150 + headline.length * 28 + 76}">${escapeHtml(doc.caption)}</text>` : ''}
      ${svgLines(words.slice(0, perColumn), 16, bodyTop, 13, 'class="column"')}
      ${svgLines(words.slice(perColumn), 186, bodyTop, 13, 'class="column"')}
      <line class="rule" x1="178" x2="178" y1="${bodyTop - 10}" y2="${bodyTop + perColumn * 13 - 8}"/>
    </svg>`;
  }

  if (doc.kind === 'contestador') {
    const entries = (doc.entries || []).slice(0, 4);
    let y = 108;
    const blocks = entries.map(([time, text], index) => {
      const lines = wrapText(text, 44, 3);
      const block = `<text class="mono small strong" x="22" y="${y}">${t('doc.mensaje')} ${index + 1} · ${escapeHtml(time)}</text>${svgLines(lines, 22, y + 18, 16, 'class="mono"')}`;
      y += 26 + lines.length * 16 + 8;
      return y > 296 ? '' : block;
    }).join('');
    return `${open('contestador')}
      <rect class="paper" width="400" height="300"/>
      <text class="mono small dim" x="22" y="28" letter-spacing="3">${t('doc.transcripcion')}</text>
      ${svgLines(wrapText(doc.header || t('doc.contestador'), 20, 2), 22, 52, 20, 'class="mono strong big"')}
      <line class="rule" x1="22" x2="270" y1="84" y2="84"/>
      <g class="cassette" transform="translate(292 16) rotate(4)">
        <rect width="90" height="58" rx="5"/><rect class="label" x="8" y="7" width="74" height="20" rx="2"/>
        <circle cx="28" cy="40" r="8"/><circle cx="62" cy="40" r="8"/>
        <text class="mono micro" x="45" y="21" text-anchor="middle">${escapeHtml(doc.tape || t('doc.caraA'))}</text>
      </g>
      ${blocks}
    </svg>`;
  }

  if (doc.kind === 'carta') {
    const body = wrapText(doc.body, 38, 8);
    return `${open('carta')}
      <rect class="paper" width="400" height="300"/>
      ${svgLines(body, 56, 78, 24, 'class="mono large"')}
      <text class="mono large" x="344" y="${Math.min(270, 78 + body.length * 24 + 22)}" text-anchor="end">${escapeHtml(doc.footer || '')}</text>
      ${svgStamp(doc.stamp, 290, 262, -6)}
    </svg>`;
  }

  if (doc.kind === 'ticket') {
    const fields = (doc.fields || []).slice(0, 6);
    const zigzag = Array.from({ length: 19 }, (_, index) => `${290 - index * 10},${index % 2 ? 292 : 286}`).join(' ');
    const bars = Array.from({ length: 40 }, (_, index) => `<rect class="bar" x="${126 + index * 3.7}" y="236" width="${index % 3 ? 1.5 : 2.6}" height="26"/>`).join('');
    return `${open('ticket')}
      <rect class="desk" width="400" height="300"/>
      <polygon class="paper" points="110,8 290,8 290,286 ${zigzag} 110,286"/>
      <text class="mono ticket-head" x="200" y="36" text-anchor="middle">${escapeHtml(doc.header || '')}</text>
      <text class="mono dim" x="200" y="54" text-anchor="middle">${t('doc.ticket')}</text>
      <line class="rule dashed" x1="124" x2="276" y1="64" y2="64"/>
      ${(() => { let row = 0; return fields.map(([label, value]) => { const wrap = label.length + value.length > 17; const y = 86 + row * 24; row += wrap ? 2 : 1; return `<text class="mono" x="124" y="${y}"><tspan class="dim">${escapeHtml(label).toUpperCase()}</tspan></text><text class="mono strong" x="276" y="${wrap ? y + 22 : y}" text-anchor="end">${escapeHtml(value)}</text>`; }).join(''); })()}
      ${bars}
      <text class="mono small dim" x="200" y="276" text-anchor="middle">${escapeHtml(doc.footer || '')}</text>
    </svg>`;
  }

  if (doc.kind === 'croquis') {
    const grid = Array.from({ length: 21 }, (_, index) => `<line class="grid" x1="${index * 20}" x2="${index * 20}" y1="0" y2="300"/><line class="grid" x1="0" x2="400" y1="${index * 20}" y2="${index * 20}"/>`).join('');
    const rooms = (doc.rooms || []).map(([label, x, y, w, h]) => `<rect class="room" x="${x}" y="${y}" width="${w}" height="${h}"/><text class="mono room-label" x="${x + 6}" y="${y + 16}">${escapeHtml(label)}</text>`).join('');
    const marks = (doc.marks || []).map(([mark, x, y]) => `<circle class="mark" cx="${x}" cy="${y}" r="10"/><text class="mono mark-text" x="${x}" y="${y + 4}" text-anchor="middle">${escapeHtml(mark)}</text>`).join('');
    const legend = (doc.marks || []).map(([mark, , , label], index) => `<text class="mono small" x="${24 + index * 120}" y="288"><tspan class="mark-label">${escapeHtml(mark)}</tspan> ${escapeHtml(label || '')}</text>`).join('');
    return `${open('croquis')}
      <rect class="paper" width="400" height="300"/>
      ${grid}
      <text class="mono small strong" x="24" y="26">${escapeHtml(doc.header || '')}</text>
      ${rooms}
      ${marks}
      ${legend}
    </svg>`;
  }

  const fields = (doc.fields || []).slice(0, 4);
  const list = (doc.list || []).slice(0, 8);
  const fieldsTop = 92;
  const listTop = fieldsTop + fields.length * 22 + (fields.length ? 4 : 0);
  const bodyTop = listTop + list.length * 19 + 16;
  const body = wrapText(doc.body, 46, Math.max(0, Math.floor((276 - bodyTop) / 19) + 1));
  const stampWidth = (doc.stamp || '').length * 10.5 + 24;
  return `${open('documento')}
    <rect class="paper" width="400" height="300"/>
    <text class="mono small dim" x="22" y="28" letter-spacing="3">${t('doc.archivo')}</text>
    <text class="mono heading" x="22" y="58">${escapeHtml(doc.header || '')}</text>
    <line class="rule" x1="22" x2="378" y1="70" y2="70"/>
    ${fields.map(([label, value], index) => `<text class="mono" x="22" y="${fieldsTop + index * 22}"><tspan class="dim">${escapeHtml(label).toUpperCase()}:</tspan> ${escapeHtml(value)}</text><line class="rule dotted" x1="22" x2="300" y1="${fieldsTop + 6 + index * 22}" y2="${fieldsTop + 6 + index * 22}"/>`).join('')}
    ${svgLines(list.map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item}`), 22, listTop + (fields.length ? 14 : 0), 19, 'class="mono"')}
    ${svgLines(body, 22, bodyTop, 19, 'class="mono"')}
    <path class="signature" d="M26 286c14-22 22-2 30-12s10-18 18-4 12 8 22-6 16 4 28-2"/>
    ${svgStamp(doc.stamp, Math.min(300, 392 - stampWidth / 2), 262, -7)}
  </svg>`;
}

/* Portada legible para fichas: papel en HTML que se adapta a cualquier tamaño.
   El documento completo (SVG) se ve al examinarlo. */
export function docCover(doc) {
  const kind = doc.kind || 'documento';
  const head = { fax: t('doc.fax'), carta: '', atestado: `${t('doc.informe')} ${doc.number || ''}`, croquis: doc.header, contestador: doc.header || t('doc.contestador') }[kind] ?? doc.header ?? '';
  let text = doc.thumb || doc.body || '';
  if (kind === 'atestado') text = doc.annotation || doc.body;
  if (kind === 'ticket') text = (doc.fields || []).map(([label, value]) => `${label} ${value}`).join(' · ');
  if (kind === 'croquis') text = (doc.marks || []).map(([mark, , , label]) => `${mark} · ${label}`).join('   ');
  if (kind === 'documento' && !doc.body && doc.list) text = doc.list.join(' · ');
  if (kind === 'periodico') text = doc.headline || '';
  if (kind === 'contestador') text = (doc.entries || []).map(([time, entry]) => `${time} — ${entry}`).join(' ');
  return `<div class="doc-cover cover-${kind}">${head ? `<b>${escapeHtml(head)}</b>` : ''}<span>${escapeHtml(text)}</span>${doc.stamp ? `<i>${escapeHtml(doc.stamp)}</i>` : ''}</div>`;
}

