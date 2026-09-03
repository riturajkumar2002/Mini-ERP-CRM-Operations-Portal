import { PrismaClient, UserRole, CustomerType, CustomerStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rituraj.com' },
    update: { password: hashedPassword, role: UserRole.ADMIN },
    create: {
      name: 'Admin User',
      email: 'admin@rituraj.com',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  });

  const sales = await prisma.user.upsert({
    where: { email: 'sales@rituraj.com' },
    update: { password: hashedPassword, role: UserRole.SALES },
    create: {
      name: 'Sales Manager',
      email: 'sales@rituraj.com',
      password: hashedPassword,
      role: UserRole.SALES,
    },
  });

  await prisma.user.upsert({
    where: { email: 'warehouse@rituraj.com' },
    update: { password: hashedPassword, role: UserRole.WAREHOUSE },
    create: {
      name: 'Warehouse Keeper',
      email: 'warehouse@rituraj.com',
      password: hashedPassword,
      role: UserRole.WAREHOUSE,
    },
  });

  await prisma.user.upsert({
    where: { email: 'accounts@rituraj.com' },
    update: { password: hashedPassword, role: UserRole.ACCOUNTS },
    create: {
      name: 'Accountant',
      email: 'accounts@rituraj.com',
      password: hashedPassword,
      role: UserRole.ACCOUNTS,
    },
  });

  console.log('Users seeded successfully!');

  // 2. Seed Products
  const p1 = await prisma.product.upsert({
    where: { sku: 'PROD-PUMP-01' },
    update: {
      name: 'Heavy Duty Industrial Pump',
      category: 'Machinery',
      unitPrice: 15000,
      minStockQty: 5,
      warehouse: 'Warehouse A',
    },
    create: {
      name: 'Heavy Duty Industrial Pump',
      sku: 'PROD-PUMP-01',
      category: 'Machinery',
      unitPrice: 15000,
      currentStock: 25,
      minStockQty: 5,
      warehouse: 'Warehouse A',
    },
  });

  const p2 = await prisma.product.upsert({
    where: { sku: 'PROD-VALVE-02' },
    update: {
      name: 'Stainless Steel Control Valve',
      category: 'Fittings',
      unitPrice: 3200,
      minStockQty: 10,
      warehouse: 'Warehouse B',
    },
    create: {
      name: 'Stainless Steel Control Valve',
      sku: 'PROD-VALVE-02',
      category: 'Fittings',
      unitPrice: 3200,
      currentStock: 8,
      minStockQty: 10, // Low stock demo
      warehouse: 'Warehouse B',
    },
  });

  const p3 = await prisma.product.upsert({
    where: { sku: 'PROD-GEAR-03' },
    update: {
      name: 'Precision Planetary Gearbox',
      category: 'Transmission',
      unitPrice: 24500,
      minStockQty: 3,
      warehouse: 'Warehouse A',
    },
    create: {
      name: 'Precision Planetary Gearbox',
      sku: 'PROD-GEAR-03',
      category: 'Transmission',
      unitPrice: 24500,
      currentStock: 15,
      minStockQty: 3,
      warehouse: 'Warehouse A',
    },
  });

  console.log('Products seeded successfully!');

  // 3. Seed Customers (Idempotent check by email)
  let c1 = await prisma.customer.findFirst({
    where: { email: 'vikram@zenithdynamics.com' },
  });

  if (!c1) {
    c1 = await prisma.customer.create({
      data: {
        name: 'Vikramaditya Singhania',
        mobile: '+919820154321',
        email: 'vikram@zenithdynamics.com',
        businessName: 'Zenith Dynamics & Solutions',
        gstNumber: '27AACCA1234E1Z9',
        customerType: CustomerType.WHOLESALE,
        address: 'Plot 54, Hinjewadi Phase 1, Pune, MH',
        status: CustomerStatus.ACTIVE,
        followUpDate: new Date(Date.now() + 86400000 * 3),
        notes: 'Interested in bulk pump orders and yearly maintenance contract for Q3',
        createdById: sales.id,
        followUps: {
          create: [
            {
              note: 'Initial executive meeting - dispatched industrial technical catalog',
              followUpDate: new Date(Date.now() - 86400000 * 2),
              createdById: sales.id,
            },
          ],
        },
      },
    });
  } else {
    c1 = await prisma.customer.update({
      where: { id: c1.id },
      data: {
        name: 'Vikramaditya Singhania',
        businessName: 'Zenith Dynamics & Solutions',
        customerType: CustomerType.WHOLESALE,
      },
    });
  }

  let c2 = await prisma.customer.findFirst({
    where: { email: 'ananya@novatrade.in' },
  });

  if (!c2) {
    c2 = await prisma.customer.create({
      data: {
        name: 'Ananya Deshmukh',
        mobile: '+919833287654',
        email: 'ananya@novatrade.in',
        businessName: 'Nova Trade & Supply Chain',
        gstNumber: '24AABBN5678M2Z1',
        customerType: CustomerType.DISTRIBUTOR,
        address: 'Tower B, Commercial Hub, Surat, GJ',
        status: CustomerStatus.LEAD,
        notes: 'Requested distributor price quotes for stainless control valves',
        createdById: sales.id,
      },
    });
  } else {
    c2 = await prisma.customer.update({
      where: { id: c2.id },
      data: {
        name: 'Ananya Deshmukh',
        businessName: 'Nova Trade & Supply Chain',
        customerType: CustomerType.DISTRIBUTOR,
      },
    });
  }

  let c3 = await prisma.customer.findFirst({
    where: { email: 'rohan@auraprecision.com' },
  });

  if (!c3) {
    await prisma.customer.create({
      data: {
        name: 'Rohan Banerjee',
        mobile: '+919811233445',
        email: 'rohan@auraprecision.com',
        businessName: 'Aura Precision Engineering',
        gstNumber: '29AAACP9988K1Z3',
        customerType: CustomerType.RETAIL,
        address: 'Sector 62, Electronic City, Bengaluru, KA',
        status: CustomerStatus.ACTIVE,
        notes: 'Regular retail order for precision planetary gearboxes',
        createdById: sales.id,
      },
    });
  }

  console.log('Customers seeded successfully!');

  // 4. Initial Stock Movements (Idempotent)
  const existingM1 = await prisma.stockMovement.findFirst({
    where: { productId: p1.id, reason: 'Initial opening stock receipt' },
  });
  if (!existingM1) {
    await prisma.stockMovement.create({
      data: {
        productId: p1.id,
        quantity: p1.currentStock,
        type: 'IN',
        reason: 'Initial opening stock receipt',
        createdById: admin.id,
      },
    });
  }

  const existingM2 = await prisma.stockMovement.findFirst({
    where: { productId: p2.id, reason: 'Initial opening stock receipt' },
  });
  if (!existingM2) {
    await prisma.stockMovement.create({
      data: {
        productId: p2.id,
        quantity: p2.currentStock,
        type: 'IN',
        reason: 'Initial opening stock receipt',
        createdById: admin.id,
      },
    });
  }

  const existingM3 = await prisma.stockMovement.findFirst({
    where: { productId: p3.id, reason: 'Initial opening stock receipt' },
  });
  if (!existingM3) {
    await prisma.stockMovement.create({
      data: {
        productId: p3.id,
        quantity: p3.currentStock,
        type: 'IN',
        reason: 'Initial opening stock receipt',
        createdById: admin.id,
      },
    });
  }

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
