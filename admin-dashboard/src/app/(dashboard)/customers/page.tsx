'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { customersApi } from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    phone: string;
    email: string;
    totalBookings: number;
    createdAt: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({
        totalCustomers: 0,
        newCustomersToday: 0,
        activeCustomers: 0
    });
    const pageSize = 20;

    useEffect(() => {
        fetchCustomers();
    }, [page, search]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await customersApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const customersArray = Array.isArray(data.customers) ? data.customers : (Array.isArray(data) ? data : []);

            setCustomers(customersArray);
            setTotal(data.count || data.total || data.pagination?.totalCount || customersArray.length || 0);

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'name', header: 'Name', sortable: true, render: (c: Customer) => <span className="font-medium text-slate-800">{c.name}</span> },
        { key: 'phone', header: 'Phone' },
        { key: 'email', header: 'Email', render: (c: Customer) => c.email || '-' },
        { key: 'totalBookings', header: 'Bookings', render: (c: Customer) => <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{c.totalBookings || 0}</span> },
        { key: 'createdAt', header: 'Joined', render: (c: Customer) => new Date(c.createdAt).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            render: (c: Customer) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/customers/${c.id}`; }}>
                        View
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Customers">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#f5f3ff] p-6 rounded-xl border-l-4 border-violet-500 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">Total Customers</h3>
                    <div className="text-3xl font-bold text-black">{stats.totalCustomers.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-violet-500 opacity-50">
                        <span className="text-2xl">👥</span>
                    </div>
                </div>

                <div className="bg-[#eff6ff] p-6 rounded-xl border-b-4 border-blue-500 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">New Today</h3>
                    <div className="text-3xl font-bold text-black">{stats.newCustomersToday.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-blue-500 opacity-50">
                        <span className="text-2xl">✨</span>
                    </div>
                </div>

                <div className="bg-[#fff1f2] p-6 rounded-xl border-r-4 border-rose-500 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">Active Customers</h3>
                    <div className="text-3xl font-bold text-black">{stats.activeCustomers.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-rose-500 opacity-50">
                        <span className="text-2xl">🔥</span>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h1 className="text-lg font-semibold text-slate-800">Customers List</h1>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs"
                        />
                    </div>
                </div>

                <DataTable
                    data={customers}
                    columns={columns}
                    keyExtractor={(c) => c.id}
                    loading={loading}
                    emptyMessage="No customers found"
                    onRowClick={(c) => { if (typeof window !== 'undefined') window.location.href = `/customers/${c.id}`; }}
                    pagination={{ page, pageSize, total, onPageChange: setPage }}
                />
            </div>
        </ClientLayout>
    );
}
