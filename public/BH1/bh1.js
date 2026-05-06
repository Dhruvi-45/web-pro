// ===== GLOBAL STATE =====
let hostelData = null;
let currentFloor = 1;
let currentMode = null;
let selectedRoomCode = null;

const API = 'http://localhost:3000/api/hostels/BH1';

// ===== FETCH DATA =====
async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('BH1 DB DATA:', hostelData);
    build(currentFloor);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// ===== CONSTANTS =====
const RW = 52, RH = 46, WS = 52, GAP = 2;

const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'          },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Partially Occupied' },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Fully Occupied'   },
};

// Wing accent colors — A B C D E
const WC = {
  A: '#1a4a8a', B: '#0d5c40', C: '#7a3e08', D: '#8c2a18', E: '#42288a'
};

const tipEl = document.getElementById('tip');

// ====================================================================
//  ROOM DATA HELPERS
// ====================================================================

function getRoomLabel(wing, floor, n) {
  return wing + '-' + (floor * 100 + n);  // "A-101"
}

function getRoomData(wing, floor, n) {
  if (!hostelData || !hostelData.floors) return null;
  const roomCode = getRoomLabel(wing, floor, n);
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return null;
  return (floorData.rooms || []).find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(wing, floor, n) {
  const room = getRoomData(wing, floor, n);
  if (!room) return 'vacant';
  const students = room.students || [];
  const count = students.length;
  const max   = room.maxCapacity || 2;
  if (count === 0)  return 'vacant';
  if (count >= max) return 'full';
  return 'single';
}

// ====================================================================
//  DOM HELPERS
// ====================================================================

function el(tag, style, cls) {
  const d = document.createElement(tag || 'div');
  if (cls)   d.className     = cls;
  if (style) d.style.cssText = style;
  return d;
}
function div(style, cls) { return el('div', style, cls); }
function row(extra) { return div('display:flex;flex-direction:row;gap:' + GAP + 'px;align-items:stretch;' + (extra||'')); }
function col(extra) { return div('display:flex;flex-direction:column;gap:' + GAP + 'px;' + (extra||'')); }
function spacer(w, h) {
  w = w || RW; h = h || RH;
  return div('width:' + w + 'px;height:' + h + 'px;flex-shrink:0;');
}

// ====================================================================
//  WASHROOM CELL
// ====================================================================

function mkWash(w, h) {
  w = w || WS; h = h || RH;
  const d = div('width:' + w + 'px;height:' + h + 'px;', 'wash');
  d.innerHTML =
    '<span>WR</span>' +
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none">' +
      '<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>' +
      '<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>' +
    '</svg>';
  return d;
}

// ====================================================================
//  STAIRCASE CELL
// ====================================================================

function mkStair(w, h) {
  w = w || WS; h = h || RH;
  const d = div('width:' + w + 'px;height:' + h + 'px;', 'stair');
  d.textContent = 'STAIR';
  return d;
}

// ====================================================================
//  ROOM CELL
// ====================================================================

function mkRoom(wing, floor, n) {
  const status = getRoomStatus(wing, floor, n);
  const st     = SS[status];
  const label  = getRoomLabel(wing, floor, n);

  const d = div(
    'width:' + RW + 'px;height:' + RH + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  d.textContent = label;
  d.dataset.roomCode = label;

  d.onmouseenter = () => {
    const room = getRoomData(wing, floor, n);
    const count = room ? (room.students || []).length : 0;
    const max   = room ? (room.maxCapacity || 2) : 2;
    const capLabel = max === 1 ? 'Single Room' : max === 2 ? 'Double Room' : 'Triple Room';
    tipEl.innerHTML =
      '<strong>Room ' + label + '</strong>' +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>' +
      ' &nbsp;·&nbsp; Wing&nbsp;<strong>' + wing + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Occupancy:&nbsp;<strong>' + count + '/' + max + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + capLabel + '</strong>';
  };
  d.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };
  return d;
}

// ====================================================================
//  WING ROW  — 18 rooms per wing, layout:
//  WR | 1-9 | STAIR | 10-18 | WR
// ====================================================================

function mkWingRow(floor, wing) {
  const r = row();
  r.appendChild(mkWash());
  for (let n = 1; n <= 9; n++)  r.appendChild(mkRoom(wing, floor, n));
  r.appendChild(mkStair());
  for (let n = 10; n <= 18; n++) r.appendChild(mkRoom(wing, floor, n));
  r.appendChild(mkWash());
  return r;
}

// ====================================================================
//  WING BLOCK  — header + row of rooms
// ====================================================================

function mkWingBlock(floor, wing) {
  const block = div('margin-bottom:' + GAP + 'px;');

  // Header bar
  const hdr = div(
    'display:flex;align-items:center;gap:8px;padding:3px 6px;' +
    'background:#f2f0e8;border:1px solid var(--line);margin-bottom:' + GAP + 'px;'
  );
  const lbl = div('background:' + WC[wing] + ';', 'wing-hdr-lbl');
  lbl.textContent = 'WING ' + wing;
  const note = div('font-size:9px;color:var(--muted);');
  const first = getRoomLabel(wing, floor, 1);
  const last  = getRoomLabel(wing, floor, 18);
  note.textContent = 'Rooms ' + first + ' – ' + last + ' · 18 rooms · 2 washrooms · 1 staircase';
  hdr.appendChild(lbl);
  hdr.appendChild(note);
  block.appendChild(hdr);

  block.appendChild(mkWingRow(floor, wing));
  return block;
}

// ====================================================================
//  FOOTER
// ====================================================================

function mkFooter(floor) {
  const wings = ['A','B','C','D','E'];
  const footer = div(
    'display:flex;justify-content:space-between;align-items:flex-start;' +
    'margin-top:12px;border-top:1px solid var(--court-b);padding-top:8px;gap:8px;flex-wrap:wrap;'
  );

  const stats = div('', 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — Boys Hostel BH-1</strong><br>' +
    'Wings: A · B · C · D · E<br>' +
    '18 rooms per wing · 90 rooms total per floor<br>' +
    '<em style="font-size:8px;opacity:.7">Room code: [Wing]-[3-digit] e.g. A-101, C-215</em>';

  const note = div('', 'note-box');
  note.innerHTML =
    '<strong>NOTE:</strong><br>' +
    'Each wing: WR · 9 rooms · STAIR · 9 rooms · WR<br>' +
    'Single rooms (maxCapacity=1) also present<br>' +
    'Colors: Green=Vacant · Orange=Partial · Red=Full';

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
    'Floor ' + floor + ' — Wings A · B · C · D · E';

  ['A','B','C','D','E'].forEach(wing => {
    bp.appendChild(mkWingBlock(floor, wing));
  });

  bp.appendChild(mkFooter(floor));
}

// ====================================================================
//  FLOOR SELECTOR
// ====================================================================

const selEl = document.getElementById('floorSel');
const FLOOR_LABELS = ['Floor 0 (GF)', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];

FLOOR_LABELS.forEach((lbl, i) => {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 1 ? ' active' : '');
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

popup.classList.add('hidden');

for (let i = 0; i <= 4; i++) {
  const opt = document.createElement('option');
  opt.value = i;
  opt.textContent = 'Floor ' + i + (i === 0 ? ' (GF)' : '');
  if (i === currentFloor) opt.selected = true;
  floorSelect.appendChild(opt);
}

function getRoomsForWingFloor(wing, floor) {
  if (!hostelData || !hostelData.floors) return [];
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return [];
  return (floorData.rooms || []).filter(r => r.roomNumber.startsWith(wing + '-'));
}

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
    roomOptions.innerHTML = '<em style="font-size:11px;color:#999;">No rooms found</em>';
    return;
  }

  rooms.forEach(room => {
    const students = room.students || [];
    const max = room.maxCapacity || 2;
    const isFull = students.length >= max;

    if (currentMode === 'remove' && students.length === 0) return;
    if (currentMode === 'add'    && isFull)                return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = room.roomNumber;
    btn.className = 'room-btn';

    btn.onclick = () => {
      roomOptions.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

wingSelect.addEventListener('change', populateRooms);
floorSelect.addEventListener('change', populateRooms);

// ====================================================================
//  OPEN / CLOSE POPUP
// ====================================================================

function openPopup(mode) {
  currentMode = mode;
  selectedRoomCode = null;
  wingSelect.value  = '';
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
//  SUBMIT
// ====================================================================

async function addStudent() {
  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();
  if (!selectedRoomCode) { alert('Please select a room.');      return; }
  if (!name)             { alert('Please enter student name.'); return; }
  if (!roll)             { alert('Please enter roll number.');  return; }

  try {
    const res = await fetch(API + '/rooms/' + encodeURIComponent(selectedRoomCode) + '/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, rollNo: roll })
    });
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert('Error: ' + (e.message||res.statusText)); return; }
    alert('Student "' + name + '" added to ' + selectedRoomCode + '!');
    closePopup();
    await loadHostel();
  } catch (err) { console.error(err); alert('Failed. Check console.'); }
}

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
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert('Error: ' + (e.message||res.statusText)); return; }
    alert('Student removed from ' + selectedRoomCode + '!');
    closePopup();
    await loadHostel();
  } catch (err) { console.error(err); alert('Failed. Check console.'); }
}

submitBtn.onclick = () => {
  if (currentMode === 'add')    addStudent();
  if (currentMode === 'remove') removeStudent();
};

// ====================================================================
//  INIT
// ====================================================================
currentFloor = 1;
build(1);
loadHostel();