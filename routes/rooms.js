const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Student = require('../models/Student');


// 🔹 GET all rooms (with optional hostel filter)
router.get('/', async (req, res) => {
  try {
    const { hostel } = req.query;

    let query = {};
    if (hostel) query.hostel = hostel;

    const rooms = await Room.find(query)
      .populate('occupants', 'name rollNumber course year phone photo');

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 GET rooms by block (with hostel filter)
router.get('/block/:block', async (req, res) => {
  try {
    const { hostel } = req.query;

    let query = { block: req.params.block };
    if (hostel) query.hostel = hostel;

    const rooms = await Room.find(query)
      .populate('occupants', 'name rollNumber course year phone photo');

    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 GET single room (with hostel protection)
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('occupants', 'name rollNumber course year phone email photo feeStatus checkInDate');

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { hostel } = req.query;
    if (hostel && room.hostel !== hostel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 🔹 POST create room
router.post('/', async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// 🔹 PUT update room (with hostel protection)
router.put('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { hostel } = req.query;
    if (hostel && room.hostel !== hostel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    Object.assign(room, req.body);
    await room.save();

    res.json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// 🔹 PATCH assign student to room (with hostel protection)
router.patch('/:id/assign', async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { hostel } = req.query;
    if (hostel && room.hostel !== hostel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({ error: 'Room is full' });
    }

    room.occupants.push(studentId);
    room.status = room.occupants.length >= room.capacity ? 'Full' : 'Occupied';
    await room.save();

    await Student.findByIdAndUpdate(studentId, {
      room: room._id,
      roomNumber: room.roomNumber,
      block: room.block
    });

    res.json(room);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// 🔹 PATCH vacate student (with hostel protection)
router.patch('/:id/vacate', async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { hostel } = req.query;
    if (hostel && room.hostel !== hostel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    room.occupants = room.occupants.filter(id => id.toString() !== studentId);
    room.status = room.occupants.length === 0 ? 'Available' : 'Occupied';

    await room.save();

    await Student.findByIdAndUpdate(studentId, {
      room: null,
      roomNumber: '',
      block: ''
    });

    res.json(room);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// 🔹 DELETE room (with hostel protection)
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const { hostel } = req.query;
    if (hostel && room.hostel !== hostel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Room.findByIdAndDelete(req.params.id);

    res.json({ message: 'Room deleted' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;