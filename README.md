# Rituraj Operations Portal | Mini ERP + CRM

> **Production-Ready Full-Stack Operations Portal**  
> A full-stack Operations Portal built for wholesale/distribution businesses featuring Role-Based Access Control (RBAC), Customer CRM with interaction tracking and profile editing, Inventory Stock Management with non-negative validation and required warehouse locations, and a Sales Delivery Challan Workflow supported by atomic transactions.

---

## 📋 Table of Contents
1. [Project Overview & Business Problem](#-project-overview--business-problem)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & Design Systems](#-architecture--design-systems)
5. [Folder Structure](#-folder-structure)
6. [Database Design & ER Relationship Explanation](#-database-design--er-relationship-explanation)
7. [Authentication & JWT Security](#-authentication--jwt-security)
8. [Role Permissions Matrix](#-role-permissions-matrix)
9. [API Reference & Endpoint Summary](#-api-reference--endpoint-summary)
10. [Environment Variables](#-environment-variables)
11. [PostgreSQL & Prisma Setup](#-postgresql--prisma-setup)
12. [Idempotent Seed Instructions](#-idempotent-seed-instructions)
13. [Backend Setup](#-backend-setup)
14. [Frontend Setup](#-frontend-setup)
15. [Running Locally](#-running-locally)
16. [Testing Workflow & Scenarios](#-testing-workflow--scenarios)
17. [Postman Collection Instructions](#-postman-collection-instructions)
18. [Render Deployment Guide](#-render-deployment-guide)
19. [Assumptions & Design Decisions](#-assumptions--design-decisions)
20. [Known Limitations](#-known-limitations)

---

## 🎯 Project Overview & Business Problem

Wholesale and distribution companies require a cohesive, reliable software system to streamline:
- **Client Management (CRM)**: Tracking retail, wholesale, and distributor client profiles, GST details, contact leads, and historical sales follow-up notes.
- **Inventory & Warehouse Tracking**: Maintaining multi-warehouse product stock, establishing minimum stock thresholds, preventing negative stock levels, and keeping audit-log history for every stock movement (IN/OUT).
- **Sales Delivery Challans**: Generating multi-product delivery notes in `DRAFT` state without prematurely altering stock, then confirming them in a single **atomic database transaction** so stock is deducted cleanly across all line items or completely rolled back if stock is insufficient.

This application provides a fast, secure REST API backend and a responsive, high-aesthetic React ERP/CRM SaaS dashboard.

---

## ✨ Key Features

1. **Role-Based Access Control (RBAC)**:
   - 4 distinct role permissions: `ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`.
   - Backend authorization middleware strictly enforces access rules on every API call.
2. **Customer CRM**:
   - Customer types: `RETAIL`, `WHOLESALE`, `DISTRIBUTOR`.
   - Complete CRUD operations (Create, Read, Search, Edit profile, Delete).
   - Follow-up timeline notes and next scheduled follow-up date tracking.
3. **Inventory & Warehouse Management**:
   - Required warehouse location on every catalog product.
   - Non-negative stock enforcement (attempts to issue more stock than available return HTTP 400 with no stock changes).
   - Low-stock warning indicators (`currentStock <= minStockQty`).
   - Audit trail of stock receipts (IN) and issues (OUT) with user and timestamp logging.
4. **Sales Challan Workflow**:
   - Multi-product line items with line subtotal and total value estimation.
   - Saves product price, SKU, and name snapshots in `ChallanItem` so historical records remain unaffected by future catalog price edits.
   - Atomic confirmation logic (`DRAFT` → `CONFIRMED`): checks all requested item quantities inside a single transaction; if any item stock is insufficient, the entire transaction rolls back cleanly with HTTP 400.

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM 6.19.0, PostgreSQL.
- **Frontend**: React 19, TypeScript, Vite, React Router DOM v7, Axios, Lucide Icons, Modern SaaS CSS Design System.
- **Validation & Security**: Zod request schema validation, JWT token authorization, `bcryptjs` password hashing, environment-based CORS.

---

## 🏗 Architecture & Design Systems

- **Layered Architecture**: Express routes delegate to Zod validators, controllers handle business logic and Prisma transactions, centralized error middleware formats consistent JSON error responses.
- **SaaS Executive Design System**: Professional dark palette (Deep Navy `#0b0f19`, Card Containers `#1e293b`, Primary Indigo `#6366f1`), consistent typography, accessible color contrast, toast notification feedback, modal dialogs, empty states, and skeleton loading indicators.

---

## 📂 Folder Structure

```
mini_erp_crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL database schema (7 models, 5 enums)
│   │   └── seed.ts                # Idempotent seed script for demo accounts & catalog
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts              # PrismaClient instance
│   │   ├── controllers/           # Auth, Customer, Product, Challan controllers
│   │   ├── middleware/            # JWT auth, Role RBAC, Error handler
│   │   ├── routes/                # Express API routes
│   │   ├── utils/                 # JWT sign/verify, bcrypt helpers
│   │   ├── validators/            # Zod validation schemas
│   │   └── app.ts                 # Main Express application entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/            # Header, Sidebar, Modal, ConfirmDialog, LoadingSkeleton, EmptyState, ErrorState, Pagination
│   │   ├── context/               # AuthContext, ToastContext, ThemeContext
│   │   ├── pages/                 # Login, Dashboard, Customers, CustomerDetail, Products, Inventory, StockHistory, Challans, CreateChallan, ChallanDetail
│   │   ├── services/              # Axios instance with API_BASE_URL env variable & 401 interceptor
│   │   ├── types/                 # TypeScript entity & API definitions
│   │   ├── App.tsx                # App router layout
│   │   └── index.css              # ERP SaaS CSS design system & Light/Dark themes
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
├── postman_collection.json        # Updated Postman API test collection
└── README.md
```

---

## 🗄 Database Design & ER Relationship Explanation

```
+------------+       +-------------------+       +--------------------+
|    User    |----<  |     Customer      |----<  |      FollowUp      |
+------------+       +-------------------+       +--------------------+
      |                       |
      |                       |
      |              +-------------------+       +--------------------+
      +-----------<  |      Challan      |----<  |    ChallanItem     |
      |              +-------------------+       +--------------------+
      |                                                    |
      |              +-------------------+                 |
      +-----------<  |   StockMovement   |                 |
                     +-------------------+                 |
                              |                            |
                              +--------------+-------------+
                                             |
                                    +------------------+
                                    |     Product      |
                                    +------------------+
```

### Models & Key Attributes
1. **User**: `id` (PK), `name`, `email` (Unique), `password`, `role` (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`), timestamps.
2. **Customer**: `id` (PK), `name`, `mobile`, `email`, `businessName`, `gstNumber` (Optional), `customerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`), `address`, `status` (`ACTIVE`, `INACTIVE`, `LEAD`), `followUpDate`, `notes`, `createdById` (FK -> User).
3. **FollowUp**: `id` (PK), `note`, `followUpDate`, `customerId` (FK -> Customer, Cascade Delete), `createdById` (FK -> User), `createdAt`.
4. **Product**: `id` (PK), `name`, `sku` (Unique), `category`, `unitPrice`, `currentStock`, `minStockQty`, `warehouse` (Required).
5. **StockMovement**: `id` (PK), `quantity`, `type` (`IN`, `OUT`), `reason`, `productId` (FK -> Product, Cascade Delete), `createdById` (FK -> User), `createdAt`.
6. **Challan**: `id` (PK), `challanNumber` (Unique), `totalQuantity`, `status` (`DRAFT`, `CONFIRMED`, `CANCELLED`), `customerId` (FK -> Customer), `createdById` (FK -> User), timestamps.
7. **ChallanItem**: `id` (PK), `quantity`, `productName` (Snapshot), `sku` (Snapshot), `unitPrice` (Snapshot), `challanId` (FK -> Challan, Cascade Delete), `productId` (FK -> Product).

---

## 🔐 Authentication & JWT Security

- **Endpoint**: `POST /api/auth/login` validates credentials against bcrypt-hashed passwords and returns a signed JWT containing user ID, email, role, and name.
- **Interceptors & Headers**: Frontend automatically attaches `Authorization: Bearer <TOKEN>` to outgoing requests and handles expired/invalid `401` tokens by clearing local session and redirecting to `/login`.

---

## 📊 Role Permissions Matrix

| Operations / Feature Area | ADMIN | SALES | WAREHOUSE | ACCOUNTS |
| :--- | :---: | :---: | :---: | :---: |
| **Login & View Dashboard Analytics** | ✅ | ✅ | ✅ | ✅ |
| **View Customer CRM Directory & Profiles** | ✅ | ✅ | ✅ | ✅ |
| **Create & Edit Customer Profiles** | ✅ | ✅ | ❌ | ❌ |
| **Delete Customer** | ✅ | ❌ | ❌ | ❌ |
| **Add CRM Follow-Up Notes** | ✅ | ✅ | ❌ | ❌ |
| **View Product Catalog & Stock** | ✅ | ✅ | ✅ | ✅ |
| **Create & Edit Product (Warehouse Required)** | ✅ | ❌ | ✅ | ❌ |
| **Execute Stock IN / Stock OUT** | ✅ | ❌ | ✅ | ❌ |
| **View Stock Movement History Log** | ✅ | ✅ | ✅ | ✅ |
| **Create DRAFT Sales Delivery Challan** | ✅ | ✅ | ❌ | ❌ |
| **View Sales Challans & Details** | ✅ | ✅ | ✅ | ✅ |
| **Confirm Challan (Atomic Stock Deduction)** | ✅ | ✅ | ✅ | ❌ |

---

## 📡 API Reference & Endpoint Summary

All responses follow standard JSON formatting:
- **Success**: `{ "success": true, "data": ..., "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 } }`
- **Error**: `{ "success": false, "message": "Error description" }`

### Auth
- `POST /api/auth/login` — Authenticate user credentials.
- `GET /api/auth/me` — Return current authenticated user info.

### Customer CRM
- `GET /api/customers?page=1&limit=10&search=apex&status=ACTIVE` — List, search & filter customers.
- `POST /api/customers` — Create customer profile (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`).
- `GET /api/customers/:id` — Get customer profile with follow-ups & challans.
- `PUT /api/customers/:id` — Update customer profile.
- `DELETE /api/customers/:id` — Delete customer (Admin only).
- `POST /api/customers/:id/follow-ups` — Record follow-up interaction note.

### Products & Inventory
- `GET /api/products?page=1&limit=10&search=pump&category=Machinery&lowStock=true` — List & filter catalog products.
- `POST /api/products` — Create product (Requires `warehouse`).
- `GET /api/products/:id` — Get product detail & movement history.
- `PUT /api/products/:id` — Update product info.
- `POST /api/products/:id/stock` — Adjust stock IN or OUT.
- `GET /api/products/stock/history` — Audit trail of stock movements.

### Sales Delivery Challans
- `POST /api/challans` — Create `DRAFT` challan with product snapshots (stock unchanged).
- `GET /api/challans?page=1&limit=10&status=DRAFT` — List sales challans.
- `GET /api/challans/:id` — Get challan detail & item snapshots.
- `PUT /api/challans/:id/status` — Update status to `CONFIRMED` or `CANCELLED` (executes atomic stock deduction).

### Dashboard
- `GET /api/dashboard` — Get total customers, active count, catalog count, low stock warnings, and recent challans.

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/mini_erp_crm?schema=public"
JWT_SECRET="your-secure-jwt-secret-key"
PORT=5000
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🐘 PostgreSQL & Prisma Setup

1. Create PostgreSQL database `mini_erp_crm`.
2. In `backend/`:
   ```bash
   npx prisma format
   npx prisma validate
   npx prisma generate
   npx prisma db push
   ```

---

## 🔁 Idempotent Seed Instructions

Running the seed script multiple times is safely idempotent and will NOT create duplicate demo users, products, or customers.

Execute:
```bash
npm run prisma:seed
```

### Demo Accounts (Password: `Password@123`)
- **ADMIN**: `admin@rituraj.com`
- **SALES**: `sales@rituraj.com`
- **WAREHOUSE**: `warehouse@rituraj.com`
- **ACCOUNTS**: `accounts@rituraj.com`

---

## 🚀 Running Locally

### 1. Start Backend Server
```bash
cd backend
npm install
npm run build
npm run dev
```
*Backend runs on `http://localhost:5000`.*

### 2. Start Frontend Application
```bash
cd frontend
npm install
npm run build
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

## 🧪 Testing Workflow & Manual Verification

Run the following manual test flows:
1. **Login Test**: Login as ADMIN, SALES, WAREHOUSE, ACCOUNTS.
2. **Customer CRM**: Create a customer (`WHOLESALE`), Edit customer details (`PUT /api/customers/:id`), Search by name, view profile, log a follow-up note.
3. **Product Catalog**: Add product with required `warehouse` location, filter low stock items.
4. **Inventory Stock IN / OUT**: Perform Stock IN (+10), Stock OUT (-2), attempt excessive Stock OUT (expect HTTP 400 and unchanged stock).
5. **DRAFT Challan Creation**: Create a multi-item delivery challan. Verify product stock remains unchanged while in `DRAFT`.
6. **Atomic Challan Confirmation**: Confirm challan. Verify inventory stock is deducted atomically and OUT stock movements are recorded.
7. **Insufficient Stock Rollback Test**: Attempt to confirm a challan requesting more stock than available. Verify HTTP 400 error is returned, transaction rolls back 100%, and stock remains untouched.
8. **Snapshot Integrity**: Change product price in catalog and verify existing confirmed challan retains original unit price snapshot.

---

## 📮 Postman Collection Instructions

1. Import `postman_collection.json` into Postman.
2. Set collection variables:
   - `BASE_URL`: `http://localhost:5000/api`
   - `TOKEN`: `<JWT token from Login request>`
3. Run request items under `Auth`, `Customer CRM`, `Products & Inventory`, and `Sales Challans`.

---

## 🚀 Render Deployment Guide

### Backend Service Setup (Render Web Service)
- **Root Directory**: `backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: `<Render PostgreSQL Internal Connection String>`
  - `JWT_SECRET`: `<Secure Random String>`
  - `FRONTEND_URL`: `https://<your-frontend-subdomain>.onrender.com`
  - `NODE_ENV`: `production`
  - `PORT`: `5000` (Render will bind automatically)

### Frontend Service Setup (Render Static Site)
- **Root Directory**: `frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://<your-backend-subdomain>.onrender.com/api`

---

## 📌 Assumptions & Design Decisions

1. **Customer Types**: Fixed enum `RETAIL`, `WHOLESALE`, `DISTRIBUTOR` to match case study requirements.
2. **Product Warehouse**: Location string is required on every product to satisfy multi-warehouse tracking needs.
3. **Currency & Taxing**: All prices in INR (₹). GST number stored as customer snapshot attribute.

---

## ⚠️ Known Limitations

1. **Storage**: JWT tokens are stored in `localStorage` for simplified local setup.
2. **Database Driver**: Configured for PostgreSQL database compatibility.

---

## 👨‍💻 Author & Maintenance

Developed and maintained by **[Rituraj Kumar](https://github.com/riturajkumar2002)**.

