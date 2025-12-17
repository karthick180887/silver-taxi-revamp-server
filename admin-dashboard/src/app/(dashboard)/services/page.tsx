'use client';

import React, { useEffect, useState } from 'react';
import { Button, Input, Card, Switch } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { servicesApi, vehiclesApi, tariffsApi } from '@/lib/api';

interface Service {
    id?: string;
    serviceId: string;
    name: string;
    minKm: number;
    vendorCommission: number;
    driverCommission: number;
    isActive: boolean;
    createdAt: string;
    tax?: any;
}

interface Vehicle {
    id: number;
    vehicleId: string;
    name: string;
    seats: number;
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

export default function ServicesPage() {
    const [loading, setLoading] = useState(true);

    // Data
    const [services, setServices] = useState<Service[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    // Local State for Edits: Keyed by `${serviceId}-${vehicleId}`
    const [tariffMap, setTariffMap] = useState<Record<string, Tariff>>({});

    // Saving state per service
    const [savingMap, setSavingMap] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Services
            const sRes = await servicesApi.getAll({ limit: 100 });
            const sData = sRes.data?.data?.services || sRes.data?.data || sRes.data || [];
            const sList = Array.isArray(sData) ? sData : [];
            setServices(sList);

            // 2. Vehicles
            const vRes = await vehiclesApi.getAll({ limit: 100 });
            const vData = vRes.data?.data?.vehicles || vRes.data?.data || vRes.data || [];
            const vList = Array.isArray(vData) ? vData : [];
            const activeVehicles = vList.filter((v: Vehicle) => v.isActive);
            setVehicles(activeVehicles);

            // 3. Tariffs
            const tRes = await tariffsApi.getAll({ limit: 1000 });
            const tData = tRes.data?.data || tRes.data || [];
            const tList = Array.isArray(tData) ? tData : [];

            // Build Map
            const initialMap: Record<string, Tariff> = {};

            sList.forEach((s: Service) => {
                activeVehicles.forEach((v: Vehicle) => {
                    const existing = tList.find((t: Tariff) => t.serviceId === s.serviceId && t.vehicleId === v.vehicleId);
                    const key = `${s.serviceId}-${v.vehicleId}`;
                    initialMap[key] = existing ? { ...existing } : {
                        serviceId: s.serviceId,
                        vehicleId: v.vehicleId,
                        price: 0,
                        driverBeta: 0,
                        description: '',
                        status: false
                    };
                });
            });
            setTariffMap(initialMap);

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTariffField = (serviceId: string, vehicleId: string, field: keyof Tariff, value: any) => {
        const key = `${serviceId}-${vehicleId}`;
        setTariffMap(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                [field]: value
            }
        }));
    };

    const updateServiceField = (serviceId: string, field: keyof Service, value: any) => {
        setServices(prev => prev.map(s =>
            s.serviceId === serviceId ? { ...s, [field]: value } : s
        ));
    };

    const handleSaveService = async (service: Service) => {
        setSavingMap(prev => ({ ...prev, [service.serviceId]: true }));
        try {
            // 1. Update Service Details
            await servicesApi.update(service.serviceId, {
                minKm: Number(service.minKm),
                vendorCommission: Number(service.vendorCommission),
                driverCommission: Number(service.driverCommission)
            });

            // 2. Save all tariffs for this service
            const promises = vehicles.map(v => {
                const key = `${service.serviceId}-${v.vehicleId}`;
                const tariff = tariffMap[key];

                if (tariff.tariffId) {
                    return tariffsApi.update(tariff.tariffId, tariff as any);
                } else if (tariff.status || tariff.price > 0) {
                    return tariffsApi.create(tariff as any);
                }
                return Promise.resolve();
            });

            await Promise.all(promises);

            alert(`Service & Rates updated for ${service.name}`);
            fetchAllData();

        } catch (error) {
            console.error(error);
            alert(`Failed to save ${service.name}`);
        } finally {
            setSavingMap(prev => ({ ...prev, [service.serviceId]: false }));
        }
    };

    if (loading) {
        return <ClientLayout pageTitle="Loading Services..."><div className="p-10 text-center">Loading...</div></ClientLayout>;
    }

    return (
        <ClientLayout pageTitle="Services & Rates">
            <div className="space-y-6 max-w-7xl mx-auto pb-20">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Services Configuration</h1>
                        <p className="text-slate-500">Manage all service rates across vehicle types</p>
                    </div>
                    <Button onClick={() => window.location.href = '/services/create'}>
                        + Add Service
                    </Button>
                </div>

                {services.map(service => (
                    <Card key={service.serviceId} className="overflow-hidden border border-slate-200 shadow-sm bg-white">
                        {/* Service Header */}
                        <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-wrap gap-6 justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">{service.name}</h2>
                                <div className="flex gap-4 mt-2 text-sm text-slate-500">
                                    <span className="bg-slate-100 px-2 py-1 rounded">Min: {service.minKm} km</span>
                                    <span>Vendor Comm: {service.vendorCommission}%</span>
                                    <span>Driver Comm: {service.driverCommission}%</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {service.isActive ? 'Active' : 'Inactive'}
                                </div>
                                <Button
                                    onClick={() => handleSaveService(service)}
                                    disabled={savingMap[service.serviceId]}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200"
                                >
                                    {savingMap[service.serviceId] ? 'Saving...' : 'Save Rates'}
                                </Button>
                            </div>
                        </div>

                        {/* Rates Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-slate-100 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 w-48">Vehicle Type</th>
                                        <th className="px-6 py-4 w-24">Active</th>
                                        <th className="px-6 py-4 w-40">Price / Km</th>
                                        <th className="px-6 py-4 w-40">Driver Beta</th>
                                        <th className="px-6 py-4">Description / Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {vehicles.map(vehicle => {
                                        const key = `${service.serviceId}-${vehicle.vehicleId}`;
                                        const tariff = tariffMap[key];
                                        if (!tariff) return null; // Should not happen

                                        return (
                                            <tr key={key} className="hover:bg-slate-50/30 transition-colors">
                                                <td className="px-6 py-3 font-medium text-slate-700">
                                                    {vehicle.name}
                                                    <div className="text-[10px] text-slate-400 font-normal">{vehicle.seats} seats</div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Switch
                                                        checked={tariff.status}
                                                        onChange={(c) => updateTariffField(service.serviceId, vehicle.vehicleId, 'status', c)}
                                                    />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                        <Input
                                                            type="number"
                                                            className="pl-6 h-8 text-sm"
                                                            value={tariff.price}
                                                            onChange={(e) => updateTariffField(service.serviceId, vehicle.vehicleId, 'price', Number(e.target.value))}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="relative">
                                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                                                        <Input
                                                            type="number"
                                                            className="pl-6 h-8 text-sm"
                                                            value={tariff.driverBeta}
                                                            onChange={(e) => updateTariffField(service.serviceId, vehicle.vehicleId, 'driverBeta', Number(e.target.value))}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <Input
                                                        className="h-8 text-sm placeholder:text-slate-300"
                                                        placeholder="Add extra charges info..."
                                                        value={tariff.description || ''}
                                                        onChange={(e) => updateTariffField(service.serviceId, vehicle.vehicleId, 'description', e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        </ClientLayout>
    );
}
