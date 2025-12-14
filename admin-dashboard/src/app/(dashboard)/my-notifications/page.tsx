'use client';

import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { notificationsApi } from '@/lib/api';

interface Notification {
    notificationId?: string;
    id?: string;
    title: string;
    description: string; // Changed from message to description
    type: string;
    isRead?: boolean;
    createdAt: string;
    data?: any;
}

export default function MyNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
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

            if (adminId) {
                // @ts-ignore
                const res = await notificationsApi.getAll({ adminId });
                console.log('Notifications API Response:', res.data); // Debug response
                if (res.data && res.data.success) {
                    setNotifications(res.data.data || []);
                } else if (res.data && Array.isArray(res.data)) {
                    setNotifications(res.data);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ClientLayout pageTitle="My Notifications">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>My Notifications</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Recent alerts and updates</p>
                    </div>
                </div>

                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔕</div>
                            No notifications found
                        </div>
                    ) : (
                        <div>
                            {notifications.map((n, i) => (
                                <div
                                    key={n.notificationId || n.id || i}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        borderBottom: '1px solid #f1f5f9',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'flex-start',
                                        background: n.isRead ? 'white' : '#fff',
                                        transition: 'background 0.2s',
                                        position: 'relative'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: '#fff7ed',
                                        color: '#f97316',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.25rem',
                                        flexShrink: 0
                                    }}>
                                        {/* Coin icon or similar based on type */}
                                        {n.type?.toLowerCase().includes('booking') ? '🚕' : '📢'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                                {n.title}
                                            </h3>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
                                            {/* Parse description if piped */}
                                            {n.description && n.description.includes('|') ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
                                                    {n.description.split('|').map((part, idx) => (
                                                        <span key={idx} style={{ display: 'inline-block', background: '#f1f5f9', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
                                                            {part.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                n.description || 'No details available'
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ClientLayout>
    );
}
