import { Router } from 'express';
import { getMessages } from '../controllers/chatController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/chat/:interestId/messages', authMiddleware, getMessages);

export default router;
