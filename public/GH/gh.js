// ===== GLOBAL STATE =====
let hostelData = null;
let currentFloor = 0;
let currentMode = null; // 'add' or 'remove'
let selectedRoomCode = null;

const API = 'http://localhost:3000/api/hostels/GH';

// ===== FETCH DATA =====
async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('DB DATA:', hostelData);
    build(currentFloor);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// ===== WING COLORS =====
const WC = { A: '#1a4a8a', B: '#0d5c40', C: '#7a3e08' };

// ===== STATUS STYLES =====
const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'            },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Partially Occupied' },
  double: { bg: 'var(--double)', b: 'var(--double-b)', t: 'var(--double-t)', lbl: 'Partially Occupied' },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Fully Occupied'     },
  triple: { bg: 'var(--triple)', b: 'var(--triple-b)', t: 'var(--triple-t)', lbl: 'Triple Room'        },
  maint:  { bg: 'var(--maint)',  b: 'var(--maint-b)',  t: 'var(--maint-t)', lbl: 'Under Maintenance'   },
};

const ROOM_META = {
  A:   { name: 'Wing A',               cap: 'Double Room', pos: 'A-Wing Left/Right Breadth'    },
  AM:  { name: 'Wing A — Middle',      cap: 'Double Room', pos: 'A-Wing Centre Column'         },
  AT:  { name: 'Wing A — Top Row',     cap: 'Double Room', pos: 'A-Wing Top Perimeter'         },
  ATR: { name: 'Wing A — Triple Room', cap: 'Triple Room', pos: 'A-Wing Bottom (Triple Block)' },
  B:   { name: 'Wing B — Side',        cap: 'Single Room', pos: 'B-Wing Left & Right Side'     },
  BC:  { name: 'Wing B — Centre',      cap: 'Double Room', pos: 'B-Wing Centre'                },
  BR:  { name: 'Wing B — Bottom Row',  cap: 'Single Room', pos: 'Bottom Perimeter'             },
  C:   { name: 'Wing C',               cap: 'Double Room', pos: 'C-Wing Left & Right Breadth'  },
  CR:  { name: 'Wing C — Bottom Row',  cap: 'Single Room', pos: 'C-Wing Bottom Perimeter'      },
};

const tipEl = document.getElementById('tip');

// ===== LAYOUT CONSTANTS =====
const RW  = 40;
const RH  = 22;
const SRW = 34;
const SRH = 20;
const WW  = 88;
const WH  = 22;

// ====================================================================
//  ROOM DATA HELPERS
// ====================================================================

function getRoomData(wing, floor, num) {
  if (!hostelData || !hostelData.floors) return null;
  const roomCode = wing + '-' + floor + String(num).padStart(2, '0');
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return null;
  return floorData.rooms.find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(wing, floor, num) {
  const room = getRoomData(wing, floor, num);
  if (!room) return 'vacant';

  const students = room.students || [];   // ✅ FIX
  const count = students.length;
  const max   = room.maxCapacity || 1;

  if (count === 0)  return 'vacant';
  if (count >= max) return 'full';
  return 'double';
}
// ====================================================================
//  DOM FACTORY HELPERS
// ====================================================================

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

// ====================================================================
//  ROOM CELL
// ====================================================================

function mkRoom(wingPrefix, seedChar, floor, num, metaKey, w, h) {
  w = w || 40;
  h = h || 22;
  metaKey = metaKey || wingPrefix;

  const status   = getRoomStatus(wingPrefix, floor, num);
  const st       = SS[status];
  const meta     = ROOM_META[metaKey] || { name: 'Wing ' + wingPrefix, cap: 'Double Room', pos: '' };
  const roomCode = wingPrefix + '-' + floor + String(num).padStart(2, '0');

  const el = mkDiv(
    'width:' + w + 'px;height:' + h + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  el.textContent = roomCode;
  el.dataset.roomCode = roomCode;

  el.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>' + roomCode + '</strong>' +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>' +
      ' &nbsp;·&nbsp; <strong>' + meta.name + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Room&nbsp;<strong>' + String(num).padStart(2,'0') + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + meta.cap + '</strong>' +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + meta.pos + '</em>';
  };
  el.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };

  return el;
}

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
  el.dataset.roomCode = roomCode;

  el.onmouseenter = () => {
    tipEl.innerHTML =
      '<strong>' + roomCode + '</strong>' +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>' +
      ' &nbsp;·&nbsp; <strong>' + meta.name + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Room&nbsp;<strong>' + String(num).padStart(2,'0') + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + meta.cap + '</strong>' +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + meta.pos + '</em>';
  };
  el.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };

  return el;
}

