import {Response} from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import {createWalletForUser,getWalletBalance,depositFunds,getWalletDetails} from '../services/wallet.service';
import { success } from 'zod';

export const createWallet = async (req: AuthRequest ,res: Response) =>{
    try{
        const wallet = await createWalletForUser(req.userId!);
        res.status(201).json({
            success:true,data:{wallet}
        });
    }catch(error:any){
        res.status(400).json({
            success : false,
            message : error.message
        });
    }
}

export const getWalletInfo = async(req:AuthRequest,res:Response)=>{
    try{
        const wallet = await getWalletDetails(req.userId!);
        res.status(200).json({
            success : true,
            data : wallet
        })
    }catch(error:any){
        res.status(400).json({
            success : false,
            message : error.message
        });
    }
}

export const getBalance = async (req: AuthRequest , res : Response) =>{
   try {
     const  id  = String(req.params.id) ;
        if (!id) {
            res.status(400).json({ success: false, message: 'Wallet ID is required' });
            return;
        }
        const wallet = await getWalletBalance(id, req.userId!);
        res.json({ success: true, data: wallet });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
}

export const deposit = async (req: AuthRequest , res: Response) =>{
    try{
        const  id  = String(req.params.id) ;
        const amount = Number(req.body.amount);
        if (isNaN(amount) || amount <= 0) {
            res.status(400).json({ success: false, message: 'Amount must be a positive number' });
            return;
        }
        if (!id) {
            res.status(400).json({ success: false, message: 'Wallet ID is required' });
            return;
        }
    
        const wallet = await depositFunds(id,req.userId!,amount);
       res.json({ success: true, data: wallet });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
}