'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Typography,
    Autocomplete,
    CircularProgress,
    Box
} from '@mui/material';
import { ArrowLeft, Save } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Interfaces
interface VehicleType {
    id: string;
    name: string;
    type: string;
}

interface Driver {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
}

export default function CreateVehiclePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [driversLoading, setDriversLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        make: '',
        model: '',
        type: '',
        vehicleTypeId: '',
        registrationNumber: '',
        color: '',
        year: new Date().getFullYear().toString(),
        driverId: '',
    });

    useEffect(() => {
        // Fetch Vehicle Types
        const fetchTypes = async () => {
            try {
                // Assuming public endpoint or admin accessible
                const res = await axios.get(`${API_URL}/v1/vehicle-types`); // Verify route
                if (res.data?.data) {
                    setVehicleTypes(res.data.data);
                } else if (Array.isArray(res.data)) {
                    setVehicleTypes(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch vehicle types", err);
                // Fallback if API fails
                setVehicleTypes([
                    { id: 'vt_mini', name: 'Mini', type: 'Mini' },
                    { id: 'vt_sedan', name: 'Sedan', type: 'Sedan' },
                    { id: 'vt_suv', name: 'SUV', type: 'SUV' },
                ]);
            }
        };

        // Fetch Drivers for assignment
        const fetchDrivers = async () => {
            try {
                setDriversLoading(true);
                const res = await axios.get(`${API_URL}/admin/drivers`, {
                    params: { limit: 100 }, // Fetch top 100 for now. Ideal: Search Select
                    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
                });
                if (res.data?.data) {
                    setDrivers(res.data.data);
                }
            } catch (err) {
                console.error("Failed to fetch drivers", err);
            } finally {
                setDriversLoading(false);
            }
        };

        fetchTypes();
        fetchDrivers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.driverId) {
            alert("Please assign a driver to this vehicle.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                year: parseInt(formData.year) || 0,
                vehicleType: formData.vehicleTypeId // API expects vehicleType ID possibly?
            };

            await axios.post(`${API_URL}/admin/vehicles`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/vehicles');
        } catch (error) {
            console.error('Error creating vehicle:', error);
            alert('Failed to create vehicle. Please check inputs and try again.');
        } finally {
            setLoading(false);
        }
    };

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
                        Add New Vehicle
                    </Typography>
                    <Typography className="text-sm text-gray-500">
                        Register a new vehicle and assign it to a driver
                    </Typography>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <Paper elevation={0} className="p-8 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm space-y-8">

                    {/* Section: Driver Assignment */}
                    <div className="space-y-4">
                        <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
                            Driver Assignment
                        </Typography>
                        <Autocomplete
                            options={drivers}
                            getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.phone})`}
                            loading={driversLoading}
                            onChange={(_, value) => setFormData({ ...formData, driverId: value?.id || '' })}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Driver"
                                    required
                                    placeholder="Search by name or phone"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {driversLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </div>

                    <div className="h-px bg-gray-100 dark:bg-zinc-800" />

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
                                placeholder="e.g. MH02AB1234"
                                value={formData.registrationNumber}
                                onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value.toUpperCase() })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Make"
                                placeholder="e.g. Toyota"
                                value={formData.make}
                                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Model"
                                placeholder="e.g. Innova Crysta"
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                required
                                label="Manufacturing Year"
                                type="number"
                                placeholder="YYYY"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            />

                            <TextField
                                fullWidth
                                label="Color"
                                placeholder="e.g. White"
                                value={formData.color}
                                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
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
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-2.5 rounded-xl text-white font-semibold shadow-lg shadow-blue-500/20"
                    >
                        {loading ? 'Creating...' : 'Create Vehicle'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
