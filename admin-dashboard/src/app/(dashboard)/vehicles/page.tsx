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
    const [showUnassigned, setShowUnassigned] = useState(true);

    useEffect(() => {
        fetchVehicles();
    }, [search, showUnassigned]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await vehiclesApi.getAll({ search, unassigned: showUnassigned });
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

    return (
        <ClientLayout pageTitle="Vehicle Management">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Vehicle Management</h1>
                    <p className="text-slate-500">Manage your fleet and vehicle configurations</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={showUnassigned}
                            onChange={(e) => setShowUnassigned(e.target.checked)}
                            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-slate-700">Show Unassigned Only</span>
                    </label>
                    <Button onClick={() => router.push('/vehicles/create')} className="bg-teal-500 hover:bg-teal-600 border-none">
                        Create Vehicle
                    </Button>
                </div>
            </div>

            {/* <div className="mb-6">
                <Input
                    placeholder="Search vehicles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-md"
                />
            </div> */}

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
