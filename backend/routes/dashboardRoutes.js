import express from 'express';
import { createMessage, getDashboard, getMessages } from '../controllers/dashboardController.js';
import protect from '../middleware/protect.js';

const router = express.Router();

router.get('/', protect, getDashboard);
router.get('/channels/:channelId/messages', protect, getMessages);
router.post('/channels/:channelId/messages', protect, createMessage);

export default router;
