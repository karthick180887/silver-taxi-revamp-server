'use client';

import React, { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { vendorsApi } from '@/lib/api';

interface VendorFormData {
    name: string;
    phone: string;
    email: string;
    password: string;
    website: string;
    walletAmount: number;
    remark: string;
    isLogin: boolean;
}

export default function CreateVendorPage() {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<VendorFormData>({
        name: '',
        phone: '',
        email: '',
        password: '',
        website: '',
        walletAmount: 0,
        remark: '',
        isLogin: true,
    });

    const handleChange = (field: keyof VendorFormData, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.phone || !formData.password) {
            setError('Please fill all required fields (Name, Phone, Password)');
            return;
        }

        setSubmitting(true);
        try {
            await vendorsApi.create(formData as unknown as Record<string, unknown>);
            if (typeof window !== 'undefined') {
                window.location.href = '/vendors';
            }
        } catch (err: any) {
            console.error('Failed to create vendor:', err);
            setError(err.response?.data?.message || 'Failed to create vendor. Please try again.');
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
        <ClientLayout pageTitle="Create Vendor">
            <div style={{ maxWidth: '800px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Add New Vendor</h1>
                        <p style={{ color: '#64748b', margin: 0 }}>Register a new vendor partner</p>
                    </div>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/vendors'; }}>
                        ← Back to Vendors
                    </Button>
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                        {error}
                    </div>
                )}

                {/* Basic Information */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Basic Information</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Vendor Name *"
                            placeholder="Enter vendor name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                        <Input
                            label="Phone Number *"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                        <Input
                            label="Email Address"
                            placeholder="Enter email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                        />
                        <Input
                            label="Password *"
                            placeholder="Create password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                        />
                        <Input
                            label="Website"
                            placeholder="https://example.com"
                            value={formData.website}
                            onChange={(e) => handleChange('website', e.target.value)}
                        />
                    </div>
                </div>

                {/* Account Settings */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Account Settings</h2>
                    <div style={gridStyle}>
                        <Input
                            label="Initial Wallet Amount"
                            type="number"
                            placeholder="0"
                            value={formData.walletAmount.toString()}
                            onChange={(e) => handleChange('walletAmount', parseFloat(e.target.value) || 0)}
                        />
                        <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '0.5rem' }}>
                                Login Status
                            </label>
                            <select
                                style={{
                                    width: '100%',
                                    padding: '0.625rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '0.875rem',
                                    background: '#ffffff',
                                    color: '#1e293b',
                                }}
                                value={formData.isLogin ? 'true' : 'false'}
                                onChange={(e) => handleChange('isLogin', e.target.value === 'true')}
                            >
                                <option value="true">Active (Allowed to Login)</option>
                                <option value="false">Blocked</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Additional Information */}
                <div style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>Additional Information</h2>
                    <textarea
                        placeholder="Remarks or notes..."
                        value={formData.remark}
                        onChange={(e) => handleChange('remark', e.target.value)}
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

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" onClick={() => { if (typeof window !== 'undefined') window.location.href = '/vendors'; }}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting ? 'Creating...' : 'Create Vendor'}
                    </Button>
                </div>
            </div>
        </ClientLayout>
    );
}
