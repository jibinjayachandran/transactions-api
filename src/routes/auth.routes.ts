import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { registerSchema, loginSchema } from '../validators/auth.validators';
import { validate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.post('/login', validate(loginSchema), login);

export default router;