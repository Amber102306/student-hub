export const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// One meeting = { day, start, end, room }. Two meetings overlap when the day is the same and the times cross.
export const meetingsOverlap = (a, b) =>
  a.day === b.day && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

// A class has many meetings. Two classes overlap if any of their meetings overlap.
export const classesOverlap = (a, b) => a.meetings.some((x) => b.meetings.some((y) => meetingsOverlap(x, y)));

export const overlapDay = (a, b) => {
  for (const x of a.meetings) for (const y of b.meetings) if (meetingsOverlap(x, y)) return x.day;
  return null;
};
