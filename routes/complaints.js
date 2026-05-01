const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Staff contact directory
const staffDirectory = {
  Electrical: { name: 'Ramesh Kumar (Electrician)', phone: '9876543210', role: 'Electrician' },
  Plumbing: { name: 'Suresh Verma (Plumber)', phone: '9876543211', role: 'Plumber' },
  Internet: { name: 'Tech Support Team', phone: '9876543212', role: 'IT Support' },
  Furniture: { name: 'Carpenter Workshop', phone: '9876543213', role: 'Carpenter' },
  Cleaning: { name: 'Housekeeping Dept.', phone: '9876543214', role: 'Housekeeping' },
  Other: { name: 'Hostel Office', phone: '9876543215', role: 'Admin' }
};

router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const complaint = new Complaint({
      ...req.body,
      assignedTo: staffDirectory[req.body.category] || staffDirectory['Other']
    });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === 'Resolved') update.resolvedAt = new Date();
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(complaint);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
