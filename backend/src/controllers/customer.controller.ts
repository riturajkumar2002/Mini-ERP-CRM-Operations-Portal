import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createFollowUpSchema,
} from '../validators/customer.validator';

export const createCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const userId = req.user!.id;
    const { followUpDate, ...rest } = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        ...rest,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        createdById: userId,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1')) || 1;
    const limit = parseInt(String(req.query.limit || '10')) || 10;
    const search = String(req.query.search || '');
    const status = req.query.status ? String(req.query.status) : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          _count: { select: { followUps: true, challans: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid customer ID', 400));
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { id: true, name: true } } },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, challanNumber: true, totalQuantity: true, status: true, createdAt: true },
        },
      },
    });

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid customer ID', 400));
    }

    const parseResult = updateCustomerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Customer not found', 404));
    }

    const { followUpDate, ...rest } = parseResult.data;

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(followUpDate !== undefined && {
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid customer ID', 400));
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Customer not found', 404));
    }

    await prisma.customer.delete({ where: { id } });

    return res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const addFollowUp = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const customerId = parseInt(String(req.params.id));
    if (isNaN(customerId)) {
      return next(new AppError('Invalid customer ID', 400));
    }

    const parseResult = createFollowUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const { note, followUpDate } = parseResult.data;
    const nextDate = new Date(followUpDate);

    const [followUp] = await prisma.$transaction([
      prisma.followUp.create({
        data: {
          note,
          followUpDate: nextDate,
          customerId,
          createdById: req.user!.id,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      }),
      prisma.customer.update({
        where: { id: customerId },
        data: { followUpDate: nextDate },
      }),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Follow-up recorded successfully',
      data: followUp,
    });
  } catch (error) {
    next(error);
  }
};
