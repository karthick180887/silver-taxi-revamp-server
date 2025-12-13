'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { promoCodesApi } from '@/lib/api';

interface PromoCode {
    id: string;
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    minAmount: number;
    maxDiscount: number;
    usageLimit: number;
    usageCount: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    createdAt: string;
}

export default function PromoCodesPage() {
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchPromoCodes();
    }, [page, search]);

    const fetchPromoCodes = async () => {
        setLoading(true);
        try {
            const res = await promoCodesApi.getAll({ page, limit: pageSize });
            const data = res.data?.data || res.data || {};
            const codesArray = Array.isArray(data) ? data : (data.promoCodes || data.rows || []);
            setPromoCodes(Array.isArray(codesArray) ? codesArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch promo codes:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'code', header: 'Code', sortable: true, render: (p: PromoCode) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.code}</span> },
        { key: 'description', header: 'Description', render: (p: PromoCode) => p.description || '-' },
        { key: 'discountType', header: 'Type', render: (p: PromoCode) => p.discountType === 'percentage' ? 'Percentage' : 'Fixed' },
        { key: 'discountValue', header: 'Value', render: (p: PromoCode) => p.discountType === 'percentage' ? `${p.discountValue}%` : `₹${p.discountValue}` },
        { key: 'usageLimit', header: 'Limit', render: (p: PromoCode) => p.usageLimit || 'Unlimited' },
        { key: 'usageCount', header: 'Used', render: (p: PromoCode) => p.usageCount || 0 },
        { key: 'validTo', header: 'Expires', render: (p: PromoCode) => p.validTo ? new Date(p.validTo).toLocaleDateString() : '-' },
        { key: 'isActive', header: 'Status', render: (p: PromoCode) => <StatusBadge status={p.isActive ? 'active' : 'inactive'} /> },
        {
            key: 'actions',
            header: 'Actions',
            render: (p: PromoCode) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/promo-codes/${p.id}`; }}>
                    Edit
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Promo Codes">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Promo Codes</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage discount codes for customers</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/promo-codes/create'; }}>
                    + Create Promo Code
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    placeholder="Search promo codes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            <DataTable
                data={promoCodes}
                columns={columns}
                keyExtractor={(p) => p.id}
                loading={loading}
                emptyMessage="No promo codes found"
                onRowClick={(p) => { if (typeof window !== 'undefined') window.location.href = `/promo-codes/${p.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
