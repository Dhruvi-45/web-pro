const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel');

router.get('/hostels/:name', async (req, res) => {
    try {
        const hostel = await Hostel.findOne({ hostelName: req.params.name });  
      if (!hostel) {
        return res.status(404).json({ error: "Hostel not found" });
      }
  
      res.json(hostel);const express = require('express');
      const router = express.Router();
      const Hostel = require('../models/Hostel');
      
      
      // ================= GET HOSTEL =================
      router.get('/hostels/:hostelName', async (req, res) => {
        try {
          const hostel = await Hostel.findOne({ hostelName: req.params.hostelName });
      
          if (!hostel) {
            return res.status(404).json({ message: "Hostel not found" });
          }
      
          res.json(hostel);
      
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
      
      
      // ================= ADD STUDENT =================
      router.post('/hostels/add-student', async (req, res) => {
        try {
          const { hostelName, floorNumber, roomNumber, name, rollNo } = req.body;
      
          const hostel = await Hostel.findOne({ hostelName });
          if (!hostel) return res.status(404).json({ message: "Hostel not found" });
      
          const floor = hostel.floors.find(f => f.floorNumber == floorNumber);
          if (!floor) return res.status(404).json({ message: "Floor not found" });
      
          const room = floor.rooms.find(r => r.roomNumber === roomNumber);
          if (!room) return res.status(404).json({ message: "Room not found" });
      
          if (room.students.length >= room.maxCapacity) {
            return res.json({ message: "Room full" });
          }
      
          room.students.push({ name, rollNo });
      
          await hostel.save();
      
          res.json({ message: "Student added", room });
      
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
      
      
      // ================= REMOVE STUDENT =================
      router.post('/remove-student', async (req, res) => {
        try {
          const { hostelName, floorNumber, roomNumber, rollNo } = req.body;
      
          const hostel = await Hostel.findOne({ hostelName });
          if (!hostel) return res.status(404).json({ message: "Hostel not found" });
      
          const floor = hostel.floors.find(f => f.floorNumber == floorNumber);
          if (!floor) return res.status(404).json({ message: "Floor not found" });
      
          const room = floor.rooms.find(r => r.roomNumber === roomNumber);
          if (!room) return res.status(404).json({ message: "Room not found" });
      
          const before = room.students.length;
      
          room.students = room.students.filter(s => s.rollNo !== rollNo);
      
          if (room.students.length === before) {
            return res.status(404).json({ message: "Student not found" });
          }
      
          await hostel.save();
      
          res.json({ message: "Student removed", room });
      
        } catch (err) {
          res.status(500).json({ error: err.message });
        }
      });
      
      module.exports = router;
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
// GET ALL HOSTELS (for dashboard)
router.get('/', async (req, res) => {
    try {
        const hostels = await Hostel.find();
        res.json(hostels);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ADD STUDENT
router.post('/hostels/add-student', async (req, res) => {
    const { hostelName, floorNumber, roomNumber, name, rollNo } = req.body;
  
    const hostel = await Hostel.findOne({ hostelName });
  
    const floor = hostel.floors.find(f => f.floorNumber == floorNumber);
    const room = floor.rooms.find(r => r.roomNumber === roomNumber);
  
    if (room.students.length >= room.maxCapacity) {
      return res.json({ message: "Room full" });
    }
  
    room.students.push({ name, rollNo });
  
    await hostel.save();
  
    res.json({ message: "Student added" });
  });


//REMOVE STUDENT
router.post('/remove-student', async (req, res) => {
    try {
        const { hostelName, floorNumber, roomNumber, rollNo } = req.body;

        const hostel = await Hostel.findOne({ hostelName });
        if (!hostel) {
            return res.status(404).json({ message: "Hostel not found" });
        }

        const floor = hostel.floors.find(f => f.floorNumber == floorNumber);
        if (!floor) {
            return res.status(404).json({ message: "Floor not found" });
        }

        const room = floor.rooms.find(r => r.roomNumber == roomNumber);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const initialLength = room.students.length;

        room.students = room.students.filter(s => s.rollNo !== rollNo);

        if (room.students.length === initialLength) {
            return res.status(404).json({ message: "Student not found in room" });
        }

        await hostel.save();

        res.json({ message: "Student removed successfully", room });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// GET SINGLE HOSTEL
router.get('/:hostelName', async (req, res) => {
    try {
        const hostel = await Hostel.findOne({ hostelName: req.params.hostelName });

        if (!hostel) {
            return res.status(404).json({ message: "Hostel not found" });
        }

        res.json(hostel);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;