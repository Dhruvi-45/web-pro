const express = require('express');
const router = express.Router();
const User = require('../models/User');

const predefinedUsers = [
    {
      email: "chiefwarden@lnmiit.ac.in",
      password: "1234",
      role: "chief_warden"
    },
    {
      email: "wardenGH@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "GH"
    },
    {
      email: "wardenBH1@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "BH1"
    },
    {
      email: "wardenBH2@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "BH2"
    },
    {
      email: "wardenBH3@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "BH3"
    },
    {
      email: "wardenBH4@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "BH4"
    },
    {
      email: "wardenBH5@lnmiit.ac.in",
      password: "1234",
      role: "warden",
      hostel: "BH5"
    }
  ];



router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    // 🔹 Check predefined users
    const user = predefinedUsers.find(
      u => u.email === email && u.password === password
    );
  
    if (user) {
      return res.json({ success: true, user });
    }
  
    // 🔹 Optional: check DB users later
    return res.json({ success: false });
  });
module.exports = router;