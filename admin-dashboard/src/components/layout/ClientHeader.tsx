'use client';

import React, { useState } from 'react';

interface ClientHeaderProps {
    pageTitle: string;
    sidebarCollapsed: boolean;
}

export function ClientHeader({ pageTitle, sidebarCollapsed }: ClientHeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const sidebarWidth = sidebarCollapsed ? '80px' : '280px';

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('admin_token');
            document.cookie = 'token=; Max-Age=0; path=/;';
            document.cookie = 'admin_token=; Max-Age=0; path=/;';
            window.location.href = '/login';
        }
    };

    const styles = {
        header: {
            position: 'fixed' as const,
            top: 0,
            left: sidebarWidth,
            right: 0,
            height: '64px',
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            zIndex: 90,
            transition: 'left 250ms ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        },
        leftSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
        },
        pageTitle: {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#1e293b',
            margin: 0,
        },
        searchContainer: {
            position: 'relative' as const,
            display: 'flex',
            alignItems: 'center',
        },
        searchInput: {
            width: '300px',
            padding: '0.5rem 1rem 0.5rem 2.5rem',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem',
            background: '#f8fafc',
            color: '#1e293b',
            outline: 'none',
            transition: 'all 150ms ease',
        },
        searchIcon: {
            position: 'absolute' as const,
            left: '0.75rem',
            color: '#94a3b8',
            fontSize: '1rem',
        },
        rightSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
        },
        iconBtn: {
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            cursor: 'pointer',
            position: 'relative' as const,
            fontSize: '1.125rem',
            transition: 'all 150ms ease',
        },
        notificationBadge: {
            position: 'absolute' as const,
            top: '-4px',
            right: '-4px',
            background: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
            color: 'white',
            fontSize: '0.625rem',
            fontWeight: 600,
            padding: '2px 5px',
            borderRadius: '10px',
            minWidth: '18px',
            textAlign: 'center' as const,
        },
        userBtn: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.375rem 0.75rem 0.375rem 0.375rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
        },
        avatar: {
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.875rem',
        },
        userInfo: {
            display: 'flex',
            flexDirection: 'column' as const,
            textAlign: 'left' as const,
        },
        userName: {
            fontSize: '0.875rem',
            fontWeight: 500,
            color: '#1e293b',
        },
        userRole: {
            fontSize: '0.75rem',
            color: '#64748b',
        },
        chevron: {
            fontSize: '0.625rem',
            color: '#94a3b8',
        },
        dropdown: {
            position: 'absolute' as const,
            top: 'calc(100% + 0.5rem)',
            right: 0,
            minWidth: '200px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            padding: '0.5rem',
            zIndex: 100,
        },
        dropdownItem: (danger?: boolean) => ({
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            padding: '0.625rem 0.75rem',
            background: 'none',
            border: 'none',
            borderRadius: '8px',
            color: danger ? '#ef4444' : '#475569',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'none',
            transition: 'all 150ms ease',
        }),
        dropdownDivider: {
            height: '1px',
            background: '#e2e8f0',
            margin: '0.5rem 0',
        },
    };

    return (
        <header style={styles.header}>
            <div style={styles.leftSection}>
                <h1 style={styles.pageTitle}>{pageTitle}</h1>

                <div style={styles.searchContainer}>
                    <span style={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={styles.searchInput}
                    />
                </div>
            </div>

            <div style={styles.rightSection}>
                {/* Notifications */}
                <button style={styles.iconBtn} title="Notifications">
                    🔔
                    <span style={styles.notificationBadge}>5</span>
                </button>

                {/* User Menu */}
                <div style={{ position: 'relative' }}>
                    <button
                        style={styles.userBtn}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div style={styles.avatar}>A</div>
                        <div style={styles.userInfo}>
                            <span style={styles.userName}>Admin</span>
                            <span style={styles.userRole}>Administrator</span>
                        </div>
                        <span style={styles.chevron}>▼</span>
                    </button>

                    {showUserMenu && (
                        <div style={styles.dropdown}>
                            <a href="/profile" style={styles.dropdownItem()}>
                                👤 Profile
                            </a>
                            <a href="/settings" style={styles.dropdownItem()}>
                                ⚙️ Settings
                            </a>
                            <div style={styles.dropdownDivider} />
                            <button
                                onClick={handleLogout}
                                style={styles.dropdownItem(true)}
                            >
                                🚪 Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
