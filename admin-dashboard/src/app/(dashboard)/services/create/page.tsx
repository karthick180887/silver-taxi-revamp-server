'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { servicesApi } from '@/lib/api';

const SERVICE_TYPES = [
    "One way",
    "Round trip",
    "Airport Pickup",
    "Airport Drop",
    "Day Packages",
    "Hourly Packages"
];

export default function CreateServicePage() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        name: SERVICE_TYPES[0],
        minKm: 0,
        vendorCommission: 0,
        driverCommission: 0,
        isActive: true
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await servicesApi.create(formData);
            alert('Service created successfully');
            router.push('/services');
        } catch (error) {
            console.error('Failed to create service:', error);
            alert('Failed to create service');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ClientLayout pageTitle="Create New Service">
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                        ← Back to Services
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-800">Create New Service</h1>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Service Name</label>
                            <select
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {SERVICE_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Min KM */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Minimum KM</label>
                                <Input
                                    type="number"
                                    value={formData.minKm}
                                    onChange={(e) => setFormData({ ...formData, minKm: Number(e.target.value) })}
                                    min={0}
                                />
                            </div>

                            {/* Status */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Status</label>
                                <div className="flex items-center space-x-4 mt-2">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.isActive}
                                            onChange={() => setFormData({ ...formData, isActive: true })}
                                            className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span>Active</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.isActive}
                                            onChange={() => setFormData({ ...formData, isActive: false })}
                                            className="text-red-600 focus:ring-red-500"
                                        />
                                        <span>Inactive</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Vendor Commission */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Vendor Commission (%)</label>
                                <Input
                                    type="number"
                                    value={formData.vendorCommission}
                                    onChange={(e) => setFormData({ ...formData, vendorCommission: Number(e.target.value) })}
                                    min={0}
                                    max={100}
                                />
                            </div>

                            {/* Driver Commission */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Driver Commission (%)</label>
                                <Input
                                    type="number"
                                    value={formData.driverCommission}
                                    onChange={(e) => setFormData({ ...formData, driverCommission: Number(e.target.value) })}
                                    min={0}
                                    max={100}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {saving ? 'Creating...' : 'Create Service'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </ClientLayout>
    );
}
