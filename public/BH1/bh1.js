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
const WC = {
  A: '#1a4a8a', B: '#0d5c40', C: '#7a3e08', D: '#8c2a18', E: '#42288a'
};

const SS = {
  vacant: { bg: 'var(--vacant)', b: 'var(--vacant-b)', t: 'var(--vacant-t)', lbl: 'Vacant'             },
  single: { bg: 'var(--single)', b: 'var(--single-b)', t: 'var(--single-t)', lbl: 'Partially Occupied' },
  full:   { bg: 'var(--full)',   b: 'var(--full-b)',   t: 'var(--full-t)',   lbl: 'Fully Occupied'      },
};

const WING_INFO = {
  A: { name: 'Wing A — Top Horizontal', type: 'Two-Sitter', position: 'North Block' },
  B: { name: 'Wing B — Right Vertical', type: 'Two-Sitter', position: 'East Block'  },
  C: { name: 'Wing C — Bottom Right',   type: 'Two-Sitter', position: 'South Block' },
  D: { name: 'Wing D — Bottom Left',    type: 'Two-Sitter', position: 'South Block' },
  E: { name: 'Wing E — Left Vertical',  type: 'Two-Sitter', position: 'West Block'  },
};

const tipEl = document.getElementById('tip');

// ====================================================================
//  ROOM DATA HELPERS
// ====================================================================

function getRoomLabel(wing, floor, num) {
  // DB format: "A-101", "B-210" etc.
  return wing + '-' + (floor * 100 + num);
}

