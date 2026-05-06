// ===== GLOBAL STATE =====
let hostelData = null;
let currentFloor = 0;
let currentMode = null; // 'add' or 'remove'
let selectedRoomCode = null;

const API = 'http://localhost:3000/api/hostels/BH4';

// ===== FETCH DATA =====
document.getElementById('popupForm').classList.add('hidden');

async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('BH4 DB DATA:', hostelData);
    build(currentFloor);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// ===== CONSTANTS =====
const RW = 52, RH = 46, WS = 52, GAP = 2;

const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'             },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Partially Occupied' },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Fully Occupied'      },
};

const TOWER_COLOR = { A: '#1a4a8a', B: '#0d5c40' };
const TOWER_BG    = { A: '#eef4fd', B: '#edf8f4' };

const tipEl = document.getElementById('tip');

// ====================================================================
//  ROOM DATA HELPERS — reads from hostelData (DB), same pattern as GH
// ====================================================================

function getRoomLabel(tower, floor, n) {
  return tower + '-' + (floor * 100 + n);  // "A-101" to match your DB
}
function getRoomData(tower, floor, n) {
  if (!hostelData || !hostelData.floors) return null;

  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return null;

  // ✅ Your DB uses blocks, not direct rooms
  const block = (floorData.blocks || []).find(b => b.blockName === tower);
  if (!block) return null;

  // ✅ Your DB uses "A-101" format, code generates n=1..20
  const roomCode = tower + '-' + (floor * 100 + n);  // e.g. "A-101"
  return block.rooms.find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(tower, floor, n) {
  const room = getRoomData(tower, floor, n);
  if (!room) return 'vacant';

  const students = room.students || [];
  const count = students.length;
  const max   = room.maxCapacity || 2;

  if (count === 0)   return 'vacant';
  if (count >= max)  return 'full';    // ✅ was 'double', now 'full' = bright red like GH
  return 'single';                     // partially occupied = yellow/orange
}

// ====================================================================
//  DOM HELPERS
// ====================================================================

function el(tag, style, cls) {
  const d = document.createElement(tag || 'div');
  if (cls)   d.className    = cls;
  if (style) d.style.cssText = style;
  return d;
}
function div(style, cls) { return el('div', style, cls); }
function row(extra) { return div('display:flex;flex-direction:row;gap:' + GAP + 'px;align-items:stretch;' + (extra||'')); }
function col(extra) { return div('display:flex;flex-direction:column;gap:' + GAP + 'px;' + (extra||'')); }
function spacer()   { return div('width:' + RW + 'px;height:' + RH + 'px;flex-shrink:0;'); }

// ====================================================================
//  WASHROOM CELL
// ====================================================================

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

// ====================================================================
//  ROOM CELL
// ====================================================================

function mkRoom(tower, floor, n) {
  const status = getRoomStatus(tower, floor, n);
  const st     = SS[status];
  const label  = getRoomLabel(tower, floor, n);

  const d = div(
    'width:' + RW + 'px;height:' + RH + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  d.textContent = label;
  d.dataset.roomCode = label;

  d.onmouseenter = () => {
    const room = getRoomData(tower, floor, n);
    const count = room ? (room.students || []).length : 0;
    const max   = room ? (room.maxCapacity || 2) : 2;
    const capLabel = max === 1 ? 'Single Room' : max === 2 ? 'Double Room' : 'Triple Room';
  
    tipEl.innerHTML =
      '<strong>Room ' + label + '</strong>' +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>' +
      ' &nbsp;·&nbsp; <strong>Tower ' + tower + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Occupancy:&nbsp;<strong>' + count + '/' + max + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + capLabel + '</strong>';
  };
  d.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };
  return d;
}

// ====================================================================
//  COURTYARD BOX
// ====================================================================

function mkCourtyard() {
  const cW = 5 * RW + 4 * GAP;
  const cH = 5 * RH + 4 * GAP;
  const d = div('width:' + cW + 'px;height:' + cH + 'px;', 'courtyard');
  const t = div(''); t.className = 'ct-title'; t.textContent = 'COURTYARD';
  const s = div(''); s.className = 'ct-sub';   s.textContent = '(Open to sky)';
  d.appendChild(t); d.appendChild(s);
  return d;
}

// ====================================================================
//  TOWER GRID
// ====================================================================

function mkTowerGrid(floor, tower) {
  const wrap = div('display:inline-flex;flex-direction:column;gap:' + GAP + 'px;');

  const room = (n) => mkRoom(tower, floor, n);

  // Top row: WR + rooms 1-5 + spacer
  const r0 = row();
  r0.appendChild(mkWash('TL'));
  [1,2,3,4,5].forEach(n => r0.appendChild(room(n)));
  r0.appendChild(spacer());
  wrap.appendChild(r0);

  // Middle: left col (11-15) | courtyard | right col (6-10)
  const mid = row();
  const leftCol = col();
  [11,12,13,14,15].forEach(n => leftCol.appendChild(room(n)));
  mid.appendChild(leftCol);
  mid.appendChild(mkCourtyard());
  const rightCol = col();
  [6,7,8,9,10].forEach(n => rightCol.appendChild(room(n)));
  mid.appendChild(rightCol);
  wrap.appendChild(mid);

  // Bottom row: spacer + rooms 16-20 + WR
  const r6 = row();
  r6.appendChild(spacer());
  [16,17,18,19,20].forEach(n => r6.appendChild(room(n)));
  r6.appendChild(mkWash('BR'));
  wrap.appendChild(r6);

  return wrap;
}

// ====================================================================
//  TOWER SIDE LABEL
// ====================================================================

function mkSideLbl(tower, side) {
  const wrap = div('', 'tower-side-lbl ' + side);
  const lbl  = div('background:' + TOWER_COLOR[tower] + ';transform:' + (side === 'left' ? 'rotate(180deg)' : 'rotate(0deg)') + ';', 'wing-lbl');
  lbl.textContent = 'TOWER ' + tower;
  wrap.appendChild(lbl);
  return wrap;
}

// ====================================================================
//  TOWER BLOCK
// ====================================================================

function mkTowerBlock(floor, tower) {
  const isMess = (tower === 'A' && floor === 0);
  const block  = div('', 'tower-block');

  const firstLbl = tower + String(floor * 100 + 1).padStart(3, '0');
  const lastLbl  = tower + String(floor * 100 + 20).padStart(3, '0');

  // Header
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
    const icon  = div('', 'mess-icon');  icon.textContent  = '🍽';
    const title = div('', 'mess-title'); title.textContent = 'MESS';
    const sub   = div('', 'mess-sub');   sub.textContent   = 'Ground Floor — Dining Hall';
    mess.appendChild(icon); mess.appendChild(title); mess.appendChild(sub);
    block.appendChild(mess);
  } else {
    const body  = div('', 'tower-body');
    const inner = div('background:' + TOWER_BG[tower] + ';', 'tower-inner');
    inner.appendChild(mkTowerGrid(floor, tower));
    body.appendChild(mkSideLbl(tower, 'left'));
    body.appendChild(inner);
    body.appendChild(mkSideLbl(tower, 'right'));
    block.appendChild(body);
  }

  return block;
}

