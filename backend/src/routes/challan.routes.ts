import { Router } from 'express';
import {
  createChallan,
  getChallans,
  getChallanById,
  updateChallanStatus,
} from '../controllers/challan.controller';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticateToken);

router.post('/', requireRole(UserRole.ADMIN, UserRole.SALES), createChallan);
router.get('/', getChallans);
router.get('/:id', getChallanById);
router.put('/:id/status', requireRole(UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE), updateChallanStatus);

export default router;
