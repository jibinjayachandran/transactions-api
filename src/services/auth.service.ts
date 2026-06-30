import { PrismaClient } from "@prisma/client";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env';


const prisma = new PrismaClient();


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
    if (!email || !password) throw new Error('Email and password are required');
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
}