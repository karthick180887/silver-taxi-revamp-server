'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import { ArrowLeft, Send, Users, User, Bell } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreateNotificationPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        message: '',
        target: 'driver', // 'driver' | 'customer' | 'admin' - for now broad targeting
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        if (!formData.title || !formData.message) {
            setError('Please fill in title and message.');
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_URL}/admin/notifications/broadcast`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/notifications');
            }, 1500);
        } catch (err: any) {
            console.error('Error sending notification:', err);
            setError(err.response?.data?.error || 'Failed to send notification.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    onClick={() => router.back()}
                    className="min-w-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <Typography variant="h5" className="font-bold text-gray-900 dark:text-white">
                        Send Notification
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                        Broadcast a message to users
                    </Typography>
                </div>
            </div>

            <Paper elevation={0} className="p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                {error && (
                    <Alert severity="error" className="mb-6 rounded-xl">
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" className="mb-6 rounded-xl">
                        Notification sent successfully! Redirecting...
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormControl fullWidth>
                        <InputLabel>Target Audience</InputLabel>
                        <Select
                            label="Target Audience"
                            name="target"
                            value={formData.target}
                            onChange={handleChange}
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            startAdornment={
                                <InputAdornment position="start" className="pl-1">
                                    <Users className="w-4 h-4 text-gray-500" />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="driver">All Drivers</MenuItem>
                            <MenuItem value="customer" disabled>All Customers (Coming Soon)</MenuItem>
                            <MenuItem value="admin" disabled>Admins (Coming Soon)</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        fullWidth
                        placeholder="e.g. Important Update"
                        className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                    />

                    <TextField
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        fullWidth
                        multiline
                        rows={6}
                        placeholder="Type your message here..."
                        className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outlined"
                            onClick={() => router.back()}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl shadow-lg shadow-blue-500/20 font-semibold"
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send className="w-5 h-5" />}
                        >
                            {loading ? 'Sending...' : 'Send Broadcast'}
                        </Button>
                    </div>
                </form>
            </Paper>
        </div>
    );
}
