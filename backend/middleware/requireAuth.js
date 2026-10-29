import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../model/User.js';

async function requireAuth(req, res, next) {
    const authorization = req.get('authorization');
    const [scheme, token, ...extra] = authorization?.trim().split(/\s+/) ?? [];

    if (scheme !== 'Bearer' || !token || extra.length) {
        return res.status(401).json({ message: 'Please sign in to continue' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        console.error('JWT_SECRET is not configured');
        return res.status(500).json({ message: 'Authentication is not configured' });
    }

    try {
        const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
        if (
            payload === null ||
            typeof payload !== 'object' ||
            typeof payload.sub !== 'string' ||
            !mongoose.isValidObjectId(payload.sub)
        ) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        const user = await User.findById(payload.sub).select('_id firstName lastName username');
        if (!user) {
            return res.status(401).json({ message: 'Invalid authentication token' });
        }

        req.user = user;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Your session has expired. Please sign in again' });
        }

        return next(error);
    }
}

export default requireAuth;
