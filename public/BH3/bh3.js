// ===== GLOBAL STATE =====
let hostelData = null;
let currentFloor = 1;
let currentMode = null;
let selectedRoomCode = null;

const API = 'http://localhost:3000/api/hostels/BH3';

// ===== FETCH DATA =====
async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('BH3 DB DATA:', hostelData);
    build(currentFloor);
    updateInfoPanel(currentFloor);
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

// BH3: same colors as BH4 — Tower A blue, Tower B green
const TOWER_COLOR = { A: '#1a4a8a', B: '#0d5c40' };
const TOWER_BG    = { A: '#eef4fd', B: '#edf8f4' };

const tipEl = document.getElementById('tip');

// ====================================================================
//  ROOM DATA HELPERS
// ====================================================================

function getRoomLabel(tower, floor, n) {
  return tower + '-' + (floor * 100 + n);  // "A-101"
}

function getRoomData(tower, floor, n) {
  if (!hostelData || !hostelData.floors) return null;
  const roomCode = getRoomLabel(tower, floor, n);
  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return null;
  return (floorData.rooms || []).find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(tower, floor, n) {
  const room = getRoomData(tower, floor, n);
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
//  TOWER GRID  (identical layout for ALL floors in BH3 — no mess ever)
// ====================================================================

function mkTowerGrid(floor, tower) {
  const wrap = div('display:inline-flex;flex-direction:column;gap:' + GAP + 'px;');
  const room = (n) => mkRoom(tower, floor, n);

  const r0 = row();
  r0.appendChild(mkWash('TL'));
  [1,2,3,4,5].forEach(n => r0.appendChild(room(n)));
  r0.appendChild(spacer());
  wrap.appendChild(r0);

  const mid = row();
  const leftCol = col();
  [11,12,13,14,15].forEach(n => leftCol.appendChild(room(n)));
  mid.appendChild(leftCol);
  mid.appendChild(mkCourtyard());
  const rightCol = col();
  [6,7,8,9,10].forEach(n => rightCol.appendChild(room(n)));
  mid.appendChild(rightCol);
  wrap.appendChild(mid);

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
//  BH3 KEY DIFFERENCE: Tower A Floor 0 = normal rooms (same as Floor 1)
//  No mess at all in BH3
// ====================================================================

function mkTowerBlock(floor, tower) {
  const block  = div('', 'tower-block');

  const firstLbl = tower + '-' + String(floor * 100 + 1).padStart(3, '0');
  const lastLbl  = tower + '-' + String(floor * 100 + 20).padStart(3, '0');

  const hdr = div(
    'display:flex;align-items:center;gap:8px;padding:5px 8px 3px;' +
    'background:' + TOWER_BG[tower] + ';' +
    'border-bottom:0.5px solid var(--court-b);' +
    (tower === 'B' ? 'border-top:1px solid var(--court-b);' : '')
  );
  const hdrLabel = div('background:' + TOWER_COLOR[tower] + ';', 'section-hdr');
  hdrLabel.textContent = 'TOWER ' + tower;
  const hdrNote = div('font-size:9px;color:var(--muted);');
  hdrNote.textContent = 'Rooms ' + firstLbl + ' – ' + lastLbl + ' · 2 washrooms (perimeter layout)';
  hdr.appendChild(hdrLabel);
  hdr.appendChild(hdrNote);
  block.appendChild(hdr);

  // Always render normal tower grid — no mess in BH3
  const body  = div('', 'tower-body');
  const inner = div('background:' + TOWER_BG[tower] + ';', 'tower-inner');
  inner.appendChild(mkTowerGrid(floor, tower));
  body.appendChild(mkSideLbl(tower, 'left'));
  body.appendChild(inner);
  body.appendChild(mkSideLbl(tower, 'right'));
  block.appendChild(body);

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
  const firstA = 'A-' + String(floor * 100 + 1).padStart(3, '0');
  const lastA  = 'A-' + String(floor * 100 + 20).padStart(3, '0');
  const firstB = 'B-' + String(floor * 100 + 1).padStart(3, '0');
  const lastB  = 'B-' + String(floor * 100 + 20).padStart(3, '0');

  const footer = div('', 'footer');
  const stats  = div('', 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — Twin Tower Complex (BH3)</strong><br>' +
    'Tower A: ' + firstA + ' – ' + lastA + '<br>' +
    'Tower B: ' + firstB + ' – ' + lastB + '<br>' +
    '<em style="font-size:8px;opacity:.7">Room code: A-101, B-215 etc.</em>';

  const note = div('', 'note-box');
  note.innerHTML =
    '<strong>NOTE:</strong><br>' +
    'Perimeter layout — rooms along outer edges<br>' +
    'Courtyard in centre (open to sky)<br>' +
    'Washrooms: top-left &amp; bottom-right corners<br>' +
    'Tower A — Ground Floor has normal rooms (no mess)';

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
    'Floor ' + floor +
    ' — Tower A: A-' + String(floor*100+1).padStart(3,'0') + '–A-' + String(floor*100+20).padStart(3,'0') +
    ' · Tower B: B-' + String(floor*100+1).padStart(3,'0') + '–B-' + String(floor*100+20).padStart(3,'0');

  bp.appendChild(mkTowerBlock(floor, 'A'));
  bp.appendChild(mkConnector());
  bp.appendChild(mkTowerBlock(floor, 'B'));
  bp.appendChild(mkFooter(floor));
}


function updateInfoPanel(floor) {
  if (!hostelData || !hostelData.floors) return;

  const floorData = hostelData.floors.find(f => f.floorNumber == floor);
  if (!floorData) return;

  document.getElementById('pieFloorLbl').textContent = floor;
  document.getElementById('barFloorLbl').textContent = floor;

  let totalRooms = 0, occupiedRooms = 0, vacantRooms = 0, partialRooms = 0, fullRooms = 0;
  const towerStudents = { A: 0, B: 0 };

  floorData.rooms.forEach(room => {
    const students = room.students || [];
    const max = room.maxCapacity || 2;
    totalRooms++;
    if (students.length === 0)       vacantRooms++;
    else if (students.length >= max) { fullRooms++;    occupiedRooms++; }
    else                             { partialRooms++; occupiedRooms++; }
    const tower = room.roomNumber.charAt(0);
    if (towerStudents[tower] !== undefined) towerStudents[tower] += students.length;
  });

  const occRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  document.getElementById('statTotalNum').textContent    = totalRooms;
  document.getElementById('statOccupiedNum').textContent = occupiedRooms;
  document.getElementById('statVacantNum').textContent   = vacantRooms;
  document.getElementById('statPartialNum').textContent  = partialRooms;
  document.getElementById('statOccRateNum').textContent  = occRate + '%';

  // Tower Bar Chart
  const wingBarEl = document.getElementById('wingBarChart');
  wingBarEl.innerHTML = '';
  const maxVal = Math.max(...Object.values(towerStudents), 1);
  Object.entries(towerStudents).forEach(([tower, count]) => {
    const color = TOWER_COLOR[tower];
    const wrap = document.createElement('div'); wrap.className = 'wb-bar-wrap';
    const val  = document.createElement('div'); val.className  = 'wb-val';
    val.textContent = count; val.style.color = color;
    const bar  = document.createElement('div'); bar.className  = 'wb-bar';
    bar.style.height = Math.round((count / maxVal) * 80) + 'px';
    bar.style.background = color;
    bar.style.opacity = count === 0 ? '.2' : '1';
    const lbl  = document.createElement('div'); lbl.className  = 'wb-lbl';
    lbl.textContent = 'Tower ' + tower;
    wrap.appendChild(val); wrap.appendChild(bar); wrap.appendChild(lbl);
    wingBarEl.appendChild(wrap);
  });

  // Pie Chart
  const pieData = [
    { label: 'Vacant',  value: vacantRooms,  color: '#5a8a2a' },
    { label: 'Partial', value: partialRooms, color: '#c08a10' },
    { label: 'Full',    value: fullRooms,    color: '#1a4a8a' },
  ].filter(d => d.value > 0);

  const canvas = document.getElementById('pieCanvas');
  const ctx = canvas.getContext('2d');
  const cx = canvas.width/2, cy = canvas.height/2, r = 55;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const total = pieData.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;
  pieData.forEach(d => {
    const slice = (d.value / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = d.color; ctx.fill();
    ctx.strokeStyle = '#f8f5ee'; ctx.lineWidth = 2; ctx.stroke();
    angle += slice;
  });
  ctx.beginPath(); ctx.arc(cx, cy, 28, 0, 2*Math.PI);
  ctx.fillStyle = '#f8f5ee'; ctx.fill();
  ctx.fillStyle = '#1a4a8a'; ctx.font = 'bold 13px Courier New';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(occRate + '%', cx, cy);

  const legendEl = document.getElementById('pieLegend');
  legendEl.innerHTML = '';
  pieData.forEach(d => {
    const item = document.createElement('div'); item.className = 'pl-item';
    item.innerHTML = '<div class="pl-dot" style="background:' + d.color + '"></div>' + d.label + '<span class="pl-val"> ' + d.value + '</span>';
    legendEl.appendChild(item);
  });

  // Floor Bar Chart
  const chartEl = document.getElementById('floorChart');
  const allFloorStats = hostelData.floors.map(fd => {
    let occ = 0, tot = 0;
    (fd.rooms || []).forEach(r => { tot++; if ((r.students||[]).length > 0) occ++; });
    return { floor: fd.floorNumber, pct: tot > 0 ? Math.round((occ/tot)*100) : 0 };
  });
  const maxPct = Math.max(...allFloorStats.map(f => f.pct), 1);
  chartEl.innerHTML = '';
  allFloorStats.forEach(f => {
    const isActive = f.floor == floor;
    const wrap   = document.createElement('div'); wrap.className = 'fc-bar-wrap';
    const valLbl = document.createElement('div'); valLbl.className = 'fc-bar-val';
    valLbl.textContent = f.pct + '%'; valLbl.style.opacity = isActive ? '1' : '.4';
    const bar = document.createElement('div'); bar.className = 'fc-bar';
    bar.style.height = Math.round((f.pct / maxPct) * 70) + 'px';
    bar.style.background = isActive ? (f.pct > 80 ? '#8c2a38' : f.pct > 50 ? '#c08a10' : '#5a8a2a') : 'var(--maint)';
    bar.style.borderColor = bar.style.background;
    bar.style.opacity = isActive ? '1' : '.35';
    const lbl = document.createElement('div'); lbl.className = 'fc-bar-lbl';
    lbl.textContent = 'F' + f.floor;
    lbl.style.fontWeight = isActive ? '700' : '400';
    lbl.style.color = isActive ? 'var(--accent)' : 'var(--muted)';
    wrap.appendChild(valLbl); wrap.appendChild(bar); wrap.appendChild(lbl);
    chartEl.appendChild(wrap);
  });
}

// ====================================================================
//  FLOOR SELECTOR
// ====================================================================

const selEl = document.getElementById('floorSel');
const FLOOR_LABELS = ['Floor 0 (GF)', 'Floor 1', 'Floor 2', 'Floor 3', 'Floor 4', 'Floor 5', 'Floor 6'];

FLOOR_LABELS.forEach((lbl, i) => {
  const btn = document.createElement('button');
  btn.className = 'fbtn' + (i === 1 ? ' active' : '');
  btn.textContent = lbl;
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFloor = i;
    build(i);
    updateInfoPanel(i);
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
  return (floorData.rooms || []).filter(r => r.roomNumber.startsWith(tower + '-'));
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

popup.classList.add('hidden');

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

  if (!selectedRoomCode) { alert('Please select a room.');      return; }
  if (!name)             { alert('Please enter student name.'); return; }
  if (!roll)             { alert('Please enter roll number.');  return; }

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

currentFloor = 1;
build(1);
loadHostel();