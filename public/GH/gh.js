// ===== GLOBAL DATA FROM DB =====
let hostelData = null;
let currentFloor = 0;

// ===== FETCH DATA =====
async function loadHostel() {
  try {
    const res = await fetch('http://localhost:3000/api/hostels/GH');
    hostelData = await res.json();

    console.log("DB DATA:", hostelData);

    // rebuild AFTER data loads
    build(currentFloor);

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

const WC = {
  A: '#1a4a8a',
  B: '#0d5c40',
  C: '#7a3e08',
};

/* Occupancy status styles */
const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'            },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Partially Occupied' },
  double: { bg: 'var(--double)', b: 'var(--double-b)', t: 'var(--double-t)', lbl: 'Partially Occupied' },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Fully Occupied'     },
  triple: { bg: 'var(--triple)', b: 'var(--triple-b)', t: 'var(--triple-t)', lbl: 'Triple Room'        },
  maint:  { bg: 'var(--maint)',  b: 'var(--maint-b)',  t: 'var(--maint-t)', lbl: 'Under Maintenance'   },
};

/*
 * Room type metadata per wing key — shown in hover tooltip.
 */
const ROOM_META = {
  A:   { name: 'Wing A',                  cap: 'Double Room',  pos: 'A-Wing Left/Right Breadth'    },
  AM:  { name: 'Wing A — Middle',         cap: 'Double Room',  pos: 'A-Wing Centre Column'         },
  AT:  { name: 'Wing A — Top Row',        cap: 'Double Room',  pos: 'A-Wing Top Perimeter'         },
  ATR: { name: 'Wing A — Triple Room',    cap: 'Triple Room',  pos: 'A-Wing Bottom (Triple Block)' },
  B:   { name: 'Wing B — Side',           cap: 'Single Room',  pos: 'B-Wing Left & Right Side'     },
  BC:  { name: 'Wing B — Centre',         cap: 'Double Room',  pos: 'B-Wing Centre'                },
  BR:  { name: 'Wing B — Bottom Row',     cap: 'Single Room',  pos: 'Bottom Perimeter'             },
  C:   { name: 'Wing C',                  cap: 'Double Room',  pos: 'C-Wing Left & Right Breadth'  },
  CR:  { name: 'Wing C — Bottom Row',     cap: 'Single Room',  pos: 'C-Wing Bottom Perimeter'      },
};

/* Reference to the hover-info bar */
const tipEl = document.getElementById('tip');


function getRoomStatus(wing, floor, num) {
  if (!hostelData || !hostelData.floors) {
    return 'vacant'; // fallback if DB missing
  }

  const roomCode = wing + '-' + floor + String(num).padStart(2, '0');
  console.log("Looking for:", roomCode);
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return 'vacant';
  if (floorData) {
    console.log("Rooms:", floorData.rooms.map(r => r.roomNumber));
  }
  const room = floorData.rooms.find(r => r.roomNumber === roomCode);
  if (!room) return 'vacant';
  
  const count = room.students.length;
  const max = room.maxCapacity;

  if (count === 0) return 'vacant';
  if (count === max) return 'full';
  return 'double';
}
/* ══════════════════════════════════════════════════════════
   DOM FACTORY HELPERS
══════════════════════════════════════════════════════════ */
function mkDiv(inlineStyle, className) {
  const el = document.createElement('div');
  if (className)   el.className     = className;
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
   TRIPLE ROOM CELL  (fixed status = triple, A-Wing bottom)
   num     — room serial 1 or 2  →  code  AT[floor]1 / AT[floor]2
══════════════════════════════════════════════════════════ */
function mkTripleRoom(floor, num, w, h) {
  w = w || 90;
  h = h || 26;
  const st       = SS['triple'];
  const meta     = ROOM_META['ATR'];
  const roomCode = 'AT' + floor + String(num).padStart(2, '0');

  const el = mkDiv(
    'width:' + w + 'px;height:' + h + 'px;font-size:7.5px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';' +
    'border:1.5px solid;border-radius:2px;display:flex;align-items:center;' +
    'justify-content:center;font-weight:700;font-family:\'Courier New\',monospace;' +
    'cursor:default;user-select:none;letter-spacing:-.2px;flex-shrink:0;' +
    'transition:filter .1s,transform .1s;'
  );
  el.textContent = roomCode;

  el.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>' + roomCode + '</strong>'                                           +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>'               +
      ' &nbsp;·&nbsp; <strong>' + meta.name + '</strong>'                          +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>'                   +
      ' &nbsp;·&nbsp; Room&nbsp;<strong>' + String(num).padStart(2,'0') + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + meta.cap + '</strong>'            +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + meta.pos + '</em>';
  };
  el.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };

  return el;
}


