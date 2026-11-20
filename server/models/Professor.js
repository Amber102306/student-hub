import mongoose from 'mongoose';

const professorSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Professor name is required.'], trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.'] },
});

export default mongoose.model('Professor', professorSchema);