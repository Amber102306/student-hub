import { Router } from 'express';
import { getGrades, getMyGrades, saveGrade } from '../controllers/gradeController.js';
import { protect, adminOnly, studentOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/mine', studentOnly, getMyGrades);
router.get('/', adminOnly, getGrades);
router.put('/', adminOnly, saveGrade);

export default router;