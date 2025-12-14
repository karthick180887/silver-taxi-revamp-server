'use client';

import React, { useState } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { notificationsApi } from '@/lib/api';

export default function CreateNotificationPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        targetOption: 'all_customers',
        image: null as File | null
    });

    const targetOptions = [
        { value: 'all_customers', label: 'All Customers' },
        { value: 'all_drivers', label: 'All Drivers' },
        { value: 'all_vendors', label: 'All Vendors' },
    ];

    const handleSubmit = async () => {
        if (!formData.title || !formData.message) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('title', formData.title);
            fd.append('message', formData.message);
            fd.append('type', 'custom_notification');

            // Map targetOption
            if (formData.targetOption === 'all_customers') {
                fd.append('target', 'customer');
                fd.append('targetAudience', 'all');
            } else if (formData.targetOption === 'all_drivers') {
                fd.append('target', 'driver');
                fd.append('targetAudience', 'all');
            } else if (formData.targetOption === 'all_vendors') {
                fd.append('target', 'vendor');
                fd.append('targetAudience', 'all');
            }

            if (formData.image) {
                fd.append('image', formData.image);
            }

            // Append adminId if available in localStorage
            if (typeof window !== 'undefined') {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        // Try typical id fields
                        const adminId = user.adminId || user.id || user._id;
                        if (adminId) {
                            fd.append('adminId', adminId);
                        }
                    } catch (e) {
                        console.error('Error parsing user from localStorage', e);
                    }
                }
            }

            await notificationsApi.create(fd);

            if (typeof window !== 'undefined') {
                window.location.href = '/notifications';
            }
        } catch (error) {
            console.error('Failed to create notification:', error);
            // Extract error message if available
            let msg = 'Failed to create notification';
            if (error && typeof error === 'object' && 'response' in error) {
                // @ts-ignore
                const resp = (error as any).response;
                if (resp && resp.data && resp.data.message) {
                    msg = resp.data.message;
                }
            }
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ClientLayout pageTitle="Create Notification">
            <div style={{ marginBottom: '1.5rem' }}>
                <Button
                    variant="ghost"
                    onClick={() => { if (typeof window !== 'undefined') window.location.href = '/notifications'; }}
                    style={{ marginBottom: '1rem', paddingLeft: 0 }}
                >
                    ← Back to Notifications
                </Button>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>
                    Create Custom Notification
                </h1>
                <p style={{ color: '#64748b', margin: 0 }}>Create a new custom notification to send to your users</p>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '800px' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>
                    Create New Notification
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Input
                        id="title"
                        name="title"
                        label="Notification Title *"
                        placeholder="Enter notification title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />

                    <div>
                        <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>
                            Notification Message *
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            placeholder="Enter notification message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '0.625rem 1rem',
                                fontSize: '0.875rem',
                                color: '#1e293b',
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '0.375rem',
                                outline: 'none',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <Select
                        id="target-audience"
                        name="target"
                        label="Target Audience *"
                        options={targetOptions}
                        value={formData.targetOption}
                        onChange={(e) => setFormData({ ...formData, targetOption: e.target.value })}
                    />

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>
                            Notification Image (Optional)
                        </label>
                        <div style={{
                            border: '1px dashed #e2e8f0',
                            borderRadius: '0.375rem',
                            padding: '2rem',
                            textAlign: 'center',
                            background: '#f8fafc'
                        }}>
                            <input
                                type="file"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData({ ...formData, image: e.target.files[0] });
                                    }
                                }}
                                style={{ display: 'none' }}
                                id="notification-image-upload"
                            />
                            <label htmlFor="notification-image-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ fontSize: '2rem', color: '#94a3b8' }}>↑</div>
                                <span style={{ fontWeight: 500, color: '#475569' }}>
                                    {formData.image ? formData.image.name : 'Choose Image'}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PNG, JPG, GIF up to 5MB</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{ minWidth: '150px' }}
                        >
                            {loading ? 'Creating...' : 'Create Notification'}
                        </Button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
