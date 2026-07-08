import { Request,Response,NextFunction } from "express";
import redis from "../lib/redis";
import { success } from "zod";

interface RateLimitOptions{
    windowSeconds: number;
    maxRequests: number;
    keyGenerator:(req: Request)=>string;
}

export const rateLimit = (options:RateLimitOptions) =>{
    return async (req:Request,res:Response,next:NextFunction) =>{
        const identifier = options.keyGenerator(req);
        const key = `rateLimit:${identifier}`;

        try{
            const count = await redis.incr(key);
            if(count==1){
                await redis.expire(key,options.windowSeconds);
            }

            if(count > options.maxRequests){
                const ttl = await redis.ttl(key);
                res.status(429).json({
                    success : false,
                    message: 'Too many requests , please try again later',
                    retryAfterSeconds: ttl>0?ttl:options.windowSeconds
                });
                return;
            }
            next();
        }catch(error:any){
            console.error('Rate limiter error:', error);
            next();
        }
    }
}