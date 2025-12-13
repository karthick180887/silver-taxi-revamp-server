'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import DashboardContent to avoid SSR issues
// The layout is now built INTO DashboardContent
const DashboardContent = dynamic(
    () => import('../../components/DashboardContent'),
    {
        ssr: false,
        loading: () => (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
                    Dashboard
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            </div>
        ),
    }
);

export default function DashboardPage() {
    return <DashboardContent />;
}
