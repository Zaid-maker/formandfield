import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();
await connectDB();

const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173'
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'tiny'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);

// health check route
app.get('/health', (req, res) => {
    res.status(200).json({ message: 'Server is healthy' });
});

app.use((error, req, res, next) => {
    console.error(error);
    if (res.headersSent) {
        return next(error);
    }

    const statusCode = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
        ? error.status
        : 500;
    const message = statusCode === 413
        ? 'Request body is too large'
        : statusCode === 400
            ? 'Invalid request body'
            : 'Server error';

    return res.status(statusCode).json({ message });
});

const port = process.env.PORT || 5000;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
})