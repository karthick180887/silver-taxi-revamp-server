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

    return (
        <div className="min-h-screen bg-slate-50">
            <ClientSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
            <ClientHeader
                pageTitle={pageTitle}
                sidebarCollapsed={sidebarCollapsed}
            />
            <main
                className="transition-all duration-300 ease-in-out pt-[88px] px-6 pb-6 min-h-screen"
                style={{
                    marginLeft: sidebarCollapsed ? '80px' : '260px'
                }}
            >
                {children}
            </main>
        </div>
    );
}
