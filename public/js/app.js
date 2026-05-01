/* ============================================================
   HostelOS — Frontend Application Logic
   ============================================================ */

const API = '';  // Same origin — change if using separate backend port

// ==================== TAB NAVIGATION ====================
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const tab = item.dataset.tab;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');

    if (tab === 'aerial') loadAerialView(currentBlock);
    else if (tab === 'stats') loadStats();
    else if (tab === 'complaints') loadComplaints();
    else if (tab === 'maintenance') loadMaintenance();
  });
});

// ==================== AERIAL VIEW ====================
let currentBlock = 'A';
let allRooms = [];

document.querySelectorAll('.block-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.block-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentBlock = btn.dataset.block;
    loadAerialView(currentBlock);
  });
});

async function loadAerialView(block) {
  const container = document.getElementById('building-view');
  container.innerHTML = `<div class="loading-spinner">Loading block ${block}...</div>`;
  try {
    const res = await fetch(`${API}/api/rooms/block/${block}`);
    allRooms = await res.json();
    renderBuilding(allRooms, block);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load rooms</h3><p>Make sure the server is running</p></div>`;
  }
}

function renderBuilding(rooms, block) {
  const container = document.getElementById('building-view');
  container.innerHTML = '';

  const floors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => b - a);
  const floorNames = { 1: 'Ground Floor', 2: 'First Floor', 3: 'Second Floor', 4: 'Third Floor' };

  floors.forEach(floor => {
    const floorRooms = rooms.filter(r => r.floor === floor).sort((a, b) => {
      const colA = a.position?.col || parseInt(a.roomNumber.slice(-1));
      const colB = b.position?.col || parseInt(b.roomNumber.slice(-1));
      return colA - colB;
    });

    const section = document.createElement('div');
    section.className = 'floor-section';
    section.innerHTML = `
      <div class="floor-label">Floor ${floor}</div>
      <div class="floor-corridor">
        <div class="corridor-label">Block ${block} — ${floorNames[floor] || `Floor ${floor}`}</div>
        <div class="rooms-row" id="floor-${floor}-rooms"></div>
      </div>
    `;
    container.appendChild(section);

    const rowContainer = section.querySelector(`#floor-${floor}-rooms`);
    floorRooms.forEach(room => {
      rowContainer.appendChild(createRoomCell(room));
    });
  });
}

function createRoomCell(room) {
  const cell = document.createElement('div');
  const occupancy = room.occupants ? room.occupants.length : 0;
  const capacity = room.capacity;

  let statusClass = 'vacant';
  if (room.status === 'Under Maintenance') statusClass = 'maintenance';
  else if (occupancy >= capacity) statusClass = 'full';
  else if (occupancy > 0) statusClass = 'occupied';

  cell.className = `room-cell ${statusClass}`;
  cell.dataset.roomId = room._id;

  let dotsHtml = '';
  for (let i = 0; i < capacity; i++) {
    dotsHtml += `<div class="bed-dot ${i < occupancy ? 'taken' : ''}"></div>`;
  }

  cell.innerHTML = `
    <div class="room-number">${room.roomNumber}</div>
    <div class="room-occupancy-icon">${dotsHtml}</div>
  `;

  cell.addEventListener('mouseenter', (e) => showTooltip(e, room));
  cell.addEventListener('mousemove', (e) => moveTooltip(e));
  cell.addEventListener('mouseleave', hideTooltip);

  return cell;
}

const tooltip = document.getElementById('room-tooltip');

function showTooltip(e, room) {
  const occupancy = room.occupants ? room.occupants.length : 0;

  document.getElementById('tip-room').textContent = room.roomNumber;
  document.getElementById('tip-type').textContent = room.type;
  document.getElementById('tip-occ').textContent = `${occupancy}/${room.capacity} Occupied · ${room.capacity - occupancy} Vacant`;

  const studentsEl = document.getElementById('tip-students');
  studentsEl.innerHTML = '';

  if (occupancy === 0) {
    studentsEl.innerHTML = `<div class="no-occupant">Room is vacant</div>`;
  } else {
    room.occupants.forEach(s => {
      const initial = (s.name || 'S')[0].toUpperCase();
      studentsEl.innerHTML += `
        <div class="tooltip-student">
          <div class="tstudent-avatar">${initial}</div>
          <div>
            <div class="tstudent-name">${s.name || 'Unknown'}</div>
            <div class="tstudent-info">${s.rollNumber || ''} · ${s.course || ''} · Year ${s.year || ''}</div>
          </div>
        </div>
      `;
    });
  }

  tooltip.classList.add('visible');
  moveTooltip(e);
}

