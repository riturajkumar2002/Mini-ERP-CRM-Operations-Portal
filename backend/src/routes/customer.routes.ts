import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addFollowUp,
} from '../controllers/customer.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(UserRole.ADMIN, UserRole.SALES), createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', requireRole(UserRole.ADMIN, UserRole.SALES), updateCustomer);
router.delete('/:id', requireRole(UserRole.ADMIN), deleteCustomer);
router.post('/:id/follow-ups', requireRole(UserRole.ADMIN, UserRole.SALES), addFollowUp);

export default router;
