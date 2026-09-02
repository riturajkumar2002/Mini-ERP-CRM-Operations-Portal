import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import { errorHandler } from './middleware/error';
import { prisma } from './config/db';
import { authenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean) as string[];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Rituraj ERP + CRM API Server Running' });
});

// Dashboard Analytics Endpoint
app.get('/api/dashboard', authenticateToken, async (_req: Request, res: Response, next) => {
  try {
    const [totalCustomers, activeCustomers, totalProducts, products, recentChallans, totalChallans] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count(),
      prisma.product.findMany({ select: { id: true, name: true, sku: true, currentStock: true, minStockQty: true } }),
      prisma.challan.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, businessName: true } } },
      }),
      prisma.challan.count(),
    ]);

    const lowStockCount = products.filter((p) => p.currentStock <= p.minStockQty).length;
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStockQty);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        totalProducts,
        lowStockCount,
        lowStockProducts,
        totalChallans,
        recentChallans,
      },
    });
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

// Error Handler
app.use(errorHandler);

const portNumber = Number(PORT);
app.listen(portNumber, '0.0.0.0', () => {
  console.log(`🚀 Mini ERP + CRM Server running on port ${portNumber}`);
});

export default app;
