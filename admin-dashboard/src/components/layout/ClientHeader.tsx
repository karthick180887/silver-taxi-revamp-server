'use client';

import React, { useState } from 'react';

interface ClientHeaderProps {
    pageTitle: string;
    sidebarCollapsed: boolean;
}

export function ClientHeader({ pageTitle, sidebarCollapsed }: ClientHeaderProps) {
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const sidebarWidth = sidebarCollapsed ? '80px' : '280px';

    React.useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            // Check for adminId via localStorage
            let adminId: string | undefined;
            if (typeof window !== 'undefined') {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        adminId = user.adminId || user.id || user._id;
                    } catch (e) { console.error(e); }
                }
            }

            // Using getAll which corresponds to getAllNotifications in controller
            // Controller expects adminId in query or body
            if (adminId) {
                // @ts-ignore - api definition might need update for param types if strictly typed
                const res = await import('@/lib/api').then(m => m.notificationsApi.getAll({ adminId }));
                if (res.data && res.data.success) {
                    setNotifications(res.data.data || []);
                    setUnreadCount(res.data.unReadCount || 0);
                } else if (res.data && Array.isArray(res.data)) {
                    // Fallback if structure is different
                    setNotifications(res.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch header notifications', error);
        }
    };

    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('admin_token'); // Keep for legacy if needed
            localStorage.removeItem('user');

            // Clear Middleware Cookie (adminToken)
            document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            // Also clear legacy/wrong named cookies just in case
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

            window.location.href = '/login';
        }
    };

    return (
        <header
            className={`fixed top-0 right-0 h-[64px] bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 transition-all duration-300 shadow-sm`}
            style={{ left: sidebarWidth }}
        >
            <div className="flex items-center gap-6 flex-1">
                <h1 className="text-xl font-bold text-slate-800 hidden md:block w-48 truncate">{pageTitle}</h1>

                <div className="relative flex-1 max-w-xl">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search Booking ID, Phone, Driver..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Live System Status */}
                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">System Live</span>
                </div>

                <div className="h-8 w-px bg-slate-200 mx-2"></div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 transition-all relative"
                        title="Notifications"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        🔔
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center border-2 border-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-sm">{unreadCount} new</span>
                            </div>
                            <div className="max-h-[320px] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                        <span className="text-2xl">🔕</span>
                                        No new notifications
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map((n, i) => (
                                        <div
                                            key={n.notificationId || i}
                                            className="p-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors group"
                                            onClick={() => { if (typeof window !== 'undefined') window.location.href = '/my-notifications' }}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-1">
                                                <h4 className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors">{n.title}</h4>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.message || n.description}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-2 border-t border-slate-100 bg-slate-50/50 text-center">
                                <a href="/my-notifications" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
                                    View All Notifications
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative">
                    <button
                        className="flex items-center gap-3 pl-1 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-all cursor-pointer"
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg text-white font-bold text-sm shadow-md shadow-indigo-500/20">
                            A
                        </div>
                        <div className="flex flex-col items-start hidden sm:flex">
                            <span className="text-sm font-semibold text-slate-700 leading-none">Admin</span>
                            <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
                        </div>
                        <span className="text-slate-400 text-xs">▼</span>
                    </button>

                    {showUserMenu && (
                        <div className="absolute top-12 right-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-1">
                                <a href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                                    👤 Profile
                                </a>
                                <a href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                                    ⚙️ Settings
                                </a>
                                <div className="h-px bg-slate-100 my-1" />
                                <button
                                    onClick={handleLogout}
                                    style={{ cursor: 'pointer' }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors font-medium cursor-pointer"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