function moveTooltip(e) {
  const x = e.clientX + 16;
  const y = e.clientY - 10;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  tooltip.style.left = (x + tw > vw ? e.clientX - tw - 16 : x) + 'px';
  tooltip.style.top = (y + th > vh ? e.clientY - th - 10 : y) + 'px';
}

function hideTooltip() { tooltip.classList.remove('visible'); }

// Load on start
loadAerialView('A');

// ==================== STATISTICS ====================
async function loadStats() {
  try {
    const res = await fetch(`${API}/api/stats`);
    const data = await res.json();
    renderStats(data);
  } catch (err) {
    showToastMsg('Failed to load statistics');
  }
}

function renderStats(data) {
  document.getElementById('stat-total-rooms').textContent = data.totalRooms;
  document.getElementById('stat-students').textContent = data.totalStudents;
  document.getElementById('stat-occupancy').textContent = data.occupancyRate + '%';
  document.getElementById('stat-vacant').textContent = data.totalVacant;

  // Occupancy bar
  setTimeout(() => {
    document.getElementById('occ-bar').style.width = data.occupancyRate + '%';
  }, 100);
  document.getElementById('occ-occupied-label').textContent = `${data.totalOccupied} beds occupied`;
  document.getElementById('occ-vacant-label').textContent = `${data.totalVacant} beds vacant`;

  // Block cards
  const blockCards = document.getElementById('block-cards');
  blockCards.innerHTML = '';
  Object.entries(data.blockStats).forEach(([block, stats]) => {
    const pct = stats.capacity > 0 ? ((stats.occupied / stats.capacity) * 100).toFixed(0) : 0;
    blockCards.innerHTML += `
      <div class="block-card">
        <div class="block-card-title">Block ${block}</div>
        <div class="block-bar-wrap">
          <div class="block-bar" style="width:0%" data-pct="${pct}"></div>
        </div>
        <div class="block-nums">
          <span>${stats.occupied}/${stats.capacity} beds occupied</span>
          <span style="color:var(--accent);font-weight:700">${pct}%</span>
        </div>
        <div style="margin-top:12px;display:flex;gap:12px;font-size:12px;color:var(--text-muted)">
          <span>🏠 ${stats.total} Rooms</span>
          <span>✅ ${stats.vacant} Vacant</span>
        </div>
      </div>
    `;
  });

  setTimeout(() => {
    document.querySelectorAll('.block-bar').forEach(bar => {
      bar.style.width = bar.dataset.pct + '%';
    });
  }, 100);

  // Complaint bars
  const cColors = { Pending: '#f59e0b', InProgress: '#3b82f6', Resolved: '#10b981' };
  const cLabels = { Pending: 'Pending', InProgress: 'In Progress', Resolved: 'Resolved' };
  const cMax = Math.max(...Object.values(data.complaintsByStatus), 1);
  const complaintBars = document.getElementById('complaint-bars');
  complaintBars.innerHTML = Object.entries(data.complaintsByStatus).map(([k, v]) => `
    <div class="mini-bar-row">
      <div class="mini-bar-label">${cLabels[k]}</div>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${(v/cMax*100)}%;background:${cColors[k]}"></div>
      </div>
      <div class="mini-bar-count">${v}</div>
    </div>
  `).join('');

  // Maintenance bars
  const mColors = { Open: '#ef4444', InProgress: '#f59e0b', Completed: '#10b981' };
  const mLabels = { Open: 'Open', InProgress: 'In Progress', Completed: 'Completed' };
  const mMax = Math.max(...Object.values(data.maintenanceByStatus), 1);
  const maintBars = document.getElementById('maintenance-bars');
  maintBars.innerHTML = Object.entries(data.maintenanceByStatus).map(([k, v]) => `
    <div class="mini-bar-row">
      <div class="mini-bar-label">${mLabels[k]}</div>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${(v/mMax*100)}%;background:${mColors[k]}"></div>
      </div>
      <div class="mini-bar-count">${v}</div>
    </div>
  `).join('');

  // Category bars
  const catColors = { Electrical: '#fbbf24', Plumbing: '#38bdf8', Internet: '#a78bfa', Furniture: '#f472b6', Cleaning: '#4ade80', Other: '#94a3b8' };
  const catMax = Math.max(...Object.values(data.complaintsByCategory || {}), 1);
  const catBars = document.getElementById('category-bars');
  catBars.innerHTML = Object.entries(data.complaintsByCategory || {}).map(([k, v]) => `
    <div class="mini-bar-row">
      <div class="mini-bar-label">${k}</div>
      <div class="mini-bar-track">
        <div class="mini-bar-fill" style="width:${(v/catMax*100)}%;background:${catColors[k]||'#64748b'}"></div>
      </div>
      <div class="mini-bar-count">${v}</div>
    </div>
  `).join('');

  // Update badges
  if (data.pendingComplaints > 0) {
    document.getElementById('complaint-badge').textContent = data.pendingComplaints;
    document.getElementById('complaint-badge').style.display = 'block';
  }
  if (data.openMaintenance > 0) {
    document.getElementById('maint-badge').textContent = data.openMaintenance;
    document.getElementById('maint-badge').style.display = 'block';
  }
}

