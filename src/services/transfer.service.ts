import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const transferFunds = async (
    fromWalletId: string,
    toWalletId: string,
    userId: string,
    amount: number,
) => {
    if (!amount || amount <= 0) throw new Error('Amount must be positive');
    if (fromWalletId === toWalletId) throw new Error('Cannot transfer to the same wallet');

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const fromWallet = await tx.wallet.findUnique({ where: { id: fromWalletId } });
        if (!fromWallet) throw new Error('Source wallet not found');
        if (fromWallet.userId !== userId) throw new Error('Not authorized');
        if (fromWallet.balance < amount) throw new Error('Insufficient funds');

        const toWallet = await tx.wallet.findUnique({ where: { id: toWalletId } });
        if (!toWallet) throw new Error('Destination wallet not found');

        await tx.wallet.update({
            where: { id: fromWalletId },
            data: { balance: { decrement: amount } }
        });

        await tx.wallet.update({
            where: { id: toWalletId },
            data: { balance: { increment: amount } }
        });

        const transaction = await tx.transaction.create({
            data: { amount, type: 'TRANSFER', walletId: fromWalletId }
        });
        return transaction;
    });
}

export const getTransactionHistory = async (
    walletId: string,
    userId: string,
    page: number = 1,
    limit: number = 10
) => {
    const wallet = await prisma.wallet.findUnique({
        where: { id: walletId }
    });
    if (!wallet) throw new Error('Wallet not found');
    if (wallet.userId != userId) throw new Error('not authorized');

    const skip = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
    });

    const total = await prisma.transaction.count({
        where: { walletId }
    });

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}