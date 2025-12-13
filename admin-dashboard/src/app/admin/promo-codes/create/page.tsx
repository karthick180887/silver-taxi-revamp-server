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
import { ArrowLeft, Check, Tag } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreatePromoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        description: '',
        type: 'flat', // 'flat' | 'percentage'
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        usageLimit: '',
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

        // Basic validation
        if (!formData.code || !formData.value || !formData.endDate) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                value: parseFloat(formData.value) || 0,
                minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
                maxDiscount: parseFloat(formData.maxDiscount) || 0,
                usageLimit: parseInt(formData.usageLimit) || 0,
                startDate: new Date(formData.startDate).toISOString(), // Ensure proper ISO format
                endDate: new Date(formData.endDate).toISOString(),
            };

            await axios.post(`${API_URL}/admin/promo-codes`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/promo-codes');
        } catch (err: any) {
            console.error('Error creating promo code:', err);
            setError(err.response?.data?.error || 'Failed to create promo code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
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
                        Create Promo Code
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                        Add a new discount coupon
                    </Typography>
                </div>
            </div>

            <Paper elevation={0} className="p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                {error && (
                    <Alert severity="error" className="mb-6 rounded-xl">
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Code & Description */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextField
                            label="Promo Code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                            fullWidth
                            placeholder="e.g. SUMMER50"
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Tag className="w-4 h-4 text-gray-400" />
                                    </InputAdornment>
                                ),
                                className: "uppercase" // Visual uppercase
                            }}
                        />
                        <TextField
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            fullWidth
                            placeholder="Short description of the offer"
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                        />
                    </div>

                    {/* Type & Value */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormControl fullWidth>
                            <InputLabel>Discount Type</InputLabel>
                            <Select
                                label="Discount Type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            >
                                <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                                <MenuItem value="percentage">Percentage (%)</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            label="Discount Value"
                            name="value"
                            type="number"
                            value={formData.value}
                            onChange={handleChange}
                            required
                            fullWidth
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">{formData.type === 'flat' ? '₹' : '%'}</InputAdornment>,
                            }}
                        />
                        <TextField
                            label="Max Discount"
                            name="maxDiscount"
                            type="number"
                            value={formData.maxDiscount}
                            onChange={handleChange}
                            fullWidth
                            disabled={formData.type === 'flat'}
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            helperText={formData.type === 'flat' ? 'Not applicable for flat discount' : 'Max cap for % discount'}
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                        />
                    </div>

                    {/* Limits & Constraints */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextField
                            label="Min Order Amount"
                            name="minOrderAmount"
                            type="number"
                            value={formData.minOrderAmount}
                            onChange={handleChange}
                            fullWidth
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                            InputProps={{
                                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                            }}
                        />
                        <TextField
                            label="Usage Limit"
                            name="usageLimit"
                            type="number"
                            value={formData.usageLimit}
                            onChange={handleChange}
                            fullWidth
                            placeholder="e.g. 100"
                            helperText="Leave empty for unlimited"
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TextField
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                        />
                        <TextField
                            label="End Date"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                        />
                    </div>

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
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Check className="w-5 h-5" />}
                        >
                            {loading ? 'Creating...' : 'Create Promo Code'}
                        </Button>
                    </div>
                </form>
            </Paper>
        </div>
    );
}
