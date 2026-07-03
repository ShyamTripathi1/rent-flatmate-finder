import { Router } from 'express';
import { sendInterest, respondInterest, getInterests } from '../controllers/interestController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.post('/interests', authMiddleware, roleMiddleware(['TENANT']), sendInterest);
router.patch('/interests/:id', authMiddleware, roleMiddleware(['OWNER', 'ADMIN']), respondInterest);
router.get('/interests', authMiddleware, getInterests);

export default router;
