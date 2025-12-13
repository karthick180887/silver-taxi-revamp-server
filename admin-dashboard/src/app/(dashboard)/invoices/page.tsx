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

    const columns = [
        { key: 'invoiceId', header: 'Invoice ID', sortable: true },
        { key: 'bookingId', header: 'Booking ID', render: (i: Invoice) => i.bookingId || '-' },
        { key: 'customerName', header: 'Customer', render: (i: Invoice) => i.customerName || '-' },
        { key: 'amount', header: 'Amount', render: (i: Invoice) => `₹${(i.amount || 0).toLocaleString()}` },
        { key: 'status', header: 'Status', render: (i: Invoice) => <StatusBadge status={i.status || 'pending'} /> },
        { key: 'paymentMethod', header: 'Payment', render: (i: Invoice) => i.paymentMethod || '-' },
        { key: 'createdAt', header: 'Created', render: (i: Invoice) => new Date(i.createdAt).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            render: (i: Invoice) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/invoices/${i.id}`; }}>
                        View
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Invoices">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Invoices</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage all invoices and payments</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/invoices/create'; }}>
                    + Create Invoice
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    placeholder="Search invoices..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
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
