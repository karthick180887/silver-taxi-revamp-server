'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Typography } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreateInvoicePage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        bookingId: '',
        customerId: '',
        amount: '',
        status: 'Pending',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/v1/invoices`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/invoices');
        } catch (error) {
            console.error('Error creating invoice:', error);
        }
    };

    return (
        <div className="space-y-6">
            <Typography variant="h4" className="font-bold">Create Invoice</Typography>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Paper className="p-6 space-y-4">
                    <TextField
                        fullWidth
                        required
                        label="Booking ID"
                        value={formData.bookingId}
                        onChange={(e) => setFormData({ ...formData, bookingId: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        required
                        label="Customer ID"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Amount"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <MenuItem value="Pending">Pending</MenuItem>
                            <MenuItem value="Paid">Paid</MenuItem>
                        </Select>
                    </FormControl>
                </Paper>
                <div className="flex justify-end gap-4">
                    <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" variant="contained" className="bg-blue-600">Create Invoice</Button>
                </div>
            </form>
        </div>
    );
}
