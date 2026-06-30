import 'dotenv/config';
import express from 'express';
import { Request, Response, NextFunction } from 'express';

import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import transferRoutes from './routes/transfer.routes';



const app = express();
const PORT = 3002;

app.use(express.json());

app.use('/api/auth',authRoutes);
app.use('/api/wallets',walletRoutes);
app.use('/api/transfers',transferRoutes);

// global error handler - must be last
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); // logs full error on server, not sent to client

    if (err.type === 'entity.parse.failed') {
        res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
        return;
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});



app.get('/health',(req,res)=> {
    res.json({status:'ok'});
});

app.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
});
