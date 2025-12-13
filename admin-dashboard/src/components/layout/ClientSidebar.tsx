'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
    label: string;
    href?: string;
    icon: string;
    submenu?: { label: string; href: string }[];
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/', icon: '📊' },
    { label: 'Enquiries', href: '/enquiries', icon: '📋' },
    {
        label: 'Bookings',
        icon: '📅',
        submenu: [
            { label: 'All Bookings', href: '/bookings' },
            { label: 'Create Booking', href: '/bookings/create' },
        ],
    },
    { label: 'Customers', href: '/customers', icon: '👥' },
    { label: 'Drivers', href: '/drivers', icon: '🚗' },
    {
        label: 'Vendors',
        icon: '🏢',
        submenu: [
            { label: 'All Vendors', href: '/vendors' },
            { label: 'Create Vendor', href: '/vendors/create' },
        ],
    },
    { label: 'Services', href: '/services', icon: '⚙️' },
    { label: 'Vehicles', href: '/vehicles', icon: '🚕' },
    {
        label: 'Invoices',
        icon: '📄',
        submenu: [
            { label: 'All Invoices', href: '/invoices' },
            { label: 'Create Invoice', href: '/invoices/create' },
        ],
    },
    { label: 'Offers', href: '/offers', icon: '🎁' },
    { label: 'Promo Codes', href: '/promo-codes', icon: '🏷️' },
    { label: 'Notifications', href: '/notifications', icon: '🔔' },
];

interface ClientSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function ClientSidebar({ collapsed, onToggle }: ClientSidebarProps) {
    const pathname = usePathname();
    const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

    const toggleSubmenu = (label: string) => {
        setExpandedMenus((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    const isActive = (href: string) => {
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    const sidebarWidth = collapsed ? '80px' : '280px';

    const styles = {
        sidebar: {
            position: 'fixed' as const,
            top: 0,
            left: 0,
            height: '100vh',
            width: sidebarWidth,
            background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column' as const,
            transition: 'width 250ms ease',
            zIndex: 100,
            overflow: 'hidden',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '1rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            height: '64px',
        },
        logo: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        },
        logoIcon: {
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
        },
        logoText: {
            fontSize: '1.125rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            whiteSpace: 'nowrap' as const,
        },
        toggleBtn: {
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '1rem',
            transition: 'all 150ms ease',
        },
        nav: {
            flex: 1,
            padding: '1rem 0.75rem',
            overflowY: 'auto' as const,
            overflowX: 'hidden' as const,
        },
        navItem: (active: boolean) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: collapsed ? '0.75rem' : '0.75rem 1rem',
            background: active ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            color: active ? '#a5b4fc' : '#94a3b8',
            fontSize: '0.875rem',
            fontWeight: active ? 600 : 500,
            textDecoration: 'none',
            marginBottom: '0.25rem',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            justifyContent: collapsed ? 'center' : 'flex-start',
        }),
        navIcon: {
            fontSize: '1.25rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
        },
        navLabel: {
            flex: 1,
            textAlign: 'left' as const,
            whiteSpace: 'nowrap' as const,
        },
        chevron: (expanded: boolean) => ({
            fontSize: '0.75rem',
            transition: 'transform 200ms ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }),
        submenu: {
            marginLeft: collapsed ? 0 : '2rem',
            marginTop: '0.25rem',
            marginBottom: '0.5rem',
        },
        submenuItem: (active: boolean) => ({
            display: 'block',
            padding: '0.5rem 1rem',
            color: active ? '#a5b4fc' : '#64748b',
            fontSize: '0.8125rem',
            textDecoration: 'none',
            borderRadius: '6px',
            marginBottom: '0.125rem',
            background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
        }),
    };

    return (
        <aside style={styles.sidebar}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.logo}>
                    <div style={styles.logoIcon}>🚕</div>
                    {!collapsed && <span style={styles.logoText}>Silver Taxi</span>}
                </div>
                {!collapsed && (
                    <button style={styles.toggleBtn} onClick={onToggle} title="Collapse sidebar">
                        ←
                    </button>
                )}
            </div>

            {/* Collapsed toggle */}
            {collapsed && (
                <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'center' }}>
                    <button style={styles.toggleBtn} onClick={onToggle} title="Expand sidebar">
                        →
                    </button>
                </div>
            )}

            {/* Navigation */}
            <nav style={styles.nav}>
                {navItems.map((item) => {
                    const hasSubmenu = item.submenu && item.submenu.length > 0;
                    const isExpanded = expandedMenus.includes(item.label);
                    const active = item.href ? isActive(item.href) : item.submenu?.some((sub) => isActive(sub.href)) || false;

                    if (hasSubmenu) {
                        return (
                            <div key={item.label}>
                                <button
                                    style={styles.navItem(active)}
                                    onClick={() => toggleSubmenu(item.label)}
                                    title={collapsed ? item.label : undefined}
                                >
                                    <span style={styles.navIcon}>{item.icon}</span>
                                    {!collapsed && (
                                        <>
                                            <span style={styles.navLabel}>{item.label}</span>
                                            <span style={styles.chevron(isExpanded)}>▼</span>
                                        </>
                                    )}
                                </button>
                                {!collapsed && isExpanded && (
                                    <div style={styles.submenu}>
                                        {item.submenu!.map((sub) => (
                                            <Link
                                                key={sub.href}
                                                href={sub.href}
                                                style={styles.submenuItem(isActive(sub.href))}
                                            >
                                                {sub.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href!}
                            style={styles.navItem(active)}
                            title={collapsed ? item.label : undefined}
                        >
                            <span style={styles.navIcon}>{item.icon}</span>
                            {!collapsed && <span style={styles.navLabel}>{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div style={{
                    padding: '1rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textAlign: 'center',
                }}>
                    © 2025 Silver Taxi
                </div>
            )}
        </aside>
    );
}
