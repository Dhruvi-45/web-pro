const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Student = require('../models/Student');
const Complaint = require('../models/Complaint');
const Maintenance = require('../models/Maintenance');

router.get('/', async (req, res) => {
  try {
    const [rooms, students, complaints, maintenance] = await Promise.all([
      Room.find(),
      Student.find(),
      Complaint.find(),
      Maintenance.find()
    ]);

    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const totalOccupied = rooms.reduce((sum, r) => sum + r.occupants.length, 0);
    const totalVacant = totalCapacity - totalOccupied;

    const blockStats = {};
    rooms.forEach(room => {
      if (!blockStats[room.block]) {
        blockStats[room.block] = { total: 0, occupied: 0, capacity: 0, vacant: 0 };
      }
      blockStats[room.block].total++;
      blockStats[room.block].capacity += room.capacity;
      blockStats[room.block].occupied += room.occupants.length;
      blockStats[room.block].vacant += (room.capacity - room.occupants.length);
    });

    const complaintsByStatus = {
      Pending: complaints.filter(c => c.status === 'Pending').length,
      InProgress: complaints.filter(c => c.status === 'In Progress').length,
      Resolved: complaints.filter(c => c.status === 'Resolved').length,
    };

    const complaintsByCategory = {};
    complaints.forEach(c => {
      complaintsByCategory[c.category] = (complaintsByCategory[c.category] || 0) + 1;
    });

    const maintenanceByStatus = {
      Open: maintenance.filter(m => m.status === 'Open').length,
      InProgress: maintenance.filter(m => m.status === 'In Progress').length,
      Completed: maintenance.filter(m => m.status === 'Completed').length,
    };

    res.json({
      totalRooms: rooms.length,
      totalCapacity,
      totalOccupied,
      totalVacant,
      totalStudents: students.length,
      occupancyRate: totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : 0,
      blockStats,
      complaintsByStatus,
      complaintsByCategory,
      maintenanceByStatus,
      totalComplaints: complaints.length,
      totalMaintenance: maintenance.length,
      pendingComplaints: complaintsByStatus.Pending,
      openMaintenance: maintenanceByStatus.Open
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
