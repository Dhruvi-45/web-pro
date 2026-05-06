const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
    name: String,
    rollNo: String
});

const RoomSchema = new mongoose.Schema({
    roomNumber: String,
    wing: String,       
    capacity: {
        type: String,
        enum: ['single', 'double', 'triple']
    },
    maxCapacity: Number,
    students: [StudentSchema]
});

const FloorSchema = new mongoose.Schema({
    floorNumber: Number,
    rooms: [RoomSchema]
});

const HostelSchema = new mongoose.Schema({
    hostelName: String, // GH, BH1
    floors: [FloorSchema]
});

module.exports = mongoose.model('Hostel', HostelSchema);