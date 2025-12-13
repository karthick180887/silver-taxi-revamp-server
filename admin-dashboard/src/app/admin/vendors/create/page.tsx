'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, Paper, Typography, Box, Alert } from '@mui/material';
import { X } from 'lucide-react';
import axios from 'axios';
import { getAdminId } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreateVendorPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        remark: '',
        website: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [adminId, setAdminId] = useState<string | null>(null);

    useEffect(() => {
        // Get admin ID from token
        const id = getAdminId();
        setAdminId(id);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        if (!adminId) {
            setError('Admin ID not found. Please login again.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                adminId: adminId,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                remark: formData.remark || undefined,
                website: formData.website || undefined,
            };

            await axios.post(`${API_URL}/v1/vendors`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/vendors');
        } catch (error: any) {
            setError(error.response?.data?.message || 'Error creating vendor. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h4" className="font-bold">Create Vendor</Typography>
                <Button onClick={() => router.back()} startIcon={<X className="w-4 h-4" />}>
                    Close
                </Button>
            </div>

            {error && (
                <Alert severity="error" onClose={() => setError('')}>
                    {error}
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Basic Information</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            fullWidth
                            required
                            label="Vendor Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            required
                            type="email"
                            label="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            required
                            label="Phone Number"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            label="Website"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://example.com"
                        />
                    </div>
                </Paper>

                {/* Password Section */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Password</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            fullWidth
                            required
                            type="password"
                            label="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            helperText="Minimum 6 characters"
                        />
                        <TextField
                            fullWidth
                            required
                            type="password"
                            label="Confirm Password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                    </div>
                </Paper>

                {/* Additional Information */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Additional Information</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Remark"
                        value={formData.remark}
                        onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                        placeholder="Additional notes or remarks about this vendor"
                    />
                </Paper>

                <div className="flex justify-end gap-4">
                    <Button variant="outlined" onClick={() => router.back()} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" className="bg-blue-600" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Vendor'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
