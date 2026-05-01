const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  block: { type: String, required: true },        // e.g. "A", "B", "C"
  floor: { type: Number, required: true },         // 0 = Ground, 1, 2, 3...
  roomNumber: { type: String, required: true, unique: true }, // e.g. "A-101"
  type: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Quad'],
    default: 'Double'
  },
  capacity: { type: Number, required: true },
  occupants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  status: {
    type: String,
    enum: ['Available', 'Occupied', 'Full', 'Under Maintenance'],
    default: 'Available'
  },
  amenities: [String],
  position: {
    row: Number,
    col: Number
  }
}, { timestamps: true });

roomSchema.virtual('occupancy').get(function() {
  return this.occupants.length;
});

roomSchema.virtual('vacant').get(function() {
  return this.capacity - this.occupants.length;
});

module.exports = mongoose.model('Room', roomSchema);
