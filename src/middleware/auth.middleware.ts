import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';
import { ZodType, z } from 'zod';
import redis from '../lib/redis';


export interface AuthRequest extends Request {
    userId?: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as { userId: string; jti: string };
        const isBlocklisted = await redis.exists(`blocklist:${decoded.jti}`);
        if(isBlocklisted){
            res.status(401).json({success:false,message:'Token has been revoked.'});
            return;
        }
        req.userId = decoded.userId;
        next();
    } catch (error: any) {
        res.status(401).json({ success: false, message: 'Invalid token, ' + error.message });
    }
}

export const validate = (schema: ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: z.flattenError(result.error).fieldErrors,
            });
        }
        req.body = result.data;
        next();
    };
};