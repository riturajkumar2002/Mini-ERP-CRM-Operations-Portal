import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import {
  createChallanSchema,
  updateChallanStatusSchema,
} from '../validators/challan.validator';
import { ChallanStatus } from '@prisma/client';

const generateChallanNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CH-${timestamp}-${random}`;
};

export const createChallan = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createChallanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const { customerId, items } = parseResult.data;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return next(new AppError('One or more selected products do not exist', 400));
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    let totalQuantity = 0;
    const challanItemsData = items.map((item) => {
      const prod = productMap.get(item.productId)!;
      totalQuantity += item.quantity;
      return {
        quantity: item.quantity,
        productName: prod.name,
        sku: prod.sku,
        unitPrice: prod.unitPrice,
        productId: prod.id,
      };
    });

    const challanNumber = generateChallanNumber();

    const challan = await prisma.challan.create({
      data: {
        challanNumber,
        totalQuantity,
        status: ChallanStatus.DRAFT,
        customerId,
        createdById: req.user!.id,
        items: {
          create: challanItemsData,
        },
      },
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true } },
        items: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Draft Challan created successfully',
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const getChallans = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1')) || 1;
    const limit = parseInt(String(req.query.limit || '10')) || 10;
    const search = String(req.query.search || '');
    const status = req.query.status ? String(req.query.status) : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status && Object.values(ChallanStatus).includes(status as ChallanStatus)) {
      where.status = status as ChallanStatus;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true } },
          createdBy: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: challans,
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

export const getChallanById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid challan ID', 400));
    }

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!challan) {
      return next(new AppError('Challan not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: challan,
    });
  } catch (error) {
    next(error);
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid challan ID', 400));
    }

    const parseResult = updateChallanStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const newStatus = parseResult.data.status;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return next(new AppError('Challan not found', 404));
    }

    if (challan.status === newStatus) {
      return next(new AppError(`Challan is already in ${newStatus} state`, 400));
    }

    if (challan.status !== ChallanStatus.DRAFT) {
      return next(
        new AppError(`Cannot change status of a ${challan.status} challan`, 400)
      );
    }

    if (newStatus === ChallanStatus.CANCELLED) {
      const updated = await prisma.challan.update({
        where: { id },
        data: { status: ChallanStatus.CANCELLED },
      });
      return res.status(200).json({
        success: true,
        message: 'Challan cancelled successfully',
        data: updated,
      });
    }

    if (newStatus === ChallanStatus.CONFIRMED) {
      const confirmedChallan = await prisma.$transaction(async (tx) => {
        const requiredQtyMap = new Map<number, { qty: number; name: string; sku: string }>();
        for (const item of challan.items) {
          const existing = requiredQtyMap.get(item.productId);
          if (existing) {
            existing.qty += item.quantity;
          } else {
            requiredQtyMap.set(item.productId, {
              qty: item.quantity,
              name: item.productName,
              sku: item.sku,
            });
          }
        }

        for (const [productId, info] of requiredQtyMap.entries()) {
          const product = await tx.product.findUnique({
            where: { id: productId },
          });

          if (!product) {
            throw new AppError(
              `Product '${info.name}' (ID: ${productId}) no longer exists`,
              400
            );
          }

          if (product.currentStock < info.qty) {
            throw new AppError(
              `Insufficient stock for '${info.name}' (SKU: ${info.sku})! Required: ${info.qty}, Available: ${product.currentStock}`,
              400
            );
          }
        }

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockMovement.create({
            data: {
              quantity: item.quantity,
              type: 'OUT',
              reason: `Sales Challan Confirmation: ${challan.challanNumber}`,
              productId: item.productId,
              createdById: req.user!.id,
            },
          });
        }

        const updated = await tx.challan.update({
          where: { id },
          data: { status: ChallanStatus.CONFIRMED },
          include: { customer: true, items: true },
        });

        return updated;
      });

      return res.status(200).json({
        success: true,
        message: 'Challan confirmed successfully! Inventory deducted.',
        data: confirmedChallan,
      });
    }
  } catch (error) {
    next(error);
  }
};
