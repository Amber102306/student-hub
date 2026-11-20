import { Router } from 'express';
import { getSubjects, createSubject, bulkCreateSubjects, updateSubject, deleteSubject } from '../controllers/subjectController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getSubjects);
router.post('/', adminOnly, createSubject);
router.post('/bulk', adminOnly, bulkCreateSubjects);
router.put('/:id', adminOnly, updateSubject);
router.delete('/:id', adminOnly, deleteSubject);

export default router;