// ==================== COMPLAINTS ====================
const categoryIcons = {
  Electrical: '⚡', Plumbing: '🚿', Internet: '📶',
  Furniture: '🪑', Cleaning: '🧹', Other: '📋'
};

async function loadComplaints() {
  const list = document.getElementById('complaint-list');
  list.innerHTML = `<div class="loading-spinner">Loading complaints...</div>`;
  const status = document.getElementById('complaint-filter-status').value;
  const category = document.getElementById('complaint-filter-cat').value;

  let url = `${API}/api/complaints?`;
  if (status) url += `status=${status}&`;
  if (category) url += `category=${category}`;

  try {
    const res = await fetch(url);
    const complaints = await res.json();
    renderComplaints(complaints);
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3></div>`;
  }
}

function renderComplaints(complaints) {
  const list = document.getElementById('complaint-list');
  if (!complaints.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><h3>No complaints found</h3><p>All clear!</p></div>`;
    return;
  }
  list.innerHTML = complaints.map(c => {
    const icon = categoryIcons[c.category] || '📋';
    const statusClass = c.status.replace(' ', '-');
    const phone = c.assignedTo?.phone;
    const callHref = phone ? `tel:${phone}` : '#';
    const assignName = c.assignedTo?.name || 'Unassigned';
    const timeAgo = getTimeAgo(c.createdAt);

    return `
      <div class="complaint-card" id="complaint-${c._id}">
        <div class="complaint-icon-wrap cat-${c.category}">${icon}</div>
        <div class="complaint-main">
          <div class="complaint-title">${c.description}</div>
          <div class="complaint-meta">
            <strong>${c.studentName}</strong> · ${c.rollNumber} · Room ${c.roomNumber} · Block ${c.block} · ${timeAgo}
          </div>
        </div>
        <div class="complaint-assign">
          <div class="assign-name">👤 ${assignName}</div>
          ${phone ? `<a class="call-btn" href="${callHref}">
            📞 Call ${c.assignedTo?.role || 'Staff'}
          </a>` : '<span style="font-size:11px;color:var(--text-muted)">No contact</span>'}
        </div>
        <div class="complaint-right">
          <span class="status-badge ${statusClass}">${c.status}</span>
          <span class="priority-badge ${c.priority}">${c.priority}</span>
          <select class="status-select" onchange="updateComplaintStatus('${c._id}', this.value)">
            <option ${c.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option ${c.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${c.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
            <option ${c.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </div>
      </div>
    `;
  }).join('');
}

