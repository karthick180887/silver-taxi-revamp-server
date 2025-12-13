'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const paddingValues = { none: '0', sm: '1rem', md: '1.5rem', lg: '2rem' };

export function Card({ children, padding = 'md', hover = false, style }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: paddingValues[padding],
        transition: 'all 200ms ease',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  className?: string; // Added
  style?: React.CSSProperties; // Added
}

export function StatCard({ title, value, icon, trend, change, className, style }: StatCardProps) {
  const trendColor = trend === 'up' ? 'var(--accent-success)' : trend === 'down' ? 'var(--accent-error)' : 'var(--text-muted)';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div
      className={className} // Pass className
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        gap: '1rem',
        ...style, // Merge style
      }}
    >
      {icon && (
        <div
          style={{
            width: '3rem',
            height: '3rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--brand-primary-subtle)',
            color: 'var(--brand-primary)',
            borderRadius: 'var(--radius-lg)',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>
          {title}
        </p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {value}
          </span>
          {change !== undefined && (
            <span style={{ fontSize: '0.75rem', color: trendColor }}>
              {trendIcon} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
