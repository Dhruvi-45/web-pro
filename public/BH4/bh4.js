const RW = 52, RH = 46, WS = 52, GAP = 2;

const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'          },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Single Occupied' },
  double: { bg: 'var(--double)', b: 'var(--double-b)', t: 'var(--double-t)', lbl: 'Double Occupied' },
};

const TOWER_COLOR = { A: '#1a4a8a', B: '#0d5c40' };
const TOWER_BG    = { A: '#eef4fd', B: '#edf8f4' };

const tipEl = document.getElementById('tip');

/* ══════════════════════════════════════════════════════════
   ROOM NUMBER LOGIC
   Floor 0 → 001–020 (A001–A020, B001–B020)
   Floor 1 → 101–120 (A101–A120, B101–B120)
   Floor 2 → 201–220 (A201–A220, B201–B220)
   ...and so on
══════════════════════════════════════════════════════════ */
function getRoomLabel(tower, floor, n) {
  const base = floor * 100 + n;          // e.g. floor=1, n=7 → 107
  return tower + String(base).padStart(3, '0');  // e.g. A107
}

/* ══════════════════════════════════════════════════════════
   SEEDED RANDOM & OCCUPANCY
══════════════════════════════════════════════════════════ */
function seededRand(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 4294967296;
  };
}

function getRoomStatus(rand) {
  const r = rand();
  if (r < 0.30) return 'vacant';
  if (r < 0.65) return 'single';
  return 'double';
}

function buildStatuses(floor, tower) {
  const rand = seededRand((tower === 'A' ? 1 : 7) * (floor + 1) * 31337);
  const map = {};
  for (let i = 1; i <= 20; i++) map[i] = getRoomStatus(rand);
  return map;
}

/* ══════════════════════════════════════════════════════════
   DOM HELPERS
══════════════════════════════════════════════════════════ */
function el(tag, style, cls) {
  const d = document.createElement(tag || 'div');
  if (cls)   d.className   = cls;
  if (style) d.style.cssText = style;
  return d;
}
function div(style, cls) { return el('div', style, cls); }
function row(extra) { return div('display:flex;flex-direction:row;gap:' + GAP + 'px;align-items:stretch;' + (extra||'')); }
function col(extra) { return div('display:flex;flex-direction:column;gap:' + GAP + 'px;' + (extra||'')); }
function spacer()   { return div('width:' + RW + 'px;height:' + RH + 'px;flex-shrink:0;'); }

/* ══════════════════════════════════════════════════════════
   WASHROOM CELL
══════════════════════════════════════════════════════════ */
function mkWash(sub) {
  const d = div('width:' + WS + 'px;height:' + RH + 'px;', 'wash');
  d.innerHTML =
    '<span>WR</span>' +
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none">' +
      '<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>' +
      '<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>' +
    '</svg>' +
    '<span style="font-size:5.5px;opacity:.75">(' + sub + ')</span>';
  return d;
}

/* ══════════════════════════════════════════════════════════
   ROOM CELL
══════════════════════════════════════════════════════════ */
function mkRoom(tower, floor, n, statuses) {
  const status = statuses[n];
  const st     = SS[status];
  const label  = getRoomLabel(tower, floor, n);

  const d = div(
    'width:' + RW + 'px;height:' + RH + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  d.textContent = label;

  d.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>Room ' + label + '</strong>' +
      ' &nbsp;·&nbsp; ' + st.lbl +
      ' &nbsp;·&nbsp; Tower&nbsp;<strong>' + tower + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; <em style="opacity:.7">Perimeter room</em>';
  };
  d.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };
  return d;
}

