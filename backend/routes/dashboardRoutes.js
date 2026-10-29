import express from 'express';
import { createMessage, getDashboard, getMessages } from '../controllers/dashboardController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);
router.get('/', getDashboard);
router.get('/channels/:channelId/messages', getMessages);
router.post('/channels/:channelId/messages', createMessage);

export default router;
