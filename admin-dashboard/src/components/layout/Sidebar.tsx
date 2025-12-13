'use client';

import React from 'react';
import Link from 'next/link';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { label: 'Dashboard', href: '/', icon: '📊' },
  { label: 'Bookings', href: '/bookings', icon: '📅' },
  { label: 'Drivers', href: '/drivers', icon: '🚗' },
  { label: 'Customers', href: '/customers', icon: '👥' },
  { label: 'Vendors', href: '/vendors', icon: '🏢' },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      height: '100vh',
      width: sidebarWidth,
      background: 'white', // White background as per source
      borderRight: '1px solid #f1f5f9',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 250ms ease',
      zIndex: 100,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        borderBottom: '1px solid #f1f5f9',
        height: 'var(--header-height)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Logo Placeholder - Gradient S */}
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '18px'
          }}>
            ⚡
          </div>
          {!collapsed && (
            <span style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a' }}>
              Silver Taxi
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.75rem 1.5rem',
              background: 'transparent', // Default transparent
              borderLeft: '3px solid transparent',
              color: '#64748b',
              fontSize: '0.875rem',
              fontWeight: 500,
              textDecoration: 'none',
              marginBottom: '0.25rem',
              transition: 'all 0.2s',
            }}
          // Add hover/active logic via CSS module or inline workaround if needed, 
          // for now keeping simple but clean structure
          >
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px' }}>
              {/* Replace with actual Outline Icons later if needed */}
              {item.label === 'Dashboard' && '📊'}
              {item.label === 'Bookings' && '📅'}
              {item.label === 'Drivers' && '🚗'}
              {item.label === 'Customers' && '👥'}
              {item.label === 'Vendors' && '🏢'}
            </span>
            {!collapsed && <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
