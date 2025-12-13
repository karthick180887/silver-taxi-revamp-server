'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    HelpCircle,
    Calendar,
    Users,
    Truck,
    Store,
    Layers,
    Car,
    FileText,
    Tag,
    Ticket,
    Bell,
    ChevronDown,
    Settings,
    LogOut,
    Menu as MenuIcon,
    X,
    Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

type NavItem = {
    name: string;
    href: string;
    icon: any;
    submenu?: { name: string; href: string }[];
};

type NavGroup = {
    title: string;
    items: NavItem[];
};

const navigationGroups: NavGroup[] = [
    {
        title: 'Overview',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
            { name: 'Enquiries', href: '/admin/enquiry', icon: HelpCircle },
        ]
    },
    {
        title: 'Operations',
        items: [
            {
                name: 'Bookings',
                href: '#',
                icon: Calendar,
                submenu: [
                    { name: 'All Bookings', href: '/admin/bookings' },
                    { name: 'Create Booking', href: '/admin/bookings/create' }
                ]
            },
            { name: 'Drivers', href: '/admin/drivers', icon: Truck },
            { name: 'Customers', href: '/admin/customers', icon: Users },
            {
                name: 'Vendors',
                href: '#',
                icon: Store,
                submenu: [
                    { name: 'All Vendors', href: '/admin/vendors' },
                    { name: 'Add Vendor', href: '/admin/vendors/create' },
                ]
            },
        ]
    },
    {
        title: 'Business',
        items: [
            {
                name: 'Services',
                href: '#',
                icon: Layers,
                submenu: [
                    { name: 'One Way', href: '/admin/services/one-way' },
                    { name: 'Round Trip', href: '/admin/services/round-trip' },
                    { name: 'Hourly Package', href: '/admin/services/packages/hourly' },
                ]
            },
            { name: 'Vehicles', href: '/admin/vehicles', icon: Car },
            { name: 'Invoices', href: '/admin/invoices', icon: FileText },
        ]
    },
    {
        title: 'Marketing & System',
        items: [
            { name: 'Offers', href: '/admin/offers', icon: Tag },
            { name: 'Promo Codes', href: '/admin/promo-codes', icon: Ticket },
            { name: 'Notifications', href: '/admin/notifications', icon: Bell },
        ]
    }
];

export default function Sidebar() {
    const pathname = usePathname();
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const newOpenState = { ...openSubmenus };
        navigationGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.submenu && item.submenu.some(sub => pathname.startsWith(sub.href))) {
                    newOpenState[item.name] = true;
                }
            });
        });
        setOpenSubmenus(newOpenState);
    }, []);

    const toggleSubmenu = (name: string) => {
        setOpenSubmenus(prev => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 flex flex-col bg-white dark:bg-zinc-950 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300">
            {/* Logo Section */}
            <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-indigo-200 dark:shadow-none shadow-md">
                        ST
                    </div>
                    <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Silver Taxi</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
                {navigationGroups.map((group) => (
                    <div key={group.title}>
                        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isParentActive = pathname.startsWith(item.href) && item.href !== '#' && item.href !== '/admin';
                                const isDashboardActive = item.href === '/admin' && pathname === '/admin';
                                const isSubmenuActive = item.submenu?.some(sub => pathname.startsWith(sub.href));
                                const isActive = isParentActive || isDashboardActive || isSubmenuActive;

                                const hasSubmenu = !!item.submenu;
                                const isOpen = openSubmenus[item.name];

                                return (
                                    <div key={item.name}>
                                        <button
                                            onClick={() => hasSubmenu ? toggleSubmenu(item.name) : null}
                                            className={clsx(
                                                isActive
                                                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                                                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-900 dark:hover:text-gray-200',
                                                'group w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-150'
                                            )}
                                        >
                                            <div className="flex items-center">
                                                <item.icon
                                                    className={clsx(
                                                        isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500',
                                                        'mr-3 h-5 w-5 shrink-0 transition-colors'
                                                    )}
                                                />
                                                {hasSubmenu || item.href === '#' ? (
                                                    <span>{item.name}</span>
                                                ) : (
                                                    <Link href={item.href} className="flex-1 outline-none">
                                                        {item.name}
                                                    </Link>
                                                )}
                                            </div>
                                            {hasSubmenu && (
                                                <ChevronDown
                                                    className={clsx(
                                                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                                                        isOpen && "transform rotate-180"
                                                    )}
                                                />
                                            )}
                                        </button>

                                        {/* Nested Menu */}
                                        {hasSubmenu && isOpen && (
                                            <div className="mt-1 space-y-1 pl-10">
                                                {item.submenu?.map((subItem) => {
                                                    const isSubActive = pathname === subItem.href;
                                                    return (
                                                        <Link
                                                            key={subItem.name}
                                                            href={subItem.href}
                                                            className={clsx(
                                                                isSubActive
                                                                    ? 'text-indigo-600 dark:text-indigo-400 font-medium'
                                                                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200',
                                                                'block py-2 text-sm transition-colors rounded-md'
                                                            )}
                                                        >
                                                            {subItem.name}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer Profile */}
            <div className="p-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-zinc-800 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-zinc-700">
                        A
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin User</p>
                        <p className="text-xs text-gray-500 truncate">admin@silvertaxi.in</p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
