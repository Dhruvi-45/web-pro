const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({

  hostel: {
    type: String,
    enum: ['GH', 'BH1', 'BH2', 'BH3', 'BH4'],
    required: true
  },

  block: { 
    type: String, 
    required: true 
  },

  floor: { 
    type: Number, 
    required: true 
  },

  roomNumber: { 
    type: String, 
    required: true 
  },

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

  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Full', 'Under Maintenance'],
    default: 'Available'
  },

  amenities: [String],

  position: {
    row: Number,
    col: Number
  },

  // optional for custom layouts
  hostelBlockType: String

}, { timestamps: true });


roomSchema.index({ roomNumber: 1, hostel: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);