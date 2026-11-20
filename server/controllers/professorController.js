import Professor from '../models/Professor.js';
import Class from '../models/Class.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';

// GET /api/professors
export const getProfessors = asyncHandler(async (req, res) => {
  res.json(await Professor.find().sort('name'));
});

// POST /api/professors
export const createProfessor = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  res.status(201).json(await Professor.create({ name, email }));
});

// POST /api/professors/bulk  body: { professors: [...] }
export const bulkCreateProfessors = asyncHandler(async (req, res) => {
  const { professors } = req.body;
  if (!Array.isArray(professors) || !professors.length) throw new HttpError(400, 'Send a list of professors.');
  const skipped = [];
  let created = 0;
  for (const [i, p] of professors.entries()) {
    try {
      await Professor.create({ name: p.name, email: p.email });
      created += 1;
    } catch (err) {
      skipped.push({ row: i + 1, reason: err.message });
    }
  }
  res.status(201).json({ created, skipped });
});

// PUT /api/professors/:id
export const updateProfessor = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const professor = await Professor.findById(req.params.id);
  if (!professor) throw new HttpError(404, 'Professor not found.');
  Object.assign(professor, { name, email });
  await professor.save();
  res.json(professor);
});

// DELETE /api/professors/:id  (blocked while the professor still has classes)
export const deleteProfessor = asyncHandler(async (req, res) => {
  const n = await Class.countDocuments({ professorId: req.params.id });
  if (n) throw new HttpError(400, `This professor still teaches ${n} class(es). Reassign or delete those classes first.`);
  const deleted = await Professor.findByIdAndDelete(req.params.id);
  if (!deleted) throw new HttpError(404, 'Professor not found.');
  res.json({ message: 'Professor deleted.' });
});