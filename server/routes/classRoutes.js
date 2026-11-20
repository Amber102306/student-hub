import { Router } from 'express';
import { getClasses, createClass, updateClass, deleteClass } from '../controllers/classController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getClasses);
router.post('/', adminOnly, createClass);
router.put('/:id', adminOnly, updateClass);
router.delete('/:id', adminOnly, deleteClass);

export default router;
