'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Switch } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { servicesApi, vehiclesApi, tariffsApi } from '@/lib/api';

interface Service {
    id: string;
    serviceId: string;
    name: string;
    minKm: number;
    vendorCommission: number;
    driverCommission: number;
    isActive: boolean;
    city: string[];
    tax?: {
        GST: number;
        vendorGST: number;
    };
}

interface Vehicle {
    id: number;
    vehicleId: string;
    name: string;
    seats: number;
    bags: number;
    imageUrl?: string;
    isActive: boolean;
}

interface Tariff {
    id?: number;
    tariffId?: string;
    serviceId: string;
    vehicleId: string;
    price: number;
    driverBeta: number;
    description: string;
    status: boolean;
    adminId?: string;
}

export default function EditServicePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { id } = params;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data states
    const [service, setService] = useState<Service | null>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [tariffs, setTariffs] = useState<Tariff[]>([]);

    // UI states
    const [serviceForm, setServiceForm] = useState({
        minKm: 0,
        vendorCommission: 0,
        driverCommission: 0,
        isActive: true
    });

    // Map of vehicleId -> Tariff (local state for editing)
    const [tariffMap, setTariffMap] = useState<Record<string, Tariff>>({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        console.log('Starting fetchData for ID:', id);
        try {
            // 1. Fetch Service
            let serviceData;
            try {
                console.log('Fetching Service...');
                const serviceRes = await servicesApi.getById(id);
                console.log('Service Response:', serviceRes);
                serviceData = serviceRes.data?.data || serviceRes.data;
                if (!serviceData) throw new Error('Service data is null');
            } catch (err: any) {
                console.error('FAILED to fetch service:', err);
                const status = err.response?.status;
                const message = err.response?.data?.message || err.message;
                alert(`Failed to fetch Service. Status: ${status}, Message: ${message}`);
                setLoading(false);
                return;
            }

            if (serviceData.tax && typeof serviceData.tax === 'string') {
                try {
                    serviceData.tax = JSON.parse(serviceData.tax);
                } catch (e) {
                    console.error('Failed to parse tax:', e);
                }
            }

            if (serviceData) {
                setService(serviceData);
                setServiceForm({
                    minKm: serviceData.minKm || 0,
                    vendorCommission: serviceData.vendorCommission || 0,
                    driverCommission: serviceData.driverCommission || 0,
                    isActive: serviceData.isActive
                });
            }

            // 2. Fetch Vehicles (Admin Vehicles/Types)
            let activeVehicles: Vehicle[] = [];
            try {
                console.log('Fetching Vehicles...');
                const vehiclesRes = await vehiclesApi.getAll({ limit: 100 });
                console.log('Vehicles Response:', vehiclesRes);
                const vehiclesList: Vehicle[] = vehiclesRes.data?.data?.vehicles || vehiclesRes.data?.data || vehiclesRes.data || [];
                // Handle different response structures more robustly
                const list = Array.isArray(vehiclesList) ? vehiclesList : [];
                activeVehicles = list.filter(v => v.isActive);
                setVehicles(activeVehicles);
                if (activeVehicles.length > 0) {
                    // Pre-select logic removed
                }
            } catch (err) {
                console.error('FAILED to fetch vehicles:', err);
                // Continue, but maybe alert?
            }

            // 3. Fetch Tariffs
            let currentServiceTariffs: Tariff[] = [];
            try {
                console.log('Fetching Tariffs...');
                const tariffsRes = await tariffsApi.getAll({ limit: 1000 });
                console.log('Tariffs Response:', tariffsRes);
                const allTariffs: Tariff[] = tariffsRes.data?.data || tariffsRes.data || [];
                // Filter for current service
                const list = Array.isArray(allTariffs) ? allTariffs : [];
                currentServiceTariffs = list.filter(t => t.serviceId === serviceData.serviceId);
                setTariffs(currentServiceTariffs);
            } catch (err) {
                console.error('FAILED to fetch tariffs:', err);
            }

            // Build map
            const tMap: Record<string, Tariff> = {};
            activeVehicles.forEach(v => {
                const existing = currentServiceTariffs.find(t => t.vehicleId === v.vehicleId);
                tMap[v.vehicleId] = existing || {
                    serviceId: serviceData.serviceId,
                    vehicleId: v.vehicleId,
                    price: 0,
                    driverBeta: 0,
                    description: '',
                    status: false
                } as any;
            });
            setTariffMap(tMap);

        } catch (error) {
            console.error('Global error in fetchData:', error);
            alert('Unexpected error loading service details');
        } finally {
            setLoading(false);
        }
    };

    const handleServiceUpdate = async () => {
        setSaving(true);
        try {
            await servicesApi.update(id, serviceForm);
            // alert('Service updated successfully');
        } catch (error) {
            console.error('Failed to update service:', error);
            alert('Failed to update service');
        } finally {
            setSaving(false);
        }
    };

    const handleTariffUpdate = async (vehicleId: string) => {
        // Debounce or save on blur/change? 
        // For this UI, we might want a global "Save" or auto-save per field.
        // The image implies a form look. Let's assume we save when specific actions happen or provide a save button?
        // The prompt says "replicate UI", usually implies functionality too.
        // I'll implement a "Save Changes" button at the bottom or save individual sections.
        // But the image doesn't show a big save button. The "Edit" icon in header might toggle valid mode? 
        // Or maybe inputs auto-save? 
        // I will stick to the existing "Save" button pattern but styled better, or add a save button for the active tab.
    };

    // Save everything
    const handleSaveAll = async () => {
        setSaving(true);
        try {
            // 1. Update Service
            await servicesApi.update(id, serviceForm);

            // 2. Update/Create Tariffs
            // We only need to save the tariff for the currently active tab or all?
            // Safer to save all modified? Let's save all for now.
            const promises = Object.values(tariffMap).map(tariff => {
                if (tariff.tariffId) {
                    return tariffsApi.update(tariff.tariffId, tariff as any);
                } else if (tariff.status || tariff.price > 0) {
                    // Only create if it has meaningful data or is enabled
                    // But if it's disabled, maybe we don't create? 
                    // If user toggles ON, we create.
                    return tariffsApi.create(tariff as any);
                }
                return Promise.resolve();
            });

            await Promise.all(promises);
            alert('Changes saved successfully');
            fetchData(); // Refresh IDs
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Failed to save changes');
        } finally {
            setSaving(false);
        }
    }

    const updateTariffField = (vehicleId: string, field: keyof Tariff, value: any) => {
        setTariffMap(prev => ({
            ...prev,
            [vehicleId]: {
                ...prev[vehicleId],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <ClientLayout pageTitle="Loading...">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </ClientLayout>
        );
    }

    if (!service) return null;

    return (
        <ClientLayout pageTitle={`${service.name}`}>
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-slate-800">{service.name}</h1>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            className="flex items-center gap-2 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                            onClick={() => router.back()}
                        >
                            Back
                        </Button>
                        <Button
                            onClick={handleSaveAll}
                            disabled={saving}
                            className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>

                {/* Base Detail Section */}
                <Card className="p-8 border-0 shadow-sm bg-white rounded-xl">
                    <div className="mb-6 flex justify-between items-start">
                        <h2 className="text-xl font-bold text-slate-900">Base Detail</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">Service Off | On</span>
                            <Switch
                                checked={serviceForm.isActive}
                                onChange={(checked) => setServiceForm(prev => ({ ...prev, isActive: checked }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Tax Info (Read Only/Static for now) */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Tax</label>
                            <div className="p-3 bg-slate-50 rounded-lg text-slate-700 font-medium">
                                GST: {service.tax?.GST || 0}% &nbsp;&nbsp; Vendor GST: {service.tax?.vendorGST || 0}%
                            </div>
                        </div>

                        {/* Minimum Km */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Minimum Km</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={serviceForm.minKm}
                                    onChange={(e) => setServiceForm({ ...serviceForm, minKm: Number(e.target.value) })}
                                    className="pl-3 pr-12 py-6 text-lg font-medium"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Km</span>
                            </div>
                        </div>

                        {/* Driver Commission */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Driver Commission</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={serviceForm.driverCommission}
                                    onChange={(e) => setServiceForm({ ...serviceForm, driverCommission: Number(e.target.value) })}
                                    className="pl-3 pr-10 py-6 text-lg font-medium"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                            </div>
                        </div>

                        {/* Vendor Commission */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-500">Vendor Commission</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    value={serviceForm.vendorCommission}
                                    onChange={(e) => setServiceForm({ ...serviceForm, vendorCommission: Number(e.target.value) })}
                                    className="pl-3 pr-10 py-6 text-lg font-medium"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                            </div>
                        </div>
                    </div>
                </Card>

                <hr className="border-slate-200" />

                {/* Vehicle Configuration Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-slate-900">Vehicle Rates</h2>
                    </div>

                    <Card className="border-0 shadow-sm bg-white rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Vehicle</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-24">Status</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-48">Price / Km</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-48">Driver Beta</th>
                                        <th className="px-6 py-4 text-sm font-semibold text-slate-600">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {vehicles.map(vehicle => {
                                        const tariff = tariffMap[vehicle.vehicleId] || {
                                            serviceId: service.serviceId,
                                            vehicleId: vehicle.vehicleId,
                                            price: 0,
                                            driverBeta: 0,
                                            description: '',
                                            status: false
                                        };

                                        return (
                                            <tr key={vehicle.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-700">{vehicle.name}</span>
                                                    <div className="text-xs text-slate-400 mt-0.5">{vehicle.seats} seats</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Switch
                                                        checked={tariff.status}
                                                        onChange={(checked) => updateTariffField(vehicle.vehicleId, 'status', checked)}
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={tariff.price}
                                                            onChange={(e) => updateTariffField(vehicle.vehicleId, 'price', Number(e.target.value))}
                                                            className="pl-7 py-2 h-10 w-full"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                        <Input
                                                            type="number"
                                                            value={tariff.driverBeta}
                                                            onChange={(e) => updateTariffField(vehicle.vehicleId, 'driverBeta', Number(e.target.value))}
                                                            className="pl-7 py-2 h-10 w-full"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <textarea
                                                        className="w-full h-10 py-2 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none transition-all focus:h-20"
                                                        value={tariff.description || ''}
                                                        onChange={(e) => updateTariffField(vehicle.vehicleId, 'description', e.target.value)}
                                                        placeholder="Add notes..."
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </ClientLayout>
    );
}
