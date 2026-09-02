import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Users,
  Boxes,
  FileText,
  AlertCircle,
  Loader2,
  TrendingUp,
  Shield,
} from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation & Loading States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('erp_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');

    if (!email || !email.trim()) {
      setEmailError('Email address is required.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    }

    return isValid;
  };

  const submitLogin = async (loginEmail: string, loginPass: string) => {
    setLoading(true);
    setApiError('');

    try {
      const res = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPass,
      });

      if (res.data.success) {
        if (rememberMe) {
          localStorage.setItem('erp_remembered_email', loginEmail);
        } else {
          localStorage.removeItem('erp_remembered_email');
        }
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Unable to sign in. Please check your email and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      submitLogin(email, password);
    }
  };

  const handleDemoFill = (roleEmail: string) => {
    const defaultPass = 'Password@123';
    setEmail(roleEmail);
    setPassword(defaultPass);
    setEmailError('');
    setPasswordError('');
    setApiError('');
    submitLogin(roleEmail, defaultPass);
  };

  return (
    <div className="login-page-container">
      <div className="login-grid">
        {/* LEFT SECTION: Branding & Marketing Panel */}
        <div className="login-branding-side">
          <div className="login-branding-pattern" />

          {/* Top Brand Header */}
          <div className="login-branding-header">
            <div className="login-brand-logo">R</div>
            <div>
              <div className="login-brand-name">Rituraj ERP</div>
              <div className="login-brand-sub">Operations Portal</div>
            </div>
          </div>

          {/* Main Hero & Features */}
          <div className="login-branding-body">
            <h1 className="login-hero-title">Run Your Operations Smarter</h1>
            <p className="login-hero-desc">
              Manage customers, inventory, sales challans, and daily operations from one unified enterprise platform.
            </p>

            <div className="login-feature-list">
              <div className="login-feature-item">
                <CheckCircle2 size={18} className="login-feature-icon" />
                <span>Customer Relationship Management (Retail, Wholesale, Distributor)</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={18} className="login-feature-icon" />
                <span>Multi-Warehouse Inventory & Non-Negative Stock Control</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={18} className="login-feature-icon" />
                <span>Sales Delivery Challan Workflow with Atomic Transactions</span>
              </div>
              <div className="login-feature-item">
                <CheckCircle2 size={18} className="login-feature-icon" />
                <span>Role-Based Access Control (Admin, Sales, Warehouse, Accounts)</span>
              </div>
            </div>

            {/* Abstract Graphic ERP Preview Card */}
            <div className="login-abstract-widget">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>Live System Status</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PostgreSQL Transactions Active</div>
                </div>
              </div>

              <div className="widget-stat-group">
                <div>
                  <div className="widget-stat-num">100%</div>
                  <div className="widget-stat-label">Atomic Audit</div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer Note */}
          <div style={{ fontSize: '0.78rem', color: '#64748b', zIndex: 2 }}>
            Rituraj Operations Portal • Enterprise System
          </div>
        </div>

        {/* RIGHT SECTION: Login Form Panel */}
        <div className="login-form-side">
          <div className="login-top-bar">
            <ThemeToggle />
          </div>

          <div className="login-form-box">
            <div className="login-form-header">
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', marginBottom: '1.25rem' }}>
                <LogIn size={24} />
              </div>
              <h2 className="login-welcome-title">Welcome back</h2>
              <p className="login-welcome-sub">Sign in to continue to your operations workspace.</p>
            </div>

            {apiError && (
              <div style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--accent-rose)', padding: '0.85rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', lineHeight: 1.4 }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Work Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="email-input"
                    type="email"
                    required
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.5rem' }}
                    placeholder="admin@rituraj.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    disabled={loading}
                    aria-invalid={!!emailError}
                  />
                  <Mail size={18} className="login-field-icon" />
                </div>
                {emailError && <div className="field-error-text">{emailError}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-control"
                    style={{ width: '100%', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    disabled={loading}
                    aria-invalid={!!passwordError}
                  />
                  <Lock size={18} className="login-field-icon" />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordError && <div className="field-error-text">{passwordError}</div>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ borderRadius: '4px', accentColor: 'var(--primary)' }}
                  />
                  <span>Remember email</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Portal</span>
                )}
              </button>
            </form>

            {/* Quick Demo Access Section */}
            <div className="demo-role-section">
              <div className="demo-section-title">
                <Shield size={14} color="var(--primary)" />
                <span>Quick Demo Access</span>
              </div>

              <div className="demo-role-grid">
                <button
                  type="button"
                  className="demo-role-card"
                  onClick={() => handleDemoFill('admin@rituraj.com')}
                  disabled={loading}
                >
                  <div className="demo-role-top">
                    <span className="demo-role-name">ADMIN</span>
                    <ShieldCheck size={16} color="var(--accent-rose)" />
                  </div>
                  <span className="demo-role-desc">Full system access</span>
                </button>

                <button
                  type="button"
                  className="demo-role-card"
                  onClick={() => handleDemoFill('sales@rituraj.com')}
                  disabled={loading}
                >
                  <div className="demo-role-top">
                    <span className="demo-role-name">SALES</span>
                    <Users size={16} color="var(--accent-emerald)" />
                  </div>
                  <span className="demo-role-desc">CRM & sales operations</span>
                </button>

                <button
                  type="button"
                  className="demo-role-card"
                  onClick={() => handleDemoFill('warehouse@rituraj.com')}
                  disabled={loading}
                >
                  <div className="demo-role-top">
                    <span className="demo-role-name">WAREHOUSE</span>
                    <Boxes size={16} color="var(--accent-amber)" />
                  </div>
                  <span className="demo-role-desc">Inventory & stock operations</span>
                </button>

                <button
                  type="button"
                  className="demo-role-card"
                  onClick={() => handleDemoFill('accounts@rituraj.com')}
                  disabled={loading}
                >
                  <div className="demo-role-top">
                    <span className="demo-role-name">ACCOUNTS</span>
                    <FileText size={16} color="var(--accent-cyan)" />
                  </div>
                  <span className="demo-role-desc">Read-only operations view</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <span>© 2026 Rituraj ERP • Operations Portal</span>
            <span>Secure role-based access</span>
          </div>
        </div>
      </div>
    </div>
  );
};
