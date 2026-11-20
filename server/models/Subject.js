import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: [true, 'Subject code is required.'], unique: true, uppercase: true, trim: true },
  name: { type: String, required: [true, 'Subject name is required.'], trim: true },
  units: { type: Number, required: true, min: [1, 'Units must be 1 to 6.'], max: [6, 'Units must be 1 to 6.'], validate: { validator: Number.isInteger, message: 'Units must be a whole number.' } },
});

export default mongoose.model('Subject', subjectSchema);
