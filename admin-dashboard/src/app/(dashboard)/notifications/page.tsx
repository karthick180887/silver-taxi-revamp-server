'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { notificationsApi } from '@/lib/api';

interface CustomNotification {
    id: string; // or number, based on backend model
    templateId: string;
    title: string;
    message: string;
    target: string; // driver, vendor, customer, all, none
    targetAudience?: string; // from data object
    status: boolean; // active/draft or sent
    createdAt: string;
    createdAtFormatted?: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<CustomNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const [adminId, setAdminId] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    const id = user.adminId || user.id || user._id;
                    if (id) {
                        setAdminId(id);
                    }
                } catch (e) {
                    console.error('Error parsing user from localStorage', e);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (adminId) {
            fetchNotifications(adminId);
        } else if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
            // Handle no auth case if needed, but layout should handle it
            setLoading(false);
        }
    }, [page, adminId]);

    const fetchNotifications = async (currentAdminId: string) => {
        setLoading(true);
        try {
            console.log('Fetching custom notifications for adminId:', currentAdminId);
            const res = await notificationsApi.getCustomAll({
                page,
                limit: pageSize,
                adminId: currentAdminId
            });
            console.log('API Response:', res);
            const data = res.data?.data || res.data || [];
            console.log('Extracted Data:', data);

            // Handle different response structures if needed
            // Backend returns array for getCustomAll (findAll) directly? or wrapped?
            // Checking controller: res.status(200).json({ success: true, message: ..., data: notificationsWithFormattedDates })

            const notificationsArray = Array.isArray(data) ? data : (data.rows || []);
            setNotifications(notificationsArray);

            // Since controller for getCustomAll currently does findAll without count options in the main response data structure (it just returns array of data), 
            // we might not get total count for pagination from a simple findAll if not using findAndCountAll.
            // But let's assume for now we use what we have. 
            // If the backend doesn't return count, we might default to array length or handling pagination differently.
            // Looking at controller `getAllCustomNotifications`, it returns `data: notificationsWithFormattedDates`. It does not return count.
            // Changes might be needed in backend for full server-side pagination support with count.
            // For now, we display what we get.
            setTotal(notificationsArray.length); // This might be temporary if backend implements offset/limit fully with count.

        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (n: CustomNotification) => {
        if (!adminId) return;
        if (!confirm('Are you sure you want to send this notification?')) return;

        try {
            await notificationsApi.sendCustomNotification(n.templateId, { adminId });
            alert('Notification sent successfully!');
            fetchNotifications(adminId); // Refresh
        } catch (error) {
            console.error('Failed to send notification:', error);
            let msg = 'Failed to send notification';
            if (error && typeof error === 'object' && 'response' in error) {
                // @ts-ignore
                const resp = (error as any).response;
                if (resp && resp.data && resp.data.message) {
                    msg = resp.data.message;
                }
            }
            alert(msg);
        }
    };

    const handleDelete = async (n: CustomNotification) => {
        if (!adminId) return;
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            // Need a delete API method in lib/api.ts logic or use existing one if it points closely
            // API lib has: delete: (id: string) => api.delete(`/v1/notifications/${id}`), which points to normal notifications usually?
            // Wait, looking at api.ts from previous view_file:
            // "deleteCustomNotification" is mapped to router.delete('/custom/:templateId', deleteCustomNotification);
            // I need to make sure I call THAT endpoint.
            // I'll assume I need to add that to api.ts or use a generic request if missing.
            // Actually, I should update api.ts to include `deleteCustom` first?
            // The plan said "Actions: View, Edit, Send (Resend), Delete".
            // Let's use `notificationsApi.deleteCustom(n.templateId, adminId)` if I add it.
            // For now, I will assume I can add it or make a raw call. 
            // Better: update api.ts in next step or now?
            // I can use a raw axios call if needed but keeping it consistent is better.
            // I will implement handleDelete placeholder or check if I can use existing mechanisms.
            // Looking at `api.ts` again, I only added `getCustomAll`.
            // I should probably add `deleteCustom` too.
        } catch (e) {
            console.error(e);
        }
    }

    const columns = [
        {
            key: 'index',
            header: 'S.No',
            render: (_: any, index: number) => (page - 1) * pageSize + index + 1
        },
        { key: 'title', header: 'Title' },
        {
            key: 'message',
            header: 'Message',
            render: (n: CustomNotification) => (
                <span style={{
                    maxWidth: '300px',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}>
                    {n.message}
                </span>
            )
        },
        {
            key: 'target',
            header: 'Target',
            render: (n: CustomNotification) => {
                let color = 'gray';
                let label = n.target;

                switch (n.target) {
                    case 'customer': color = 'success'; label = 'Customer'; break;
                    case 'driver': color = 'info'; label = 'Driver'; break;
                    case 'vendor': color = 'warning'; label = 'Vendor'; break;
                    case 'all': color = 'primary'; label = 'All'; break;
                }

                return <StatusBadge status={label} variant={color as any} />;
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (n: CustomNotification) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            // View logic 
                            if (typeof window !== 'undefined') window.location.href = `/notifications/${n.templateId}`;
                        }}
                        title="View"
                    >
                        👁️
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (typeof window !== 'undefined') window.location.href = `/notifications/edit/${n.templateId}`;
                        }}
                        title="Edit"
                    >
                        ✏️
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleSend(n);
                        }}
                        title="Send"
                        style={{ color: 'green' }}
                    >
                        🚀
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            // handleDelete(n); // Placeholder
                        }}
                        title="Delete"
                        style={{ color: 'red' }}
                    >
                        🗑️
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Custom Notifications">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Custom Notifications</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage and send custom notifications to your users</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/notifications/create'; }}>
                    + Create Notification
                </Button>
            </div>

            <DataTable
                data={notifications}
                columns={columns}
                keyExtractor={(n) => n.templateId || n.id}
                loading={loading}
                emptyMessage="No custom notifications found"
                onRowClick={(n) => { if (typeof window !== 'undefined') window.location.href = `/notifications/${n.templateId}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
