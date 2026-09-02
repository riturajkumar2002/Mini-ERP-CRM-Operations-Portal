import { Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/error';
import {
  createProductSchema,
  updateProductSchema,
  stockMovementSchema,
} from '../validators/product.validator';

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const parseResult = createProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const existing = await prisma.product.findUnique({
      where: { sku: parseResult.data.sku },
    });

    if (existing) {
      return next(new AppError('Product SKU already exists', 409));
    }

    const product = await prisma.product.create({
      data: parseResult.data,
    });

    if (product.currentStock > 0) {
      await prisma.stockMovement.create({
        data: {
          quantity: product.currentStock,
          type: 'IN',
          reason: 'Initial opening stock',
          productId: product.id,
          createdById: req.user!.id,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1')) || 1;
    const limit = parseInt(String(req.query.limit || '10')) || 10;
    const search = String(req.query.search || '');
    const category = req.query.category ? String(req.query.category) : undefined;
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    let products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    if (lowStockOnly) {
      products = products.filter((p) => p.currentStock <= p.minStockQty);
    }

    const total = products.length;
    const paginatedProducts = products.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: paginatedProducts,
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

export const getProductById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid product ID', 400));
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { id: true, name: true, role: true } } },
        },
      },
    });

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(String(req.params.id));
    if (isNaN(id)) {
      return next(new AppError('Invalid product ID', 400));
    }

    const parseResult = updateProductSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Product not found', 404));
    }

    const { currentStock, ...updateData } = parseResult.data;

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const manageStockMovement = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const productId = parseInt(String(req.params.id));
    if (isNaN(productId)) {
      return next(new AppError('Invalid product ID', 400));
    }

    const parseResult = stockMovementSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(parseResult.error.issues[0].message, 400));
    }

    const { quantity, type, reason } = parseResult.data;

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      let newStock = product.currentStock;

      if (type === 'IN') {
        newStock += quantity;
      } else if (type === 'OUT') {
        if (product.currentStock < quantity) {
          throw new AppError(
            `Insufficient stock! Requested ${quantity}, but current stock is only ${product.currentStock}`,
            400
          );
        }
        newStock -= quantity;
      }

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      });

      const movement = await tx.stockMovement.create({
        data: {
          quantity,
          type,
          reason,
          productId,
          createdById: req.user!.id,
        },
        include: {
          createdBy: { select: { id: true, name: true, role: true } },
          product: { select: { id: true, name: true, sku: true } },
        },
      });

      return { product: updatedProduct, movement };
    });

    return res.status(200).json({
      success: true,
      message: `Stock ${type} movement of ${quantity} units completed successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getStockMovements = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(String(req.query.page || '1')) || 1;
    const limit = parseInt(String(req.query.limit || '15')) || 15;
    const productId = req.query.productId ? parseInt(String(req.query.productId)) : undefined;
    const type = req.query.type ? String(req.query.type) : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId && !isNaN(productId)) {
      where.productId = productId;
    }
    if (type && (type === 'IN' || type === 'OUT')) {
      where.type = type;
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: movements,
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
