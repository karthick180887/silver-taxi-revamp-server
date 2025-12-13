'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { driversApi } from '@/lib/api';

interface Driver {
    id: string;
    name: string;
    phone: string;
    email: string;
    vehicle?: any[];
    vehicleNumber?: string;
    status: string;
    verificationStatus: string;
    rating: number;
    totalTrips: number;
    walletBalance: number;
    createdAt: string;
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const pageSize = 20;

    useEffect(() => {
        fetchDrivers();
    }, [page, search]);

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const res = await driversApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const driversArray = Array.isArray(data) ? data : (data.drivers || data.rows || []);
            setDrivers(Array.isArray(driversArray) ? driversArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch drivers:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'phone', header: 'Phone' },
        {
            key: 'vehicleNumber',
            header: 'Vehicle',
            render: (d: Driver) => d.vehicle?.[0]?.vehicleNumber || d.vehicleNumber || '-'
        },
        { key: 'status', header: 'Status', render: (d: Driver) => <StatusBadge status={d.status || 'inactive'} /> },
        { key: 'verificationStatus', header: 'Verified', render: (d: Driver) => <StatusBadge status={d.verificationStatus || 'pending'} /> },
        { key: 'totalTrips', header: 'Trips', render: (d: Driver) => d.totalTrips || 0 },
        { key: 'walletBalance', header: 'Wallet', render: (d: Driver) => `₹${d.walletBalance || 0}` },
        {
            key: 'actions',
            header: 'Actions',
            render: (d: Driver) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/drivers/${d.id}`; }}>
                    View
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Drivers">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Drivers</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage all registered drivers</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/drivers/create'; }}>
                    + Add Driver
                </Button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <Input
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
                {selectedIds.length > 0 && (
                    <Button variant="danger" size="sm">
                        Delete Selected ({selectedIds.length})
                    </Button>
                )}
            </div>

            <DataTable
                data={drivers}
                columns={columns}
                keyExtractor={(d) => d.id}
                loading={loading}
                emptyMessage="No drivers found"
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(d) => { if (typeof window !== 'undefined') window.location.href = `/drivers/${d.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
