'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Paper, Typography, Box } from '@mui/material';
import { X } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function CreateBookingPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        tripType: 'One way',
        vehicleType: '',
        customerName: '',
        phoneNumber: '',
        countryCode: '+91',
        pickupLocation: '',
        dropLocation: '',
        pickupDate: '',
        pickupTime: '',
        amountPerKm: '',
        extraAmountPerKm: '',
        driverBeta: '',
        extraDriverBeta: '',
        hillCharge: '',
        extraHillCharge: '',
        permitCharge: '',
        extraPermitCharge: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/v1/bookings`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            router.push('/admin/bookings');
        } catch (error) {
            console.error('Error creating booking:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h4" className="font-bold">Create New Booking</Typography>
                <Button onClick={() => router.back()} startIcon={<X className="w-4 h-4" />}>
                    Close
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Trip Detail */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Trip Detail</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormControl fullWidth required>
                            <InputLabel>Trip Type</InputLabel>
                            <Select
                                value={formData.tripType}
                                onChange={(e) => setFormData({ ...formData, tripType: e.target.value })}
                            >
                                <MenuItem value="One way">One way</MenuItem>
                                <MenuItem value="Round trip">Round trip</MenuItem>
                                <MenuItem value="Hourly">Hourly</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Vehicle Type</InputLabel>
                            <Select
                                value={formData.vehicleType}
                                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                            >
                                <MenuItem value="Sedan">Sedan</MenuItem>
                                <MenuItem value="SUV">SUV</MenuItem>
                                <MenuItem value="Innova">Innova</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </Paper>

                {/* Customer Detail */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Customer Detail</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            fullWidth
                            required
                            label="Customer Name"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        />
                        <div className="flex gap-2">
                            <Select
                                value={formData.countryCode}
                                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                className="w-32"
                            >
                                <MenuItem value="+91">India: +91</MenuItem>
                                <MenuItem value="+1">USA: +1</MenuItem>
                            </Select>
                            <TextField
                                fullWidth
                                required
                                label="Phone Number"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>
                    </div>
                </Paper>

                {/* Location Detail */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Location Detail</Typography>
                    <TextField
                        fullWidth
                        required
                        label="Pickup Location"
                        placeholder="Search for a location..."
                        value={formData.pickupLocation}
                        onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                    />
                    <TextField
                        fullWidth
                        required
                        label="Drop Location"
                        placeholder="Search for a location..."
                        value={formData.dropLocation}
                        onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
                    />
                </Paper>

                {/* Pickup Date & Time */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Pickup Date & Time Detail</Typography>
                    <TextField
                        fullWidth
                        required
                        type="datetime-local"
                        label="Pickup Date & Time"
                        value={formData.pickupDate}
                        onChange={(e) => setFormData({ ...formData, pickupDate: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                    />
                </Paper>

                {/* Pricing Detail */}
                <Paper className="p-6 space-y-4">
                    <Typography variant="h6" className="font-bold mb-4">Pricing Detail</Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <TextField
                            fullWidth
                            type="number"
                            label="Amount per Km"
                            value={formData.amountPerKm}
                            onChange={(e) => setFormData({ ...formData, amountPerKm: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Extra Amount per Km"
                            value={formData.extraAmountPerKm}
                            onChange={(e) => setFormData({ ...formData, extraAmountPerKm: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Driver Beta"
                            value={formData.driverBeta}
                            onChange={(e) => setFormData({ ...formData, driverBeta: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Extra Driver Beta"
                            value={formData.extraDriverBeta}
                            onChange={(e) => setFormData({ ...formData, extraDriverBeta: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Hill Charge"
                            value={formData.hillCharge}
                            onChange={(e) => setFormData({ ...formData, hillCharge: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Extra Hill Charge"
                            value={formData.extraHillCharge}
                            onChange={(e) => setFormData({ ...formData, extraHillCharge: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Permit Charge"
                            value={formData.permitCharge}
                            onChange={(e) => setFormData({ ...formData, permitCharge: e.target.value })}
                        />
                        <TextField
                            fullWidth
                            type="number"
                            label="Extra Permit Charge"
                            value={formData.extraPermitCharge}
                            onChange={(e) => setFormData({ ...formData, extraPermitCharge: e.target.value })}
                        />
                    </div>
                </Paper>

                <div className="flex justify-end gap-4">
                    <Button variant="outlined" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button type="button" variant="contained" className="bg-blue-600">
                        Check Fare
                    </Button>
                    <Button type="submit" variant="contained" className="bg-green-600">
                        Create Booking
                    </Button>
                </div>
            </form>
        </div>
    );
}