// ====================================================================
//  OTHER CELL BUILDERS
// ====================================================================

function mkWash(label, sub, w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'wash');
  const personIcon =
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none">' +
      '<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>' +
      '<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>' +
    '</svg>';
  el.innerHTML = '<span>' + label + '</span>' + personIcon + '<span style="font-size:5.5px;opacity:.75">(' + sub + ')</span>';
  return el;
}

function mkStair(w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'stair');
  el.textContent = 'STAIRCASE';
  return el;
}

function mkSideLbl(letter, transform) {
  transform = transform || 'rotate(180deg)';
  const el = mkDiv('background:' + WC[letter] + ';transform:' + transform + ';', 'wing-side-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}

function mkSectionHdr(text, color) {
  const el = mkDiv('background:' + (color || '#555') + ';', 'section-hdr');
  el.textContent = text;
  return el;
}

function mkNote(text, style) {
  const el = mkDiv(style || 'font-size:9px;color:var(--muted);');
  el.textContent = text;
  return el;
}

// ====================================================================
//  SECTION BUILDERS
// ====================================================================

function buildTopRow(floor, bp) {
  const wrap = mkRow('justify-content:center;padding:6px 8px 4px;border-bottom:1px solid var(--court-b);gap:4px;');
  wrap.appendChild(mkWash('WR', 'Top-Left', WH, WH));
  const roomsWrap = mkRow('gap:2px;');
  for (let i = 6; i <= 11; i++) roomsWrap.appendChild(mkRoom('A', 'A', floor, i, 'AT', RW, RH));
  wrap.appendChild(roomsWrap);
  wrap.appendChild(mkWash('WR', 'Top-Right', WH, WH));
  bp.appendChild(wrap);

  const lbl = mkDiv('text-align:center;font-size:9px;color:var(--muted);padding:2px 0;letter-spacing:.5px;border-bottom:1px solid var(--court-b);');
  lbl.textContent = 'A-Wing Top Row: 6 rooms [A' + floor + '06–A' + floor + '11] + Corner Washrooms';
  bp.appendChild(lbl);
}

function buildAWing(floor, bp) {
  const hdr = mkDiv('display:flex;align-items:center;gap:8px;padding:5px 8px 3px;background:#eef4fd;border-bottom:0.5px solid var(--court-b);');
  hdr.appendChild(mkSectionHdr('A-WING', WC.A));
  hdr.appendChild(mkNote('Left A' + floor + '01–A' + floor + '05  ·  Right A' + floor + '12–A' + floor + '16  ·  2 Triple Rooms in corridor'));
  bp.appendChild(hdr);

  const body = mkRow('gap:0;align-items:stretch;');

  const leftLblWrap = mkDiv('display:flex;align-items:center;background:#eef4fd;border:1.5px solid var(--line);border-right:none;border-radius:2px 0 0 2px;padding:0 3px;');
  leftLblWrap.appendChild(mkSideLbl('A', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  const leftRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#eef4fd;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 1; i <= 5; i++) leftRooms.appendChild(mkRoom('A', 'A', floor, i, 'A', RW, RH));
  body.appendChild(leftRooms);

  const corridor = mkDiv('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;padding:8px 6px 10px;border:1.5px solid var(--line);min-height:150px;position:relative;', 'courtyard');
  corridor.style.margin = '0';
  const cLbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1.5px;color:var(--muted);margin-top:4px;');
  cLbl.textContent = 'A-WING CORRIDOR';
  const cSub = mkDiv('font-size:8px;color:var(--muted);opacity:.7;');
  cSub.textContent = '(OPEN CORRIDOR)';
  corridor.appendChild(cLbl);
  corridor.appendChild(cSub);

  const tripleWrap = mkDiv('position:absolute;bottom:8px;right:8px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;');
  const tripleRow = mkRow('gap:6px;');
  tripleRow.appendChild(mkTripleRoom(floor, 1));
  tripleRow.appendChild(mkTripleRoom(floor, 2));
  tripleWrap.appendChild(tripleRow);
  const tNote = mkDiv('font-size:8px;color:var(--triple-b);font-weight:700;opacity:.9;');
  tNote.textContent = '2 Triple Rooms · 3 beds each';
  tripleWrap.appendChild(tNote);
  corridor.appendChild(tripleWrap);
  body.appendChild(corridor);

  const rightRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#eef4fd;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 12; i <= 16; i++) rightRooms.appendChild(mkRoom('A', 'A', floor, i, 'A', RW, RH));
  body.appendChild(rightRooms);

  const rightLblWrap = mkDiv('display:flex;align-items:center;background:#eef4fd;border:1.5px solid var(--line);border-left:none;border-radius:0 2px 2px 0;padding:0 3px;');
  rightLblWrap.appendChild(mkSideLbl('A', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}

function buildABConnector(floor, bp) {
  const wrap = mkDiv('display:flex;align-items:center;gap:6px;padding:5px 10px;justify-content:center;border-top:1px solid var(--court-b);border-bottom:1px solid var(--court-b);background:#f6f3ee;');
  wrap.appendChild(mkWash('WASHROOM', 'A–B Link', 130, WH));
  wrap.appendChild(mkNote('Shared washroom between Wing A and Wing B', 'font-size:8.5px;color:var(--muted);white-space:nowrap;'));
  bp.appendChild(wrap);
}

function buildBWing(floor, bp) {
  const hdr = mkDiv('display:flex;align-items:center;gap:8px;padding:5px 8px 3px;background:#edf8f4;border-bottom:0.5px solid var(--court-b);border-top:1px solid var(--court-b);');
  hdr.appendChild(mkSectionHdr('B-WING', WC.B));
  hdr.appendChild(mkNote('Left B' + floor + '01–B' + floor + '05  ·  Centre B' + floor + '06–B' + floor + '12  ·  Right B' + floor + '13–B' + floor + '17'));
  bp.appendChild(hdr);

  const body = mkRow('gap:0;align-items:stretch;');

  const leftLblWrap = mkDiv('display:flex;align-items:center;background:#edf8f4;border:1.5px solid var(--line);border-right:none;border-radius:2px 0 0 2px;padding:0 3px;');
  leftLblWrap.appendChild(mkSideLbl('B', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  const leftRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#edf8f4;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 1; i <= 5; i++) leftRooms.appendChild(mkRoom('B', 'B', floor, i, 'B', SRW, SRH));
  body.appendChild(leftRooms);

  const centre = mkDiv('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 6px;border:1.5px solid var(--line);background:var(--paper);');
  const cLbl = mkDiv('font-size:9px;font-weight:700;letter-spacing:1px;color:var(--muted);');
  cLbl.textContent = 'B-WING CENTRE';
  centre.appendChild(cLbl);
  const cRooms = mkRow('gap:2px;flex-wrap:wrap;justify-content:center;');
  for (let i = 6; i <= 12; i++) cRooms.appendChild(mkRoom('B', 'B', floor, i, 'BC', RW, RH));
  centre.appendChild(cRooms);
  centre.appendChild(mkNote('7 Two-Sitter rooms', 'font-size:8px;color:var(--muted);opacity:.8;'));
  body.appendChild(centre);

  const rightRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#edf8f4;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 13; i <= 17; i++) rightRooms.appendChild(mkRoom('B', 'B', floor, i, 'B', SRW, SRH));
  body.appendChild(rightRooms);

  const rightLblWrap = mkDiv('display:flex;align-items:center;background:#edf8f4;border:1.5px solid var(--line);border-left:none;border-radius:0 2px 2px 0;padding:0 3px;');
  rightLblWrap.appendChild(mkSideLbl('B', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}

function buildSplitCorridor(bp) {
  const wrap = mkDiv('padding:5px 10px;text-align:center;margin:2px 0;border-top:2px dashed #9b8fcc;border-bottom:2px dashed #9b8fcc;background:repeating-linear-gradient(45deg,#ede9f5 0,#ede9f5 4px,#e5e0f0 4px,#e5e0f0 8px);');
  const lbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1px;color:#6b5fa0;');
  lbl.textContent = 'SPLIT LINE  ·  B-WING / C-WING CORRIDOR';
  wrap.appendChild(lbl);
  bp.appendChild(wrap);
}

function buildCWing(floor, bp) {
  const hdr = mkDiv('display:flex;align-items:center;gap:8px;padding:5px 8px 3px;background:#fdf6ee;border-bottom:0.5px solid var(--court-b);border-top:1px solid var(--court-b);');
  hdr.appendChild(mkSectionHdr('C-WING', WC.C));
  hdr.appendChild(mkNote('Left C' + floor + '01–C' + floor + '05  ·  Bottom row C' + floor + '06–C' + floor + '14  ·  Right C' + floor + '15–C' + floor + '19  ·  All Two-Sitters'));
  bp.appendChild(hdr);

  const body = mkRow('gap:0;align-items:stretch;');

  const leftLblWrap = mkDiv('display:flex;align-items:center;background:#fdf6ee;border:1.5px solid var(--line);border-right:none;border-radius:2px 0 0 2px;padding:0 3px;');
  leftLblWrap.appendChild(mkSideLbl('C', 'rotate(180deg)'));
  body.appendChild(leftLblWrap);

  const leftRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#fdf6ee;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 1; i <= 5; i++) leftRooms.appendChild(mkRoom('C', 'C', floor, i, 'C', RW, RH));
  body.appendChild(leftRooms);

  const corridor = mkDiv('flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:8px 6px;border:1.5px solid var(--line);min-height:100px;', 'courtyard');
  corridor.style.margin = '0';
  const cLbl = mkDiv('font-size:10px;font-weight:700;letter-spacing:1px;color:var(--muted);');
  cLbl.textContent = 'C-WING CORRIDOR';
  const cSub = mkDiv('font-size:8px;color:var(--muted);opacity:.7;');
  cSub.textContent = '(OPEN CORRIDOR)';
  corridor.appendChild(cLbl);
  corridor.appendChild(cSub);
  body.appendChild(corridor);

  const rightRooms = mkDiv('display:flex;flex-direction:column;gap:2px;padding:6px 4px;background:#fdf6ee;border:1.5px solid var(--line);border-left:none;border-right:none;justify-content:center;');
  for (let i = 15; i <= 19; i++) rightRooms.appendChild(mkRoom('C', 'C', floor, i, 'C', RW, RH));
  body.appendChild(rightRooms);

  const rightLblWrap = mkDiv('display:flex;align-items:center;background:#fdf6ee;border:1.5px solid var(--line);border-left:none;border-radius:0 2px 2px 0;padding:0 3px;');
  rightLblWrap.appendChild(mkSideLbl('C', 'rotate(0deg)'));
  body.appendChild(rightLblWrap);

  bp.appendChild(body);
}

function buildBottomRow(floor, bp) {
  const lbl = mkDiv('text-align:center;font-size:9px;color:var(--muted);padding:2px 0;letter-spacing:.5px;border-top:1px solid var(--court-b);');
  lbl.textContent = 'C-Wing Bottom Row: 9 rooms [C' + floor + '06–C' + floor + '14] + Corner Washrooms';
  bp.appendChild(lbl);

  const wrap = mkRow('justify-content:center;padding:4px 8px 6px;border-top:0.5px solid var(--court-b);gap:4px;');
  wrap.appendChild(mkWash('WR', 'C1 & Bottom', WH, WH));
  const roomsWrap = mkRow('gap:2px;');
  for (let i = 1; i <= 9; i++) roomsWrap.appendChild(mkRoom('C', 'C', floor, 5 + i, 'CR', SRW, RH));
  wrap.appendChild(roomsWrap);
  wrap.appendChild(mkWash('WR', 'C2 & Bottom', WH, WH));
  bp.appendChild(wrap);
}

function buildFooter(floor, bp) {
  const footer = mkRow('justify-content:space-between;align-items:flex-start;margin-top:12px;border-top:1px solid var(--court-b);padding-top:8px;gap:8px;flex-wrap:wrap;');
  const wingsLabel = floor <= 2 ? '3 Wings (A + B + C)' : floor === 3 ? '2 Wings (A + B)' : '1 Wing (B only)';

  const stats = mkDiv(null, 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — ' + wingsLabel + '</strong><br>' +
    'Room Code Format: [Wing]-[Floor][RoomNo. 2-digit]<br>' +
    'A-Wing: Left A-' + floor + '01–A-' + floor + '05  ·  Top row A-' + floor + '06–A-' + floor + '11  ·  Right A-' + floor + '12–A-' + floor + '16<br>' +
    'B-Wing: Left B-' + floor + '01–B-' + floor + '05  ·  Centre B-' + floor + '06–B-' + floor + '12  ·  Right B-' + floor + '13–B-' + floor + '17<br>' +
    'C-Wing: Left C-' + floor + '01–C-' + floor + '05  ·  Bottom row C-' + floor + '06–C-' + floor + '14  ·  Right C-' + floor + '15–C-' + floor + '19<br>' +
    '<em style="font-size:8px;opacity:.7">e.g. A-101 = Wing A · Floor 1 · Room 01</em>';
  footer.appendChild(stats);

  const note = mkDiv(null, 'note-box');
  note.innerHTML =
    '<strong>ROOM CAPACITY:</strong><br>' +
    'A-Wing main rooms = Double Room  ·  A-Wing bottom = Triple Room<br>' +
    'B-Wing sides = Single Room  ·  B-Wing centre = Double Room<br>' +
    'C-Wing = Double Room  ·  C-Wing bottom row = Single Room';
  footer.appendChild(note);

  bp.appendChild(footer);
}

// ====================================================================
//  MAIN BUILD
// ====================================================================

function build(floor) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  document.getElementById('floorSub').textContent =
    floor <= 2 ? 'Floor ' + floor + ' — Wings A + B + C' :
    floor === 3 ? 'Floor ' + floor + ' — Wings A + B'    :
    'Floor ' + floor + ' — Wing B only';

  if (floor <= 2) {
    buildTopRow(floor, bp);
    buildAWing(floor, bp);
    buildABConnector(floor, bp);
    buildBWing(floor, bp);
    buildSplitCorridor(bp);
    buildCWing(floor, bp);
    buildBottomRow(floor, bp);

  } else if (floor === 3) {
    buildTopRow(floor, bp);
    buildAWing(floor, bp);
    buildABConnector(floor, bp);
    buildBWing(floor, bp);
    const n = mkDiv('text-align:center;font-size:10px;color:var(--muted);padding:10px;background:#f6f4ee;border:1px dashed var(--court-b);margin-top:2px;border-radius:2px;');
    n.textContent = 'C-Wing is not present on Floor 3';
    bp.appendChild(n);

  } else {
    const noA = mkDiv('text-align:center;font-size:10px;color:var(--muted);padding:8px;background:#eef4fd;border:1px dashed var(--court-b);');
    noA.textContent = 'A-Wing is not present on Floor 4';
    bp.appendChild(noA);

    const topW = mkDiv('display:flex;align-items:center;gap:6px;padding:6px 10px;background:#edf8f4;border-bottom:1px solid var(--court-b);justify-content:center;');
    topW.appendChild(mkWash('WASHROOM', 'B-Wing Top', 130, WH));
    bp.appendChild(topW);

    buildBWing(floor, bp);

    const botW = mkDiv('display:flex;align-items:center;gap:6px;padding:6px 10px;background:#edf8f4;border-top:1px solid var(--court-b);justify-content:center;');
    botW.appendChild(mkWash('WASHROOM', 'B-Wing Bottom', 130, WH));
    bp.appendChild(botW);

    const noC = mkDiv('text-align:center;font-size:10px;color:var(--muted);padding:8px;background:#fdf6ee;border:1px dashed var(--court-b);');
    noC.textContent = 'C-Wing is not present on Floor 4';
    bp.appendChild(noC);
  }

  buildFooter(floor, bp);
}

// ====================================================================
//  FLOOR SELECTOR
// ====================================================================

const selEl = document.getElementById('floorSel');
const FLOOR_LABELS = ['Floor 0 (GF)', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];

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

// ====================================================================
//  POPUP — HELPER: get all rooms for a given wing + floor from hostelData
// ====================================================================

function getRoomsForWingFloor(wing, floor) {
  if (!hostelData || !hostelData.floors) return [];
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return [];
  return floorData.rooms.filter(r => r.roomNumber.startsWith(wing + '-' + floor));
}

// ====================================================================
//  POPUP — SETUP
// ====================================================================

const popup        = document.getElementById('popupForm');
const formTitle    = document.getElementById('formTitle');
const wingSelect   = document.getElementById('wingSelect');
const floorSelect  = document.getElementById('floorSelect');
const roomOptions  = document.getElementById('roomOptions');
const studentGroup = document.getElementById('studentGroup');
const studentDrop  = document.getElementById('studentDropdown');
const addInputs    = document.getElementById('addInputs');
const nameInput    = document.getElementById('nameInput');
const rollInput    = document.getElementById('rollInput');
const submitBtn    = document.getElementById('submitBtn');
const closeBtn     = document.getElementById('closeBtn');

// Populate floor dropdown
for (let i = 0; i <= 4; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = 'Floor ' + i + (i === 0 ? ' (GF)' : '');
  if (i === currentFloor) opt.selected = true;
  floorSelect.appendChild(opt);
}

// Wing/floor change → repopulate rooms
function populateRooms() {
  roomOptions.innerHTML = '';
  selectedRoomCode = null;
  studentGroup.style.display = 'none';
  studentDrop.innerHTML = '';

  const wing  = wingSelect.value;
  const floor = parseInt(floorSelect.value);
  if (!wing) return;

  const rooms = getRoomsForWingFloor(wing, floor);

  if (rooms.length === 0) {
    roomOptions.innerHTML = '<em style="font-size:11px;color:#999;">No rooms found for this wing/floor</em>';
    return;
  }

  rooms.forEach(room => {

    const students = room.students || [];
    const max = room.maxCapacity || 2;
    const isFull = students.length >= max;
  
    // ✅ REMOVE MODE → only rooms with students
    if (currentMode === 'remove' && students.length === 0) return;
  
    // ✅ ADD MODE → only rooms with space
    if (currentMode === 'add' && isFull) return;
  
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = room.roomNumber;
  
    btn.style.cssText =
      'padding:4px 8px;font-size:11px;border-radius:4px;cursor:pointer;' +
      'border:1.5px solid #aaa;background:#f5f5f5;transition:all .15s;';
  
    btn.onclick = () => {
  
      roomOptions.querySelectorAll('button').forEach(b => {
        b.style.background = '#f5f5f5';
        b.style.borderColor = '#aaa';
        b.style.color = '#333';
      });
  
      btn.style.background = '#1a4a8a';
      btn.style.borderColor = '#1a4a8a';
      btn.style.color = '#fff';
  
      selectedRoomCode = room.roomNumber;
  
      // REMOVE MODE → populate students
      if (currentMode === 'remove') {
        studentDrop.innerHTML = '';
  
        room.students.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.rollNo;
          opt.textContent = `${s.name} — ${s.rollNo}`;
          studentDrop.appendChild(opt);
        });
  
        studentGroup.style.display = '';
      }
    };
  
    roomOptions.appendChild(btn);
  });
}

wingSelect.addEventListener('change', populateRooms);
floorSelect.addEventListener('change', populateRooms);

// ====================================================================
//  OPEN POPUP
// ====================================================================

function openPopup(mode) {
  currentMode = mode;
  selectedRoomCode = null;

  // Reset fields
  wingSelect.value = '';
  floorSelect.value = currentFloor;
  roomOptions.innerHTML = '';
  studentGroup.style.display = 'none';
  studentDrop.innerHTML = '';
  nameInput.value = '';
  rollInput.value = '';

  if (mode === 'add') {
    formTitle.textContent = 'Add Student to Room';
    addInputs.style.display = '';
    submitBtn.textContent = 'Add Student';
  } else {
    formTitle.textContent = 'Remove Student from Room';
    addInputs.style.display = 'none';
    submitBtn.textContent = 'Remove Student';
  }

  popup.classList.remove('hidden');
}

function closePopup() {
  popup.classList.add('hidden');
  currentMode = null;
  selectedRoomCode = null;
}

document.getElementById('addBtn').onclick    = () => openPopup('add');
document.getElementById('removeBtn').onclick = () => openPopup('remove');
closeBtn.onclick = closePopup;

// Close on backdrop click
popup.addEventListener('click', (e) => {
  if (e.target === popup) closePopup();
});

// ====================================================================
//  SUBMIT — ADD STUDENT
// ====================================================================

async function addStudent() {
  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();

  if (!selectedRoomCode) { alert('Please select a room.'); return; }
  if (!name)             { alert('Please enter student name.'); return; }
  if (!roll)             { alert('Please enter roll number.'); return; }

  try {
    const res = await fetch(API + '/rooms/' + encodeURIComponent(selectedRoomCode) + '/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rollNo: roll })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Error: ' + (err.message || res.statusText));
      return;
    }

    alert('Student "' + name + '" added to ' + selectedRoomCode + ' successfully!');
    closePopup();
    await loadHostel(); // refresh data + redraw

  } catch (err) {
    console.error('Add error:', err);
    alert('Failed to add student. Check console for details.');
  }
}

// ====================================================================
//  SUBMIT — REMOVE STUDENT
// ====================================================================

async function removeStudent() {
  if (!selectedRoomCode) { alert('Please select a room.'); return; }

  const rollNo = studentDrop.value;
  if (!rollNo || rollNo === 'No students in this room') {
    alert('No student selected or room is already empty.');
    return;
  }

  if (!confirm('Remove student "' + studentDrop.options[studentDrop.selectedIndex].text + '" from ' + selectedRoomCode + '?')) return;

  try {
    const res = await fetch(
      API + '/rooms/' + encodeURIComponent(selectedRoomCode) + '/students/' + encodeURIComponent(rollNo),
      { method: 'DELETE' }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      alert('Error: ' + (err.message || res.statusText));
      return;
    }

    alert('Student removed from ' + selectedRoomCode + ' successfully!');
    closePopup();
    await loadHostel(); // refresh data + redraw

  } catch (err) {
    console.error('Remove error:', err);
    alert('Failed to remove student. Check console for details.');
  }
}

// ====================================================================
//  SUBMIT BUTTON HANDLER
// ====================================================================

submitBtn.onclick = () => {
  if (currentMode === 'add')    addStudent();
  if (currentMode === 'remove') removeStudent();
};

// ====================================================================
//  INIT
// ====================================================================

currentFloor = 0;
build(0);
loadHostel();