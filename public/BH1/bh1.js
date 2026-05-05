const WC = {
  A: '#1a4a8a',
  B: '#0d5c40',
  C: '#7a3e08',
  D: '#8c2a18',
  E: '#42288a',
};

/* Occupancy status styles */
const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'             },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Single Occupied'    },
  double: { bg: 'var(--double)', b: 'var(--double-b)', t: 'var(--double-t)', lbl: 'Double Occupied'    },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Full (Triple)'      },
  maint:  { bg: 'var(--maint)',  b: 'var(--maint-b)',  t: 'var(--maint-t)', lbl: 'Maintenance/Blocked' },
};

/* Wing metadata shown in hover tooltip */
const WING_INFO = {
  A: { name: 'Wing A — Top Horizontal',  type: 'Two-Sitter', position: 'North Block' },
  B: { name: 'Wing B — Right Vertical',  type: 'Two-Sitter', position: 'East Block'  },
  C: { name: 'Wing C — Bottom Right',    type: 'Two-Sitter', position: 'South Block' },
  D: { name: 'Wing D — Bottom Left',     type: 'Two-Sitter', position: 'South Block' },
  E: { name: 'Wing E — Left Vertical',   type: 'Two-Sitter', position: 'West Block'  },
};

/* Reference to the hover-info bar */
const tipEl = document.getElementById('tip');


/* ══════════════════════════════════════════════════════════
   OCCUPANCY SEED FUNCTION
   Deterministic pseudo-random: same room always shows same
   status, but status varies meaningfully across rooms/floors.
══════════════════════════════════════════════════════════ */
function occ(floor, wing, num) {
  const h = (floor * 41 + wing.charCodeAt(0) * 23 + num * 13) % 100;
  if (h < 28) return 'vacant';
  if (h < 52) return 'single';
  if (h < 72) return 'double';
  if (h < 86) return 'full';
  return 'maint';
}


/* ══════════════════════════════════════════════════════════
   DOM FACTORY HELPERS
══════════════════════════════════════════════════════════ */
function mkDiv(inlineStyle, className) {
  const el = document.createElement('div');
  if (className)   el.className    = className;
  if (inlineStyle) el.style.cssText = inlineStyle;
  return el;
}

function mkRow(extraStyle) {
  return mkDiv('display:flex;flex-direction:row;gap:2px;align-items:center;' + (extraStyle || ''));
}

function mkCol(extraStyle) {
  return mkDiv('display:flex;flex-direction:column;gap:2px;' + (extraStyle || ''));
}


/* ══════════════════════════════════════════════════════════
   ROOM CELL
   wing  — letter 'A'–'E'
   floor — floor number 0–4
   num   — room number within wing (1-based)
   w, h  — pixel dimensions
══════════════════════════════════════════════════════════ */
function mkRoom(wing, floor, num, w, h) {
  w = w || 44;
  h = h || 23;

  const status   = occ(floor, wing, num);
  const st       = SS[status];
  const wi       = WING_INFO[wing] || { name: 'Wing ' + wing, type: 'Two-Sitter', position: '' };
  const roomCode = wing + floor + String(num).padStart(2, '0');  /* e.g. A101 */

  const el = mkDiv(
    'width:' + w + 'px;height:' + h + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  el.textContent = roomCode;

  /* Rich hover tooltip */
  el.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>' + roomCode + '</strong>'                       +
      ' &nbsp;·&nbsp; ' + st.lbl                               +
      ' &nbsp;·&nbsp; <strong>' + wi.name + '</strong>'        +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Room&nbsp;<strong>' + String(num).padStart(2,'0') + '</strong>' +
      ' &nbsp;·&nbsp; Type:&nbsp;<strong>' + wi.type + '</strong>' +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + wi.position + '</em>';
  };
  el.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };

  return el;
}


/* ══════════════════════════════════════════════════════════
   WASHROOM CELL
══════════════════════════════════════════════════════════ */
function mkWash(label, sub, w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'wash');
  const personIcon =
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>' +
      '<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>' +
    '</svg>';
  el.innerHTML =
    '<span>' + label + '</span>' +
    personIcon +
    '<span style="font-size:5.5px;opacity:.75">(' + sub + ')</span>';
  return el;
}


