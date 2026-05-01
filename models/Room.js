const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({

  // 🔹 WHICH HOSTEL THIS ROOM BELONGS TO (IMPORTANT)
  hostel: {
    type: String,
    enum: ['GH', 'BH1', 'BH2', 'BH3', 'BH4'],
    required: true
  },

  // 🔹 EXISTING STRUCTURE
  block: { 
    type: String, 
    required: true 
  }, // e.g. A, B, C

  floor: { 
    type: Number, 
    required: true 
  }, // 0 = ground

  roomNumber: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g. A-101

  // 🔹 ROOM TYPE
  type: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Quad'],
    default: 'Double'
  },

  capacity: { 
    type: Number, 
    required: true 
  },

  occupants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }],

  // 🔹 STATUS
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Full', 'Under Maintenance'],
    default: 'Available'
  },

  // 🔹 EXTRA
  amenities: [String],

  position: {
    row: Number,
    col: Number
  }

}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);