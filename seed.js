require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const Student = require('./models/Student');
const Complaint = require('./models/Complaint');
const Maintenance = require('./models/Maintenance');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostelDB';

const students = [
  { name: 'Arjun Sharma', rollNumber: 'CS21001', course: 'B.Tech CSE', year: 3, phone: '9812345001', email: 'arjun@college.edu', roomNumber: 'A-101', block: 'A', feeStatus: 'Paid' },
  { name: 'Rohit Meena', rollNumber: 'ME21002', course: 'B.Tech ME', year: 2, phone: '9812345002', email: 'rohit@college.edu', roomNumber: 'A-101', block: 'A', feeStatus: 'Paid' },
  { name: 'Vikram Singh', rollNumber: 'EC21003', course: 'B.Tech EC', year: 3, phone: '9812345003', email: 'vikram@college.edu', roomNumber: 'A-102', block: 'A', feeStatus: 'Pending' },
  { name: 'Aditya Joshi', rollNumber: 'CS21004', course: 'B.Tech CSE', year: 1, phone: '9812345004', email: 'aditya@college.edu', roomNumber: 'A-103', block: 'A', feeStatus: 'Paid' },
  { name: 'Karan Gupta', rollNumber: 'CE21005', course: 'B.Tech CE', year: 4, phone: '9812345005', email: 'karan@college.edu', roomNumber: 'B-201', block: 'B', feeStatus: 'Paid' },
  { name: 'Sanjay Patel', rollNumber: 'ME21006', course: 'B.Tech ME', year: 2, phone: '9812345006', email: 'sanjay@college.edu', roomNumber: 'B-201', block: 'B', feeStatus: 'Overdue' },
  { name: 'Deepak Yadav', rollNumber: 'CS21007', course: 'B.Tech CSE', year: 3, phone: '9812345007', email: 'deepak@college.edu', roomNumber: 'B-202', block: 'B', feeStatus: 'Paid' },
  { name: 'Rahul Verma', rollNumber: 'EC21008', course: 'B.Tech EC', year: 1, phone: '9812345008', email: 'rahul@college.edu', roomNumber: 'C-301', block: 'C', feeStatus: 'Pending' },
  { name: 'Manish Kumar', rollNumber: 'CS21009', course: 'B.Tech CSE', year: 2, phone: '9812345009', email: 'manish@college.edu', roomNumber: 'C-301', block: 'C', feeStatus: 'Paid' },
  { name: 'Suresh Bhatt', rollNumber: 'ME21010', course: 'B.Tech ME', year: 4, phone: '9812345010', email: 'suresh@college.edu', roomNumber: 'C-302', block: 'C', feeStatus: 'Paid' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([Room.deleteMany({}), Student.deleteMany({}), Complaint.deleteMany({}), Maintenance.deleteMany({})]);
    console.log('Cleared existing data');

    // Create rooms for 3 blocks, 3 floors, 6 rooms per floor
    const blocks = ['A', 'B', 'C'];
    const floors = [1, 2, 3];
    const roomTypes = ['Single', 'Double', 'Double', 'Triple', 'Double', 'Double'];
    const capacities = [1, 2, 2, 3, 2, 2];

    const roomDocs = [];
    for (const block of blocks) {
      for (const floor of floors) {
        for (let col = 1; col <= 6; col++) {
          const roomNum = `${block}-${floor}0${col}`;
          roomDocs.push({
            block, floor,
            roomNumber: roomNum,
            type: roomTypes[col - 1],
            capacity: capacities[col - 1],
            occupants: [],
            status: 'Available',
            amenities: ['Fan', 'Study Table', 'Wardrobe'],
            position: { row: floor, col }
          });
        }
      }
    }
    const rooms = await Room.insertMany(roomDocs);
    console.log(`Created ${rooms.length} rooms`);

    // Create students and assign to rooms
    for (const studentData of students) {
      const room = rooms.find(r => r.roomNumber === studentData.roomNumber);
      const student = await Student.create({ ...studentData, room: room?._id });
      if (room) {
        await Room.findByIdAndUpdate(room._id, {
          $push: { occupants: student._id },
          status: 'Occupied'
        });
      }
    }
    console.log(`Created ${students.length} students`);

    // Seed complaints
    await Complaint.insertMany([
      { studentName: 'Arjun Sharma', rollNumber: 'CS21001', roomNumber: 'A-101', block: 'A', category: 'Electrical', description: 'Tube light not working in room, need replacement', status: 'Pending', priority: 'Medium', assignedTo: { name: 'Ramesh Kumar (Electrician)', phone: '9876543210', role: 'Electrician' } },
      { studentName: 'Vikram Singh', rollNumber: 'EC21003', roomNumber: 'A-102', block: 'A', category: 'Plumbing', description: 'Water tap is leaking continuously', status: 'In Progress', priority: 'High', assignedTo: { name: 'Suresh Verma (Plumber)', phone: '9876543211', role: 'Plumber' } },
      { studentName: 'Karan Gupta', rollNumber: 'CE21005', roomNumber: 'B-201', block: 'B', category: 'Internet', description: 'WiFi signal very weak in room', status: 'Pending', priority: 'Medium', assignedTo: { name: 'Tech Support Team', phone: '9876543212', role: 'IT Support' } },
      { studentName: 'Deepak Yadav', rollNumber: 'CS21007', roomNumber: 'B-202', block: 'B', category: 'Furniture', description: 'Chair leg broken, needs replacement', status: 'Resolved', priority: 'Low', assignedTo: { name: 'Carpenter Workshop', phone: '9876543213', role: 'Carpenter' }, resolvedAt: new Date() },
      { studentName: 'Rahul Verma', rollNumber: 'EC21008', roomNumber: 'C-301', block: 'C', category: 'Electrical', description: 'Power socket not working', status: 'Pending', priority: 'Urgent', assignedTo: { name: 'Ramesh Kumar (Electrician)', phone: '9876543210', role: 'Electrician' } },
    ]);
    console.log('Complaints seeded');

    // Seed maintenance
    await Maintenance.insertMany([
      { area: 'Gym', block: 'Common', reportedBy: 'Arjun Sharma', rollNumber: 'CS21001', issueTitle: 'Treadmill Motor Failure', description: 'The main treadmill motor has stopped working. Needs urgent replacement.', status: 'Open', priority: 'High' },
      { area: 'Kitchen', block: 'Common', reportedBy: 'Karan Gupta', rollNumber: 'CE21005', issueTitle: 'Gas Burner Malfunction', description: 'One of the 4 gas burners is not igniting properly. Safety hazard.', status: 'In Progress', priority: 'Critical', assignedTeam: 'Gas Agency Team', scheduledDate: new Date() },
      { area: 'Common Room', block: 'A', reportedBy: 'Rohit Meena', rollNumber: 'ME21002', issueTitle: 'TV Remote Missing', description: 'TV remote in Block A common room is lost. Needs new universal remote.', status: 'Open', priority: 'Low' },
      { area: 'Laundry', block: 'B', reportedBy: 'Sanjay Patel', rollNumber: 'ME21006', issueTitle: 'Washing Machine Not Spinning', description: 'The washing machine in Block B laundry is stuck on rinse cycle.', status: 'Scheduled', priority: 'Medium', assignedTeam: 'Appliance Repair Team', scheduledDate: new Date(Date.now() + 86400000) },
      { area: 'Gym', block: 'Common', reportedBy: 'Manish Kumar', rollNumber: 'CS21009', issueTitle: 'Dumbbells Missing from Set', description: 'Several dumbbells from the 10kg and 15kg set are missing.', status: 'Open', priority: 'Low' },
    ]);
    console.log('Maintenance seeded');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
