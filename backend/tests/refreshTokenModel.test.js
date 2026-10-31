import { describe, expect, it } from 'bun:test';
import RefreshToken from '../model/RefreshToken.js';

describe('RefreshToken model', () => {
    it('requires a user, token hash, and expiration date', async () => {
        let validationError;
        try {
            await new RefreshToken().validate();
        } catch (error) {
            validationError = error;
        }

        expect(validationError).toBeDefined();
        expect(validationError.name).toBe('ValidationError');
        expect(Object.keys(validationError.errors).sort()).toEqual([
            'expiresAt',
            'tokenHash',
            'user'
        ]);
    });

    it('creates a TTL index for refresh-token expiration', () => {
        const ttlIndex = RefreshToken.schema.indexes().find(
            ([fields, options]) => fields.expiresAt === 1 && options.expireAfterSeconds === 0
        );

        expect(ttlIndex).toBeDefined();
    });

    it('enforces unique token hashes', () => {
        const uniqueHashIndex = RefreshToken.schema.indexes().find(
            ([fields, options]) => fields.tokenHash === 1 && options.unique === true
        );

        expect(uniqueHashIndex).toBeDefined();
    });

    it('indexes refresh tokens by user for account-level lookups', () => {
        const userIndex = RefreshToken.schema.indexes().find(
            ([fields]) => fields.user === 1
        );

        expect(userIndex).toBeDefined();
    });

    it('casts string user ids and accepts a valid token document', async () => {
        const token = new RefreshToken({
            user: '507f1f77bcf86cd799439011',
            tokenHash: 'a'.repeat(64),
            expiresAt: new Date(Date.now() + 60_000)
        });

        await expect(token.validate()).resolves.toBeUndefined();
        expect(token.user.toString()).toBe('507f1f77bcf86cd799439011');
    });
});
