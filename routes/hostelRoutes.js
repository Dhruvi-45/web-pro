const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');

// ================= GET HOSTEL =================
router.get('/hostels/:hostelName', async (req, res) => {
  try {
    const hostel = await Hostel.findOne({ hostelName: req.params.hostelName });
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });
    res.json(hostel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= ADD STUDENT =================
router.post('/hostels/:hostelName/rooms/:roomCode/students', async (req, res) => {
  try {
    const { hostelName, roomCode } = req.params;
    const { name, rollNo } = req.body;

    if (!name || !rollNo)
      return res.status(400).json({ message: "name and rollNo are required" });

    const hostel = await Hostel.findOne({ hostelName });
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });

    for (const floor of hostel.floors) {
      const room = (floor.rooms || []).find(r => r.roomNumber === roomCode);
      if (room) {
        if ((room.students || []).length >= room.maxCapacity)
          return res.status(400).json({ message: "Room is full" });

        room.students.push({ name, rollNo });
        await hostel.save();
        return res.json({ message: "Student added successfully", room });
      }
    }

    res.status(404).json({ message: "Room not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= REMOVE STUDENT =================
router.delete('/hostels/:hostelName/rooms/:roomCode/students/:rollNo', async (req, res) => {
  try {
    const { hostelName, roomCode, rollNo } = req.params;

    const hostel = await Hostel.findOne({ hostelName });
    if (!hostel) return res.status(404).json({ message: "Hostel not found" });

    for (const floor of hostel.floors) {
      const room = (floor.rooms || []).find(r => r.roomNumber === roomCode);
      if (room) {
        const before = (room.students || []).length;
        room.students = (room.students || []).filter(s => s.rollNo !== rollNo);

        if (room.students.length === before)
          return res.status(404).json({ message: "Student not found in this room" });

        await hostel.save();
        return res.json({ message: "Student removed successfully", room });
      }
    }

    res.status(404).json({ message: "Room not found" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;