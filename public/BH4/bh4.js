// ===== GLOBAL STATE =====
let hostelData = null;
let currentFloor = 1;  
let currentMode = null;
let selectedRoomCode = null;

const API = 'http://localhost:3000/api/hostels/BH4';

// ===== FETCH DATA =====
async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('BH4 DB DATA:', hostelData);
    build(currentFloor);
    buildInfoGraphics();          // ← NEW
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
  // ✅ flat rooms array — no blocks
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
//  TOWER GRID
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
// ====================================================================

function mkTowerBlock(floor, tower) {
  const isMess = (tower === 'A' && floor === 0);
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
  hdrNote.textContent = isMess
    ? 'Mess / Dining Hall — Ground Floor'
    : 'Rooms ' + firstLbl + ' – ' + lastLbl + ' · 2 washrooms (perimeter layout)';
  hdr.appendChild(hdrLabel);
  hdr.appendChild(hdrNote);
  block.appendChild(hdr);

  if (isMess) {
    const mess  = div('', 'mess-block');
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
  const firstA = 'A-' + String(floor * 100 + 1).padStart(3, '0');
  const lastA  = 'A-' + String(floor * 100 + 20).padStart(3, '0');
  const firstB = 'B-' + String(floor * 100 + 1).padStart(3, '0');
  const lastB  = 'B-' + String(floor * 100 + 20).padStart(3, '0');
  const towerARange = floor === 0 ? 'Mess / Dining Hall (Ground Floor)' : firstA + ' – ' + lastA;

  const footer = div('', 'footer');
  const stats  = div('', 'stats-box');
  stats.innerHTML =
    '<strong>Floor ' + floor + ' — Twin Tower Complex (BH4)</strong><br>' +
    'Tower A: ' + towerARange + '<br>' +
    'Tower B: ' + firstB + ' – ' + lastB + '<br>' +
    '<em style="font-size:8px;opacity:.7">Room code: A-101, B-215 etc.</em>';

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
      : 'Floor ' + floor +
        ' — Tower A: A-' + String(floor*100+1).padStart(3,'0') + '–A-' + String(floor*100+20).padStart(3,'0') +
        ' · Tower B: B-' + String(floor*100+1).padStart(3,'0') + '–B-' + String(floor*100+20).padStart(3,'0');

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
  btn.className = 'fbtn' + (i === 1 ? ' active' : '');  // ✅ floor 1 active by default
  btn.textContent = lbl;
  btn.onclick = () => {
    document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFloor = i;
    build(i);
    buildInfoGraphics();
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
  // ✅ flat rooms, filter by tower prefix
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

// Ensure popup hidden on load
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
//  INFOGRAPHICS — STATS + CHARTS
// ====================================================================

function computeStats(floor) {
  if (!hostelData || !hostelData.floors) return null;

  let totalRooms = 0, totalCapacity = 0, totalStudents = 0;
  let vacant = 0, partial = 0, full = 0;
  const towerStats = {
    A: { rooms: 0, students: 0, capacity: 0 },
    B: { rooms: 0, students: 0, capacity: 0 }
  };

  const fd = hostelData.floors.find(f => f.floorNumber == floor);
  if (!fd) return { totalRooms: 0, totalCapacity: 0, totalStudents: 0,
                    vacant: 0, partial: 0, full: 0, towerStats, occupancyPct: 0 };

  (fd.rooms || []).forEach(room => {
    const tower    = room.roomNumber[0];
    const students = (room.students || []).length;
    const max      = room.maxCapacity || 2;

    totalRooms++;  totalStudents += students;  totalCapacity += max;

    if (tower === 'A' || tower === 'B') {
      towerStats[tower].rooms++;
      towerStats[tower].students += students;
      towerStats[tower].capacity += max;
    }

    if      (students === 0)   vacant++;
    else if (students >= max)  full++;
    else                       partial++;
  });

  const occupancyPct = totalCapacity > 0
    ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return { totalRooms, totalCapacity, totalStudents,
           vacant, partial, full, towerStats, occupancyPct };
}

/* ── Donut Chart SVG ── */
function mkSVGDonut(vacant, partial, full) {
  const total = vacant + partial + full;
  if (total === 0) return '<text x="100" y="105" text-anchor="middle" font-size="11" fill="#888">No Data</text>';

  const cx = 100, cy = 100, R = 72, r = 48;
  const colors  = ['#d4e9b0', '#f5d08a', '#c8687a'];
  const borders = ['#5a8a2a', '#c08a10', '#8c2a38'];
  const labels  = ['Vacant', 'Partial', 'Full'];
  const values  = [vacant, partial, full];
  let paths = '', startAngle = -Math.PI / 2;

  values.forEach((val, i) => {
    if (val === 0) return;
    const angle    = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;
    const large    = angle > Math.PI ? 1 : 0;
    const f = n => n.toFixed(2);

    const x1  = cx + R * Math.cos(startAngle), y1  = cy + R * Math.sin(startAngle);
    const x2  = cx + R * Math.cos(endAngle),   y2  = cy + R * Math.sin(endAngle);
    const ix1 = cx + r * Math.cos(endAngle),   iy1 = cy + r * Math.sin(endAngle);
    const ix2 = cx + r * Math.cos(startAngle), iy2 = cy + r * Math.sin(startAngle);

    paths += `<path d="M${f(x1)},${f(y1)} A${R},${R} 0 ${large},1 ${f(x2)},${f(y2)} L${f(ix1)},${f(iy1)} A${r},${r} 0 ${large},0 ${f(ix2)},${f(iy2)} Z"
      fill="${colors[i]}" stroke="${borders[i]}" stroke-width="1.5"/>`;
    startAngle = endAngle;
  });

  const center = `
    <text x="${cx}" y="${cy - 8}"  text-anchor="middle" font-size="22" font-weight="700" fill="#18160e" font-family="Courier New">${total}</text>
    <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="8"  fill="#5a5040"  font-family="Courier New">TOTAL ROOMS</text>`;

  let legend = '';
  values.forEach((val, i) => {
    const pct = Math.round((val / total) * 100);
    const ly  = 212 + i * 22;
    legend += `<rect x="16" y="${ly - 9}" width="12" height="10" rx="1" fill="${colors[i]}" stroke="${borders[i]}" stroke-width="1"/>`;
    legend += `<text x="33" y="${ly}" font-size="9" fill="#18160e" font-family="Courier New">${labels[i]}: ${val} (${pct}%)</text>`;
  });

  return paths + center + legend;
}

/* ── Stacked Bar Chart SVG ── */
function mkSVGBarChart(floorStats) {
  const W = 460, H = 150, padL = 34, padB = 26, padT = 8, padR = 10;
  const chartW = W - padL - padR, chartH = H - padB - padT;
  const floors = floorStats.filter(f => f.rooms > 0);
  if (!floors.length) return '<text x="230" y="75" text-anchor="middle" font-size="11" fill="#888">No Data</text>';

  const maxVal = Math.max(...floors.map(f => f.capacity), 1);
  const slot   = Math.floor(chartW / floors.length);
  const barW   = Math.max(slot - 8, 10);
  let bars = '', xLabels = '', grid = '';

  for (let i = 1; i <= 4; i++) {
    const y   = padT + chartH - (i / 4) * chartH;
    const val = Math.round((i / 4) * maxVal);
    grid += `<line x1="${padL}" y1="${y.toFixed(1)}" x2="${W - padR}" y2="${y.toFixed(1)}" stroke="#ddd" stroke-width="0.8" stroke-dasharray="3,3"/>`;
    grid += `<text x="${padL - 3}" y="${(y + 3).toFixed(1)}" font-size="7" text-anchor="end" fill="#888" font-family="Courier New">${val}</text>`;
  }

  floors.forEach((f, i) => {
    const x    = padL + i * slot + (slot - barW) / 2;
    const yBot = padT + chartH;
    const hA   = f.towerA > 0 ? Math.max((f.towerA / maxVal) * chartH, 2) : 0;
    const hB   = f.towerB > 0 ? Math.max((f.towerB / maxVal) * chartH, 2) : 0;

    if (hA > 0) bars += `<rect x="${x.toFixed(1)}" y="${(yBot - hA - hB).toFixed(1)}" width="${barW}" height="${hA.toFixed(1)}" fill="#1a4a8a" rx="1"/>`;
    if (hB > 0) bars += `<rect x="${x.toFixed(1)}" y="${(yBot - hB).toFixed(1)}" width="${barW}" height="${hB.toFixed(1)}" fill="#0d5c40" rx="1"/>`;

    xLabels += `<text x="${(x + barW / 2).toFixed(1)}" y="${(yBot + 14).toFixed(1)}" font-size="8" text-anchor="middle" fill="#5a5040" font-family="Courier New">F${f.floor}</text>`;
  });

  const axes   = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#7a7060" stroke-width="1"/>
                  <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#7a7060" stroke-width="1"/>`;
  const legend = `<rect x="${padL}" y="${H - 8}" width="9" height="8" fill="#1a4a8a"/>
                  <text x="${padL + 12}" y="${H - 1}" font-size="7" fill="#18160e" font-family="Courier New">Tower A</text>
                  <rect x="${padL + 62}" y="${H - 8}" width="9" height="8" fill="#0d5c40"/>
                  <text x="${padL + 75}" y="${H - 1}" font-size="7" fill="#18160e" font-family="Courier New">Tower B</text>`;

  return grid + bars + axes + xLabels + legend;
}

/* ── Horizontal Progress Bars for Tower Comparison ── */
function mkSVGTowerBars(towerStats) {
  const W = 460, rowH = 40, padL = 80;
  const towers = [
    { name: 'TOWER A', color: '#1a4a8a', ...towerStats.A },
    { name: 'TOWER B', color: '#0d5c40', ...towerStats.B }
  ];

  let out = '';
  const trackW = W - padL - 80;

  towers.forEach((t, i) => {
    const y   = i * rowH + 4;
    const pct = t.capacity > 0 ? t.students / t.capacity : 0;
    const bW  = Math.round(pct * trackW);
    const pLabel = Math.round(pct * 100) + '%';

    out += `<text x="0" y="${y + 14}" font-size="9" font-weight="700" fill="${t.color}" font-family="Courier New">${t.name}</text>`;
    out += `<rect x="${padL}" y="${y}" width="${trackW}" height="22" rx="2" fill="#e8e4d8" stroke="#bcbaa8" stroke-width="1"/>`;
    if (bW > 0)
      out += `<rect x="${padL}" y="${y}" width="${bW}" height="22" rx="2" fill="${t.color}"/>`;
    const lx     = bW > 45 ? padL + bW - 5 : padL + bW + 5;
    const anchor = bW > 45 ? 'end' : 'start';
    const lFill  = bW > 45 ? '#fff' : '#333';
    out += `<text x="${lx}" y="${y + 15}" font-size="9" font-weight="700" text-anchor="${anchor}" fill="${lFill}" font-family="Courier New">${pLabel}</text>`;
    out += `<text x="${padL + trackW + 6}" y="${y + 14}" font-size="8" fill="#5a5040" font-family="Courier New">${t.students}/${t.capacity} beds</text>`;
  });

  return out;
}

/* ── Main builder ── */
function buildInfoGraphics() {
  const section = document.getElementById('infographicsSection');
  if (!section) return;
  if (!hostelData || !hostelData.floors) return;

  const stats = computeStats(currentFloor);
  if (!stats) return;

  const { totalRooms, totalCapacity, totalStudents,
          vacant, partial, full, towerStats, occupancyPct } = stats;

  const pctColor = occupancyPct > 80 ? '#8c2a38' : occupancyPct > 50 ? '#c08a10' : '#5a8a2a';
  const floorLbl = currentFloor === 0 ? '0 (Ground Floor)' : currentFloor;

  const cards = [
    { label: 'TOTAL ROOMS',    value: totalRooms,         unit: 'rooms',       color: '#1a4a8a' },
    { label: 'TOTAL CAPACITY', value: totalCapacity,      unit: 'beds',        color: '#0d5c40' },
    { label: 'STUDENTS IN',    value: totalStudents,      unit: 'occupied',    color: '#c08a10' },
    { label: 'OCCUPANCY RATE', value: occupancyPct + '%', unit: 'of capacity', color: pctColor  },
    { label: 'VACANT ROOMS',   value: vacant,             unit: 'available',   color: '#5a8a2a' },
  ];

  const towerBarH = 2 * 40 + 10;

  section.innerHTML = `
    <div class="ig-header">
      <span class="ig-title">ANALYTICS</span>
      <span class="ig-sub">BH-4 · Boys Hostel · Floor ${floorLbl} · ${totalRooms} rooms · ${totalStudents}/${totalCapacity} occupied</span>
    </div>

    <div class="stat-cards-row">
      ${cards.map(c => `
        <div class="stat-card">
          <div class="stat-val" style="color:${c.color}">${c.value}</div>
          <div class="stat-label">${c.label}</div>
          <div class="stat-unit">${c.unit}</div>
        </div>`).join('')}
    </div>

    <div class="charts-row">

      <div class="chart-box" style="max-width:206px;">
        <div class="chart-title">Room Status Distribution</div>
        <svg viewBox="0 0 200 280" width="200" height="280" xmlns="http://www.w3.org/2000/svg">
          ${mkSVGDonut(vacant, partial, full)}
        </svg>
      </div>

      <div class="chart-box" style="flex:2;">
        <div class="chart-title">Tower A vs Tower B — Floor ${floorLbl} Utilisation</div>
        <svg viewBox="0 0 460 ${towerBarH}" width="100%" height="${towerBarH}" xmlns="http://www.w3.org/2000/svg">
          ${mkSVGTowerBars(towerStats)}
        </svg>
      </div>

    </div>`;
}


// ====================================================================
//  INIT
// ====================================================================

currentFloor = 1; 
build(1);
loadHostel();