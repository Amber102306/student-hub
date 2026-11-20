import Registration from '../models/Registration.js';
import Class from '../models/Class.js';
import asyncHandler from '../utils/asyncHandler.js';
import HttpError from '../utils/httpError.js';
import { overlaps } from '../utils/schedule.js';
import { MAX_UNITS } from '../utils/constants.js';

const withClass = (q) =>
  q.populate({ path: 'classId', populate: [{ path: 'subjectId', select: 'code name units' }, { path: 'teacherId', select: 'name' }] });

// GET /api/registrations?status=pending   (admin)
export const getRegistrations = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await withClass(Registration.find(filter).populate('studentId', 'name studentNo').sort('-createdAt')));
});

// GET /api/registrations/mine   (student)
export const getMyRegistrations = asyncHandler(async (req, res) => {
  res.json(await withClass(Registration.find({ studentId: req.student._id })));
});

// POST /api/registrations   body: { classId }   (student)
export const createRegistration = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.body.classId).populate('subjectId');
  if (!cls) throw new HttpError(404, 'Class not found.');

  const mine = await withClass(Registration.find({ studentId: req.student._id, status: { $ne: 'rejected' } }));

  if (mine.some((r) => String(r.classId.subjectId._id) === String(cls.subjectId._id)))
    throw new HttpError(400, 'You already registered for this subject.');

  const clash = mine.find((r) => overlaps(r.classId, cls));
  if (clash) throw new HttpError(400, `Overlaps with ${clash.classId.subjectId.code} on ${clash.classId.day}.`);

  const units = mine.reduce((n, r) => n + r.classId.subjectId.units, 0) + cls.subjectId.units;
  if (units > MAX_UNITS) throw new HttpError(400, `This goes over the ${MAX_UNITS}-unit limit.`);

  // If this class was rejected before, send it again as pending.
  const old = await Registration.findOne({ studentId: req.student._id, classId: cls._id });
  if (old) {
    old.status = 'pending';
    await old.save();
    return res.status(201).json(old);
  }
  res.status(201).json(await Registration.create({ studentId: req.student._id, classId: cls._id }));
});

// PUT /api/registrations/:id/status   body: { status }   (admin)
export const setStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) throw new HttpError(400, 'Status is not valid.');
  const reg = await Registration.findById(req.params.id).populate('classId');
  if (!reg) throw new HttpError(404, 'Registration not found.');

  if (status === 'approved') {
    const approved = await Registration.find({ studentId: reg.studentId, status: 'approved', _id: { $ne: reg._id } }).populate('classId');
    const clash = approved.find((r) => overlaps(r.classId, reg.classId));
    if (clash) throw new HttpError(400, 'Cannot approve. It overlaps with another approved class.');
  }
  reg.status = status;
  await reg.save();
  res.json(reg);
});

// DELETE /api/registrations/:id   (student drops own, admin removes any)
export const deleteRegistration = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) throw new HttpError(404, 'Registration not found.');
  if (req.user.role === 'student' && String(reg.studentId) !== String(req.student._id))
    throw new HttpError(403, 'You can only drop your own subjects.');
  await reg.deleteOne();
  res.json({ message: 'Registration removed.' });
});
