import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be positive'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative').optional().default(0),
  minStockQty: z.number().int().min(0).optional().default(5),
  warehouse: z.string().min(1, 'Warehouse location is required'),
});

export const updateProductSchema = createProductSchema.partial();

export const stockMovementSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  type: z.nativeEnum(StockMovementType),
  reason: z.string().min(3, 'Reason for movement is required'),
});