// ====================================================================
//  CONNECTOR
// ====================================================================

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

// ====================================================================
//  FOOTER
// ====================================================================

function mkFooter(floor) {
  const firstA = 'A' + String(floor * 100 + 1).padStart(3, '0');
  const lastA  = 'A' + String(floor * 100 + 20).padStart(3, '0');
  const firstB = 'B' + String(floor * 100 + 1).padStart(3, '0');
  const lastB  = 'B' + String(floor * 100 + 20).padStart(3, '0');

  const towerARange = floor === 0 ? 'Mess / Dining Hall (Ground Floor)' : firstA + ' – ' + lastA;

  const footer = div('', 'footer');
  const stats  = div('', 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — Twin Tower Complex (BH4)</strong><br>' +
    'Tower A: ' + towerARange + '<br>' +
    'Tower B: ' + firstB + ' – ' + lastB + '<br>' +
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

// ====================================================================
//  MAIN BUILD
// ====================================================================

function build(floor) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  document.getElementById('floorSub').textContent =
    floor === 0
      ? 'Floor 0 (Ground Floor) — Tower A: Mess · Tower B: Active'
      : 'Floor ' + floor + ' — Tower A: ' + 'A' + String(floor*100+1).padStart(3,'0') + '–A' + String(floor*100+20).padStart(3,'0') +
        ' · Tower B: B' + String(floor*100+1).padStart(3,'0') + '–B' + String(floor*100+20).padStart(3,'0');

  bp.appendChild(mkTowerBlock(floor, 'A'));
  bp.appendChild(mkConnector());
  bp.appendChild(mkTowerBlock(floor, 'B'));
  bp.appendChild(mkFooter(floor));
}

// ====================================================================
//  FLOOR SELECTOR
// ====================================================================

const selEl = document.getElementById('floorSel');
const FLOOR_LABELS = ['Floor 0 (GF)', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6'];

FLOOR_LABELS.forEach((lbl, i) => {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 0 ? ' active' : '');
  btn.textContent = lbl;
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFloor = i;
    build(i);
  };
  selEl.appendChild(btn);
});

