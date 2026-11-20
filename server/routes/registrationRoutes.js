import { Router } from 'express';
import {
  getRegistrations, getMyRegistrations, createRegistration, setStatus, deleteRegistration,
} from '../controllers/registrationController.js';
import { protect, adminOnly, studentOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/mine', studentOnly, getMyRegistrations); // keep before '/:id'
router.get('/', adminOnly, getRegistrations);
router.post('/', studentOnly, createRegistration);
router.put('/:id/status', adminOnly, setStatus);
router.delete('/:id', deleteRegistration);

export default router;
