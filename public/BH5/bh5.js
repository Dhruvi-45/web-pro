'use strict';

const API = 'http://localhost:3000/api/hostels/BH5';
let hostelData = null;

const P = {
  vacant:  { bg:'#d4e9b0', border:'#5a8a2a', text:'#2e5010', lbl:'Vacant' },
  partial: { bg:'#f5d08a', border:'#c08a10', text:'#5a3a05', lbl:'Partial occupied' },
  full:    { bg:'#f0b080', border:'#c05a20', text:'#4a1a05', lbl:'Fully occupied' }
};

const WING_COLOR = { A: '#1a4a8a', B: '#0d5c40' };

function fmt(n){ return n < 10 ? '00'+n : n < 100 ? '0'+n : String(n); }

// Room number → wing
function getWing(num){ return num <= 21 ? 'A' : 'B'; }

// ====================================================================
//  MONGODB DATA HELPERS
// ====================================================================

function getRoomData(num) {
  if (!hostelData || !hostelData.floors) return null;
  const roomCode = fmt(num);
  // BH5 is ground floor only — floorNumber 0
  const floorData = hostelData.floors.find(f => f.floorNumber == 0);
  if (!floorData) return null;
  return (floorData.rooms || []).find(r => r.roomNumber === roomCode) || null;
}

function getRoomStatus(num) {
  const room = getRoomData(num);
  if (!room) return 'vacant';
  const students = room.students || [];
  const max = room.maxCapacity || 1;
  if (students.length === 0)  return 'vacant';
  if (students.length >= max) return 'full';
  return 'partial';
}

// ====================================================================
//  DOM BUILDERS
// ====================================================================

const tipEl = document.getElementById('tip');

function mkStair(){
  const d = document.createElement('div');
  d.className = 'stair-cell';
  d.title = 'Staircase';
  d.textContent = '▲';
  return d;
}

function mkRoom(num) {
  const status = getRoomStatus(num);
  const pal    = P[status];
  const room   = getRoomData(num);
  const wing   = getWing(num);

  const d = document.createElement('div');
  d.className = 'room';
  d.style.background   = pal.bg;
  d.style.borderColor  = pal.border;
  d.style.color        = pal.text;
  d.textContent = fmt(num);

  d.addEventListener('mouseenter', function() {
    const count = room ? (room.students || []).length : 0;
    const max   = room ? (room.maxCapacity || 1) : 1;
    tipEl.innerHTML =
      '<strong>Room ' + fmt(num) + '</strong>' +
      '<span class="dot">&middot;</span>' + pal.lbl +
      '<span class="dot">&middot;</span>Wing ' + wing +
      '<span class="dot">&middot;</span>Occupancy: <strong>' + count + '/' + max + '</strong>';
  });
  d.addEventListener('mouseleave', function() {
    tipEl.innerHTML = '<span style="color:#9a9080">Hover over any room to see details</span>';
  });

  return d;
}

const LAYOUTS = [
  { wing: 'A', north:[1,2,3,4,5,6,'S',7,8,9,10,11,12],      south:[13,14,15,16,17,18,19,20,21] },
  { wing: 'B', north:[22,23,24,25,26,27,'S',28,29,30,31,32], south:[33,34,35,36,37,38,39,40,41,42] }
];

function mkRow(items) {
  const row = document.createElement('div');
  row.className = 'room-row';
  items.forEach(item => row.appendChild(item === 'S' ? mkStair() : mkRoom(item)));
  return row;
}

function mkWing(cfg) {
  const wing = document.createElement('div');
  wing.className = 'wing';
  wing.appendChild(mkRow(cfg.north));
  const corr = document.createElement('div');
  corr.className = 'corridor';
  const s = document.createElement('span');
  s.textContent = '— Wing ' + cfg.wing + ' corridor —';
  corr.appendChild(s);
  wing.appendChild(corr);
  wing.appendChild(mkRow(cfg.south));
  return wing;
}

