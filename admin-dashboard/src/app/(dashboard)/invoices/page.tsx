'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { invoicesApi } from '@/lib/api';

interface Invoice {
    id: string;
    invoiceId: string;
    bookingId: string;
    customerName: string;
    amount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    paidAt: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchInvoices();
    }, [page, search]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await invoicesApi.getAll({ page, limit: pageSize, sortBy: 'createdAt', sortOrder: 'DESC' });
            const data = res.data?.data || res.data || {};
            const invoicesArray = Array.isArray(data) ? data : (data.invoices || data.rows || []);
            setInvoices(Array.isArray(invoicesArray) ? invoicesArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    // Stats - Calculated from current list or a separate API
    const [stats, setStats] = useState({
        totalAmount: 0,
        pendingAmount: 0,
        paidCount: 0,
        pendingCount: 0
    });

    useEffect(() => {
        // Calculate stats from invoices
        const total = invoices.reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const pending = invoices.filter(i => i.status === 'pending').reduce((acc, curr) => acc + (curr.amount || 0), 0);
        const paidCount = invoices.filter(i => i.status === 'paid').length;
        const pendingCount = invoices.filter(i => i.status === 'pending').length;

        setStats({ totalAmount: total, pendingAmount: pending, paidCount, pendingCount });
    }, [invoices]);

    const StatCard = ({ title, count, colorClass, iconPath, isCurrency = false }: any) => (
        <div className={`${colorClass} p-6 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between h-32`}>
            <div>
                <p className="text-slate-600 font-medium mb-1">{title}</p>
                <h2 className="text-3xl font-bold text-slate-900">
                    {isCurrency ? `₹${count.toLocaleString('en-IN')}` : count.toLocaleString()}
                </h2>
            </div>
            <div className="absolute top-6 right-6">
                <svg className="w-6 h-6 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                </svg>
            </div>
        </div>
    );

    const columns = [
        {
            key: 'invoiceId',
            header: 'Invoice ID',
            sortable: true,
            render: (i: Invoice) => <span className="text-indigo-600 font-medium">{i.invoiceId}</span>
        },
        { key: 'bookingId', header: 'Booking ID', render: (i: Invoice) => i.bookingId || '-' },
        { key: 'customerName', header: 'Customer', render: (i: Invoice) => <span className="text-slate-700 font-medium">{i.customerName || '-'}</span> },
        { key: 'amount', header: 'Amount', render: (i: Invoice) => `₹${(i.amount || 0).toLocaleString('en-IN')}` },
        { key: 'status', header: 'Status', render: (i: Invoice) => <StatusBadge status={i.status || 'pending'} /> },
        {
            key: 'paymentMethod',
            header: 'Payment',
            render: (i: Invoice) => (
                <span className="capitalize px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                    {i.paymentMethod || '-'}
                </span>
            )
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (i: Invoice) => new Date(i.createdAt).toLocaleDateString('en-GB')
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (i: Invoice) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e: any) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/invoices/${i.id}`; }}>
                        View
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Invoices">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Invoices</h1>
                    <p className="text-slate-500 text-sm">Manage all invoices and payments</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/invoices/create'; }} className="bg-slate-800 hover:bg-slate-700 text-white shadow-md">
                    + Create Invoice
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Invoiced"
                    count={stats.totalAmount}
                    colorClass="bg-[#e0f2fe]"
                    iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    isCurrency={true}
                />
                <StatCard
                    title="Pending Amount"
                    count={stats.pendingAmount}
                    colorClass="bg-[#fee2e2]"
                    iconPath="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    isCurrency={true}
                />
                <StatCard
                    title="Paid Invoices"
                    count={stats.paidCount}
                    colorClass="bg-[#dcfce7]"
                    iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <StatCard
                    title="Pending Invoices"
                    count={stats.pendingCount}
                    colorClass="bg-[#ffedd5]"
                    iconPath="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
                <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e: any) => setSearch(e.target.value)}
                    className="max-w-md border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
            </div>

            <DataTable
                data={invoices}
                columns={columns}
                keyExtractor={(i) => i.id || i.invoiceId}
                loading={loading}
                emptyMessage="No invoices found"
                onRowClick={(i) => { if (typeof window !== 'undefined') window.location.href = `/invoices/${i.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
