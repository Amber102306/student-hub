import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Teacher name is required.'], trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'] },
  department: { type: String, required: [true, 'Department is required.'], trim: true },
});

export default mongoose.model('Teacher', teacherSchema);
