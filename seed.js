const mongoose = require('mongoose');
const Room = require('./models/G43_Room');

mongoose.connect('mongodb://127.0.0.1:27017/hostelDB')
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 💰 Rent logic
function getRent(type) {
    if (type === "Single") return 35000;
    if (type === "Double") return 70000;
    if (type === "Triple") return 105000;
}

// 🎲 Random occupancy generator
function generateOccupancy(capacity) {
    return Math.floor(Math.random() * (capacity + 1)); // 0 → capacity
}

// 🧠 Create room with smart occupancy
function createRoom(roomNumber, hostelName, type) {
    const capacity = type === "Single" ? 1 : type === "Double" ? 2 : 3;

    const occupancy = generateOccupancy(capacity);

    let status = "Available";
    if (occupancy === capacity) {
        status = "Full";
    }

    return {
        roomNumber,
        hostelName,
        roomType: type,
        baseRent: getRent(type),
        maxCapacity: capacity,
        currentOccupancy: occupancy,
        status
    };
}

// 📦 Sample data (same as before but smarter now)
const rooms = [

    // GH
    createRoom("A001", "GH-1", "Single"),
    createRoom("A002", "GH-1", "Double"),
    createRoom("A006", "GH-1", "Triple"),
    createRoom("B001", "GH-1", "Double"),
    createRoom("B010", "GH-1", "Single"),
    createRoom("C005", "GH-1", "Double"),
    createRoom("C011", "GH-1", "Triple"),

    // BH1 (no triple)
    createRoom("A001", "BH-1", "Single"),
    createRoom("A005", "BH-1", "Double"),
    createRoom("B002", "BH-1", "Double"),
    createRoom("C010", "BH-1", "Single"),
    createRoom("D015", "BH-1", "Double"),
    createRoom("E003", "BH-1", "Single"),

    // BH2 (no triple)
    createRoom("A001", "BH-2", "Single"),
    createRoom("B004", "BH-2", "Double"),
    createRoom("C011", "BH-2", "Single"),
    createRoom("D008", "BH-2", "Double"),
    createRoom("E002", "BH-2", "Single"),

    // BH3
    createRoom("A001", "BH-3", "Single"),
    createRoom("A010", "BH-3", "Double"),
    createRoom("A020", "BH-3", "Triple"),
    createRoom("B001", "BH-3", "Double"),
    createRoom("B014", "BH-3", "Single"),

    // BH4
    createRoom("B001", "BH-3", "Single"),
    createRoom("B005", "BH-3", "Double"),
    createRoom("B010", "BH-3", "Triple"),
    createRoom("B015", "BH-3", "Single"),

    // BH5
    createRoom("001", "BH-2", "Single"),
    createRoom("002", "BH-2", "Double"),
    createRoom("003", "BH-2", "Single"),
    createRoom("004", "BH-2", "Double"),
    createRoom("005", "BH-2", "Single"),
];


// 🚀 Seed DB
async function seedDB() {
    try {
        await Room.deleteMany();

        await Room.insertMany(rooms);

        console.log("✅ Seeded with realistic occupancy");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedDB();