'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Select, LocationAutocomplete } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { bookingsApi, servicesApi, vehiclesApi, tariffsApi } from '@/lib/api';

interface Service {
    serviceId: string;
    name: string;
}

interface VehicleType {
    vehicleId: string;
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
    const [showFareModal, setShowFareModal] = useState(false);
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

    const handleConfirmBooking = async () => {
        if (!formData.tripType || !formData.vehicleType || !formData.customerName || !formData.customerPhone) {
            setError('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const serviceName = services.find(s => s.serviceId === formData.tripType)?.name || "";
            const vehicleName = vehicleTypes.find(v => v.vehicleId === formData.vehicleType)?.name || "";
            const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}`;

            const payload = {
                adminId: "admin-1",
                createdBy: "Admin",
                name: formData.customerName,
                phone: formData.customerPhone,
                pickup: formData.pickupLocation,
                drop: formData.dropLocation,
                pickupDateTime: pickupDateTime,
                dropDate: pickupDateTime, // Assuming same day/one-way for now or handle round trip drop date if added
                serviceType: serviceName,
                vehicleId: formData.vehicleType,
                vehicleType: vehicleName,
                distance: fareResult?.distance || 0,
                status: "Booking Confirmed",
                paymentStatus: "Unpaid",
                paymentMethod: "Cash",
                isContacted: true,
                // Pricing fields
                estimatedAmount: fareResult?.finalPrice || 0,
                finalAmount: fareResult?.finalPrice || 0,
                amountPerKm: formData.amountPerKm,
                extraAmountPerKm: formData.extraAmountPerKm,
                driverBeta: formData.driverBeta,
                extraDriverBeta: formData.extraDriverBeta,
                hillCharge: formData.hillCharge,
                extraHillCharge: formData.extraHillCharge,
                permitCharge: formData.permitCharge,
                extraPermitCharge: formData.extraPermitCharge,
                notes: formData.notes
            };

            console.log("Creating Booking Payload:", payload); // Debugging

            await bookingsApi.create(payload);
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

    const handleCheckFare = async () => {
        if (!formData.pickupLocation || !formData.dropLocation) {
            setError('Please enter pickup and drop locations');
            return;
        }

        if (!formData.pickupDate || !formData.pickupTime) {
            setError('Please enter pickup date and time');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            // 1. Calculate Distance using Google Maps API
            let distance = 0;
            if (window.google && window.google.maps) {
                const service = new window.google.maps.DistanceMatrixService();
                try {
                    const result = await new Promise<any>((resolve, reject) => {
                        service.getDistanceMatrix({
                            origins: [formData.pickupLocation],
                            destinations: [formData.dropLocation],
                            travelMode: window.google.maps.TravelMode.DRIVING,
                        }, (response, status) => {
                            if (status === 'OK' && response) {
                                resolve(response);
                            } else {
                                reject(status);
                            }
                        });
                    });

                    if (result.rows[0]?.elements[0]?.status === 'OK') {
                        // value is in meters, convert to km
                        distance = result.rows[0].elements[0].distance.value / 1000;
                    }
                } catch (e) {
                    console.error("Distance Matrix failed", e);
                }
            }

            // 2. Prepare payload for Backend
            const pickupDateTime = `${formData.pickupDate}T${formData.pickupTime}`;

            const payload = {
                adminId: "admin-1",
                distance: distance,
                pickupDateTime: pickupDateTime,
                dropDate: pickupDateTime,
                serviceType: services.find(s => s.serviceId === formData.tripType)?.name || "",
                vehicleId: formData.vehicleType,
                vehicleType: vehicleTypes.find(v => v.vehicleId === formData.vehicleType)?.name || "",
                packageId: null,
                packageType: null,
                createdBy: "Admin",
                stops: []
            };

            const res = await bookingsApi.calculateFare(payload);
            setFareResult({ ...res.data?.data, distance }); // Include calculated distance in result
            setShowFareModal(true); // Open Modal
        } catch (error: any) {
            console.error('Failed to calculate fare:', error);
            setError(error.response?.data?.message || 'Failed to calculate fare. Please try again.');
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
        ...services.map(s => ({ value: s.serviceId, label: s.name })),
    ];

    const vehicleOptions = [
        { value: '', label: 'Select Vehicle Type' },
        ...vehicleTypes.map(v => ({ value: v.vehicleId, label: v.name || v.type })),
    ];

    // Helper for modal rows
    const DetailBox = ({ label, value, bg, icon }: { label: string, value: string, bg: string, icon?: string }) => (
        <div style={{ background: bg, padding: '1rem', borderRadius: '8px', flex: 1 }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {icon && <span>{icon}</span>}
                {label}
            </div>
            <div style={{ fontWeight: 600, color: '#1e293b' }}>{value}</div>
        </div>
    );

    // Helper for Fare rows
    const FareRow = ({ label, value }: { label: string, value: string | number }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.875rem', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
            <span>{label}</span>
            <span style={{ fontWeight: 500 }}>{value}</span>
        </div>
    );


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
                        <LocationAutocomplete
                            label="Pickup Location *"
                            placeholder="Search for pickup location..."
                            value={formData.pickupLocation}
                            onChange={(value: string) => handleChange('pickupLocation', value)}
                        />
                        <LocationAutocomplete
                            label="Drop Location *"
                            placeholder="Search for drop location..."
                            value={formData.dropLocation}
                            onChange={(value: string) => handleChange('dropLocation', value)}
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
                    <h2 style={sectionTitleStyle}>Pricing Details (Optional Overrides)</h2>
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

                {/* Main Action Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/bookings'; }}>
                        Cancel
                    </Button>
                    <Button onClick={handleCheckFare} disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981' }}>
                        {submitting ? 'Calculating...' : 'Check Fare'}
                    </Button>
                </div>
            </div>

            {/* Fare Calculation Modal */}
            {showFareModal && fareResult && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowFareModal(false)} />
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '800px',
                        background: '#fff',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        {/* Modal Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Fare Calculation</h2>
                            <button onClick={() => setShowFareModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
                        </div>

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Customer Row */}
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <DetailBox label="Customer Name" value={formData.customerName} bg="#eff6ff" icon="👤" />
                                <DetailBox label="Phone Number" value={formData.customerPhone} bg="#f3e8ff" icon="📞" />
                            </div>

                            {/* Trip Details Header */}
                            <div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    📄 Trip Details
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                    <DetailBox label="Pickup Location" value={formData.pickupLocation} bg="#eff6ff" icon="📍" />
                                    <DetailBox label="Drop Location" value={formData.dropLocation} bg="#f0fdf4" icon="🎯" />
                                    <DetailBox label="Date & Time" value={`${formData.pickupDate} • ${formData.pickupTime}`} bg="#f3e8ff" icon="📅" />
                                    <DetailBox label="Service Type" value={services.find(s => s.serviceId === formData.tripType)?.name || '-'} bg="#fff7ed" icon="🧳" />
                                    <DetailBox label="Vehicle" value={vehicleTypes.find(v => v.vehicleId === formData.vehicleType)?.name || '-'} bg="#f8fafc" icon="🚕" />
                                </div>
                            </div>

                            {/* Fares Row */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                {/* Estimation Fare */}
                                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        💳 Estimation Fare
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <FareRow label="Distance" value={`${fareResult.distance} km`} />
                                        {/* Assuming Min Km is part of fareResult logic, fallback for now */}
                                        <FareRow label="Minimum Km" value={`${fareResult.minKm || '-'} km`} />
                                        {/* Duration might come from Google Maps if we stored it, else calculate? Using placeholder from screenshot */}
                                        <FareRow label="Duration" value="-" />
                                        <FareRow label="No of Days" value="1" />
                                        <FareRow label="Price Per Km" value={`₹${fareResult.pricePerKm || formData.amountPerKm}`} />
                                        <FareRow label="Driver Bata" value={`₹${fareResult.driverBeta || formData.driverBeta}`} />
                                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                            <span>Final Amount</span>
                                            <span>₹{String(fareResult.finalPrice || fareResult.totalAmount || 0)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Admin Fare (Mirror for now as per screenshot layout) */}
                                <div style={{ background: '#eff6ff', padding: '1.5rem', borderRadius: '12px' }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        🛡️ Admin Fare
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <FareRow label="Distance" value={`${fareResult.distance} km`} />
                                        <FareRow label="Minimum Km" value={`${fareResult.minKm || '-'} km`} />
                                        <FareRow label="Duration" value="-" />
                                        <FareRow label="No of Days" value="1" />
                                        <FareRow label="Price Per Km" value={`₹${fareResult.pricePerKm || formData.amountPerKm}`} />
                                        <FareRow label="Driver Bata" value={`₹${fareResult.driverBeta || formData.driverBeta}`} />
                                        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', color: '#1e293b' }}>
                                            <span>Final Amount</span>
                                            <span>₹{String(fareResult.finalPrice || fareResult.totalAmount || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div style={{ padding: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setShowFareModal(false)} style={{ width: '150px' }}>Cancel</Button>
                            <Button onClick={handleConfirmBooking} disabled={submitting} style={{ background: '#10b981', borderColor: '#10b981', width: '200px' }}>
                                {submitting ? 'Creating...' : 'Create Booking'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ClientLayout>
    );
}
