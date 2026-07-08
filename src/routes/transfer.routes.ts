import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { transfer, getTransactions } from '../controllers/transfer.controller';
import { rateLimit } from '../middleware/rateLimiter';

const router = Router();

router.use(protect);

const transferLimiter = rateLimit({
    windowSeconds: 60,
    maxRequests: 10,
    keyGenerator: (req) => `transfer:${(req as any).userId}`,
});

router.post('/transfer',transferLimiter, transfer);
router.get('/:id/history', getTransactions);


export default router;