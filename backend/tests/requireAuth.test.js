import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import requireAuth from '../middleware/requireAuth.js';

const JWT_SECRET = 'unit-test-access-token-secret';
const USER_ID = '507f1f77bcf86cd799439011';
let previousJwtSecret;

function createResponse() {
    let statusCode;
    let body;
    const response = {
        status(code) {
            statusCode = code;
            return response;
        },
        json(payload) {
            body = payload;
            return response;
        }
    };

    return {
        response,
        get statusCode() {
            return statusCode;
        },
        get body() {
            return body;
        }
    };
}

function createRequest(token) {
    return {
        get: mock((header) => {
            if (header.toLowerCase() !== 'authorization') return undefined;
            return token === undefined ? undefined : `Bearer ${token}`;
        })
    };
}

function createAccessToken(overrides = {}, options = {}) {
    return jwt.sign(
        { sub: USER_ID, tokenUse: 'access', ...overrides },
        JWT_SECRET,
        { algorithm: 'HS256', ...options }
    );
}

function createRequestWithAuthorization(authorization) {
    return {
        get: mock((header) => header.toLowerCase() === 'authorization' ? authorization : undefined)
    };
}

describe('requireAuth middleware', () => {
    beforeEach(() => {
        previousJwtSecret = process.env.JWT_SECRET;
        process.env.JWT_SECRET = JWT_SECRET;
    });

    afterEach(() => {
        if (previousJwtSecret === undefined) {
            delete process.env.JWT_SECRET;
        } else {
            process.env.JWT_SECRET = previousJwtSecret;
        }
        mock.restore();
    });

    it('rejects requests without a bearer token', async () => {
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequest(), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Please sign in to continue');
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects refresh tokens when authenticating API requests', async () => {
        const token = createAccessToken({ tokenUse: 'refresh' });
        const result = createResponse();
        const next = mock();
        const findById = spyOn(User, 'findById');

        await requireAuth(createRequest(token), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Invalid authentication token');
        expect(findById).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects expired access tokens', async () => {
        const token = createAccessToken({}, { expiresIn: -1 });
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequest(token), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Your session has expired. Please sign in again');
        expect(next).not.toHaveBeenCalled();
    });

    it('loads the user and continues for a valid access token', async () => {
        const user = { _id: USER_ID, username: 'jane' };
        const select = mock(async () => user);
        const findById = spyOn(User, 'findById').mockReturnValue({ select });
        const result = createResponse();
        const req = createRequest(createAccessToken());
        const next = mock();

        await requireAuth(req, result.response, next);

        expect(findById).toHaveBeenCalledWith(USER_ID);
        expect(select).toHaveBeenCalledWith('_id firstName lastName username');
        expect(req.user).toBe(user);
        expect(next).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toBeUndefined();
    });

    it('rejects a valid token when its user no longer exists', async () => {
        const select = mock(async () => null);
        spyOn(User, 'findById').mockReturnValue({ select });
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequest(createAccessToken()), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Invalid authentication token');
        expect(next).not.toHaveBeenCalled();
    });

    it.each([
        'Basic token',
        'Bearer',
        'Bearer token extra',
        'Bearer token extra parts'
    ])('rejects malformed authorization header: %s', async (authorization) => {
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequestWithAuthorization(authorization), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Please sign in to continue');
        expect(next).not.toHaveBeenCalled();
    });

    it('reports a server error when the access-token secret is missing', async () => {
        delete process.env.JWT_SECRET;
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequest(createAccessToken()), result.response, next);

        expect(result.statusCode).toBe(500);
        expect(result.body.message).toBe('Authentication is not configured');
        expect(next).not.toHaveBeenCalled();
    });

    it.each([
        ['malformed token', 'not.a.jwt'],
        ['token signed by another secret', jwt.sign(
            { sub: USER_ID, tokenUse: 'access' },
            'different-test-secret',
            { algorithm: 'HS256' }
        )]
    ])('rejects %s without querying the user model', async (_label, token) => {
        const result = createResponse();
        const next = mock();
        const findById = spyOn(User, 'findById');

        await requireAuth(createRequest(token), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(findById).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('rejects an access token with an invalid user id', async () => {
        const token = createAccessToken({ sub: 'not-an-object-id' });
        const result = createResponse();
        const next = mock();
        const findById = spyOn(User, 'findById');

        await requireAuth(createRequest(token), result.response, next);

        expect(result.statusCode).toBe(401);
        expect(result.body.message).toBe('Invalid authentication token');
        expect(findById).not.toHaveBeenCalled();
        expect(next).not.toHaveBeenCalled();
    });

    it('passes database failures to the error handler', async () => {
        const databaseError = new Error('database unavailable');
        const select = mock(async () => {
            throw databaseError;
        });
        spyOn(User, 'findById').mockReturnValue({ select });
        const result = createResponse();
        const next = mock();

        await requireAuth(createRequest(createAccessToken()), result.response, next);

        expect(next).toHaveBeenCalledWith(databaseError);
        expect(result.statusCode).toBeUndefined();
    });
});
