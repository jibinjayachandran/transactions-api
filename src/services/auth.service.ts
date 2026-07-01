import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWT_SECRET } from '../config/env';


const prisma = new PrismaClient();

const ACCESS_TOKEN_EXPIRY = '5m';
const REFRESH_TOKEN_EXPIRY = 15; // 15 minutes 



export const registerUser = async (email: string, password: string, name: string) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already in use');

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: { email: email, password: hashed, name: name }
    });
    return { id: user.id, name: user.name, email: user.email };
};

export const loginUser = async (email: string, password: string) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } };
}

export const refreshTokens = async (refreshToken: string) => {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) throw new Error('Invalid refresh token');
    if (stored.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { token: refreshToken } });
        throw new Error('Refresh token expired');
    }
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    const accessToken = generateAccessToken(stored.userId);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(stored.userId, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };

}

export const logoutUser = async (token: string) => {
    const result = await prisma.refreshToken.deleteMany({ where: { token } });
    if (result.count === 0) throw new Error('Invalid refresh token');
}

export const logoutAllDevices = async (userId: string) => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
}


//helpers

const generateAccessToken = (userId: string) => {
    return jwt.sign({ userId: userId }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString('hex');
}

const saveRefreshToken = async (userId: string, token: string) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + REFRESH_TOKEN_EXPIRY);

    await prisma.refreshToken.create({
        data: { token, userId, expiresAt }
    });
}