'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, Paper, Typography } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreateOfferPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        discount: '',
        validFrom: '',
        validTo: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/v1/offers`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/offers');
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    };

    return (
        <div className="space-y-6">
            <Typography variant="h4" className="font-bold">Create Offer</Typography>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Paper className="p-6 space-y-4">
                    <TextField
                        fullWidth
                        required
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        required
                        type="number"
                        label="Discount (%)"
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        required
                        type="date"
                        label="Valid From"
                        value={formData.validFrom}
                        onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        fullWidth
                        required
                        type="date"
                        label="Valid To"
                        value={formData.validTo}
                        onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Paper>
                <div className="flex justify-end gap-4">
                    <Button variant="outlined" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit" variant="contained" className="bg-blue-600">Create Offer</Button>
                </div>
            </form>
        </div>
    );
}
