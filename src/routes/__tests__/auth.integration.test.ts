import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

describe('POST api/auth/register', () => {
    // clean up the users table before each test so tests don't interfere with each other
    beforeEach(async () => {
        await prisma.transaction.deleteMany();
        await prisma.wallet.deleteMany();
        await prisma.refreshToken.deleteMany();
        await prisma.user.deleteMany();
    })
    // close the Prisma connection after all tests finish, so Jest can exit cleanly
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should register a new user with valid data', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'jibin@example.com',
                password: '12345Abc',
                name: 'jibin'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });

    it('shouldnot allow to register existing email', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({
                email: 'jibin@example.com',
                password: '12345Abc',
                name: 'jibin'
            });
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'jibin@example.com',
                password: '12345Abc',
                name: 'jibin'
            });
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });
});

describe('api/auth/login', () => {
    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('should login with valid username and password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jibin@example.com',
                password: '12345Abc',
            });
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
    });

    it('shouldnot login with  username and invallid password', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'jibin@example.com',
                password: '12345Abcdd',
            });
        expect(response.status).toBe(401);
        expect(response.body.success).toBe(false);
    });
});