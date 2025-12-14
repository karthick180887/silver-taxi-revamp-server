'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { driversApi } from '@/lib/api';

interface Driver {
    id: string;
    driverId?: string; // Added driverId
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
    isOnline?: boolean; // Added isOnline
    inActiveReason?: string; // Added inActiveReason
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
        {
            key: 'sno',
            header: 'S.No',
            render: (_: Driver, index: number) => (page - 1) * pageSize + index + 1
        },
        {
            key: 'driverId',
            header: 'Driver ID',
            render: (d: Driver) => (
                <a
                    href={`/drivers/${d.driverId}`}
                    onClick={(e) => { e.stopPropagation(); }}
                    className="text-blue-600 hover:underline"
                >
                    {d.driverId || '-'}
                </a>
            )
        },
        { key: 'name', header: 'Driver Name', sortable: true },
        {
            key: 'createdAt',
            header: 'Joined Date',
            sortable: true,
            render: (d: Driver) => d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : '-'
        },
        {
            key: 'isOnline',
            header: 'Online Status',
            render: (d: Driver) => (
                <div className="flex justify-center">
                    <div
                        className={`w-3 h-3 rounded-full ${d.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`}
                        title={d.isOnline ? 'Online' : 'Offline'}
                    />
                </div>
            )
        },
        { key: 'phone', header: 'Phone Number' },
        { key: 'walletBalance', header: 'Wallet Balance', render: (d: Driver) => `₹${(d.walletBalance || 0).toLocaleString('en-IN')}` },
        { key: 'status', header: 'Status', render: (d: Driver) => <StatusBadge status={d.status || 'inactive'} /> },
        { key: 'inActiveReason', header: 'Reason', render: (d: Driver) => d.inActiveReason || '-' },
        {
            key: 'actions',
            header: 'Actions',
            render: (d: Driver) => (
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 p-1 h-auto"
                        onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/drivers/${d.driverId}`; }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                        onClick={(e) => {
                            e.stopPropagation();
                            // Handle delete 
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                    </Button>
                </div>
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
                keyExtractor={(d) => d.driverId || ''}
                loading={loading}
                emptyMessage="No drivers found"
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onRowClick={(d) => { if (typeof window !== 'undefined') window.location.href = `/drivers/${d.driverId}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
