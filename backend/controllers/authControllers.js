import User from "../model/User.js";
import RefreshToken from "../model/RefreshToken.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_PATH = '/auth';

function getTokenSecrets() {
    const accessSecret = process.env.JWT_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
        console.error('JWT_SECRET and JWT_REFRESH_SECRET must be configured');
        return null;
    }
    return { accessSecret, refreshSecret };
}

function hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
}

function getRefreshCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: REFRESH_COOKIE_PATH,
        maxAge: REFRESH_TOKEN_TTL_MS
    };
}

function readRefreshCookie(req) {
    const cookie = req.get('cookie')
        ?.split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith(`${REFRESH_COOKIE}=`));
    return cookie?.slice(REFRESH_COOKIE.length + 1) || null;
}

function setRefreshCookie(res, token) {
    res.cookie(REFRESH_COOKIE, token, getRefreshCookieOptions());
}

function clearRefreshCookie(res) {
    const options = getRefreshCookieOptions();
    res.clearCookie(REFRESH_COOKIE, {
        httpOnly: options.httpOnly,
        secure: options.secure,
        sameSite: options.sameSite,
        path: options.path
    });
}

function createAccessToken(userId, accessSecret) {
    return jwt.sign(
        { sub: userId.toString(), tokenUse: 'access' },
        accessSecret,
        { expiresIn: ACCESS_TOKEN_TTL, algorithm: 'HS256' }
    );
}

async function createTokenPair(userId, secrets) {
    const accessToken = createAccessToken(userId, secrets.accessSecret);
    const refreshToken = jwt.sign(
        { sub: userId.toString(), tokenUse: 'refresh', jti: randomUUID() },
        secrets.refreshSecret,
        { expiresIn: REFRESH_TOKEN_TTL, algorithm: 'HS256' }
    );

    await RefreshToken.create({
        user: userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
    });

    return { accessToken, refreshToken };
}

function verifyRefreshToken(token, refreshSecret) {
    const payload = jwt.verify(token, refreshSecret, { algorithms: ['HS256'] });
    if (
        payload === null ||
        typeof payload !== 'object' ||
        payload.tokenUse !== 'refresh' ||
        typeof payload.sub !== 'string'
    ) {
        return null;
    }
    return payload;
}

export const registerUser = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Request body must be a JSON object' });
        }

        const { firstName, lastName, fullName, username, emailAddress, password } = req.body;

        const fields = [firstName, lastName, fullName, username, emailAddress, password];
        if (fields.some((field) => typeof field !== 'string')) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const normalizedFirstName = firstName.trim();
        const normalizedLastName = lastName.trim();
        const normalizedFullName = fullName.trim();
        const normalizedUsername = username.trim();
        const normalizedEmailAddress = emailAddress.trim().toLowerCase();

        if (
            !normalizedFirstName ||
            !normalizedLastName ||
            !normalizedFullName ||
            !normalizedUsername ||
            !normalizedEmailAddress ||
            !password.trim()
        ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(400).json({ message: 'Please choose a shorter password' });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmailAddress)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        const secrets = getTokenSecrets();
        if (!secrets) {
            return res.status(500).json({ message: 'Authentication is not configured' });
        }

        const existingUser = await User.findOne({
            $or: [{ emailAddress: normalizedEmailAddress }, { username: normalizedUsername }]
        });
        if (existingUser) {
            return res.status(409).json({ message: 'Email or username is already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({
            firstName: normalizedFirstName,
            lastName: normalizedLastName,
            fullName: normalizedFullName,
            username: normalizedUsername,
            emailAddress: normalizedEmailAddress,
            password: hashedPassword
        });

        await newUser.save();
        const tokens = await createTokenPair(newUser._id, secrets);
        setRefreshCookie(res, tokens.refreshToken);

        res.status(201).json({ message: 'User registered successfully', accessToken: tokens.accessToken });
    } catch (error) {
        if (error && error.code === 11000) {
            return res.status(409).json({ message: 'Email or username is already in use' });
        }

        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const loginUser = async (req, res) => {
    try {
        if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
            return res.status(400).json({ message: 'Request body must be a JSON object' });
        }

        const { emailAddress, password } = req.body;

        if (typeof emailAddress !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmailAddress = emailAddress.trim().toLowerCase();

        if (!normalizedEmailAddress || !password.trim()) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        if (Buffer.byteLength(password, 'utf8') > 72) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = await User.findOne({ emailAddress: normalizedEmailAddress });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const secrets = getTokenSecrets();
        if (!secrets) {
            return res.status(500).json({ message: 'Authentication is not configured' });
        }

        const tokens = await createTokenPair(user._id, secrets);
        setRefreshCookie(res, tokens.refreshToken);

        res.status(200).json({ message: 'Login successful', accessToken: tokens.accessToken });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}

export const refreshAccessToken = async (req, res) => {
    const refreshToken = readRefreshCookie(req);
    if (!refreshToken) {
        return res.status(401).json({ message: 'Please sign in to continue' });
    }

    const secrets = getTokenSecrets();
    if (!secrets) {
        return res.status(500).json({ message: 'Authentication is not configured' });
    }

    try {
        const payload = verifyRefreshToken(refreshToken, secrets.refreshSecret);
        if (!payload) {
            clearRefreshCookie(res);
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const storedToken = await RefreshToken.findOne({
            user: payload.sub,
            tokenHash: hashToken(refreshToken),
            expiresAt: { $gt: new Date() }
        });
        if (!storedToken) {
            clearRefreshCookie(res);
            return res.status(401).json({ message: 'Your 7-day session has expired. Please sign in again' });
        }

        const userExists = await User.exists({ _id: payload.sub });
        if (!userExists) {
            clearRefreshCookie(res);
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        const accessToken = createAccessToken(payload.sub, secrets.accessSecret);
        return res.status(200).json({ accessToken });
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
            clearRefreshCookie(res);
            return res.status(401).json({ message: 'Your session has expired. Please sign in again' });
        }

        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

export const logoutUser = async (req, res) => {
    const refreshToken = readRefreshCookie(req);
    clearRefreshCookie(res);
    if (refreshToken) {
        await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
    }
    return res.status(204).end();
};