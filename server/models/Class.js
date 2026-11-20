import mongoose from 'mongoose';
import { DAYS } from '../utils/constants.js';
import { toMin } from '../utils/schedule.js';

const time = { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must look like HH:MM.'] };

const classSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  section: { type: String, required: [true, 'Section is required.'], trim: true },
  day: { type: String, enum: DAYS, required: true },
  start: time,
  end: time,
  room: { type: String, required: [true, 'Room is required.'], trim: true },
});

classSchema.pre('validate', function (next) {
  if (this.start && this.end && toMin(this.end) <= toMin(this.start))
    this.invalidate('end', 'End time must be after the start time.');
  next();
});

export default mongoose.model('Class', classSchema);
