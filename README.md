# 🏨 HostelOS — Hostel & Room Management System

A full-stack Hostel Management System built with **HTML, CSS, JavaScript, Node.js & MongoDB**.

---

## 🗂️ Project Structure

```
hostel-management/
├── server.js              # Express server entry point
├── seed.js                # Database seeding with demo data
├── .env                   # Environment variables
├── package.json
│
├── models/
│   ├── Room.js            # Room schema (block, floor, capacity, occupants)
│   ├── Student.js         # Student schema
│   ├── Complaint.js       # Complaint schema (with auto-assign to staff)
│   └── Maintenance.js     # Maintenance schema
│
├── routes/
│   ├── rooms.js           # CRUD + assign/vacate student
│   ├── students.js        # CRUD
│   ├── complaints.js      # CRUD + status update
│   ├── maintenance.js     # CRUD + status update
│   └── stats.js           # Aggregated statistics
│
└── public/
    ├── index.html         # Single-page app
    ├── css/style.css      # All styles
    └── js/app.js          # All frontend logic
```

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v16+)
- MongoDB (running locally or MongoDB Atlas)

### 2. Install Dependencies
```bash
cd hostel-management
npm install
```

### 3. Configure Environment
Edit `.env`:
```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/hostelDB
```

### 4. Seed the Database (optional but recommended)
```bash
npm run seed
```
This will populate:
- 54 rooms across 3 blocks (A, B, C), 3 floors each
- 10 sample students
- 5 complaints with auto-assigned staff contacts
- 5 maintenance issues

### 5. Start the Server
```bash
npm start          # Production
npm run dev        # Development with auto-reload (requires nodemon)
```

### 6. Open in Browser
Visit: **http://localhost:3000**

---

## ✨ Features

### 1. 🗺️ Aerial View (Floor Plan)
- Visual grid of rooms per block and floor
- Color coding: 🟢 Vacant · 🔵 Occupied · 🔴 Full · 🟡 Maintenance
- **Hover over any room** to see:
  - Room number, type, capacity
  - Full occupant list with name, roll number, course, year
- Switch between Block A, B, C

### 2. 📊 Statistics Dashboard
- Total rooms, students, occupancy rate, vacant beds
- Animated occupancy progress bar
- Block-wise breakdown with fill bars
- Complaints by status & category
- Maintenance by status

### 3. 📋 Complaints System
- Students can register complaints: Electrical, Plumbing, Internet, Furniture, Cleaning
- **Auto-assigns staff** based on category (electrician, plumber, etc.)
- **📞 Click-to-call button** opens phone app with staff number pre-filled
- Filter by status and category
- Warden can update status (Pending → In Progress → Resolved)

### 4. 🔧 Maintenance Tracker
- Report issues for: Gym, Kitchen, Common Room, Laundry, Garden, etc.
- Priority levels: Low, Medium, High, Critical (color-coded left border)
- Schedule repair teams, add dates and cost estimates
- Status tracking: Open → Scheduled → In Progress → Completed

---

## 🔌 API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/rooms | All rooms with occupants |
| GET | /api/rooms/block/:block | Rooms by block |
| GET | /api/rooms/:id | Single room |
| POST | /api/rooms | Create room |
| PATCH | /api/rooms/:id/assign | Assign student to room |
| PATCH | /api/rooms/:id/vacate | Remove student from room |
| GET | /api/students | All students |
| POST | /api/students | Add student |
| GET | /api/complaints | All complaints (filter: status, category) |
| POST | /api/complaints | Submit complaint |
| PATCH | /api/complaints/:id/status | Update complaint status |
| GET | /api/maintenance | All maintenance (filter: status, area) |
| POST | /api/maintenance | Report maintenance issue |
| PATCH | /api/maintenance/:id/status | Update maintenance status |
| GET | /api/stats | Aggregated dashboard data |

---

## 🛠️ Additional Features You Can Add
- **Student portal** (student login to submit complaints themselves)
- **Email/SMS notifications** on complaint assignment (nodemailer / Twilio)
- **Fee management** module
- **QR code** for each room
- **Export to PDF/Excel** (room occupancy reports)
- **Image uploads** for maintenance evidence (multer)
- **Authentication** with JWT (warden login)
- **Real-time updates** with Socket.io

---

## 🎨 Design
- White-based, minimal & professional
- Font: DM Sans + Syne (Google Fonts)
- Fully responsive layout
- Smooth animations and transitions
- Dark sidebar for navigation contrast
"# web-pro" 
