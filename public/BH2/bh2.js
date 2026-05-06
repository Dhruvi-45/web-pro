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
    buildInfoGraphics();          // ← NEW
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
    '<strong>Floor ' + floor + ' — Boys Hostel BH-2</strong><br>' +
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
    buildInfoGraphics();
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
//  INFOGRAPHICS — STATS + CHARTS
// ====================================================================

function computeStats(floor) {
    console.log('computeStats called — hostelData:', hostelData, '| floor:', floor);
  if (!hostelData || !hostelData.floors) return null;

  const WINGS = ['A','B','C','D','E'];
  let totalRooms = 0, totalCapacity = 0, totalStudents = 0;
  let vacant = 0, partial = 0, full = 0;

  const wingStats = {};
  WINGS.forEach(w => wingStats[w] = { rooms: 0, students: 0, capacity: 0 });

  // ← Only process the selected floor
  const fd = hostelData.floors.find(f => f.floorNumber == floor);
  if (!fd) return { totalRooms: 0, totalCapacity: 0, totalStudents: 0,
                    vacant: 0, partial: 0, full: 0, wingStats, occupancyPct: 0 };

  (fd.rooms || []).forEach(room => {
    const wing     = room.roomNumber[0];
    const students = (room.students || []).length;
    const max      = room.maxCapacity || 2;

    totalRooms++;  totalStudents += students;  totalCapacity += max;

    if (wingStats[wing]) {
      wingStats[wing].rooms++;
      wingStats[wing].students += students;
      wingStats[wing].capacity += max;
    }

    if      (students === 0)   vacant++;
    else if (students >= max)  full++;
    else                       partial++;
  });

  const occupancyPct = totalCapacity > 0
    ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  return { totalRooms, totalCapacity, totalStudents,
           vacant, partial, full, wingStats, occupancyPct };
}

/* ── Donut Chart ── */
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

/* ── Floor Bar Chart (one bar per floor, students vs capacity backdrop) ── */
function mkSVGBarChart(floorStats) {
  const W = 460, H = 150, padL = 34, padB = 26, padT = 8, padR = 10;
  const chartW = W - padL - padR, chartH = H - padB - padT;
  const floors = floorStats.filter(f => f.rooms > 0);
  if (!floors.length) return '<text x="230" y="75" text-anchor="middle" font-size="11" fill="#888">No Data</text>';

  const maxVal = Math.max(...floors.map(f => f.capacity), 1);
  const slot   = Math.floor(chartW / floors.length);
  const barW   = Math.max(slot - 10, 10);
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

    // Capacity backdrop (light grey)
    const hCap = Math.max((f.capacity / maxVal) * chartH, 2);
    bars += `<rect x="${x.toFixed(1)}" y="${(yBot - hCap).toFixed(1)}" width="${barW}" height="${hCap.toFixed(1)}" fill="#e8e4d8" rx="1"/>`;

    // Students bar (accent red for BH1)
    const hStu = f.students > 0 ? Math.max((f.students / maxVal) * chartH, 2) : 0;
    if (hStu > 0)
      bars += `<rect x="${x.toFixed(1)}" y="${(yBot - hStu).toFixed(1)}" width="${barW}" height="${hStu.toFixed(1)}" fill="var(--accent, #8c2a38)" rx="1"/>`;

    xLabels += `<text x="${(x + barW / 2).toFixed(1)}" y="${(yBot + 14).toFixed(1)}" font-size="8" text-anchor="middle" fill="#5a5040" font-family="Courier New">F${f.floor}</text>`;
  });

  const axes   = `<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#7a7060" stroke-width="1"/>
                  <line x1="${padL}" y1="${padT + chartH}" x2="${W - padR}" y2="${padT + chartH}" stroke="#7a7060" stroke-width="1"/>`;
  const legend = `<rect x="${padL}" y="${H - 8}" width="9" height="8" fill="#8c2a38"/>
                  <text x="${padL + 12}" y="${H - 1}" font-size="7" fill="#18160e" font-family="Courier New">Students</text>
                  <rect x="${padL + 68}" y="${H - 8}" width="9" height="8" fill="#e8e4d8" stroke="#bcbaa8" stroke-width="1"/>
                  <text x="${padL + 81}" y="${H - 1}" font-size="7" fill="#18160e" font-family="Courier New">Capacity</text>`;

  return grid + bars + axes + xLabels + legend;
}

