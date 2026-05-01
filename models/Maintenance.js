const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  area: {
    type: String,
    enum: ['Gym', 'Kitchen', 'Common Room', 'Laundry', 'Garden', 'Parking', 'Library', 'Corridor', 'Bathroom', 'Roof'],
    required: true
  },
  block: { type: String },
  reportedBy: { type: String, required: true },
  rollNumber: { type: String },
  issueTitle: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['Open', 'Scheduled', 'In Progress', 'Completed', 'On Hold'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTeam: { type: String },
  estimatedCost: { type: Number },
  scheduledDate: { type: Date },
  completedDate: { type: Date },
  images: [String]
}, { timestamps: true });

module.exports = mongoose.model('Maintenance', maintenanceSchema);
