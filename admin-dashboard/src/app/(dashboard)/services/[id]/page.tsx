'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { servicesApi } from '@/lib/api';

interface Service {
    id: string;
    serviceId: string;
    name: string;
    minKm: number;
    vendorCommission: number;
    driverCommission: number;
    isActive: boolean;
    city: string[];
}

export default function EditServicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [service, setService] = useState<Service | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        minKm: 0,
        vendorCommission: 0,
        driverCommission: 0,
        isActive: true
    });

    useEffect(() => {
        fetchService();
    }, [id]);

    const fetchService = async () => {
        setLoading(true);
        try {
            const res = await servicesApi.getById(id);
            const data = res.data?.data || res.data;
            if (data) {
                setService(data);
                setFormData({
                    minKm: data.minKm || 0,
                    vendorCommission: data.vendorCommission || 0,
                    driverCommission: data.driverCommission || 0,
                    isActive: data.isActive
                });
            }
        } catch (error) {
            console.error('Failed to fetch service:', error);
            alert('Failed to load service details');
            router.push('/services');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await servicesApi.update(id, formData);
            alert('Service updated successfully');
            router.push('/services');
        } catch (error) {
            console.error('Failed to update service:', error);
            alert('Failed to update service');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout pageTitle="Edit Service">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </ClientLayout>
        );
    }

    if (!service) return null;

    return (
        <ClientLayout pageTitle={`Edit Service: ${service.name}`}>
            <div className="max-w-2xl mx-auto">
                <div className="mb-6">
                    <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                        ← Back to Services
                    </Button>
                    <h1 className="text-2xl font-bold text-slate-800">Edit {service.name}</h1>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">

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
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </ClientLayout>
    );
}
