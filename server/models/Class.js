const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  className: { 
    type: String, 
    required: true, 
    trim: true 
  },
  section: { 
    type: String, 
    required: true 
  },
  roomNo: { 
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);