import { Request, Response } from "express";
import { registerUser, loginUser, refreshTokens, logoutUser, logoutAllDevices } from "../services/auth.service";


export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const user = await registerUser(email, password, name);
        res.status(201).json({ success: true, data: user });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }

}

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message });
    }
}

export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await refreshTokens(refreshToken);
        res.json({ success: true, data: tokens });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export const logout = async (req: Request,res: Response) =>{
    try{
       const { refreshToken } = req.body;
        await logoutUser(refreshToken);
        res.json({ success: true, message: 'Logged out successfully' }); 
    }catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
}

export const logoutAll = async (req: Request, res: Response) => {
    try {
        // userId comes from protect middleware (JWT already verified)
        await logoutAllDevices((req as any).userId);
        res.json({ success: true, message: 'Logged out from all devices' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};