/* ══════════════════════════════════════════════════════════
   STANDARD ROOM CELL
   wingPrefix — display prefix for the room code (e.g. 'A', 'B', 'C')
   seedChar   — single letter used for occ() seed ('A','B','C' etc.)
   floor      — floor index 0–4
   num        — room number within this wing/row (1-based)
   metaKey    — key into ROOM_META for tooltip display info
   w, h       — pixel dimensions
══════════════════════════════════════════════════════════ */
function mkRoom(wingPrefix, seedChar, floor, num, metaKey, w, h) {
  w = w || 40;
  h = h || 22;
  metaKey = metaKey || wingPrefix;

  const status = getRoomStatus(wingPrefix, floor, num);
  const st       = SS[status];
  const meta     = ROOM_META[metaKey] || { name: 'Wing ' + wingPrefix, cap: 'Double Room', pos: '' };
  /* Room code: [Wing][Floor][RoomNum two-digit] e.g. A101 */
  const roomCode = wingPrefix + '-' + floor + String(num).padStart(2, '0');
  const el = mkDiv(
    'width:' + w + 'px;height:' + h + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  el.textContent = roomCode;

  /* Rich hover tooltip */
  el.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>' + roomCode + '</strong>'                                         +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>'              +
      ' &nbsp;·&nbsp; <strong>' + meta.name + '</strong>'                        +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>'                 +
      ' &nbsp;·&nbsp; Room&nbsp;<strong>' + String(num).padStart(2,'0') + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + meta.cap + '</strong>'          +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + meta.pos + '</em>';
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
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none">' +
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
/* Vertical side label */
function mkSideLbl(letter, transform) {
  transform = transform || 'rotate(180deg)';
  const el = mkDiv('background:' + WC[letter] + ';transform:' + transform + ';', 'wing-side-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}

/* Inline section header badge */
function mkSectionHdr(text, color) {
  const el = mkDiv('background:' + (color || '#555') + ';', 'section-hdr');
  el.textContent = text;
  return el;
}

/* Plain text note */
function mkNote(text, style) {
  const el = mkDiv(style || 'font-size:9px;color:var(--muted);');
  el.textContent = text;
  return el;
}


/* ══════════════════════════════════════════════════════════
   LAYOUT CONSTANTS  (pixel dimensions)
══════════════════════════════════════════════════════════ */
const RW  = 40;   /* standard room width                   */
const RH  = 22;   /* standard room height                  */
const SRW = 34;   /* small room width  (B-wing one-sitter) */
const SRH = 20;   /* small room height (B-wing one-sitter) */
const WW  = 88;   /* washroom width                        */
const WH  = 22;   /* washroom height                       */


/* ══════════════════════════════════════════════════════════
   SECTION BUILDERS
══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────
   TOP EDGE ROW  (A-Wing top perimeter: A[floor]06 – A[floor]11)
   Numbered 06–11: continuation after left rooms A01–A05.
   Right rooms then continue as A12–A16.
   Layout: [WR corner] [A06–A11] [WR corner]
   6 Double Rooms + washrooms at both ends
────────────────────────────────────────────── */
function buildTopRow(floor, bp) {
  const wrap = mkRow('justify-content:center;padding:6px 8px 4px;border-bottom:1px solid var(--court-b);gap:4px;');
  wrap.appendChild(mkWash('WR', 'Top-Left', WH, WH));

  const roomsWrap = mkRow('gap:2px;');
  for (let i = 6; i <= 11; i++) {
    roomsWrap.appendChild(mkRoom('A', 'A', floor, i, 'AT', RW, RH));
  }
  wrap.appendChild(roomsWrap);
  wrap.appendChild(mkWash('WR', 'Top-Right', WH, WH));
  bp.appendChild(wrap);

  const lbl = mkDiv('text-align:center;font-size:9px;color:var(--muted);padding:2px 0;letter-spacing:.5px;border-bottom:1px solid var(--court-b);');
  lbl.textContent = 'A-Wing Top Row: 6 rooms [A' + floor + '06–A' + floor + '11] + Corner Washrooms';
  bp.appendChild(lbl);
}


/* ──────────────────────────────────────────────
   A-WING
   Left=A01–A05, Right=A12–A16 (continuation after top row 06–11)
   Top row=A06–A11 (continuation after left 01–05)
   Triple Rooms AT[f]01–AT[f]02 inside corridor, bottom-right
────────────────────────────────────────────── */
function buildAWing(floor, bp) {
  const hdr = mkDiv(
    'display:flex;align-items:center;gap:8px;' +
    'padding:5px 8px 3px;background:#eef4fd;' +
    'border-bottom:0.5px solid var(--court-b);'
  );
  hdr.appendChild(mkSectionHdr('A-WING', WC.A));
  hdr.appendChild(mkNote(
    'Left A' + floor + '01–A' + floor + '05  ·  Right A' + floor + '12–A' + floor + '16  ·  2 Triple Rooms in corridor'
  ));
  bp.appendChild(hdr);

  const body = mkRow('gap:0;align-items:stretch;');

  /* Left wing label */
  const leftLblWrap = mkDiv(
    'display:flex;align-items:center;background:#eef4fd;' +
    'border:1.5px solid var(--line);border-right:none;' +
    'border-radius:2px 0 0 2px;padding:0 3px;'
  );
  leftLblWrap.appendChild(mkSideLbl('A', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  /* Left rooms — A01–A05 */
  const leftRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#eef4fd;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 1; i <= 5; i++) {
    leftRooms.appendChild(mkRoom('A', 'A', floor, i, 'A', RW, RH));
  }
  body.appendChild(leftRooms);

  /* Centre — open courtyard corridor with triple rooms at bottom-right */
  const corridor = mkDiv(
    'flex:1;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:flex-start;gap:4px;padding:8px 6px 10px;' +
    'border:1.5px solid var(--line);min-height:150px;position:relative;',
    'courtyard'
  );
  corridor.style.margin = '0';

  const cLbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--muted);margin-top:4px;');
  cLbl.textContent = 'A-WING CORRIDOR';
  const cSub = mkDiv('font-size:8px;color:var(--muted);opacity:.7;');
  cSub.textContent = '(OPEN CORRIDOR)';
  corridor.appendChild(cLbl);
  corridor.appendChild(cSub);

  /* Triple rooms absolutely positioned at bottom-right of corridor */
  const tripleWrap = mkDiv(
    'position:absolute;bottom:8px;right:8px;' +
    'display:flex;flex-direction:column;align-items:flex-end;gap:4px;'
  );
  const tripleRow = mkRow('gap:6px;');
  tripleRow.appendChild(mkTripleRoom(floor, 1));
  tripleRow.appendChild(mkTripleRoom(floor, 2));
  tripleWrap.appendChild(tripleRow);
  const tNote = mkDiv('font-size:8px;color:var(--triple-b);font-weight:700;opacity:.9;');
  tNote.textContent = '2 Triple Rooms · 3 beds each';
  tripleWrap.appendChild(tNote);
  corridor.appendChild(tripleWrap);

  body.appendChild(corridor);

  /* Right rooms — A12–A16 (continuation after top row A06–A11) */
  const rightRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#eef4fd;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 12; i <= 16; i++) {
    rightRooms.appendChild(mkRoom('A', 'A', floor, i, 'A', RW, RH));
  }
  body.appendChild(rightRooms);

  /* Right wing label */
  const rightLblWrap = mkDiv(
    'display:flex;align-items:center;background:#eef4fd;' +
    'border:1.5px solid var(--line);border-left:none;' +
    'border-radius:0 2px 2px 0;padding:0 3px;'
  );
  rightLblWrap.appendChild(mkSideLbl('A', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}


/* ──────────────────────────────────────────────
   A–B DIVIDER STRIP
   Simple visual separator between wings A & B + washroom
────────────────────────────────────────────── */
function buildABConnector(floor, bp) {
  const wrap = mkDiv(
    'display:flex;align-items:center;gap:6px;padding:5px 10px;' +
    'justify-content:center;' +
    'border-top:1px solid var(--court-b);border-bottom:1px solid var(--court-b);' +
    'background:#f6f3ee;'
  );

  wrap.appendChild(mkWash('WASHROOM', 'A–B Link', 130, WH));
  wrap.appendChild(mkNote('Shared washroom between Wing A and Wing B', 'font-size:8.5px;color:var(--muted);white-space:nowrap;'));
  bp.appendChild(wrap);
}


/* ──────────────────────────────────────────────
   B-WING
   Layout: [WING B label] [B01–B05 one-sitters] [CENTRE: B11–B17 two-sitters] [B06–B10 one-sitters] [WING B label]
   5 One-Sitters each side + 7 Two-Sitters across the centre
────────────────────────────────────────────── */
function buildBWing(floor, bp) {
  /* Section header bar */
  const hdr = mkDiv(
    'display:flex;align-items:center;gap:8px;' +
    'padding:5px 8px 3px;background:#edf8f4;' +
    'border-bottom:0.5px solid var(--court-b);border-top:1px solid var(--court-b);'
  );
  hdr.appendChild(mkSectionHdr('B-WING', WC.B));
  hdr.appendChild(mkNote('Left B' + floor + '01–B' + floor + '05  ·  Centre B' + floor + '06–B' + floor + '12  ·  Right B' + floor + '13–B' + floor + '17'));
  bp.appendChild(hdr);

  /* Body row */
  const body = mkRow('gap:0;align-items:stretch;');

  /* Left wing label */
  const leftLblWrap = mkDiv(
    'display:flex;align-items:center;background:#edf8f4;' +
    'border:1.5px solid var(--line);border-right:none;' +
    'border-radius:2px 0 0 2px;padding:0 3px;'
  );
  leftLblWrap.appendChild(mkSideLbl('B', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  /* Left One-Sitter rooms (B01–B05) */
  const leftRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#edf8f4;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 1; i <= 5; i++) {
    leftRooms.appendChild(mkRoom('B', 'B', floor, i, 'B', SRW, SRH));
  }
  body.appendChild(leftRooms);

  /* Centre — 7 Two-Sitter rooms (B06–B12, continuation after left 01–05) */
  const centre = mkDiv(
    'flex:1;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;gap:4px;padding:8px 6px;' +
    'border:1.5px solid var(--line);background:var(--paper);'
  );
  const cLbl = mkDiv('font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);');
  cLbl.textContent = 'B-WING CENTRE';
  centre.appendChild(cLbl);

  const cRooms = mkRow('gap:2px;flex-wrap:wrap;justify-content:center;');
  for (let i = 6; i <= 12; i++) {
    cRooms.appendChild(mkRoom('B', 'B', floor, i, 'BC', RW, RH));
  }
  centre.appendChild(cRooms);
  centre.appendChild(mkNote('7 Two-Sitter rooms', 'font-size:8px;color:var(--muted);opacity:.8;'));
  body.appendChild(centre);

  /* Right One-Sitter rooms (B13–B17, continuation after centre 06–12) */
  const rightRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#edf8f4;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 13; i <= 17; i++) {
    rightRooms.appendChild(mkRoom('B', 'B', floor, i, 'B', SRW, SRH));
  }
  body.appendChild(rightRooms);

  /* Right wing label */
  const rightLblWrap = mkDiv(
    'display:flex;align-items:center;background:#edf8f4;' +
    'border:1.5px solid var(--line);border-left:none;' +
    'border-radius:0 2px 2px 0;padding:0 3px;'
  );
  rightLblWrap.appendChild(mkSideLbl('B', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}


/* ──────────────────────────────────────────────
   SPLIT CORRIDOR  (B-wing / C-wing divider)
────────────────────────────────────────────── */
function buildSplitCorridor(bp) {
  const wrap = mkDiv(
    'padding:5px 10px;text-align:center;margin:2px 0;' +
    'border-top:2px dashed #9b8fcc;border-bottom:2px dashed #9b8fcc;' +
    'background:repeating-linear-gradient(45deg,#ede9f5 0,#ede9f5 4px,#e5e0f0 4px,#e5e0f0 8px);'
  );
  const lbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1px;color:#6b5fa0;');
  lbl.textContent = 'SPLIT LINE  ·  B-WING / C-WING CORRIDOR';
  wrap.appendChild(lbl);
  bp.appendChild(wrap);
}


/* ──────────────────────────────────────────────
   C-WING
   Layout: [WING C label] [C01–C05] [OPEN CORRIDOR] [C06–C10] [WING C label]
   All rooms use "C" prefix. 5 Two-Sitters each side.
────────────────────────────────────────────── */
function buildCWing(floor, bp) {
  /* Section header bar */
  const hdr = mkDiv(
    'display:flex;align-items:center;gap:8px;' +
    'padding:5px 8px 3px;background:#fdf6ee;' +
    'border-bottom:0.5px solid var(--court-b);border-top:1px solid var(--court-b);'
  );
  hdr.appendChild(mkSectionHdr('C-WING', WC.C));
  hdr.appendChild(mkNote('Left C' + floor + '01–C' + floor + '05  ·  Bottom row C' + floor + '06–C' + floor + '14  ·  Right C' + floor + '15–C' + floor + '19  ·  All Two-Sitters'));
  bp.appendChild(hdr);

  /* Body row */
  const body = mkRow('gap:0;align-items:stretch;');

  /* Left wing label */
  const leftLblWrap = mkDiv(
    'display:flex;align-items:center;background:#fdf6ee;' +
    'border:1.5px solid var(--line);border-right:none;' +
    'border-radius:2px 0 0 2px;padding:0 3px;'
  );
  leftLblWrap.appendChild(mkSideLbl('C', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  /* Left rooms — C01–C05 */
  const leftRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#fdf6ee;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 1; i <= 5; i++) {
    leftRooms.appendChild(mkRoom('C', 'C', floor, i, 'C', RW, RH));
  }
  body.appendChild(leftRooms);

  /* Open corridor centre */
  const corridor = mkDiv(
    'flex:1;display:flex;flex-direction:column;align-items:center;' +
    'justify-content:center;gap:3px;padding:8px 6px;' +
    'border:1.5px solid var(--line);min-height:100px;',
    'courtyard'
  );
  corridor.style.margin = '0';
  const cLbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1px;color:var(--muted);');
  cLbl.textContent = 'C-WING CORRIDOR';
  const cSub = mkDiv('font-size:8px;color:var(--muted);opacity:.7;');
  cSub.textContent = '(OPEN CORRIDOR)';
  corridor.appendChild(cLbl);
  corridor.appendChild(cSub);
  body.appendChild(corridor);

  /* Right rooms — C15–C19 (continuation after bottom row C06–C14) */
  const rightRooms = mkDiv(
    'display:flex;flex-direction:column;gap:2px;padding:6px 4px;' +
    'background:#fdf6ee;border:1.5px solid var(--line);' +
    'border-left:none;border-right:none;justify-content:center;'
  );
  for (let i = 15; i <= 19; i++) {
    rightRooms.appendChild(mkRoom('C', 'C', floor, i, 'C', RW, RH));
  }
  body.appendChild(rightRooms);

  /* Right wing label */
  const rightLblWrap = mkDiv(
    'display:flex;align-items:center;background:#fdf6ee;' +
    'border:1.5px solid var(--line);border-left:none;' +
    'border-radius:0 2px 2px 0;padding:0 3px;'
  );
  rightLblWrap.appendChild(mkSideLbl('C', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}


/* ──────────────────────────────────────────────
   BOTTOM EDGE ROW  (C-Wing bottom perimeter)
   Uses "C" prefix, numbered 11–19 (clean continuation
   after C-Wing main rooms C01–C10).
   Layout: [WR corner] [C11–C19 one-sitters] [WR corner]
   9 One-Sitter rooms + washrooms at both ends
────────────────────────────────────────────── */
function buildBottomRow(floor, bp) {
  /* Sub-label above */
  const lbl = mkDiv(
    'text-align:center;font-size:9px;color:var(--muted);' +
    'padding:2px 0;letter-spacing:.5px;border-top:1px solid var(--court-b);'
  );
  lbl.textContent = 'C-Wing Bottom Row: 9 rooms [C' + floor + '06–C' + floor + '14] + Corner Washrooms';
  bp.appendChild(lbl);

  /* Room row */
  const wrap = mkRow('justify-content:center;padding:4px 8px 6px;border-top:0.5px solid var(--court-b);gap:4px;');
  wrap.appendChild(mkWash('WR', 'C1 & Bottom', WH, WH));

  const roomsWrap = mkRow('gap:2px;');
  for (let i = 1; i <= 9; i++) {
    /* C06–C14; continuation after left C01–C05 */
    roomsWrap.appendChild(mkRoom('C', 'C', floor, 5 + i, 'CR', SRW, RH));
  }
  wrap.appendChild(roomsWrap);
  wrap.appendChild(mkWash('WR', 'C2 & Bottom', WH, WH));
  bp.appendChild(wrap);
}


/* ──────────────────────────────────────────────
   FOOTER — statistics + notes
────────────────────────────────────────────── */
function buildFooter(floor, bp) {
  const footer = mkRow(
    'justify-content:space-between;align-items:flex-start;' +
    'margin-top:12px;border-top:1px solid var(--court-b);' +
    'padding-top:8px;gap:8px;flex-wrap:wrap;'
  );

  const wingsLabel =
    floor <= 2 ? '3 Wings (A + B + C)' :
    floor === 3 ? '2 Wings (A + B)'    :
    '1 Wing (B only)';

  const stats = mkDiv(null, 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — ' + wingsLabel + '</strong><br>' +
    'Room Code Format: [Wing][Floor][RoomNo. 2-digit]<br>' +
    'A-Wing: Left A' + floor + '01–A' + floor + '05  ·  Top row A' + floor + '06–A' + floor + '11  ·  Right A' + floor + '12–A' + floor + '16  ·  Triple AT' + floor + '01–AT' + floor + '02<br>' +
    'B-Wing: Left B' + floor + '01–B' + floor + '05  ·  Centre B' + floor + '06–B' + floor + '12  ·  Right B' + floor + '13–B' + floor + '17<br>' +
    'C-Wing: Left C' + floor + '01–C' + floor + '05  ·  Bottom row C' + floor + '06–C' + floor + '14  ·  Right C' + floor + '15–C' + floor + '19<br>' +
    '<em style="font-size:8px;opacity:.7">e.g. A101 = Wing A · Floor 1 · Room 01</em>';
  footer.appendChild(stats);

  const note = mkDiv(null, 'note-box');
  note.innerHTML =
    '<strong>ROOM CAPACITY:</strong><br>' +
    'A-Wing main rooms = Double Room  ·  A-Wing bottom = Triple Room<br>' +
    'B-Wing sides = Single Room  ·  B-Wing centre = Double Room<br>' +
    'C-Wing = Double Room  ·  C-Wing bottom row = Single Room<br>' +
    'Washrooms independent per wing section';
  footer.appendChild(note);

  bp.appendChild(footer);
}


/* ══════════════════════════════════════════════════════════
   MAIN BUILD  — called every time the floor changes
   Floor 0, 1, 2  →  All three wings (A + B + C)
   Floor 3        →  Wings A + B only
   Floor 4        →  Wing B only
══════════════════════════════════════════════════════════ */
function build(floor) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  /* Update subtitle */
  document.getElementById('floorSub').textContent =
    floor <= 2 ? 'Floor ' + floor + ' — Wings A + B + C' :
    floor === 3 ? 'Floor ' + floor + ' — Wings A + B'    :
    'Floor ' + floor + ' — Wing B only';

  if (floor <= 2) {
    /* ── Floors 0, 1, 2 — all three wings ── */
    buildTopRow(floor, bp);
    buildAWing(floor, bp);
    buildABConnector(floor, bp);
    buildBWing(floor, bp);
    buildSplitCorridor(bp);
    buildCWing(floor, bp);
    buildBottomRow(floor, bp);

  } else if (floor === 3) {
    /* ── Floor 3 — Wings A + B only ── */
    buildTopRow(floor, bp);
    buildAWing(floor, bp);
    buildABConnector(floor, bp);
    buildBWing(floor, bp);

    const absentNote = mkDiv(
      'text-align:center;font-size:10px;color:var(--muted);' +
      'padding:10px;background:#f6f4ee;' +
      'border:1px dashed var(--court-b);margin-top:2px;border-radius:2px;'
    );
    absentNote.textContent = 'C-Wing is not present on Floor 3';
    bp.appendChild(absentNote);

  } else {
    /* ── Floor 4 — Wing B only ── */
    const noANote = mkDiv(
      'text-align:center;font-size:10px;color:var(--muted);' +
      'padding:8px;background:#eef4fd;border:1px dashed var(--court-b);'
    );
    noANote.textContent = 'A-Wing is not present on Floor 4';
    bp.appendChild(noANote);

    const topWash = mkDiv(
      'display:flex;align-items:center;gap:6px;padding:6px 10px;' +
      'background:#edf8f4;border-bottom:1px solid var(--court-b);justify-content:center;'
    );
    topWash.appendChild(mkWash('WASHROOM', 'B-Wing Top', 130, WH));
    bp.appendChild(topWash);

    buildBWing(floor, bp);

    const botWash = mkDiv(
      'display:flex;align-items:center;gap:6px;padding:6px 10px;' +
      'background:#edf8f4;border-top:1px solid var(--court-b);justify-content:center;'
    );
    botWash.appendChild(mkWash('WASHROOM', 'B-Wing Bottom', 130, WH));
    bp.appendChild(botWash);

    const noCNote = mkDiv(
      'text-align:center;font-size:10px;color:var(--muted);' +
      'padding:8px;background:#fdf6ee;border:1px dashed var(--court-b);'
    );
    noCNote.textContent = 'C-Wing is not present on Floor 4';
    bp.appendChild(noCNote);
  }

  buildFooter(floor, bp);
}


/* ══════════════════════════════════════════════════════════
   FLOOR SELECTOR
══════════════════════════════════════════════════════════ */
const selEl = document.getElementById('floorSel');

const FLOOR_LABELS = [
  'Floor 0 (GF)',
  'Floor 1',
  'Floor 2',
  'Floor 3',
  'Floor 4',
];

for (let i = 0; i < FLOOR_LABELS.length; i++) {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 0 ? ' active' : '');
  btn.textContent = FLOOR_LABELS[i];
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFloor = i;
    build(i);
  };
  selEl.appendChild(btn);
}

currentFloor = 0;
build(0);      // render layout immediately
loadHostel();  // then load real data