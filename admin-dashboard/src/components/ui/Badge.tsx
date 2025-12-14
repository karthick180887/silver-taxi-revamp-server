'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  dot?: boolean;
}

const variantColors: Record<string, { bg: string; text: string }> = {
  default: { bg: 'var(--bg-tertiary)', text: 'var(--text-secondary)' },
  success: { bg: 'var(--accent-success-bg)', text: 'var(--accent-success)' },
  warning: { bg: 'var(--accent-warning-bg)', text: 'var(--accent-warning)' },
  danger: { bg: 'var(--accent-error-bg)', text: 'var(--accent-error)' },
  info: { bg: 'var(--brand-primary-subtle)', text: 'var(--brand-primary)' },
};

export function Badge({ children, variant = 'default', size = 'md', dot }: BadgeProps) {
  const colors = variantColors[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.625rem',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontWeight: 500,
        background: colors.bg,
        color: colors.text,
        borderRadius: '9999px',
      }}
    >
      {dot && (
        <span
          style={{
            width: '0.375rem',
            height: '0.375rem',
            background: colors.text,
            borderRadius: '50%',
          }}
        />
      )}
      {children}
    </span>
  );
}

interface StatusBadgeProps {
  status: string;
  variant?: BadgeProps['variant'];
}

export function StatusBadge({ status, variant: explicitVariant }: StatusBadgeProps) {
  const statusLower = status?.toLowerCase() || '';
  let variant: BadgeProps['variant'] = 'default';

  if (explicitVariant) {
    variant = explicitVariant;
  } else if (statusLower.includes('active') || statusLower.includes('completed') || statusLower.includes('verified') || statusLower.includes('ended')) {
    variant = 'success';
  } else if (statusLower.includes('pending') || statusLower.includes('confirmed')) {
    variant = 'warning';
  } else if (statusLower.includes('cancelled') || statusLower.includes('inactive') || statusLower.includes('rejected')) {
    variant = 'danger';
  } else if (statusLower.includes('started') || statusLower.includes('progress')) {
    variant = 'info';
  }

  return <Badge variant={variant} dot>{status || 'Unknown'}</Badge>;
}