function buildLegend() {
  const c = document.getElementById('legend');
  c.innerHTML = '';
  [
    { bg:'#d4e9b0', bc:'#5a8a2a', label:'Vacant' },
    { bg:'#f5d08a', bc:'#c08a10', label:'Partial occupied' },
    { bg:'#f0b080', bc:'#c05a20', label:'Fully occupied' },
    { bg:'#a0bcd8', bc:'#3a6898', label:'Staircase' }
  ].forEach(item => {
    const w  = document.createElement('div'); w.className = 'legend-item';
    const sw = document.createElement('div'); sw.className = 'legend-swatch';
    sw.style.background = item.bg; sw.style.borderColor = item.bc;
    const sp = document.createElement('span'); sp.textContent = item.label;
    w.appendChild(sw); w.appendChild(sp);
    c.appendChild(w);
  });
}

function buildBlueprint() {
  const wingsEl = document.getElementById('wings');
  wingsEl.innerHTML = '';
  LAYOUTS.forEach(cfg => wingsEl.appendChild(mkWing(cfg)));
}

// ====================================================================
//  INFOGRAPHICS
// ====================================================================

function updateInfoPanel() {
  if (!hostelData || !hostelData.floors) return;

  const floorData = hostelData.floors.find(f => f.floorNumber == 0);
  if (!floorData) return;

  let totalRooms = 0, occupiedRooms = 0, vacantRooms = 0, partialRooms = 0, fullRooms = 0;
  const wingStudents = { A: 0, B: 0 };

  (floorData.rooms || []).forEach(room => {
    const students = room.students || [];
    const max = room.maxCapacity || 1;
    totalRooms++;
    if (students.length === 0)       vacantRooms++;
    else if (students.length >= max) { fullRooms++;    occupiedRooms++; }
    else                             { partialRooms++; occupiedRooms++; }

    // room number se wing determine karo
    const num = parseInt(room.roomNumber);
    const wing = num <= 21 ? 'A' : 'B';
    wingStudents[wing] += students.length;
  });

  const occRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  document.getElementById('statTotalNum').textContent    = totalRooms;
  document.getElementById('statOccupiedNum').textContent = occupiedRooms;
  document.getElementById('statVacantNum').textContent   = vacantRooms;
  document.getElementById('statPartialNum').textContent  = partialRooms;
  document.getElementById('statOccRateNum').textContent  = occRate + '%';

  // Wing Bar Chart
  const wingBarEl = document.getElementById('wingBarChart');
  wingBarEl.innerHTML = '';
  const maxVal = Math.max(...Object.values(wingStudents), 1);
  Object.entries(wingStudents).forEach(([wing, count]) => {
    const color = WING_COLOR[wing];
    const wrap = document.createElement('div'); wrap.className = 'wb-bar-wrap';
    const val  = document.createElement('div'); val.className  = 'wb-val';
    val.textContent = count; val.style.color = color;
    const bar  = document.createElement('div'); bar.className  = 'wb-bar';
    bar.style.height     = Math.round((count / maxVal) * 80) + 'px';
    bar.style.background = color;
    bar.style.opacity    = count === 0 ? '.2' : '1';
    const lbl  = document.createElement('div'); lbl.className  = 'wb-lbl';
    lbl.textContent = 'Wing ' + wing;
    wrap.appendChild(val); wrap.appendChild(bar); wrap.appendChild(lbl);
    wingBarEl.appendChild(wrap);
  });

  // Pie Chart
  const pieData = [
    { label: 'Vacant',  value: vacantRooms,  color: '#5a8a2a' },
    { label: 'Partial', value: partialRooms, color: '#c08a10' },
    { label: 'Full',    value: fullRooms,    color: '#c05a20' },
  ].filter(d => d.value > 0);

  const canvas = document.getElementById('pieCanvas');
  const ctx    = canvas.getContext('2d');
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
}

// ====================================================================
//  INIT
// ====================================================================

async function loadHostel() {
  try {
    const res = await fetch(API);
    hostelData = await res.json();
    console.log('BH5 DB DATA:', hostelData);
    buildBlueprint(); // rooms ko MongoDB data se render karo
    updateInfoPanel();
  } catch(err) {
    console.error('Fetch error:', err);
    buildBlueprint(); // fallback — vacant dikhao
  }
}

buildLegend();
buildBlueprint(); // pehle render karo (vacant state)
loadHostel();    // phir DB se data aake update hoga