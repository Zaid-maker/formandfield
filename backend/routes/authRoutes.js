// authRoutes.js

import express from 'express';
import { loginUser, registerUser } from '../controllers/authControllers.js';

const router = express.Router();

// Register route
router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;