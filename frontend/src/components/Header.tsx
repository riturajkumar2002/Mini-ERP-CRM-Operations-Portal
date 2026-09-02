import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LogOut, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeToggle />

        {user && (
          <div className="header-user">
            <div className="user-badge">
              <UserIcon size={16} color="var(--primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</span>
              <span className={`role-pill role-${user.role}`}>{user.role}</span>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              title="Log out of application"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
