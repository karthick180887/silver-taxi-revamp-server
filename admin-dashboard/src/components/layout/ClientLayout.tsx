'use client';

import React, { useState } from 'react';
import { ClientSidebar } from './ClientSidebar';
import { ClientHeader } from './ClientHeader';

interface ClientLayoutProps {
    children: React.ReactNode;
    pageTitle?: string;
}

export function ClientLayout({ children, pageTitle = 'Dashboard' }: ClientLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const sidebarWidth = sidebarCollapsed ? '80px' : '280px';
    const headerHeight = '64px';

    const styles = {
        container: {
            minHeight: '100vh',
            background: '#f8fafc',
        },
        main: {
            marginLeft: sidebarWidth,
            marginTop: headerHeight,
            padding: '1.5rem',
            minHeight: `calc(100vh - ${headerHeight})`,
            transition: 'margin-left 250ms ease',
        },
    };

    return (
        <div style={styles.container}>
            <ClientSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <ClientHeader
                pageTitle={pageTitle}
                sidebarCollapsed={sidebarCollapsed}
            />
            <main style={styles.main}>
                {children}
            </main>
        </div>
    );
}
