import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function cleanDatabase() {
    await prisma.transaction.deleteMany();
    await prisma.wallet.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
}

async function createUserWithWallet(balance: number) {
    const user = await prisma.user.create({
        data: {
            email: `user-${Date.now()}-${Math.random()}@example.com`,
            password: 'hashed-not-relevant-for-this-test',
            name: 'Test User',
        }
    });

    const wallet = await prisma.wallet.create({
        data: {
            userId: user.id, balance
        }
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!);
    return { user, wallet, token };
}

describe('api/transfers/transfer', () => {
    beforeEach(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should transfer funds and update both wallets correctly', async () => {
        const sender = await createUserWithWallet(1000);
        const receiver = await createUserWithWallet(0);

        const response = await request(app)
            .post('/api/transfers/transfer')
            .set('Authorization', `Bearer ${sender.token}`)
            .send({
                fromWalletId: sender.wallet.id,
                toWalletId: receiver.wallet.id,
                amount: 100
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);

        const updatedSenderWallet = await prisma.wallet.findUnique({ where: { id: sender.wallet.id } });
        const updatedReceiverWallet = await prisma.wallet.findUnique({ where: { id: receiver.wallet.id } });

        expect(updatedSenderWallet?.balance).toBe(900);
        expect(updatedReceiverWallet?.balance).toBe(100);


    });
});