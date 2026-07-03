import prisma from "../lib/prisma";
import redis from "../lib/redis";

const CACHE_TTL_SECONDS = 100;

function walletCacheKey(walletId: string) {
    return `wallet:balance:${walletId}`;
}


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

    const cachKey = walletCacheKey(walletId);
    const cached = await redis.get(cachKey);

    if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.userId != userId) throw new Error('Not Authorized');
        return { id: parsed.id, balance: parsed.balance, currency: parsed.currency }
    }

    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.userId != userId) throw new Error('Not Authorized');

    await redis.set(
        cachKey,
        JSON.stringify({ id: wallet.id, userId: wallet.userId, balance: wallet.balance, currency: wallet.currency },),
        'EX',
        CACHE_TTL_SECONDS
    );

    return { id: wallet.id, balance: wallet.balance, currency: wallet.currency };
}

export const depositFunds = async (walletId: string, userId: string, amount: number) => {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.userId != userId) throw new Error('Not Authorized');

    const updated = await prisma.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: amount } }
    });

    redis.del(walletCacheKey(walletId));

    return updated;
}