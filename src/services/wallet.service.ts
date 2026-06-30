import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createWalletForUser = async (userId: string) => {
    const existing = await prisma.wallet.findFirst({ where: { userId } });
    if (existing) throw new Error('Wallet already exists for this user.');

    return prisma.wallet.create({ data: { userId } });
}

export const getWalletDetails = async (userId: string) => {
    const wallet = await prisma.wallet.findFirst({ where: { userId } });
    if (!wallet) throw new Error('No Wallet for this user.');
    return wallet;
}

export const getWalletBalance = async (walletId: string, userId: string) => {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.userId != userId) throw new Error('Not Authorized');

    return { id: wallet.id, balance: wallet.balance, currency: wallet.currency };
}

export const depositFunds = async (walletId: string, userId: string, amount: number) => {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.userId != userId) throw new Error('Not Authorized');

    return prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } }
    });
}