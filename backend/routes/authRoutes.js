// authRoutes.js

import express from 'express';
import { loginUser, logoutUser, refreshAccessToken, registerUser } from '../controllers/authControllers.js';

const router = express.Router();

// Register route
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logoutUser);

export default router;