'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Bell, Search, Menu as MenuIcon, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

const pageTitles: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/enquiry': 'Enquiries',
    '/admin/bookings': 'Bookings',
    '/admin/bookings/create': 'Create Booking',
    '/admin/customers': 'Customers',
    '/admin/drivers': 'Drivers',
    '/admin/vendors': 'Vendors',
    '/admin/vendors/create': 'Create Vendor',
    '/admin/services': 'Services',
    '/admin/services/one-way': 'One Way Service',
    '/admin/services/round-trip': 'Round Trip Service',
    '/admin/services/packages/hourly': 'Hourly Package',
    '/admin/vehicles': 'Vehicles',
    '/admin/vehicles/create': 'Create Vehicle',
    '/admin/invoices': 'Invoices',
    '/admin/invoices/create': 'Create Invoice',
    '/admin/offers': 'Offers',
    '/admin/offers/create': 'Create Offer',
    '/admin/promo-codes': 'Promo Codes',
    '/admin/promo-codes/create': 'Create Promo Code',
    '/admin/notifications': 'Custom Notifications',
    '/admin/notifications/create': 'Create Notification',
};

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [pageTitle, setPageTitle] = useState('Dashboard');
    const [notificationCount, setNotificationCount] = useState(0);

    useEffect(() => {
        // Find matching page title
        const title = pageTitles[pathname] ||
            Object.entries(pageTitles).find(([key]) => pathname.startsWith(key) && key !== '/admin')?.[1] ||
            'Dashboard';
        setPageTitle(title);
        fetchNotificationCount();
    }, [pathname]);

    const fetchNotificationCount = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
            const response = await axios.get(`${API_URL}/v1/notifications`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            if (response.data?.data) {
                const unreadCount = response.data.data.filter((n: any) => !n.read).length;
                setNotificationCount(unreadCount);
            }
        } catch (error) {
            // console.error('Error fetching notifications:', error);
            // Silent error as this is just a count
        }
    };

    const handleLogout = () => {
        console.log('Logout initiated');
        try {
            // Clear all possible tokens
            localStorage.removeItem('token');
            localStorage.removeItem('admin_token');
            sessionStorage.clear();

            // Clear cookies with various path/domain combinations to be safe
            const cookies = ['token', 'admin_token'];
            const paths = ['/', '/admin', '/login'];

            cookies.forEach(cookie => {
                paths.forEach(path => {
                    document.cookie = `${cookie}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
                });
                // Also try without path
                document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
            });
            console.log('Cleanup complete, redirecting...');
        } catch (e) {
            console.error('Logout cleanup error:', e);
        }

        // Force reload and redirect
        window.location.replace('/login?logout=true' + Date.now());
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 shadow-sm backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                    <MenuIcon className="w-5 h-5" />
                </button>
                <nav className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors cursor-pointer">Admin</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <h1 className="text-gray-900 dark:text-white font-semibold">{pageTitle}</h1>
                </nav>
            </div>

            <div className="flex items-center gap-4">
                {/* Search Bar - improved design */}
                <div className="relative hidden md:block w-72">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search..."
                        className="block w-full rounded-md border-0 py-2 pl-10 pr-4 text-sm bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-200 dark:ring-zinc-800 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:leading-6"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <kbd className="inline-flex items-center rounded border border-gray-200 dark:border-zinc-700 px-1 font-sans text-xs text-gray-400">⌘K</kbd>
                    </div>
                </div>

                <div className="w-px h-6 bg-gray-200 dark:bg-zinc-800 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2">
                    <button
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400 rounded-full transition-colors relative"
                        onClick={() => router.push('/admin/notifications')}
                    >
                        <Bell className="w-5 h-5" />
                        {notificationCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 rounded-md transition-colors ml-1"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
