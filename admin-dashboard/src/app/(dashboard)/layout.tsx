
import React from 'react';

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
            <div style={{ padding: '2rem', color: 'white' }}>
                Sidebar Placeholder
            </div>
            <div style={{ flex: 1 }}>
                {children}
            </div>
        </div>
    );
}
