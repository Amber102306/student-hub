import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    status: { type: String, enum: ['pending', 'enrolled', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

// A student can register for the same class only once.
registrationSchema.index({ studentId: 1, classId: 1 }, { unique: true });

export default mongoose.model('Registration', registrationSchema);
