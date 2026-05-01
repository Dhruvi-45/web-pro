const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');

router.get('/', async (req, res) => {
  try {
    const { status, area } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (area) filter.area = area;
    const records = await Maintenance.find(filter).sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const record = new Maintenance(req.body);
    await record.save();
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status, assignedTeam, scheduledDate, estimatedCost } = req.body;
    const update = { status };
    if (assignedTeam) update.assignedTeam = assignedTeam;
    if (scheduledDate) update.scheduledDate = scheduledDate;
    if (estimatedCost) update.estimatedCost = estimatedCost;
    if (status === 'Completed') update.completedDate = new Date();
    const record = await Maintenance.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Maintenance.findByIdAndDelete(req.params.id);
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