/* ── Wing Comparison — 5 horizontal progress bars ── */
function mkSVGWingBars(wingStats) {
  const WINGS = ['A','B','C','D','E'];
  const COLORS = { A: '#1a4a8a', B: '#0d5c40', C: '#7a3e08', D: '#8c2a18', E: '#42288a' };
  const W = 460, rowH = 34, padL = 70;
  const trackW = W - padL - 90;
  let out = '';

  WINGS.forEach((wing, i) => {
    const t    = wingStats[wing] || { rooms: 0, students: 0, capacity: 0 };
    const y    = i * rowH + 2;
    const pct  = t.capacity > 0 ? t.students / t.capacity : 0;
    const bW   = Math.round(pct * trackW);
    const pLbl = Math.round(pct * 100) + '%';

    out += `<text x="0" y="${y + 14}" font-size="9" font-weight="700" fill="${COLORS[wing]}" font-family="Courier New">WING ${wing}</text>`;
    out += `<rect x="${padL}" y="${y}" width="${trackW}" height="20" rx="2" fill="#e8e4d8" stroke="#bcbaa8" stroke-width="1"/>`;
    if (bW > 0)
      out += `<rect x="${padL}" y="${y}" width="${bW}" height="20" rx="2" fill="${COLORS[wing]}"/>`;

    const lx     = bW > 45 ? padL + bW - 5 : padL + bW + 5;
    const anchor = bW > 45 ? 'end' : 'start';
    const lFill  = bW > 45 ? '#fff' : '#333';
    out += `<text x="${lx}" y="${y + 14}" font-size="9" font-weight="700" text-anchor="${anchor}" fill="${lFill}" font-family="Courier New">${pLbl}</text>`;
    out += `<text x="${padL + trackW + 6}" y="${y + 14}" font-size="8" fill="#5a5040" font-family="Courier New">${t.students}/${t.capacity}</text>`;
  });

  return out;
}

/* ── Main builder ── */
function buildInfoGraphics() {
  const section = document.getElementById('infographicsSection');
  if (!section) return;
    if (!hostelData || !hostelData.floors) return;
  const stats = computeStats(currentFloor);
  if (!stats) {
    section.innerHTML = '<div style="text-align:center;color:var(--muted);font-size:10px;padding:20px;">Loading analytics…</div>';
    return;
  }

  const { totalRooms, totalCapacity, totalStudents,
          vacant, partial, full, wingStats, occupancyPct } = stats;

  const pctColor = occupancyPct > 80 ? '#8c2a38' : occupancyPct > 50 ? '#c08a10' : '#5a8a2a';

  const cards = [
    { label: 'TOTAL ROOMS',    value: totalRooms,         unit: 'rooms',       color: '#1a4a8a' },
    { label: 'TOTAL CAPACITY', value: totalCapacity,      unit: 'beds',        color: '#0d5c40' },
    { label: 'STUDENTS IN',    value: totalStudents,      unit: 'occupied',    color: '#c08a10' },
    { label: 'OCCUPANCY RATE', value: occupancyPct + '%', unit: 'of capacity', color: pctColor  },
    { label: 'VACANT ROOMS',   value: vacant,             unit: 'available',   color: '#5a8a2a' },
  ];

  const cardHTML = cards.map(c => `
    <div class="stat-card">
      <div class="stat-val" style="color:${c.color}">${c.value}</div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-unit">${c.unit}</div>
    </div>`).join('');

  const wingBarHeight = 5 * 34 + 10;   // 5 wings × rowH + padding

  section.innerHTML = `
    <div class="ig-header">
      <span class="ig-title">OCCUPANCY ANALYTICS</span>
      <span class="ig-sub">BH-2 · Boys Hostel · Floor ${currentFloor === 0 ? '0 (Ground Floor)' : currentFloor}</span>
    </div>

    <div class="stat-cards-row">${cardHTML}</div>

    <div class="charts-row">

      

      <div class="chart-box" style="max-width:210px;">
        <div class="chart-title">Room Status Distribution</div>
        <svg viewBox="0 0 200 280" width="200" height="280" xmlns="http://www.w3.org/2000/svg">
          ${mkSVGDonut(vacant, partial, full)}
        </svg>
      </div>

      <div class="chart-box" style="flex:2;">
        <div class="chart-title">Wing-wise Capacity Utilisation (A · B · C · D · E)</div>
        <svg viewBox="0 0 460 ${wingBarHeight}" width="100%" height="${wingBarHeight}" xmlns="http://www.w3.org/2000/svg">
          ${mkSVGWingBars(wingStats)}
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