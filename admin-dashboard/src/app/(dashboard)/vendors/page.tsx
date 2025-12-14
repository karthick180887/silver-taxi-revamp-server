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

    // Stats
    const [stats, setStats] = useState({
        totalVendors: 0,
        totalWallet: 0
    });

    useEffect(() => {
        fetchVendors();
    }, [page, search]);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const res = await vendorsApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const vendorsArray = Array.isArray(data) ? data : (data.vendors || data.rows || []);
            const validVendors = Array.isArray(vendorsArray) ? vendorsArray : [];

            setVendors(validVendors);

            const totalCount = data.count || data.total || 0;
            setTotal(totalCount);

            // Calculate stats (using current page data for wallet sum as approximation)
            const currentWalletSum = validVendors.reduce((acc: number, curr: Vendor) => acc + (Number(curr.walletBalance) || 0), 0);

            setStats({
                totalVendors: totalCount,
                totalWallet: currentWalletSum
            });

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
        {
            key: 'createdAt',
            header: 'Joined Date',
            sortable: true,
            render: (v: Vendor) => v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-GB') : '-'
        },
        { key: 'status', header: 'Status', render: (v: Vendor) => <StatusBadge status={v.status || 'inactive'} /> },
        { key: 'walletBalance', header: 'Wallet', render: (v: Vendor) => `₹${(v.walletBalance || 0).toLocaleString('en-IN')}` },
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl">
                <div className="bg-[#D1FAE5] p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Total Vendors</p>
                        <h2 className="text-3xl font-bold text-slate-900">{stats.totalVendors.toLocaleString()}</h2>
                    </div>
                    <div className="absolute top-6 right-6">
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>

                <div className="bg-[#DBEafe] p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Total Wallet Balance</p>
                        <h2 className="text-3xl font-bold text-slate-900">₹{stats.totalWallet.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="absolute top-6 right-6">
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
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
