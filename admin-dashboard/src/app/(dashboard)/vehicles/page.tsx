'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { vehiclesApi } from '@/lib/api';

interface Vehicle {
    id: string;
    vehicleNumber: string;
    vehicleType: string;
    model: string;
    brand: string;
    color: string;
    seatingCapacity: number;
    fuelType: string;
    driverName: string;
    status: string;
    createdAt: string;
}

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchVehicles();
    }, [page, search]);

    const fetchVehicles = async () => {
        setLoading(true);
        try {
            const res = await vehiclesApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const vehiclesArray = Array.isArray(data) ? data : (data.vehicles || data.rows || []);
            setVehicles(Array.isArray(vehiclesArray) ? vehiclesArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch vehicles:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'vehicleNumber', header: 'Vehicle No.', sortable: true },
        { key: 'vehicleType', header: 'Type', render: (v: Vehicle) => v.vehicleType || '-' },
        { key: 'brand', header: 'Brand', render: (v: Vehicle) => v.brand || '-' },
        { key: 'model', header: 'Model', render: (v: Vehicle) => v.model || '-' },
        { key: 'color', header: 'Color', render: (v: Vehicle) => v.color || '-' },
        { key: 'seatingCapacity', header: 'Seats', render: (v: Vehicle) => v.seatingCapacity || '-' },
        { key: 'driverName', header: 'Driver', render: (v: Vehicle) => v.driverName || 'Unassigned' },
        { key: 'status', header: 'Status', render: (v: Vehicle) => <StatusBadge status={v.status || 'active'} /> },
        {
            key: 'actions',
            header: 'Actions',
            render: (v: Vehicle) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/vehicles/${v.id}`; }}>
                    Edit
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Vehicles">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Vehicles</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage all registered vehicles</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/vehicles/create'; }}>
                    + Add Vehicle
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    placeholder="Search by vehicle number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            <DataTable
                data={vehicles}
                columns={columns}
                keyExtractor={(v) => v.id}
                loading={loading}
                emptyMessage="No vehicles found"
                onRowClick={(v) => { if (typeof window !== 'undefined') window.location.href = `/vehicles/${v.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
