import { z } from 'zod';
import { CustomerType, CustomerStatus } from '@prisma/client';

export const createCustomerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits'),
  email: z.string().email('Invalid email address'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.nativeEnum(CustomerType).optional().default(CustomerType.WHOLESALE),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  status: z.nativeEnum(CustomerStatus).optional().default(CustomerStatus.ACTIVE),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createFollowUpSchema = z.object({
  note: z.string().min(3, 'Follow-up note is required'),
  followUpDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid follow-up date',
  }),
});
