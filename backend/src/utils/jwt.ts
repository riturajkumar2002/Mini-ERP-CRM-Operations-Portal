import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserRole } from '@prisma/client';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'mini-erp-crm-secret-key-2026';

export interface TokenPayload {
  id: number;
  email: string;
  role: UserRole;
  name: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
