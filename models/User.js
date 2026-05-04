const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  gender: String,
  contactNumber: String,
  altContactNumber: String,
  dob: Date,
  email: String,
  joiningDate: Date,
  identityType: {
    type: String,
    enum: ['Aadhaar', 'PAN', 'VoterID', 'Passport', 'DrivingLicense']
  },
  identityNumber: String,

  role: {
    type: String,
    enum: ['chief_warden', 'warden', 'caretaker']
  },

  hostel: {
    type: String,
    enum: ['GH', 'BH1', 'BH2', 'BH3', 'BH4','BH5'],
    required: function () {
      return this.role !== 'chief_warden';
    }
  },

  password: String
});

module.exports = mongoose.model('User', userSchema);