/* ══════════════════════════════════════════════════════════
   STAIRCASE CELL
══════════════════════════════════════════════════════════ */
function mkStair(w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'stair');
  el.textContent = 'STAIRCASE';
  return el;
}


/* ══════════════════════════════════════════════════════════
   WING LABEL HELPERS
══════════════════════════════════════════════════════════ */
/* Vertical side label (used for Wing E left / Wing B right) */
function mkSideLbl(letter, transform) {
  transform = transform || 'rotate(180deg)';
  const el = mkDiv('background:' + WC[letter] + ';transform:' + transform + ';', 'wing-side-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}

/* Horizontal header label (used for Wing A top) */
function mkTopLbl(letter) {
  const el = mkDiv('background:' + WC[letter] + ';', 'wing-hdr-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}


/* ══════════════════════════════════════════════════════════
   MAIN BUILD  — called every time the floor changes
══════════════════════════════════════════════════════════ */
function build(f) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  document.getElementById('floorSub').textContent =
    f === 0 ? 'Floor 0 (Ground Floor) Shown as Example' : 'Floor ' + f + ' Shown as Example';

  /* ── Cell dimensions ── */
  const RW  = 43, RH  = 22;   /* standard room (Wings A / C / D) */
  const MRW = 42, MRH = 21;   /* side-wing room (Wings B / E)    */
  const WW  = 56, WH  = 32;   /* washroom                        */
  const SW  = 56, SH  = 18;   /* staircase                       */

  /* ══════════════════════════════════
     WING A  — top horizontal band
     Layout: [WashA1][A01–A09][WashA2]
              [Stair ][A18–A10][Stair ]
  ══════════════════════════════════ */
  const wingA = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:5px 5px 3px;background:#eef2fa;' +
    'border:1.5px solid var(--line);border-radius:2px;margin-bottom:2px;'
  );
  wingA.appendChild(mkTopLbl('A'));

  /* Row 1 */
  const aRow1 = mkRow();
  aRow1.appendChild(mkWash('WASHROOM', 'A1', WW, WH));
  for (let i = 1; i <= 9; i++) aRow1.appendChild(mkRoom('A', f, i, RW, RH));
  aRow1.appendChild(mkWash('WASHROOM', 'A2', WW, WH));
  wingA.appendChild(aRow1);

  /* Row 2 — reversed numbering */
  const aRow2 = mkRow('margin-top:2px;');
  aRow2.appendChild(mkStair(WW, SH));
  for (let i = 18; i >= 10; i--) aRow2.appendChild(mkRoom('A', f, i, RW, RH));
  aRow2.appendChild(mkStair(WW, SH));
  wingA.appendChild(aRow2);

  bp.appendChild(wingA);


  /* ══════════════════════════════════
     MIDDLE ROW
     [E-label][Wing E][Courtyard][Wing B][B-label]
  ══════════════════════════════════ */
  const midRow = mkRow('gap:0;align-items:stretch;margin-bottom:2px;');

  /* ── Wing E left label ── */
  const eLblWrap = mkDiv(
    'display:flex;align-items:center;' +
    'background:#f0eef8;border:1.5px solid var(--line);' +
    'border-right:none;border-radius:2px 0 0 2px;padding:0 3px;'
  );
  eLblWrap.appendChild(mkSideLbl('E', 'rotate(180deg)'));
  midRow.appendChild(eLblWrap);

  /* ── Wing E rooms ── */
  const wE = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#f0eef8;' +
    'border:1.5px solid var(--line);border-left:none;border-right:none;'
  );
  wE.appendChild(mkWash('WASHROOM', 'E1', 94, WH));

  const eCols = mkRow('gap:2px;margin-top:2px;');
  /* Left column (outer):  E09 top → E01 bottom */
  const eColL = mkCol();
  for (let i = 9; i >= 1; i--) eColL.appendChild(mkRoom('E', f, i, MRW, MRH));
  /* Right column (inner): E10 top → E18 bottom */
  const eColR = mkCol();
  for (let i = 10; i <= 18; i++) eColR.appendChild(mkRoom('E', f, i, MRW, MRH));
  eCols.appendChild(eColL);
  eCols.appendChild(eColR);
  wE.appendChild(eCols);

  const eBotWash = mkDiv('display:flex;flex-direction:column;gap:2px;margin-top:2px;align-items:center;');
  eBotWash.appendChild(mkWash('WASHROOM', 'E2', 94, WH));
  eBotWash.appendChild(mkStair(94, SH));
  wE.appendChild(eBotWash);
  midRow.appendChild(wE);

  /* ── Central courtyard column ── */
  const ctCol = mkDiv(
    'flex:1;display:flex;flex-direction:column;gap:2px;' +
    'border:1.5px solid var(--line);background:var(--paper);'
  );

  const ctTop = mkRow('justify-content:space-between;padding:3px 3px 0;');
  ctTop.appendChild(mkStair(72, SH));
  ctTop.appendChild(mkStair(72, SH));
  ctCol.appendChild(ctTop);

  const courtyard = mkDiv('flex:1;min-height:140px;margin:2px 4px;', 'courtyard');
  courtyard.innerHTML =
    '<div class="ct-title">CENTRAL COURTYARD</div>' +
    '<div class="ct-sub">(OPEN TO SKY)</div>';
  ctCol.appendChild(courtyard);

  const ctBot = mkRow('justify-content:space-between;padding:0 3px 3px;');
  ctBot.appendChild(mkStair(72, SH));
  ctBot.appendChild(mkStair(72, SH));
  ctCol.appendChild(ctBot);

  midRow.appendChild(ctCol);

  /* ── Wing B rooms ── */
  const wB = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#eaf6f2;' +
    'border:1.5px solid var(--line);border-left:none;border-right:none;'
  );
  wB.appendChild(mkWash('WASHROOM', 'B1', 94, WH));

  const bCols = mkRow('gap:2px;margin-top:2px;');
  /* Left column (inner):  B01–B09 top → bottom */
  const bColL = mkCol();
  for (let i = 1; i <= 9; i++) bColL.appendChild(mkRoom('B', f, i, MRW, MRH));
  /* Right column (outer): B10–B18 top → bottom */
  const bColR = mkCol();
  for (let i = 10; i <= 18; i++) bColR.appendChild(mkRoom('B', f, i, MRW, MRH));
  bCols.appendChild(bColL);
  bCols.appendChild(bColR);
  wB.appendChild(bCols);

  const bBotWash = mkDiv('display:flex;flex-direction:column;gap:2px;margin-top:2px;align-items:center;');
  bBotWash.appendChild(mkWash('WASHROOM', 'B2', 94, WH));
  bBotWash.appendChild(mkStair(94, SH));
  wB.appendChild(bBotWash);
  midRow.appendChild(wB);

  /* ── Wing B right label ── */
  const bLblWrap = mkDiv(
    'display:flex;align-items:center;' +
    'background:#eaf6f2;border:1.5px solid var(--line);' +
    'border-left:none;border-radius:0 2px 2px 0;padding:0 3px;'
  );
  bLblWrap.appendChild(mkSideLbl('B', 'rotate(0deg)'));
  midRow.appendChild(bLblWrap);

  bp.appendChild(midRow);


  /* ══════════════════════════════════
     BOTTOM ROW
     [spacer][Wing D][gap=court width][Wing C][spacer]
  ══════════════════════════════════ */
  const botRow = mkRow('gap:0;align-items:stretch;');

  /* Spacer matching E-label width */
  botRow.appendChild(mkDiv('min-width:28px;'));

  /* ── Wing D ── */
  const wD = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#f8edea;border:1.5px solid var(--line);'
  );
  /* Header: Washroom D2 + Staircase */
  const dHead = mkRow('gap:3px;margin-bottom:2px;');
  dHead.appendChild(mkWash('WASHROOM', 'D2', WW, WH));
  dHead.appendChild(mkStair(SW, SH));
  wD.appendChild(dHead);
  /* Row 1: D09 → D01 */
  const dR1 = mkRow();
  for (let i = 9; i >= 1; i--) dR1.appendChild(mkRoom('D', f, i, RW, RH));
  wD.appendChild(dR1);
  /* Row 2: D18 → D10 */
  const dR2 = mkRow('margin-top:2px;');
  for (let i = 18; i >= 10; i--) dR2.appendChild(mkRoom('D', f, i, RW, RH));
  wD.appendChild(dR2);
  botRow.appendChild(wD);

  /* Gap beneath the courtyard column */
  botRow.appendChild(mkDiv('flex:1;'));

  /* ── Wing C ── */
  const wC = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#fbf5ea;border:1.5px solid var(--line);'
  );
  /* Header: Staircase + Washroom C1 */
  const cHead = mkRow('gap:3px;margin-bottom:2px;');
  cHead.appendChild(mkStair(SW, SH));
  cHead.appendChild(mkWash('WASHROOM', 'C1', WW, WH));
  wC.appendChild(cHead);
  /* Row 1: C01–C09 */
  const cR1 = mkRow();
  for (let i = 1; i <= 9; i++) cR1.appendChild(mkRoom('C', f, i, RW, RH));
  wC.appendChild(cR1);
  /* Row 2: C10–C18 */
  const cR2 = mkRow('margin-top:2px;');
  for (let i = 10; i <= 18; i++) cR2.appendChild(mkRoom('C', f, i, RW, RH));
  wC.appendChild(cR2);
  botRow.appendChild(wC);

  /* Spacer matching B-label width */
  botRow.appendChild(mkDiv('min-width:28px;'));

  bp.appendChild(botRow);


  /* ── Wing D / C bottom text labels ── */
  const lblRow = mkRow('justify-content:space-around;margin-top:8px;');

  const lD = mkDiv('font-size:12px;font-weight:700;letter-spacing:2px;color:' + WC.D + ';text-align:center;flex:1;');
  lD.textContent = 'WING D';
  const lC = mkDiv('font-size:12px;font-weight:700;letter-spacing:2px;color:' + WC.C + ';text-align:center;flex:1;');
  lC.textContent = 'WING C';
  lblRow.appendChild(lD);
  lblRow.appendChild(lC);
  bp.appendChild(lblRow);


  /* ══════════════════════════════════
     FOOTER — stats + notes
  ══════════════════════════════════ */
  const footer = mkRow(
    'justify-content:space-between;align-items:flex-start;' +
    'margin-top:12px;border-top:1px solid var(--court-b);' +
    'padding-top:8px;gap:8px;flex-wrap:wrap;'
  );

  const stats = mkDiv(null, 'stats-box');
  stats.innerHTML =
    '<strong>Total Wings: 5 &nbsp;(A, B, C, D, E)</strong><br>' +
    'Rooms per Wing: 18 &nbsp;|&nbsp; Floors: 0–4<br>' +
    'Room Code: [Wing][Floor][Room No.]<br>' +
    '<em style="font-size:8px;opacity:.7">' +
      'e.g. A101 = Wing A · Floor 1 · Room 01' +
    '</em>';
  footer.appendChild(stats);

  const note = mkDiv(null, 'note-box');
  note.innerHTML =
    '<strong>NOTE:</strong><br>' +
    'All rooms are Two-Sitter capacity<br>' +
    'Each wing has 2 independent washrooms<br>' +
    'Staircases are located beside washrooms<br>' +
    'Room numbers restart from 01 each floor';
  footer.appendChild(note);

  bp.appendChild(footer);
}


/* ══════════════════════════════════════════════════════════
   FLOOR SELECTOR
══════════════════════════════════════════════════════════ */
const selEl = document.getElementById('floorSel');

for (let i = 0; i <= 4; i++) {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 0 ? ' active' : '');
  btn.textContent = i === 0 ? 'Floor 0 (GF)' : 'Floor ' + i;
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    build(i);
  };
  selEl.appendChild(btn);
}

/* Initial render */
build(0);