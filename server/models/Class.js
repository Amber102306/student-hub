import mongoose from 'mongoose';
import { DAYS, SECTION_RE } from '../utils/constants.js';
import { toMin, meetingsOverlap } from '../utils/schedule.js';

const time = { type: String, required: true, match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must look like HH:MM.'] };

// One time slot in the week. A class can have many (1, 2, 4...).
const meetingSchema = new mongoose.Schema(
  {
    day: { type: String, enum: DAYS, required: true },
    start: time,
    end: time,
    room: { type: String, required: [true, 'Room is required.'], trim: true },
  },
  { _id: false }
);

const classSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  professorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
  section: {
    type: String, required: [true, 'Section is required.'], uppercase: true, trim: true,
    match: [SECTION_RE, 'Section must be 3 letters and 3 numbers, like COM241 or COM242.'],
  },
  meetings: {
    type: [meetingSchema],
    validate: { validator: (a) => a.length > 0, message: 'Add at least one time slot.' },
  },
});

classSchema.pre('validate', function (next) {
  const list = this.meetings || [];
  for (const m of list) {
    if (m.start && m.end && toMin(m.end) <= toMin(m.start)) this.invalidate('meetings', `End time must be after the start time (${m.day}).`);
  }
  for (let i = 0; i < list.length; i += 1)
    for (let j = i + 1; j < list.length; j += 1)
      if (meetingsOverlap(list[i], list[j])) this.invalidate('meetings', 'Two time slots overlap each other.');
  next();
});

export default mongoose.model('Class', classSchema);
