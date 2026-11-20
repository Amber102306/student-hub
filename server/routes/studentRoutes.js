import { Router } from 'express';
import {
  getStudents, createStudentByAdmin, bulkCreateStudents, updateStudent, updateMe, deleteStudent,
} from '../controllers/studentController.js';
import { protect, adminOnly, studentOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.put('/me', studentOnly, updateMe); // keep before '/:id'
router.get('/', adminOnly, getStudents);
router.post('/', adminOnly, createStudentByAdmin);
router.post('/bulk', adminOnly, bulkCreateStudents);
router.put('/:id', adminOnly, updateStudent);
router.delete('/:id', adminOnly, deleteStudent);

export default router;
