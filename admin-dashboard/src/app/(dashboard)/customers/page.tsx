'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, Input, Card } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { customersApi } from '@/lib/api';

interface Customer {
    id: string;
    customerId: string; // Display ID e.g., SLTC...
    name: string;
    phone: string;
    email: string;
    bookingCount: number;
    totalAmount: number;
    createdAt: string;
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);

    // Stats
    const [stats, setStats] = useState({
        totalTrips: 0,
        totalAmount: 0
    });

    const pageSize = 10;

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

            // Calculate stats from available data
            // Note: Ideally these should come from a centralized stats API
            const totalTrips = customersArray.reduce((acc: number, curr: Customer) => acc + (curr.bookingCount || 0), 0);
            const totalRevenue = customersArray.reduce((acc: number, curr: Customer) => acc + (curr.totalAmount || 0), 0);

            setStats({
                totalTrips: totalTrips,
                totalAmount: totalRevenue
            });

        } catch (error) {
            console.error('Failed to fetch customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'customerId',
            header: 'Customer ID',
            sortable: true,
            render: (c: Customer) => (
                <span
                    className="text-indigo-500 cursor-pointer hover:underline"
                    onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/customers/${c.id}`; }}
                >
                    {c.customerId || c.id}
                </span>
            )
        },
        { key: 'name', header: 'Name', sortable: true, render: (c: Customer) => <span className="text-slate-700">{c.name}</span> },
        { key: 'phone', header: 'Phone' },
        {
            key: 'createdAt',
            header: 'Joined Date',
            sortable: true,
            render: (c: Customer) => c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-GB') : '-'
        },
        { key: 'bookingCount', header: 'Booking Count', render: (c: Customer) => c.bookingCount || 0 },
        { key: 'totalAmount', header: 'Total Amount', render: (c: Customer) => `₹${(c.totalAmount || 0).toLocaleString('en-IN')}` },
        {
            key: 'actions',
            header: 'Actions',
            render: (c: Customer) => (
                <div className="flex gap-2">
                    <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/customers/${c.id}`; }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button className="text-red-500 hover:text-red-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Customers">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
                <Button className="bg-[#00B074] hover:bg-[#009e68] text-white rounded-full px-6">
                    + Create Customer
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
                <div className="bg-[#D1FAE5] p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Total Trip Completed</p>
                        <h2 className="text-3xl font-bold text-slate-900">{stats.totalTrips.toLocaleString()}</h2>
                    </div>
                    <div className="absolute top-6 right-6">
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>

                <div className="bg-[#DBEafe] p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32">
                    <div>
                        <p className="text-slate-600 font-medium mb-1">Total Amount</p>
                        <h2 className="text-3xl font-bold text-slate-900">₹{stats.totalAmount.toLocaleString('en-IN')}</h2>
                    </div>
                    <div className="absolute top-6 right-6">
                        <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="relative w-64">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <Input
                            placeholder="Search ..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                        <button className="hover:text-gray-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                        <button className="hover:text-gray-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg></button>
                        <button className="hover:text-gray-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                        <button className="hover:text-gray-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg></button>
                    </div>
                </div>

                <DataTable
                    data={customers}
                    columns={columns}
                    keyExtractor={(c) => c.id}
                    loading={loading}
                    emptyMessage="No customers found"
                    selectable={true}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onRowClick={(c) => { if (typeof window !== 'undefined') window.location.href = `/customers/${c.id}`; }}
                    pagination={{ page, pageSize, total, onPageChange: setPage }}
                />
            </div>
        </ClientLayout>
    );
}
