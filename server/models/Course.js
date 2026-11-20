import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  code: { type: String, required: [true, 'Course code is required.'], unique: true, uppercase: true, trim: true },
  description: { type: String, required: [true, 'Course description is required.'], uppercase: true, trim: true },
  units: {
    type: Number,
    required: true,
    min: [1, 'Units must be from 1.0 to 6.0.'],
    max: [6, 'Units must be from 1.0 to 6.0.'],
    validate: { validator: (u) => (u * 2) % 1 === 0, message: 'Units must be in steps of 0.5.' },
  },
});

export default mongoose.model('Course', courseSchema);
