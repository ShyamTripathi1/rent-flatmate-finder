import { Router } from 'express';
import { register, login, refresh, listUsersForQuickLogin } from '../controllers/authController';
import { googleLogin } from '../controllers/googleAuthController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/google', googleLogin);
router.get('/quick-login-users', listUsersForQuickLogin);

export default router;
