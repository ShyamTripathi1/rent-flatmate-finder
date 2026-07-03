import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/profileController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Mounted at /tenant
router.get('/profile', authMiddleware, roleMiddleware(['TENANT']), getProfile);
router.put('/profile', authMiddleware, roleMiddleware(['TENANT']), updateProfile);

export default router;
