'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Chip,
    CircularProgress,
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
import { Plus, Bell, Clock, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('all');

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                // Determine API endpoint based on tab/mock data
                // Since this is Admin panel, we want history of Broadcasts mainly.
                const res = await axios.get(`${API_URL}/admin/notifications`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
                });
                if (res.data?.data) {
                    setNotifications(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, [tab]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        Notifications
                    </Typography>
                    <Typography className="text-gray-500 mt-1">
                        Send alerts and updates to drivers
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Plus className="w-5 h-5" />}
                    onClick={() => router.push('/admin/notifications/create')}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-2.5 shadow-lg shadow-blue-500/20 text-white font-semibold"
                >
                    New Notification
                </Button>
            </div>

            {/* List */}
            <Paper elevation={0} className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                <Tabs
                    value={tab}
                    onChange={(_, val) => setTab(val)}
                    textColor="primary"
                    indicatorColor="primary"
                    className="border-b border-gray-100 dark:border-zinc-800"
                >
                    <Tab label="Recent Broadcasts" value="all" className="font-medium" />
                </Tabs>

                {loading ? (
                    <div className="flex justify-center p-12"><CircularProgress /></div>
                ) : notifications.length === 0 ? (
                    <div className="text-center p-12 text-gray-500">No notifications found</div>
                ) : (
                    <List className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {notifications.map((notif: any) => (
                            <ListItem key={notif.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors py-4">
                                <ListItemAvatar>
                                    <Avatar className="bg-blue-100 text-blue-600">
                                        <Bell className="w-5 h-5" />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <div className="flex justify-between items-center">
                                            <Typography className="font-semibold text-gray-900 dark:text-gray-100">
                                                {notif.title}
                                            </Typography>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Clock className="w-3.5 h-3.5" />
                                                {new Date(notif.sentAt).toLocaleString()}
                                            </div>
                                        </div>
                                    }
                                    secondary={
                                        <div className="mt-1">
                                            <Typography className="text-gray-600 dark:text-gray-400 text-sm">
                                                {notif.message}
                                            </Typography>
                                            <div className="flex gap-2 mt-2">
                                                {notif.ownerType && (
                                                    <Chip label={`To: ${notif.ownerType}`} size="small" className="bg-gray-100 dark:bg-zinc-800 text-xs" />
                                                )}
                                            </div>
                                        </div>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </div>
    );
}