function getRoomData(wing, floor, num) {
  if (!hostelData || !hostelData.floors) return null;
  const roomCode = getRoomLabel(wing, floor, num);
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return null;
  return (floorData.rooms || []).find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(wing, floor, num) {
  const room = getRoomData(wing, floor, num);
  if (!room) return 'vacant';
  const students = room.students || [];
  const count = students.length;
  const max   = room.maxCapacity || 2;
  if (count === 0)  return 'vacant';
  if (count >= max) return 'full';
  return 'single';
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

function mkRoom(wing, floor, num, w, h) {
  w = w || 44; h = h || 23;

  const status = getRoomStatus(wing, floor, num);
  const st     = SS[status];
  const wi     = WING_INFO[wing] || { name: 'Wing ' + wing, type: 'Two-Sitter', position: '' };
  const label  = getRoomLabel(wing, floor, num);

  const el = mkDiv(
    'width:' + w + 'px;height:' + h + 'px;' +
    'background:' + st.bg + ';border-color:' + st.b + ';color:' + st.t + ';',
    'room'
  );
  el.textContent = label;
  el.dataset.roomCode = label;

  el.onmouseenter = () => {
    const room  = getRoomData(wing, floor, num);
    const count = room ? (room.students || []).length : 0;
    const max   = room ? (room.maxCapacity || 2) : 2;
    const capLabel = max === 1 ? 'Single Room' : max === 2 ? 'Double Room' : 'Triple Room';
    tipEl.innerHTML =
      '<strong>' + label + '</strong>' +
      ' &nbsp;·&nbsp; Status:&nbsp;<strong>' + st.lbl + '</strong>' +
      ' &nbsp;·&nbsp; <strong>' + wi.name + '</strong>' +
      ' &nbsp;·&nbsp; Floor&nbsp;<strong>' + floor + '</strong>' +
      ' &nbsp;·&nbsp; Occupancy:&nbsp;<strong>' + count + '/' + max + '</strong>' +
      ' &nbsp;·&nbsp; Capacity:&nbsp;<strong>' + capLabel + '</strong>' +
      ' &nbsp;·&nbsp; <em style="opacity:.7">' + wi.position + '</em>';
  };
  el.onmouseleave = () => { tipEl.textContent = 'Hover over any room to see details'; };

  return el;
}

// ====================================================================
//  WASHROOM CELL
// ====================================================================

function mkWash(label, sub, w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'wash');
  const personIcon =
    '<svg width="10" height="12" viewBox="0 0 10 12" fill="none">' +
      '<circle cx="5" cy="3" r="2.2" fill="#3a6898"/>' +
      '<rect x="1.5" y="6" width="7" height="5" rx="1.5" fill="#3a6898"/>' +
    '</svg>';
  el.innerHTML =
    '<span>' + label + '</span>' + personIcon +
    '<span style="font-size:5.5px;opacity:.75">(' + sub + ')</span>';
  return el;
}

// ====================================================================
//  STAIRCASE CELL
// ====================================================================

function mkStair(w, h) {
  const el = mkDiv('width:' + w + 'px;height:' + h + 'px;', 'stair');
  el.textContent = 'STAIRCASE';
  return el;
}

// ====================================================================
//  WING LABEL HELPERS
// ====================================================================

function mkSideLbl(letter, transform) {
  transform = transform || 'rotate(180deg)';
  const el = mkDiv('background:' + WC[letter] + ';transform:' + transform + ';', 'wing-side-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}

function mkTopLbl(letter) {
  const el = mkDiv('background:' + WC[letter] + ';', 'wing-hdr-lbl');
  el.textContent = 'WING ' + letter;
  return el;
}

// ====================================================================
//  MAIN BUILD — identical layout to original, DB-powered colors
// ====================================================================

function build(f) {
  const bp = document.getElementById('bp');
  bp.innerHTML = '';

  document.getElementById('floorSub').textContent =
    f === 0 ? 'Floor 0 (Ground Floor)' : 'Floor ' + f + ' — Wings A · B · C · D · E';

  const RW  = 43, RH  = 22;
  const MRW = 42, MRH = 21;
  const WW  = 56, WH  = 32;
  const SW  = 56, SH  = 18;

  // ── WING A (top horizontal) ──
  const wingA = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:5px 5px 3px;background:#eef2fa;' +
    'border:1.5px solid var(--line);border-radius:2px;margin-bottom:2px;'
  );
  wingA.appendChild(mkTopLbl('A'));

  const aRow1 = mkRow();
  aRow1.appendChild(mkWash('WASHROOM', 'A1', WW, WH));
  for (let i = 1; i <= 9; i++) aRow1.appendChild(mkRoom('A', f, i, RW, RH));
  aRow1.appendChild(mkWash('WASHROOM', 'A2', WW, WH));
  wingA.appendChild(aRow1);

  const aRow2 = mkRow('margin-top:2px;');
  aRow2.appendChild(mkStair(WW, SH));
  for (let i = 18; i >= 10; i--) aRow2.appendChild(mkRoom('A', f, i, RW, RH));
  aRow2.appendChild(mkStair(WW, SH));
  wingA.appendChild(aRow2);

  bp.appendChild(wingA);

  // ── MIDDLE ROW (E | Courtyard | B) ──
  const midRow = mkRow('gap:0;align-items:stretch;margin-bottom:2px;');

  // Wing E left label
  const eLblWrap = mkDiv(
    'display:flex;align-items:center;' +
    'background:#f0eef8;border:1.5px solid var(--line);' +
    'border-right:none;border-radius:2px 0 0 2px;padding:0 3px;'
  );
  eLblWrap.appendChild(mkSideLbl('E', 'rotate(180deg)'));
  midRow.appendChild(eLblWrap);

  // Wing E rooms
  const wE = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#f0eef8;' +
    'border:1.5px solid var(--line);border-left:none;border-right:none;'
  );
  wE.appendChild(mkWash('WASHROOM', 'E1', 94, WH));
  const eCols = mkRow('gap:2px;margin-top:2px;');
  const eColL = mkCol();
  for (let i = 9; i >= 1; i--) eColL.appendChild(mkRoom('E', f, i, MRW, MRH));
  const eColR = mkCol();
  for (let i = 10; i <= 18; i++) eColR.appendChild(mkRoom('E', f, i, MRW, MRH));
  eCols.appendChild(eColL); eCols.appendChild(eColR);
  wE.appendChild(eCols);
  const eBotWash = mkDiv('display:flex;flex-direction:column;gap:2px;margin-top:2px;align-items:center;');
  eBotWash.appendChild(mkWash('WASHROOM', 'E2', 94, WH));
  eBotWash.appendChild(mkStair(94, SH));
  wE.appendChild(eBotWash);
  midRow.appendChild(wE);

  // Central courtyard
  const ctCol = mkDiv(
    'flex:1;display:flex;flex-direction:column;gap:2px;' +
    'border:1.5px solid var(--line);background:var(--paper);'
  );
  const ctTop = mkRow('justify-content:space-between;padding:3px 3px 0;');
  ctTop.appendChild(mkStair(72, SH)); ctTop.appendChild(mkStair(72, SH));
  ctCol.appendChild(ctTop);
  const courtyard = mkDiv('flex:1;min-height:140px;margin:2px 4px;', 'courtyard');
  courtyard.innerHTML =
    '<div class="ct-title">CENTRAL COURTYARD</div>' +
    '<div class="ct-sub">(OPEN TO SKY)</div>';
  ctCol.appendChild(courtyard);
  const ctBot = mkRow('justify-content:space-between;padding:0 3px 3px;');
  ctBot.appendChild(mkStair(72, SH)); ctBot.appendChild(mkStair(72, SH));
  ctCol.appendChild(ctBot);
  midRow.appendChild(ctCol);

  // Wing B rooms
  const wB = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#eaf6f2;' +
    'border:1.5px solid var(--line);border-left:none;border-right:none;'
  );
  wB.appendChild(mkWash('WASHROOM', 'B1', 94, WH));
  const bCols = mkRow('gap:2px;margin-top:2px;');
  const bColL = mkCol();
  for (let i = 1; i <= 9; i++) bColL.appendChild(mkRoom('B', f, i, MRW, MRH));
  const bColR = mkCol();
  for (let i = 10; i <= 18; i++) bColR.appendChild(mkRoom('B', f, i, MRW, MRH));
  bCols.appendChild(bColL); bCols.appendChild(bColR);
  wB.appendChild(bCols);
  const bBotWash = mkDiv('display:flex;flex-direction:column;gap:2px;margin-top:2px;align-items:center;');
  bBotWash.appendChild(mkWash('WASHROOM', 'B2', 94, WH));
  bBotWash.appendChild(mkStair(94, SH));
  wB.appendChild(bBotWash);
  midRow.appendChild(wB);

  // Wing B right label
  const bLblWrap = mkDiv(
    'display:flex;align-items:center;' +
    'background:#eaf6f2;border:1.5px solid var(--line);' +
    'border-left:none;border-radius:0 2px 2px 0;padding:0 3px;'
  );
  bLblWrap.appendChild(mkSideLbl('B', 'rotate(0deg)'));
  midRow.appendChild(bLblWrap);

  bp.appendChild(midRow);

  // ── BOTTOM ROW (D | gap | C) ──
  const botRow = mkRow('gap:0;align-items:stretch;');
  botRow.appendChild(mkDiv('min-width:28px;'));

  // Wing D
  const wD = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#f8edea;border:1.5px solid var(--line);'
  );
  const dHead = mkRow('gap:3px;margin-bottom:2px;');
  dHead.appendChild(mkWash('WASHROOM', 'D2', WW, WH));
  dHead.appendChild(mkStair(SW, SH));
  wD.appendChild(dHead);
  const dR1 = mkRow();
  for (let i = 9; i >= 1; i--) dR1.appendChild(mkRoom('D', f, i, RW, RH));
  wD.appendChild(dR1);
  const dR2 = mkRow('margin-top:2px;');
  for (let i = 18; i >= 10; i--) dR2.appendChild(mkRoom('D', f, i, RW, RH));
  wD.appendChild(dR2);
  botRow.appendChild(wD);

  botRow.appendChild(mkDiv('flex:1;'));

  // Wing C
  const wC = mkDiv(
    'display:flex;flex-direction:column;align-items:center;' +
    'padding:4px 4px;background:#fbf5ea;border:1.5px solid var(--line);'
  );
  const cHead = mkRow('gap:3px;margin-bottom:2px;');
  cHead.appendChild(mkStair(SW, SH));
  cHead.appendChild(mkWash('WASHROOM', 'C1', WW, WH));
  wC.appendChild(cHead);
  const cR1 = mkRow();
  for (let i = 1; i <= 9; i++) cR1.appendChild(mkRoom('C', f, i, RW, RH));
  wC.appendChild(cR1);
  const cR2 = mkRow('margin-top:2px;');
  for (let i = 10; i <= 18; i++) cR2.appendChild(mkRoom('C', f, i, RW, RH));
  wC.appendChild(cR2);
  botRow.appendChild(wC);

  botRow.appendChild(mkDiv('min-width:28px;'));
  bp.appendChild(botRow);

  // Wing D / C labels
  const lblRow = mkRow('justify-content:space-around;margin-top:8px;');
  const lD = mkDiv('font-size:12px;font-weight:700;letter-spacing:2px;color:' + WC.D + ';text-align:center;flex:1;');
  lD.textContent = 'WING D';
  const lC = mkDiv('font-size:12px;font-weight:700;letter-spacing:2px;color:' + WC.C + ';text-align:center;flex:1;');
  lC.textContent = 'WING C';
  lblRow.appendChild(lD); lblRow.appendChild(lC);
  bp.appendChild(lblRow);

  // ── FOOTER ──
  const footer = mkRow(
    'justify-content:space-between;align-items:flex-start;' +
    'margin-top:12px;border-top:1px solid var(--court-b);' +
    'padding-top:8px;gap:8px;flex-wrap:wrap;'
  );
  const stats = mkDiv(null, 'stats-box');
  stats.innerHTML =
    '<strong>Total Wings: 5 &nbsp;(A, B, C, D, E)</strong><br>' +
    'Rooms per Wing: 18 &nbsp;|&nbsp; Floors: 0–4<br>' +
    'Room Code: [Wing]-[3-digit] e.g. A-101, C-215<br>' +
    '<em style="font-size:8px;opacity:.7">Colors live from MongoDB</em>';
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
//  POPUP SETUP
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
    const max      = room.maxCapacity || 2;
    const isFull   = students.length >= max;

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

  formTitle.textContent = mode === 'add' ? 'Add Student to Room' : 'Remove Student from Room';
  addInputs.style.display = mode === 'add' ? '' : 'none';
  submitBtn.textContent   = mode === 'add' ? 'Add Student' : 'Remove Student';

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
popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });

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
    const res = await fetch(
      API + '/rooms/' + encodeURIComponent(selectedRoomCode) + '/students',
      { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rollNo: roll }) }
    );
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert('Error: ' + (e.message || res.statusText)); return; }
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
    if (!res.ok) { const e = await res.json().catch(()=>({})); alert('Error: ' + (e.message || res.statusText)); return; }
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