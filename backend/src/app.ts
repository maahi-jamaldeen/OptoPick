import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import examRoutes from './routes/examRoutes.js';
import productRoutes from './routes/productRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Security and CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Rate limiting on sensitive authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many authentication attempts. Please try again later.' }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'OptoPick Intelligent Optical Center Management System',
    client: 'Indian Optician, Nintavur, Sri Lanka',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/examinations', examRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
