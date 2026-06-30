import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { transfer, getTransactions } from '../controllers/transfer.controller';

const router = Router();

router.use(protect);

router.post('/transfer', transfer);
router.get('/:id/history', getTransactions);


export default router;