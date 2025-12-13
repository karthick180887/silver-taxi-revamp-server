'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Typography,
    CircularProgress,
    Alert
} from '@mui/material';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Interfaces
interface VehicleType {
    id: string;
    name: string;
    type: string;
}

export default function EditVehiclePage() {
    const router = useRouter();
    const params = useParams();
    // In Next.js App Router, params are dynamic. params.id might be string or array.
    const vehicleId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [loading, setLoading] = useState(true); // Initial load
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);

    // Form Data
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        type: '',
        vehicleTypeId: '',
        registrationNumber: '',
        color: '',
        year: '',
        status: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Vehicle Types
                const typesRes = await axios.get(`${API_URL}/v1/vehicle-types`);
                if (typesRes.data?.data) {
                    setVehicleTypes(typesRes.data.data);
                }

                // Fetch Vehicle Details
                if (vehicleId) {
                    const vehicleRes = await axios.get(`${API_URL}/admin/vehicles/${vehicleId}`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
                    });

                    if (vehicleRes.data?.data) {
                        const v = vehicleRes.data.data;
                        setFormData({
                            make: v.make || '',
                            model: v.model || '',
                            type: v.type || '', // Might differ from vehicleTypeId logic
                            vehicleTypeId: v.vehicleTypeId || '',
                            registrationNumber: v.registrationNumber || '',
                            color: v.color || '',
                            year: v.year ? v.year.toString() : '',
                            status: v.status || 'Active',
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to fetch data", err);
                setError('Failed to load vehicle details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [vehicleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...formData,
                year: parseInt(formData.year) || 0,
                vehicleType: formData.vehicleTypeId
            };

            await axios.put(`${API_URL}/admin/vehicles/${vehicleId}`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/vehicles');
        } catch (error) {
            console.error('Error updating vehicle:', error);
            setError('Failed to update vehicle.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <CircularProgress />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button
                    onClick={() => router.back()}
                    className="min-w-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <Typography variant="h5" className="font-bold text-gray-900 dark:text-white">
                        Edit Vehicle
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                        Update vehicle details
                    </Typography>
                </div>
            </div>

            {error && <Alert severity="error" className="mb-4">{error}</Alert>}

            <form onSubmit={handleSubmit}>
                <Paper elevation={0} className="p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm space-y-8">

                    {/* Section: Vehicle Details */}
                    <div className="space-y-4">
                        <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
                            Vehicle Details
                        </Typography>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormControl fullWidth required>
                                <InputLabel>Vehicle Type</InputLabel>
                                <Select
                                    label="Vehicle Type"
                                    value={formData.vehicleTypeId}
                                    onChange={(e) => {
                                        const selected = vehicleTypes.find(t => t.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            vehicleTypeId: e.target.value,
                                            type: selected?.type || ''
                                        });
                                    }}
                                >
                                    {vehicleTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                required
                                label="Registration Number"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Make"
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Model"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Manufacturing Year"
                                type="number"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                label="Color"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />

                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    label="Status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Inactive">Inactive</MenuItem>
                                    <MenuItem value="Maintenance">Maintenance</MenuItem>
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                </Paper>

                <div className="flex justify-end gap-4 mt-6">
                    <Button
                        variant="outlined"
                        onClick={() => router.back()}
                        className="px-6 py-2.5 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/20"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
