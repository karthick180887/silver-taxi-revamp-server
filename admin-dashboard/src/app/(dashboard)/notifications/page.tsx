'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { notificationsApi } from '@/lib/api';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    targetType: string;
    targetCount: number;
    sentAt: string;
    createdAt: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchNotifications();
    }, [page]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await notificationsApi.getAll({ page, limit: pageSize });
            const data = res.data?.data || res.data || {};
            const notificationsArray = Array.isArray(data) ? data : (data.notifications || data.rows || []);
            setNotifications(Array.isArray(notificationsArray) ? notificationsArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'title', header: 'Title', sortable: true },
        {
            key: 'message', header: 'Message', render: (n: Notification) => (
                <span style={{ maxWidth: '200px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.message}
                </span>
            )
        },
        { key: 'type', header: 'Type', render: (n: Notification) => <StatusBadge status={n.type || 'info'} /> },
        { key: 'targetType', header: 'Target', render: (n: Notification) => n.targetType || 'All' },
        { key: 'targetCount', header: 'Recipients', render: (n: Notification) => n.targetCount || '-' },
        { key: 'createdAt', header: 'Created', render: (n: Notification) => new Date(n.createdAt).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            render: (n: Notification) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/notifications/${n.id}`; }}>
                    View
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Notifications">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Custom Notifications</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Send notifications to drivers and customers</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/notifications/create'; }}>
                    + Send Notification
                </Button>
            </div>

            <DataTable
                data={notifications}
                columns={columns}
                keyExtractor={(n) => n.id}
                loading={loading}
                emptyMessage="No notifications found"
                onRowClick={(n) => { if (typeof window !== 'undefined') window.location.href = `/notifications/${n.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
