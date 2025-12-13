'use client';

import React, { useState } from 'react';
// import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} /> */}
      <Header
        user={{ name: 'Admin', email: 'admin@silvertaxi.in' }}
        onLogout={handleLogout}
      />
      <main style={{
        // marginLeft: sidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        marginTop: 'var(--header-height)',
        padding: '1.5rem',
        minHeight: 'calc(100vh - var(--header-height))',
        // transition: 'margin-left 250ms ease',
      }}>
        {children}
      </main>
    </div>
  );
}
