import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';


export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: string };
        req.userId = decoded.userId;
        next();
    } catch (error: any) {
        res.status(401).json({ success: false, message: 'Invalid token ' + error.message });
    }
}