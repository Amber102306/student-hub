import { Router } from 'express';
import { getCourses, createCourse, bulkCreateCourses, updateCourse, deleteCourse } from '../controllers/courseController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getCourses);
router.post('/', adminOnly, createCourse);
router.post('/bulk', adminOnly, bulkCreateCourses);
router.put('/:id', adminOnly, updateCourse);
router.delete('/:id', adminOnly, deleteCourse);

export default router;
