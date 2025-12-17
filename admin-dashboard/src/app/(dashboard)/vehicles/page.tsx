'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, StatusBadge } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { vehiclesApi } from '@/lib/api';

interface Vehicle {
    id: number;
    vehicleId: string;
    vehicleNumber: string;
    type: string;
    model: string;
    name: string;
    fuelType: string;
    seats: number;
    bags: number;
    imageUrl: string;
    isActive: boolean;
    order: number;
    permitCharge: number;
}

export default function VehiclesPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
        maintenance: 0
    });

    useEffect(() => {
        fetchVehicles();
    }, [search]);

    useEffect(() => {
        // Recalculate stats when vehicles change
        const total = vehicles.length;
        const active = vehicles.filter(v => v.isActive).length;
        const inactive = total - active;
        const maintenance = 0; // Placeholder if backend doesn't support maintenance state yet

        setStats({ total, active, inactive, maintenance });
    }, [vehicles]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            // Explicitly filter for unassigned vehicles (driverId is NULL)
            const res = await vehiclesApi.getAll({ search, unassigned: true });
            const data = res.data?.data || res.data || [];
            // Handle both array directly or nested data properties
            const vehiclesArray = Array.isArray(data) ? data : (data.vehicles || data.rows || []);
            setVehicles(Array.isArray(vehiclesArray) ? vehiclesArray : []);
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (vehicle: Vehicle) => {
        try {
            // Optimistic update
            const updatedVehicles = vehicles.map(v =>
                v.vehicleId === vehicle.vehicleId ? { ...v, isActive: !v.isActive } : v
            );
            setVehicles(updatedVehicles);

            const formData = new FormData();
            formData.append('isActive', (!vehicle.isActive).toString());
            await vehiclesApi.update(vehicle.vehicleId, formData);
        } catch (error) {
            console.error('Failed to update status:', error);
            fetchVehicles(); // Revert on error
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await vehiclesApi.delete(id);
                fetchVehicles();
            } catch (error) {
                console.error('Failed to delete vehicle:', error);
            }
        }
    };

    const StatCard = ({ title, count, colorClass, iconPath }: any) => (
        <div className={`${colorClass} p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32`}>
            <div>
                <p className="text-slate-600 font-medium mb-1">{title}</p>
                <h2 className="text-3xl font-bold text-slate-900">{count.toLocaleString()}</h2>
            </div>
            <div className="absolute top-6 right-6">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                </svg>
            </div>
        </div>
    );

    return (
        <ClientLayout pageTitle="Vehicle Management">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Vehicle Management</h1>
                    <p className="text-slate-500 text-sm">Manage your fleet and vehicle configurations</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={() => router.push('/vehicles/create')} className="bg-teal-600 hover:bg-teal-700 text-white shadow-md">
                        + Create Vehicle
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Vehicles"
                    count={stats.total}
                    colorClass="bg-[#e0f2fe]"
                    iconPath="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
                />
                <StatCard
                    title="Active Vehicles"
                    count={stats.active}
                    colorClass="bg-[#dcfce7]"
                    iconPath="M13 10V3L4 14h7v7l9-11h-7z"
                />
                <StatCard
                    title="Inactive Vehicles"
                    count={stats.inactive}
                    colorClass="bg-[#fee2e2]"
                    iconPath="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <StatCard
                    title="In Maintenance"
                    count={stats.maintenance}
                    colorClass="bg-[#ffedd5]"
                    iconPath="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                    {vehicles.map((vehicle) => (
                        <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">

                            {/* Header / Title */}
                            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-50">
                                <h3 className="font-semibold text-slate-800 text-sm">
                                    {vehicle.type || vehicle.name} ({vehicle.seats - 1}+1)
                                </h3>
                                <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input
                                        type="checkbox"
                                        name={`toggle-${vehicle.id}`}
                                        id={`toggle-${vehicle.id}`}
                                        checked={vehicle.isActive}
                                        onChange={() => handleToggleStatus(vehicle)}
                                        className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5"
                                        style={{ top: '2px', transition: 'all 0.3s' }}
                                    />
                                    <label
                                        htmlFor={`toggle-${vehicle.id}`}
                                        className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${vehicle.isActive ? 'bg-teal-500' : 'bg-slate-300'}`}
                                    ></label>
                                </div>
                            </div>

                            {/* Image Section */}
                            <div className="p-4 flex justify-center bg-slate-50/50 min-h-[160px] items-center">
                                {vehicle.imageUrl ? (
                                    <img
                                        src={vehicle.imageUrl}
                                        alt={vehicle.name}
                                        className="max-h-32 object-contain"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="text-slate-300 text-4xl">🚗</div>
                                )}
                            </div>

                            {/* Details Grid */}
                            <div className="px-4 py-3 space-y-2 text-xs text-slate-600">
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-slate-400 font-medium">Fuel Type:</span>
                                    <span className="font-medium text-slate-700">{vehicle.fuelType || 'Petrol'}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-slate-400 font-medium">Type:</span>
                                    <span className="font-medium text-slate-700">{vehicle.type} ({vehicle.seats - 1}+1)</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-slate-400 font-medium">Seats:</span>
                                    <span className="font-medium text-slate-700">{vehicle.seats}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-slate-400 font-medium">Luggage:</span>
                                    <span className="font-medium text-slate-700">{vehicle.bags}</span>
                                </div>
                                <div className="grid grid-cols-[80px_1fr] gap-2">
                                    <span className="text-slate-400 font-medium">Order:</span>
                                    <span className="font-medium text-slate-700">{vehicle.order}</span>
                                </div>
                            </div>

                            {/* Actions Footer */}
                            <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-between gap-3">
                                <button
                                    onClick={() => router.push(`/vehicles/${vehicle.vehicleId}`)}
                                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-1.5 rounded text-xs font-medium transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(vehicle.vehicleId)}
                                    className="w-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                                >
                                    <span className="text-xs">🗑️</span>
                                </button>
                            </div>
                        </div>
                    ))}

                    {vehicles.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No vehicles found. Click "Create Vehicle" to add one.
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .toggle-checkbox:checked {
                    right: 0;
                    border-color: #14b8a6;
                }
                .toggle-checkbox {
                    right: 0;
                    margin-right: 2px;
                }
            `}</style>
        </ClientLayout>
    );
}
