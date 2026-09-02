import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  manageStockMovement,
  getStockMovements,
} from '../controllers/product.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), createProduct);
router.get('/', getProducts);
router.get('/stock/history', getStockMovements);
router.get('/:id', getProductById);
router.put('/:id', requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), updateProduct);
router.post('/:id/stock', requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), manageStockMovement);

export default router;
