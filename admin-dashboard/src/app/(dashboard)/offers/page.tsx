'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { offersApi } from '@/lib/api';

interface Offer {
    id: string;
    title: string;
    description: string;
    discountType: string;
    discountValue: number;
    minAmount: number;
    maxDiscount: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    usageCount: number;
    createdAt: string;
}

export default function OffersPage() {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchOffers();
    }, [page, search]);

    const fetchOffers = async () => {
        setLoading(true);
        try {
            const res = await offersApi.getAll({ page, limit: pageSize });
            const data = res.data?.data || res.data || {};
            const offersArray = Array.isArray(data) ? data : (data.offers || data.rows || []);
            setOffers(Array.isArray(offersArray) ? offersArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await offersApi.toggleStatus(id);
            fetchOffers();
        } catch (error) {
            console.error('Failed to toggle offer:', error);
        }
    };

    const columns = [
        { key: 'title', header: 'Title', sortable: true },
        { key: 'discountType', header: 'Type', render: (o: Offer) => o.discountType === 'percentage' ? 'Percentage' : 'Fixed' },
        { key: 'discountValue', header: 'Value', render: (o: Offer) => o.discountType === 'percentage' ? `${o.discountValue}%` : `₹${o.discountValue}` },
        { key: 'minAmount', header: 'Min Amount', render: (o: Offer) => `₹${o.minAmount || 0}` },
        { key: 'validTo', header: 'Valid Until', render: (o: Offer) => o.validTo ? new Date(o.validTo).toLocaleDateString() : '-' },
        { key: 'isActive', header: 'Status', render: (o: Offer) => <StatusBadge status={o.isActive ? 'active' : 'inactive'} /> },
        { key: 'usageCount', header: 'Used', render: (o: Offer) => o.usageCount || 0 },
        {
            key: 'actions',
            header: 'Actions',
            render: (o: Offer) => (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/offers/${o.id}`; }}>
                        Edit
                    </Button>
                    <Button variant={o.isActive ? 'danger' : 'success'} size="sm" onClick={(e) => { e.stopPropagation(); handleToggle(o.id); }}>
                        {o.isActive ? 'Disable' : 'Enable'}
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Offers">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Offers</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage promotional offers and discounts</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/offers/create'; }}>
                    + Create Offer
                </Button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <Input
                    placeholder="Search offers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: '300px' }}
                />
            </div>

            <DataTable
                data={offers}
                columns={columns}
                keyExtractor={(o) => o.id}
                loading={loading}
                emptyMessage="No offers found"
                onRowClick={(o) => { if (typeof window !== 'undefined') window.location.href = `/offers/${o.id}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
