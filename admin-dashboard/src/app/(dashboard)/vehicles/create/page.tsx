'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
}

export default function CreateVehiclePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        image: null
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            if (formData.image) {
                data.append('imageUrl', formData.image);
            }

            await vehiclesApi.create(data);
            router.push('/vehicles');
        } catch (error) {
            console.error('Failed to create vehicle:', error);
            alert('Failed to create vehicle. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ClientLayout pageTitle="Add Vehicle">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Add New Vehicle</h1>
                        <p className="text-slate-500">Create a new vehicle configuration</p>
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
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-100">
                            <Button type="submit" isLoading={loading} className="w-32">
                                Create Vehicle
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </ClientLayout>
    );
}
