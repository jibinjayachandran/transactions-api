

import { loginSchema, registerSchema } from '../auth.validators';


describe('registerSchema', () => {
    it('should accept valid registration data', () => {
        const result = registerSchema.safeParse({
            email: 'jibin@example.com',
            password: 'securePass@123',
            name: 'jibin'
        });

        expect(result.success).toBe(true);
    });

    it('should reject and invalid email', () => {
        const result = registerSchema.safeParse({
            email: 'jibin',
            password: 'securePass@123',
            name: 'jibin'
        });

        expect(result.success).toBe(false);
    });

    it('should reject a password less than 8', () => {
        const result = registerSchema.safeParse({
            email: 'jibin',
            password: '23',
            name: 'jibin'
        });

        expect(result.success).toBe(false);
    });

    it('should reject an empty name', () => {
        const result = registerSchema.safeParse({
            email: 'jibin',
            password: '23'

        });
        expect(result.success).toBe(false);
    });

});

describe('loginSchema', () => {
    it('login should be successful with email and password', () => {
        const result = loginSchema.safeParse({
            email: 'jibin@example.com',
            password: 'sJibin@123434'
        });
        expect(result.success).toBe(true);
    });

    it('login should fail without email and password',() =>{
        const result = loginSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});