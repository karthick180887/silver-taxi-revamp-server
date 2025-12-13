'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { vendorsApi } from '@/lib/api';

interface Vendor {
    id: string;
    name: string;
    phone: string;
    email: string;
    companyName: string;
    status: string;
    walletBalance: number;
    createdAt: string;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchVendors();
    }, [page, search]);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await vendorsApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const vendorsArray = Array.isArray(data) ? data : (data.vendors || data.rows || []);
            setVendors(Array.isArray(vendorsArray) ? vendorsArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'companyName', header: 'Company', render: (v: Vendor) => v.companyName || '-' },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email', render: (v: Vendor) => v.email || '-' },
        { key: 'status', header: 'Status', render: (v: Vendor) => <StatusBadge status={v.status || 'inactive'} /> },
        { key: 'walletBalance', header: 'Wallet', render: (v: Vendor) => `₹${v.walletBalance || 0}` },
        {
            key: 'actions',
            header: 'Actions',
            render: (v: Vendor) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/vendors/${v.id}`; }}>
                    View
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Vendors">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Vendors</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage vendor partners</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/vendors/create'; }}>
                    + Add Vendor
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    placeholder="Search by name or company..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            <DataTable
                data={vendors}
                columns={columns}
                keyExtractor={(v) => v.id}
                loading={loading}
                emptyMessage="No vendors found"
                onRowClick={(v) => { if (typeof window !== 'undefined') window.location.href = `/vendors/${v.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