// ====================================================================
//  POPUP — get rooms for tower + floor
// ====================================================================

function getRoomsForTowerFloor(tower, floor) {
  if (!hostelData || !hostelData.floors) return [];
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return [];

  // ✅ Your DB uses blocks
  const block = (floorData.blocks || []).find(b => b.blockName === tower);
  if (!block) return [];

  return block.rooms || [];
}

// ====================================================================
//  POPUP — SETUP
// ====================================================================

const popup        = document.getElementById('popupForm');
const formTitle    = document.getElementById('formTitle');
const towerSelect  = document.getElementById('towerSelect');
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
for (let i = 0; i <= 6; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = 'Floor ' + i + (i === 0 ? ' (GF)' : '');
  if (i === currentFloor) opt.selected = true;
  floorSelect.appendChild(opt);
}

function populateRooms() {
  roomOptions.innerHTML = '';
  selectedRoomCode = null;
  studentGroup.style.display = 'none';
  studentDrop.innerHTML = '';

  const tower = towerSelect.value;
  const floor = parseInt(floorSelect.value);
  if (!tower) return;

  const rooms = getRoomsForTowerFloor(tower, floor);

  if (rooms.length === 0) {
    roomOptions.innerHTML = '<em style="font-size:11px;color:#999;">No rooms found for this tower/floor</em>';
    return;
  }

  rooms.forEach(room => {
    const students = room.students || [];
    const max = room.maxCapacity || 2;
    const isFull = students.length >= max;

    // Filter by mode
    if (currentMode === 'remove' && students.length === 0) return;
    if (currentMode === 'add'    && isFull)                return;

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

      if (currentMode === 'remove') {
        studentDrop.innerHTML = '';
        (room.students || []).forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.rollNo;
          opt.textContent = s.name + ' — ' + s.rollNo;
          studentDrop.appendChild(opt);
        });
        studentGroup.style.display = '';
      }
    };

    roomOptions.appendChild(btn);
  });
}

towerSelect.addEventListener('change', populateRooms);
floorSelect.addEventListener('change', populateRooms);

// ====================================================================
//  OPEN / CLOSE POPUP
// ====================================================================

function openPopup(mode) {
  currentMode = mode;
  selectedRoomCode = null;
  towerSelect.value = '';
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
popup.addEventListener('click', (e) => { if (e.target === popup) closePopup(); });

// ====================================================================
//  SUBMIT — ADD STUDENT
// ====================================================================

async function addStudent() {
  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();

  if (!selectedRoomCode) { alert('Please select a room.');         return; }
  if (!name)             { alert('Please enter student name.');    return; }
  if (!roll)             { alert('Please enter roll number.');     return; }

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
    await loadHostel();

  } catch (err) {
    console.error('Add error:', err);
    alert('Failed to add student. Check console.');
  }
}

// ====================================================================
//  SUBMIT — REMOVE STUDENT
// ====================================================================

async function removeStudent() {
  if (!selectedRoomCode) { alert('Please select a room.'); return; }

  const rollNo = studentDrop.value;
  if (!rollNo) { alert('No student selected.'); return; }

  if (!confirm('Remove "' + studentDrop.options[studentDrop.selectedIndex].text + '" from ' + selectedRoomCode + '?')) return;

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
    await loadHostel();

  } catch (err) {
    console.error('Remove error:', err);
    alert('Failed to remove student. Check console.');
  }
}

// ====================================================================
//  SUBMIT HANDLER
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