async function updateComplaintStatus(id, status) {
  try {
    await fetch(`${API}/api/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showToastMsg(`Status updated to ${status}`);
    loadComplaints();
  } catch (err) {
    showToastMsg('Failed to update status');
  }
}

async function submitComplaint() {
  const body = {
    studentName: document.getElementById('c-name').value.trim(),
    rollNumber: document.getElementById('c-roll').value.trim(),
    roomNumber: document.getElementById('c-room').value.trim(),
    block: document.getElementById('c-block').value,
    category: document.getElementById('c-category').value,
    priority: document.getElementById('c-priority').value,
    description: document.getElementById('c-desc').value.trim()
  };

  if (!body.studentName || !body.rollNumber || !body.roomNumber || !body.description) {
    showToastMsg('⚠️ Please fill all required fields');
    return;
  }

  try {
    const res = await fetch(`${API}/api/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error();
    closeModal('complaint-modal');
    showToastMsg('✅ Complaint submitted successfully!');
    loadComplaints();
    loadStats();
    // Clear form
    ['c-name','c-roll','c-room','c-desc'].forEach(id => document.getElementById(id).value = '');
  } catch (err) {
    showToastMsg('Failed to submit complaint');
  }
}

// ==================== MAINTENANCE ====================
const areaIcons = {
  Gym: '🏋️', Kitchen: '🍽️', 'Common Room': '📺', Laundry: '👕',
  Garden: '🌿', Bathroom: '🚿', Corridor: '🚪', Parking: '🚗',
  Library: '📚', Roof: '🏠'
};

async function loadMaintenance() {
  const grid = document.getElementById('maintenance-grid');
  grid.innerHTML = `<div class="loading-spinner">Loading maintenance records...</div>`;
  const status = document.getElementById('maint-filter-status').value;
  const area = document.getElementById('maint-filter-area').value;

  let url = `${API}/api/maintenance?`;
  if (status) url += `status=${status}&`;
  if (area) url += `area=${encodeURIComponent(area)}`;

  try {
    const res = await fetch(url);
    const records = await res.json();
    renderMaintenance(records);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Failed to load</h3></div>`;
  }
}

function renderMaintenance(records) {
  const grid = document.getElementById('maintenance-grid');
  if (!records.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">✅</div><h3>No maintenance issues</h3><p>Everything is running smoothly!</p></div>`;
    return;
  }
  grid.innerHTML = records.map(m => {
    const icon = areaIcons[m.area] || '⚙️';
    const statusClass = m.status.replace(' ', '-');
    const timeAgo = getTimeAgo(m.createdAt);

    return `
      <div class="maint-card maint-priority-${m.priority}">
        <div class="maint-card-top">
          <div class="maint-area-badge">
            <div class="maint-area-icon">${icon}</div>
            <div>
              <div style="font-size:13px;font-weight:700">${m.area}</div>
              <div style="font-size:11px;color:var(--text-muted)">Block: ${m.block || 'Common'}</div>
            </div>
          </div>
          <span class="status-badge maint-status-${statusClass}">${m.status}</span>
        </div>
        <div class="maint-title">${m.issueTitle}</div>
        <div class="maint-desc">${m.description}</div>
        <div class="maint-meta">
          Reported by <strong>${m.reportedBy}</strong> ${m.rollNumber ? `(${m.rollNumber})` : ''} · ${timeAgo}
          ${m.assignedTeam ? `<br>🔧 Team: <strong>${m.assignedTeam}</strong>` : ''}
          ${m.scheduledDate ? `<br>📅 Scheduled: ${new Date(m.scheduledDate).toLocaleDateString()}` : ''}
          ${m.estimatedCost ? `<br>💰 Est. Cost: ₹${m.estimatedCost}` : ''}
        </div>
        <div class="maint-footer">
          <span class="priority-badge ${m.priority}">⚠ ${m.priority} Priority</span>
          <select class="status-select" onchange="updateMaintenanceStatus('${m._id}', this.value)">
            <option ${m.status === 'Open' ? 'selected' : ''}>Open</option>
            <option ${m.status === 'Scheduled' ? 'selected' : ''}>Scheduled</option>
            <option ${m.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option ${m.status === 'Completed' ? 'selected' : ''}>Completed</option>
            <option ${m.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
          </select>
        </div>
      </div>
    `;
  }).join('');
}

async function updateMaintenanceStatus(id, status) {
  try {
    await fetch(`${API}/api/maintenance/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    showToastMsg(`Status updated to ${status}`);
    loadMaintenance();
  } catch (err) {
    showToastMsg('Failed to update status');
  }
}

async function submitMaintenance() {
  const body = {
    reportedBy: document.getElementById('m-name').value.trim(),
    rollNumber: document.getElementById('m-roll').value.trim(),
    area: document.getElementById('m-area').value,
    block: document.getElementById('m-block').value,
    issueTitle: document.getElementById('m-title').value.trim(),
    priority: document.getElementById('m-priority').value,
    description: document.getElementById('m-desc').value.trim()
  };

  if (!body.reportedBy || !body.issueTitle || !body.description) {
    showToastMsg('⚠️ Please fill all required fields');
    return;
  }

  try {
    const res = await fetch(`${API}/api/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error();
    closeModal('maintenance-modal');
    showToastMsg('✅ Maintenance issue reported!');
    loadMaintenance();
    loadStats();
    ['m-name','m-roll','m-title','m-desc'].forEach(id => document.getElementById(id).value = '');
  } catch (err) {
    showToastMsg('Failed to submit maintenance issue');
  }
}

// ==================== MODALS ====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ==================== TOAST ====================
function showToastMsg(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== UTILS ====================
function getTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ==================== INITIAL LOAD ====================
loadStats();
loadComplaints();
loadMaintenance();
