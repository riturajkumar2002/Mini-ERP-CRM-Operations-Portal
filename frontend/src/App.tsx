import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { CustomerDetail } from './pages/CustomerDetail';
import { Products } from './pages/Products';
import { Inventory } from './pages/Inventory';
import { StockHistory } from './pages/StockHistory';
import { Challans } from './pages/Challans';
import { CreateChallan } from './pages/CreateChallan';
import { ChallanDetail } from './pages/ChallanDetail';
import './index.css';

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing Portal...</div>;
  }

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing Portal...</div>;
  }

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const getPageTitle = (path: string) => {
    if (path.startsWith('/dashboard')) return 'Executive Dashboard';
    if (path.startsWith('/customers/')) return 'Customer Profile & CRM';
    if (path.startsWith('/customers')) return 'Customer CRM Directory';
    if (path.startsWith('/products')) return 'Product Catalog';
    if (path.startsWith('/inventory')) return 'Inventory Stock Control';
    if (path.startsWith('/stock-history')) return 'Stock Movement History Log';
    if (path.startsWith('/challans/new')) return 'Create Delivery Challan';
    if (path.startsWith('/challans/')) return 'Challan Inspection';
    if (path.startsWith('/challans')) return 'Sales Challans';
    return 'Fundsroom ERP';
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Header title={getPageTitle(location.pathname)} />
        <main className="page-body">{children}</main>
      </div>
    </div>
  );
};

const RootRedirect: React.FC = () => {
  const { token, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Initializing Portal...</div>;
  }

  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />

              <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
              <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
              <Route path="/customers/:id" element={<ProtectedLayout><CustomerDetail /></ProtectedLayout>} />
              <Route path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />
              <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
              <Route path="/stock-history" element={<ProtectedLayout><StockHistory /></ProtectedLayout>} />
              <Route path="/challans" element={<ProtectedLayout><Challans /></ProtectedLayout>} />
              <Route path="/challans/new" element={<ProtectedLayout><CreateChallan /></ProtectedLayout>} />
              <Route path="/challans/:id" element={<ProtectedLayout><ChallanDetail /></ProtectedLayout>} />

              <Route path="*" element={<RootRedirect />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
