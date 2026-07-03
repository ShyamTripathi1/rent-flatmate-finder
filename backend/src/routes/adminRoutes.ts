import { Router } from 'express';
import { getStats, getUsers, deleteUser, deleteListing, getAllChats, getChatMessages } from '../controllers/adminController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

// Secure all admin routes
router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.delete('/listings/:id', deleteListing);
router.get('/chats', getAllChats);
router.get('/chats/:interestId/messages', getChatMessages);

export default router;
