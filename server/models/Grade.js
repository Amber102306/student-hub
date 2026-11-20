import mongoose from 'mongoose';

const score = { type: Number, min: [1, 'Grades must be 1.00 to 5.00.'], max: [5, 'Grades must be 1.00 to 5.00.'], default: null };

const gradeSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    midterm: score,
    finals: score,
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

gradeSchema.index({ studentId: 1, subjectId: 1 }, { unique: true });

// Computed, not stored: average of midterm and finals.
gradeSchema.virtual('finalRating').get(function () {
  return this.midterm == null || this.finals == null ? null : (this.midterm + this.finals) / 2;
});

// Computed, not stored: passed when 3.00 or better.
gradeSchema.virtual('remarks').get(function () {
  const r = this.finalRating;
  return r == null ? null : r <= 3 ? 'passed' : 'failed';
});

export default mongoose.model('Grade', gradeSchema);
