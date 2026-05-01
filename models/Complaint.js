const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  roomNumber: { type: String, required: true },
  block: { type: String, required: true },
  category: {
    type: String,
    enum: ['Electrical', 'Plumbing', 'Internet', 'Furniture', 'Cleaning', 'Other'],
    required: true
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  assignedTo: {
    name: String,
    phone: String,
    role: String
  },
  resolvedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
