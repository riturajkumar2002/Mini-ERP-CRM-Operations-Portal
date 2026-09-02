import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { loginSchema } from '../validators/auth.validator';
import { AppError } from '../middleware/error';
import { AuthRequest } from '../middleware/auth';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const { email, password } = parseResult.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return next(new AppError('Unauthorized', 401));
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
