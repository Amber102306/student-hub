const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  roll: { 
    type: String, 
    required: true,
    unique: true 
  },
  phone: { 
    type: String, 
    required: true,
    match: [/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number']
  },
  dob: { 
    type: String, // Kept as String to match your frontend 'DD-MM-YYYY' format for now
    required: true 
  },
  // This acts similarly to a foreign key, referencing the Class model
  classId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class',
    required: false // Set to false initially so you can insert data without a class
  }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);