import { z } from 'zod';
import { ChallanStatus } from '@prisma/client';

export const challanItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive('Item quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  customerId: z.number().int().positive('Customer is required'),
  items: z.array(challanItemInputSchema).min(1, 'Challan must contain at least 1 item'),
});

export const updateChallanStatusSchema = z.object({
  status: z.nativeEnum(ChallanStatus),
});
