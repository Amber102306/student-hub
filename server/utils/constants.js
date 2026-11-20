// Placeholder list. Keep it the same as PROGRAMS in the frontend data.js.
export const PROGRAMS = ['BS Computer Science', 'BS Information Technology', 'BS Information Systems'];
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MAX_UNITS = 24;
// Student numbers look like 2024-1003637 (4-digit year, dash, 7 digits).
export const STUDENT_NO_RE = /^\d{4}-\d{7}$/;
export const DEFAULT_PASSWORD = 'Welcome123';
// Section codes are 3 letters + 3 numbers, like COM241 or COM242.
export const SECTION_RE = /^[A-Z]{3}\d{3}$/;