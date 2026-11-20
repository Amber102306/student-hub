import mongoose from 'mongoose';
import { PROGRAMS } from '../utils/constants.js';

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentNo: { type: String, required: true, unique: true },
  name: { type: String, required: [true, 'Name is required.'], trim: true },
  phone: { type: String, trim: true, match: [/^\+?[0-9 -]{7,15}$/, 'Phone must have 7 to 15 digits.'] },
  dob: { type: Date, validate: { validator: (d) => d <= new Date(), message: 'Date of birth must be in the past.' } },
  program: { type: String, required: [true, 'Program is required.'], enum: { values: PROGRAMS, message: 'Pick a valid program.' } },
});

export default mongoose.model('Student', studentSchema);
