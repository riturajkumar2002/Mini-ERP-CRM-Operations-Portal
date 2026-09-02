export type UserRole = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';

export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'LEAD';

export type StockMovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdById: number;
  createdBy?: { id: number; name: string; email: string };
  followUps?: FollowUp[];
  challans?: Challan[];
  createdAt: string;
  updatedAt: string;
  _count?: { followUps: number; challans: number };
}

export interface FollowUp {
  id: number;
  note: string;
  followUpDate: string;
  customerId: number;
  createdById: number;
  createdBy?: { id: number; name: string };
  createdAt: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStockQty: number;
  warehouse: string;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
}

export interface StockMovement {
  id: number;
  quantity: number;
  type: StockMovementType;
  reason: string;
  productId: number;
  product?: { id: number; name: string; sku: string };
  createdById: number;
  createdBy?: { id: number; name: string; role: UserRole };
  createdAt: string;
}

export interface ChallanItem {
  id?: number;
  quantity: number;
  productName: string;
  sku: string;
  unitPrice: number;
  challanId?: number;
  productId: number;
  product?: Product;
}

export interface Challan {
  id: number;
  challanNumber: string;
  totalQuantity: number;
  status: ChallanStatus;
  customerId: number;
  customer?: Customer;
  createdById: number;
  createdBy?: { id: number; name: string; email?: string; role?: UserRole };
  items: ChallanItem[];
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardData {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  lowStockProducts: Product[];
  totalChallans: number;
  recentChallans: Challan[];
}
