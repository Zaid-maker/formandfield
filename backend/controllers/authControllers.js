import User from "../model/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

        res.status(201).json({ message: 'User registered successfully' });
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

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({ message: 'Authentication is not configured' });
        }

        const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
}