/* ══════════════════════════════════════════════════════════
   COURTYARD BOX
══════════════════════════════════════════════════════════ */
function mkCourtyard() {
  const cW = 5 * RW + 4 * GAP;
  const cH = 5 * RH + 4 * GAP;
  const d = div('width:' + cW + 'px;height:' + cH + 'px;', 'courtyard');
  const t = div(''); t.className = 'ct-title'; t.textContent = 'COURTYARD';
  const s = div(''); s.className = 'ct-sub';   s.textContent = '(Open to sky)';
  d.appendChild(t); d.appendChild(s);
  return d;
}

/* ══════════════════════════════════════════════════════════
   TOWER GRID
══════════════════════════════════════════════════════════ */
function mkTowerGrid(floor, tower, statuses) {
  const wrap = div('display:inline-flex;flex-direction:column;gap:' + GAP + 'px;');

  const room = (n) => mkRoom(tower, floor, n, statuses);

  // Row 0: WR-TL + 001–005 + spacer
  const r0 = row();
  r0.appendChild(mkWash('TL'));
  [1,2,3,4,5].forEach(n => r0.appendChild(room(n)));
  r0.appendChild(spacer());
  wrap.appendChild(r0);

  // Middle rows: left col (011–015) | courtyard | right col (006–010)
  const mid = row();
  const leftCol = col();
  [11,12,13,14,15].forEach(n => leftCol.appendChild(room(n)));
  mid.appendChild(leftCol);
  mid.appendChild(mkCourtyard());
  const rightCol = col();
  [6,7,8,9,10].forEach(n => rightCol.appendChild(room(n)));
  mid.appendChild(rightCol);
  wrap.appendChild(mid);

  // Row 6: spacer + 016–020 + WR-BR
  const r6 = row();
  r6.appendChild(spacer());
  [16,17,18,19,20].forEach(n => r6.appendChild(room(n)));
  r6.appendChild(mkWash('BR'));
  wrap.appendChild(r6);

  return wrap;
}

/* ══════════════════════════════════════════════════════════
   TOWER SIDE LABEL
══════════════════════════════════════════════════════════ */
function mkSideLbl(tower, side) {
  const wrap = div('', 'tower-side-lbl ' + side);
  const lbl  = div('background:' + TOWER_COLOR[tower] + ';transform:' + (side === 'left' ? 'rotate(180deg)' : 'rotate(0deg)') + ';', 'wing-lbl');
  lbl.textContent = 'TOWER ' + tower;
  wrap.appendChild(lbl);
  return wrap;
}

/* ══════════════════════════════════════════════════════════
   TOWER BLOCK (header + body)
══════════════════════════════════════════════════════════ */
function mkTowerBlock(floor, tower) {
  const isMess = (tower === 'A' && floor === 0);
  const block  = div('', 'tower-block');

  // Compute first & last room labels for this floor
  const firstNum = floor * 100 + 1;
  const lastNum  = floor * 100 + 20;
  const firstLbl = tower + String(firstNum).padStart(3, '0');
  const lastLbl  = tower + String(lastNum).padStart(3, '0');

  // Section header
  const hdr = div(
    'display:flex;align-items:center;gap:8px;padding:5px 8px 3px;' +
    'background:' + TOWER_BG[tower] + ';' +
    'border-bottom:0.5px solid var(--court-b);' +
    (tower === 'B' ? 'border-top:1px solid var(--court-b);' : '')
  );
  const hdrLabel = div('background:' + TOWER_COLOR[tower] + ';', 'section-hdr');
  hdrLabel.textContent = 'TOWER ' + tower;
  const hdrNote = div('font-size:9px;color:var(--muted);');
  hdrNote.textContent = isMess
    ? 'Mess / Dining Hall — Ground Floor'
    : 'Rooms ' + firstLbl + ' – ' + lastLbl + ' · 2 washrooms (perimeter layout)';
  hdr.appendChild(hdrLabel);
  hdr.appendChild(hdrNote);
  block.appendChild(hdr);

  // Body
  if (isMess) {
    const mess = div('', 'mess-block');
    const icon = div('', 'mess-icon'); icon.textContent = '🍽';
    const title = div('', 'mess-title'); title.textContent = 'MESS';
    const sub = div('', 'mess-sub'); sub.textContent = 'Ground Floor — Dining Hall';
    mess.appendChild(icon); mess.appendChild(title); mess.appendChild(sub);
    block.appendChild(mess);
  } else {
    const statuses = buildStatuses(floor, tower);
    const body = div('', 'tower-body');
    const inner = div(
      'background:' + TOWER_BG[tower] + ';',
      'tower-inner'
    );
    inner.appendChild(mkTowerGrid(floor, tower, statuses));
    body.appendChild(mkSideLbl(tower, 'left'));
    body.appendChild(inner);
    body.appendChild(mkSideLbl(tower, 'right'));
    block.appendChild(body);
  }

  return block;
}

