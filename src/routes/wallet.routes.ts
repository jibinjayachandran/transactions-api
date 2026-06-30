import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { createWallet, getBalance, deposit, getWalletInfo } from '../controllers/wallet.controller';

const router = Router();

router.use(protect);

router.post('/create', createWallet);
router.get('/info', getWalletInfo);
router.get('/:id/balance', getBalance);
router.post('/:id/deposit', deposit);

export default router;
