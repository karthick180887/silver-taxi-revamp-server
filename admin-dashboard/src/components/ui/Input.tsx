'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({ label, error, helperText, leftIcon, rightIcon, style, ...props }: InputProps) {
  return (
    <div style={{ ...style }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {leftIcon}
          </span>
        )}
        <input
          style={{
            width: '100%',
            padding: leftIcon ? '0.625rem 1rem 0.625rem 2.5rem' : '0.625rem 1rem',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            background: 'var(--bg-tertiary)',
            border: error ? '1px solid var(--accent-error)' : '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-md)',
            outline: 'none',
            transition: 'border-color 150ms ease',
          }}
          {...props}
        />
        {rightIcon && (
          <span style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--accent-error)' }}>{error}</p>}
      {helperText && !error && <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{helperText}</p>}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
}

export function Select({ label, error, options, style, ...props }: SelectProps) {
  return (
    <div style={{ ...style }}>
      {label && (
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <select
        style={{
          width: '100%',
          padding: '0.625rem 1rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          background: 'var(--bg-tertiary)',
          border: error ? '1px solid var(--accent-error)' : '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-md)',
          outline: 'none',
          cursor: 'pointer',
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p style={{ marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--accent-error)' }}>{error}</p>}
    </div>
  );
}
