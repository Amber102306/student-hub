import { Router } from 'express';
import { getProfessors, createProfessor, bulkCreateProfessors, updateProfessor, deleteProfessor } from '../controllers/professorController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/', getProfessors);
router.post('/', adminOnly, createProfessor);
router.post('/bulk', adminOnly, bulkCreateProfessors);
router.put('/:id', adminOnly, updateProfessor);
router.delete('/:id', adminOnly, deleteProfessor);

export default router;