/* ══════════════════════════════════════════════════════════
   CONNECTOR STRIP
══════════════════════════════════════════════════════════ */
function mkConnector() {
  const strip = div('', 'connector-strip');
  const door  = div('', 'connector-door');
  door.textContent = 'COMMON DOOR / WASHROOM';
  const note  = div('', 'connector-note');
  note.textContent = 'Connector between Tower A & Tower B';
  strip.appendChild(door);
  strip.appendChild(note);
  return strip;
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
function mkFooter(floor) {
  const firstA = 'A' + String(floor * 100 + 1).padStart(3, '0');
  const lastA  = 'A' + String(floor * 100 + 20).padStart(3, '0');
  const firstB = 'B' + String(floor * 100 + 1).padStart(3, '0');
  const lastB  = 'B' + String(floor * 100 + 20).padStart(3, '0');

  const towerARange = floor === 0 ? 'Mess / Dining Hall (Ground Floor)' : firstA + ' – ' + lastA;
  const towerBRange = firstB + ' – ' + lastB;

  const footer = div('', 'footer');

  const stats = div('', 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — Twin Tower Complex</strong><br>' +
    'Tower A: ' + towerARange + '<br>' +
    'Tower B: ' + towerBRange + '<br>' +
    '<em style="font-size:8px;opacity:.7">Room code: [Tower][3-digit number] e.g. A107, B215</em>';

  const note = div('', 'note-box');
  note.innerHTML =
    '<strong>NOTE:</strong><br>' +
    'Perimeter layout — rooms along outer edges<br>' +
    'Courtyard in centre (open to sky)<br>' +
    'Washrooms: top-left &amp; bottom-right corners<br>' +
    'Tower A — Ground Floor is Mess / Dining Hall';

  footer.appendChild(stats);
  footer.appendChild(note);
  return footer;
}

/* ══════════════════════════════════════════════════════════
   MAIN BUILD
══════════════════════════════════════════════════════════ */
function build(floor) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  document.getElementById('floorSub').textContent =
    floor === 0
      ? 'Floor 0 (Ground Floor) — Tower A: Mess · Tower B: Active'
      : 'Floor ' + floor + ' — Tower A: A' + String(floor*100+1).padStart(3,'0') + '–A' + String(floor*100+20).padStart(3,'0') +
        ' · Tower B: B' + String(floor*100+1).padStart(3,'0') + '–B' + String(floor*100+20).padStart(3,'0');

  bp.appendChild(mkTowerBlock(floor, 'A'));
  bp.appendChild(mkConnector());
  bp.appendChild(mkTowerBlock(floor, 'B'));
  bp.appendChild(mkFooter(floor));
}

/* ══════════════════════════════════════════════════════════
   FLOOR SELECTOR
══════════════════════════════════════════════════════════ */
const selEl = document.getElementById('floorSel');
const FLOOR_LABELS = ['Floor 0 (GF)', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6'];

FLOOR_LABELS.forEach((lbl, i) => {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 0 ? ' active' : '');
  btn.textContent = lbl;
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    build(i);
  };
  selEl.appendChild(btn);
});

build(0);