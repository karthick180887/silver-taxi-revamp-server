'use client';

import React, { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { invoicesApi } from '@/lib/api';

interface InvoiceFormData {
    name: string;
    phone: string;
    email: string;
    address: string;
    serviceType: string;
    vehicleType: string;
    invoiceNo: string;
    invoiceDate: string;
    pickup: string;
    drop: string;
    totalKm: number;
    pricePerKm: number;
    travelTime: string;
    otherCharges: number;
    totalAmount: number;
    status: string;
    paymentDetails: string;
    GSTNumber: string;
    note: string;
}

export default function CreateInvoicePage() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<InvoiceFormData>({
        name: '',
        phone: '',
        email: '',
        address: '',
        serviceType: 'Outstation',
        vehicleType: '',
        invoiceNo: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        pickup: '',
        drop: '',
        totalKm: 0,
        pricePerKm: 0,
        travelTime: '',
        otherCharges: 0,
        totalAmount: 0,
        status: 'Unpaid',
        paymentDetails: 'Cash',
        GSTNumber: '',
        note: '',
    });

    const handleChange = (field: keyof InvoiceFormData, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const calculateTotal = () => {
        const kmCost = formData.totalKm * formData.pricePerKm;
        const total = kmCost + formData.otherCharges;
        setFormData(prev => ({ ...prev, totalAmount: total }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone || !formData.totalAmount) {
            setError('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await invoicesApi.create({
                ...formData,
                createdBy: 'Admin',
            });
            if (typeof window !== 'undefined') {
                window.location.href = '/invoices';
            }
        } catch (err: any) {
            console.error('Failed to create invoice:', err);
            setError(err.response?.data?.message || 'Failed to create invoice. Please try again.');
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

    return (
        <ClientLayout pageTitle="Create Invoice">
            <div style={{ maxWidth: '900px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Create New Invoice</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Generate a new invoice manually</p>
                    </div>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/invoices'; }}>
                        ← Back to Invoices
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                        {error}
                    </div>
                )}

                {/* Customer Details */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Customer Details</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Customer Name *"
                            placeholder="Full Name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        <Input
                            label="Phone Number *"
                            placeholder="+91..."
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                        <Input
                            label="Customer Address *"
                            placeholder="Full address"
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                        />
                        <Input
                            label="GST Number"
                            placeholder="Optional"
                            value={formData.GSTNumber}
                            onChange={(e) => handleChange('GSTNumber', e.target.value)}
                        />
                    </div>
                </div>

                {/* Invoice Details */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Invoice Details</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Invoice Date *"
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => handleChange('invoiceDate', e.target.value)}
                        />
                        <Input
                            label="Invoice No (Optional)"
                            placeholder="Auto-generated if empty"
                            value={formData.invoiceNo}
                            onChange={(e) => handleChange('invoiceNo', e.target.value)}
                        />
                        <Select
                            label="Status *"
                            options={[
                                { value: 'Paid', label: 'Paid' },
                                { value: 'Unpaid', label: 'Unpaid' },
                                { value: 'Pending', label: 'Pending' },
                            ]}
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        />
                    </div>
                </div>

                {/* Trip Details */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Trip Details</h2>
                    <div style={gridStyle}>
                        <Select
                            label="Service Type *"
                            options={[
                                { value: 'Outstation', label: 'Outstation' },
                                { value: 'Local', label: 'Local' },
                                { value: 'Airport Transfer', label: 'Airport Transfer' },
                            ]}
                            value={formData.serviceType}
                            onChange={(e) => handleChange('serviceType', e.target.value)}
                        />
                        <Input
                            label="Vehicle Type"
                            placeholder="e.g. Sedan, SUV"
                            value={formData.vehicleType}
                            onChange={(e) => handleChange('vehicleType', e.target.value)}
                        />
                        <Input
                            label="Pickup Location"
                            value={formData.pickup}
                            onChange={(e) => handleChange('pickup', e.target.value)}
                        />
                        <Input
                            label="Drop Location"
                            value={formData.drop}
                            onChange={(e) => handleChange('drop', e.target.value)}
                        />
                        <Input
                            label="Travel Time"
                            placeholder="e.g. 2 days"
                            value={formData.travelTime}
                            onChange={(e) => handleChange('travelTime', e.target.value)}
                        />
                    </div>
                </div>

                {/* Pricing Details */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Pricing Calculation</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Total Distance (Km) *"
                            type="number"
                            value={formData.totalKm.toString()}
                            onChange={(e) => {
                                handleChange('totalKm', parseFloat(e.target.value) || 0);
                            }}
                            onBlur={calculateTotal}
                        />
                        <Input
                            label="Price Per Km *"
                            type="number"
                            value={formData.pricePerKm.toString()}
                            onChange={(e) => {
                                handleChange('pricePerKm', parseFloat(e.target.value) || 0);
                            }}
                            onBlur={calculateTotal}
                        />
                        <Input
                            label="Other Charges"
                            type="number"
                            value={formData.otherCharges.toString()}
                            onChange={(e) => {
                                handleChange('otherCharges', parseFloat(e.target.value) || 0);
                            }}
                            onBlur={calculateTotal}
                        />
                        <Input
                            label="Payment Details *"
                            placeholder="e.g. Cash, Online, UPI"
                            value={formData.paymentDetails}
                            onChange={(e) => handleChange('paymentDetails', e.target.value)}
                        />
                        <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: '#475569' }}>Total Amount:</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Button size="sm" variant="secondary" onClick={calculateTotal}>Recalculate</Button>
                                    <Input
                                        value={formData.totalAmount.toString()}
                                        onChange={(e) => handleChange('totalAmount', parseFloat(e.target.value) || 0)}
                                        style={{ width: '150px', fontSize: '1.125rem', fontWeight: 700, textAlign: 'right' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Notes</h2>
                    <textarea
                        placeholder="Additional notes..."
                        value={formData.note}
                        onChange={(e) => handleChange('note', e.target.value)}
                        style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '0.75rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.875rem',
                            resize: 'vertical',
                        }}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/invoices'; }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating Invoice...' : 'Create Invoice'}
                    </Button>
                </div>
            </div>
        </ClientLayout>
    );
}
