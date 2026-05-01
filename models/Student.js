const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNumber: { type: String, required: true, unique: true },
  course: { type: String, required: true },
  year: { type: Number, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  parentPhone: { type: String },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  roomNumber: { type: String },
  block: { type: String },
  photo: { type: String, default: '' },
  checkInDate: { type: Date, default: Date.now },
  feeStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);
