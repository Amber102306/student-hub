import { Router } from 'express';
import { getTeachers, createTeacher, bulkCreateTeachers, updateTeacher, deleteTeacher } from '../controllers/teacherController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getTeachers);
router.post('/', adminOnly, createTeacher);
router.post('/bulk', adminOnly, bulkCreateTeachers);
router.put('/:id', adminOnly, updateTeacher);
router.delete('/:id', adminOnly, deleteTeacher);

export default router;
