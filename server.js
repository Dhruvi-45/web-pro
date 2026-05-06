require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware FIRST (before routes)
app.use(cors());
app.use(bodyParser.json());

// Routes
const hostelRoutes = require('./routes/hostelRoutes');
app.use('/api', hostelRoutes);
app.use('/api/auth', require('./routes/auth'));

//  Static frontend
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded ✅" : "Missing ❌");

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    console.log(mongoose.connection.name);
  })
  .catch(err => {
    console.log("FULL ERROR:", err);
  });

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});