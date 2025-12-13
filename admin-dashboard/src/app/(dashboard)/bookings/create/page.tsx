'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { bookingsApi, servicesApi, vehiclesApi, tariffsApi } from '@/lib/api';

interface Service {
    id: string;
    name: string;
}

interface VehicleType {
    id: string;
    name: string;
    type: string;
}

interface FormData {
    tripType: string;
    vehicleType: string;
    customerName: string;
    customerPhone: string;
    pickupLocation: string;
    dropLocation: string;
    pickupDate: string;
    pickupTime: string;
    amountPerKm: number;
    extraAmountPerKm: number;
    driverBeta: number;
    extraDriverBeta: number;
    hillCharge: number;
    extraHillCharge: number;
    permitCharge: number;
    extraPermitCharge: number;
    notes: string;
}

export default function CreateBookingPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [fareResult, setFareResult] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<FormData>({
        tripType: '',
        vehicleType: '',
        customerName: '',
        customerPhone: '',
        pickupLocation: '',
        dropLocation: '',
        pickupDate: '',
        pickupTime: '',
        amountPerKm: 0,
        extraAmountPerKm: 0,
        driverBeta: 0,
        extraDriverBeta: 0,
        hillCharge: 0,
        extraHillCharge: 0,
        permitCharge: 0,
        extraPermitCharge: 0,
        notes: '',
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [servicesRes, vehiclesRes, tariffsRes] = await Promise.all([
                servicesApi.getAll().catch(() => ({ data: [] })),
                vehiclesApi.getAll().catch(() => ({ data: [] })),
                tariffsApi.getAll().catch(() => ({ data: [] })),
            ]);

            const servicesData = servicesRes.data?.data || servicesRes.data || [];
            setServices(Array.isArray(servicesData) ? servicesData : servicesData.services || []);

            const vehiclesData = vehiclesRes.data?.data || vehiclesRes.data || [];
            setVehicleTypes(Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles || []);

            // Set default pricing from tariffs if available
            const tariffs = tariffsRes.data?.data || tariffsRes.data || [];
            if (Array.isArray(tariffs) && tariffs.length > 0) {
                const defaultTariff = tariffs[0];
                setFormData(prev => ({
                    ...prev,
                    amountPerKm: defaultTariff.pricePerKm || 0,
                    driverBeta: defaultTariff.driverBeta || 0,
                }));
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field: keyof FormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleCheckFare = async () => {
        if (!formData.pickupLocation || !formData.dropLocation) {
            setError('Please enter pickup and drop locations');
            return;
        }

        setSubmitting(true);
        try {
            const res = await bookingsApi.calculateFare({
                pickupLocation: formData.pickupLocation,
                dropLocation: formData.dropLocation,
                tripType: formData.tripType,
                vehicleType: formData.vehicleType,
                amountPerKm: formData.amountPerKm,
                driverBeta: formData.driverBeta,
                hillCharge: formData.hillCharge,
                permitCharge: formData.permitCharge,
            });
            setFareResult(res.data?.data || res.data || {});
        } catch (error) {
            console.error('Failed to calculate fare:', error);
            setError('Failed to calculate fare. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.tripType || !formData.vehicleType || !formData.customerName || !formData.customerPhone) {
            setError('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await bookingsApi.create({
                ...formData,
                pickupDateTime: `${formData.pickupDate}T${formData.pickupTime}`,
            });
            if (typeof window !== 'undefined') {
                window.location.href = '/bookings';
            }
        } catch (error) {
            console.error('Failed to create booking:', error);
            setError('Failed to create booking. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const sectionStyle = {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
    };

    const sectionTitleStyle = {
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1e293b',
        marginBottom: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #e2e8f0',
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
    };

    const serviceOptions = [
        { value: '', label: 'Select Trip Type' },
        ...services.map(s => ({ value: s.id, label: s.name })),
    ];

    const vehicleOptions = [
        { value: '', label: 'Select Vehicle Type' },
        ...vehicleTypes.map(v => ({ value: v.id, label: v.name || v.type })),
    ];

    if (loading) {
        return (
            <ClientLayout pageTitle="Create Booking">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                    <div style={{ textAlign: 'center', color: '#64748b' }}>Loading...</div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout pageTitle="Create Booking">
            <div style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Create New Booking</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Fill in the details to create a new booking</p>
                    </div>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/bookings'; }}>
                        ← Back to Bookings
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                        {error}
                    </div>
                )}

                {/* Trip Detail Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Trip Detail</h2>
                    <div style={gridStyle}>
                        <Select
                            label="Trip Type *"
                            options={serviceOptions}
                            value={formData.tripType}
                            onChange={(e) => handleChange('tripType', e.target.value)}
                        />
                        <Select
                            label="Vehicle Type *"
                            options={vehicleOptions}
                            value={formData.vehicleType}
                            onChange={(e) => handleChange('vehicleType', e.target.value)}
                        />
                    </div>
                </div>

                {/* Customer Detail Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Customer Detail</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Customer Name *"
                            placeholder="Enter customer name"
                            value={formData.customerName}
                            onChange={(e) => handleChange('customerName', e.target.value)}
                        />
                        <Input
                            label="Phone Number *"
                            placeholder="+91 9876543210"
                            value={formData.customerPhone}
                            onChange={(e) => handleChange('customerPhone', e.target.value)}
                        />
                    </div>
                </div>

                {/* Location Detail Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Location Detail</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Pickup Location *"
                            placeholder="Search for pickup location..."
                            value={formData.pickupLocation}
                            onChange={(e) => handleChange('pickupLocation', e.target.value)}
                        />
                        <Input
                            label="Drop Location *"
                            placeholder="Search for drop location..."
                            value={formData.dropLocation}
                            onChange={(e) => handleChange('dropLocation', e.target.value)}
                        />
                    </div>
                </div>

                {/* Pickup Date & Time Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Pickup Date & Time</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Pickup Date *"
                            type="date"
                            value={formData.pickupDate}
                            onChange={(e) => handleChange('pickupDate', e.target.value)}
                        />
                        <Input
                            label="Pickup Time *"
                            type="time"
                            value={formData.pickupTime}
                            onChange={(e) => handleChange('pickupTime', e.target.value)}
                        />
                    </div>
                </div>

                {/* Pricing Detail Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Pricing Detail</h2>
                    <div style={{ ...gridStyle, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <Input
                            label="Amount per Km"
                            type="number"
                            value={formData.amountPerKm.toString()}
                            onChange={(e) => handleChange('amountPerKm', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Extra Amount per Km"
                            type="number"
                            value={formData.extraAmountPerKm.toString()}
                            onChange={(e) => handleChange('extraAmountPerKm', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Driver Bata"
                            type="number"
                            value={formData.driverBeta.toString()}
                            onChange={(e) => handleChange('driverBeta', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Extra Driver Bata"
                            type="number"
                            value={formData.extraDriverBeta.toString()}
                            onChange={(e) => handleChange('extraDriverBeta', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Hill Charge"
                            type="number"
                            value={formData.hillCharge.toString()}
                            onChange={(e) => handleChange('hillCharge', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Extra Hill Charge"
                            type="number"
                            value={formData.extraHillCharge.toString()}
                            onChange={(e) => handleChange('extraHillCharge', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Permit Charge"
                            type="number"
                            value={formData.permitCharge.toString()}
                            onChange={(e) => handleChange('permitCharge', parseFloat(e.target.value) || 0)}
                        />
                        <Input
                            label="Extra Permit Charge"
                            type="number"
                            value={formData.extraPermitCharge.toString()}
                            onChange={(e) => handleChange('extraPermitCharge', parseFloat(e.target.value) || 0)}
                        />
                    </div>

                    {/* Check Fare Button */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <Button variant="secondary" onClick={handleCheckFare} disabled={submitting}>
                            {submitting ? 'Calculating...' : 'Check Fare'}
                        </Button>
                    </div>

                    {/* Fare Result */}
                    {fareResult && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>Fare Calculation</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <div>Distance: <strong>{String(fareResult.distance || '-')} km</strong></div>
                                <div>Base Fare: <strong>₹{String(fareResult.baseFare || 0)}</strong></div>
                                <div>Total: <strong>₹{String(fareResult.totalAmount || fareResult.total || 0)}</strong></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes Section */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Additional Notes</h2>
                    <textarea
                        placeholder="Any special instructions or notes..."
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '100px',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                        }}
                    />
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/bookings'; }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Booking'}
                    </Button>
                </div>
            </div>
        </ClientLayout>
    );
}
