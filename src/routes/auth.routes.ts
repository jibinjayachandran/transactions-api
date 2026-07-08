import { Router } from 'express';
import { register, login, refresh, logout, logoutAll } from '../controllers/auth.controller';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validators';
import { protect, validate } from '../middleware/auth.middleware';
import { rateLimit } from '../middleware/rateLimiter';

const router = Router();

const loginLimiter = rateLimit({
    windowSeconds: 60,
    maxRequests: 5,
    keyGenerator: (req) => { console.log('myIP', req.ip); return `login:${req.ip}`; }
});

router.post('/register', validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refreshToken', validate(refreshSchema), refresh);
router.post('/logout', protect, validate(refreshSchema), logout);
router.post('/logout-all', protect, logoutAll);

export default router;