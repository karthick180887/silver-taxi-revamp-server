'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button, Input, Card } from '@/components/ui';
import { vehiclesApi } from '@/lib/api';

interface VehicleFormData {
    name: string;
    type: string;
    vehicleNumber: string;
    fuelType: string;
    seats: number;
    bags: number;
    order: number;
    permitCharge: number;
    image: File | null;
    currentImageUrl: string | null;
    isActive: boolean;
}

export default function EditVehiclePage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<VehicleFormData>({
        name: '',
        type: '',
        vehicleNumber: '',
        fuelType: 'Petrol',
        seats: 4,
        bags: 2,
        order: 0,
        permitCharge: 0,
        image: null,
        currentImageUrl: null,
        isActive: true
    });

    useEffect(() => {
        if (id) {
            fetchVehicleData();
        }
    }, [id]);

    const fetchVehicleData = async () => {
        try {
            const res = await vehiclesApi.getById(id);
            const vehicle = res.data?.data || res.data;
            if (vehicle) {
                setFormData({
                    name: vehicle.name || '',
                    type: vehicle.type || '',
                    vehicleNumber: vehicle.vehicleNumber || '',
                    fuelType: vehicle.fuelType || 'Petrol',
                    seats: vehicle.seats || 0,
                    bags: vehicle.bags || 0,
                    order: vehicle.order || 0,
                    permitCharge: vehicle.permitCharge || 0,
                    image: null,
                    currentImageUrl: vehicle.imageUrl,
                    isActive: vehicle.isActive
                });
                if (vehicle.imageUrl) {
                    setImagePreview(vehicle.imageUrl);
                }
            }
        } catch (error) {
            console.error('Failed to fetch vehicle:', error);
            alert('Failed to load vehicle data.');
            router.push('/vehicles');
        } finally {
            setFetching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: checked
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFormData(prev => ({ ...prev, image: file }));
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('type', formData.type);
            data.append('vehicleNumber', formData.vehicleNumber);
            data.append('fuelType', formData.fuelType);
            data.append('seats', formData.seats.toString());
            data.append('bags', formData.bags.toString());
            data.append('order', formData.order.toString());
            data.append('permitCharge', formData.permitCharge.toString());
            data.append('isActive', formData.isActive.toString());

            if (formData.image) {
                data.append('imageUrl', formData.image);
            }

            // Using the vehicleId (which is the UUID from DB) for update
            await vehiclesApi.update(id, data);
            router.push('/vehicles');
        } catch (error) {
            console.error('Failed to update vehicle:', error);
            alert('Failed to update vehicle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <ClientLayout pageTitle="Edit Vehicle">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            </ClientLayout>
        );
    }

    return (
        <ClientLayout pageTitle="Edit Vehicle">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Edit Vehicle</h1>
                        <p className="text-slate-500">Update vehicle information</p>
                    </div>
                    <Button variant="outline" onClick={() => router.back()}>
                        Cancel
                    </Button>
                </div>

                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Image Upload */}
                        <div className="flex justify-center mb-8">
                            <div className="relative group cursor-pointer w-64 h-40 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden hover:border-indigo-500 transition-colors">
                                <input
                                    type="file"
                                    name="image"
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                        <span className="text-4xl mb-2">📷</span>
                                        <span className="text-sm">Upload Vehicle Image</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Name / Model *</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Swift Dzire, Toyota Innova"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type *</label>
                                <Input
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Sedan, SUV, Mini"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
                                <select
                                    name="fuelType"
                                    value={formData.fuelType}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                                >
                                    <option value="Petrol">Petrol</option>
                                    <option value="Diesel">Diesel</option>
                                    <option value="Electric">Electric</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Seats Capacity</label>
                                <Input
                                    type="number"
                                    name="seats"
                                    value={formData.seats}
                                    onChange={handleInputChange}
                                    min={1}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Luggage Capacity</label>
                                <Input
                                    type="number"
                                    name="bags"
                                    value={formData.bags}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Permit Charge</label>
                                <Input
                                    type="number"
                                    name="permitCharge"
                                    value={formData.permitCharge}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Display Order</label>
                                <Input
                                    type="number"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                    min={0}
                                />
                            </div>

                            <div className="flex items-center pt-6">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleCheckboxChange}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Vehicle Active Status</span>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <Button type="submit" isLoading={loading} className="w-32">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </ClientLayout>
    );
}
