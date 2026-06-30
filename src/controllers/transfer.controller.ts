import {Response} from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {transferFunds,getTransactionHistory} from '../services/transfer.service';
import { success } from 'zod';

export const transfer = async(req: AuthRequest ,res: Response) =>{
    try{
        const {fromWalletId,toWalletId,amount} = req.body;
        if (!fromWalletId || !toWalletId || !amount) {
    res.status(400).json({ success: false, message: 'fromWalletId, toWalletId and amount are required' });
    return;
}

if (typeof fromWalletId !== 'string' || typeof toWalletId !== 'string') {
    res.status(400).json({ success: false, message: 'Wallet IDs must be strings' });
    return;
}

        const transaction = await transferFunds(fromWalletId,toWalletId,req.userId!,Number(amount));
        res.status(201).json({ success: true, data: transaction });

    }catch(error: any){
        res.status(400).json({ success: false, data: error.message });
    }
}

export const getTransactions = async(req: AuthRequest,res: Response) =>{
    try{
        const id = String(req.params.id);
        const page = Number(req.query.page);
        const limit = Number(req.query.limit);
        if (!id) {
            res.status(400).json({ success: false, message: 'Wallet ID is required' });
            return;
        }
        const result = await getTransactionHistory(id,req.userId!,page,limit);
        res.json({
            success : true,
            data : result
        });
    }catch(error:any){
        res.status(400).json({
            success : false,
            message : error.message
        });
    }
}