'use client';

import Sidebar from '@/components/admin/Sidebar';
import Header from '@/components/admin/Header';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
                {/* Sticky Header */}
                <Header />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
