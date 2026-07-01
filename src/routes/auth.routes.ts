import { Router } from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators';
import { protect, validate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refreshToken', validate(refreshSchema), refresh);
router.post('/logout', validate(refreshSchema), logout);
router.post('/logout-all', protect, logoutAll);

export default router;