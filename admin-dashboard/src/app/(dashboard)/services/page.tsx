'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { servicesApi } from '@/lib/api';

interface Service {
    id?: string; // Optional or removed
    serviceId: string; // The actual public ID
    name: string;
    minKm: number;
    vendorCommission: number;
    driverCommission: number;
    isActive: boolean;
    createdAt: string;
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 20;

    useEffect(() => {
        fetchServices();
    }, [page]);

    const fetchServices = async () => {
        setLoading(true);
        try {
            const res = await servicesApi.getAll({ page, limit: pageSize });
            const data = res.data?.data || res.data || {};
            const servicesArray = Array.isArray(data) ? data : (data.services || data.rows || []);
            setServices(Array.isArray(servicesArray) ? servicesArray : []);
            setTotal(data.count || data.total || 0);
        } catch (error) {
            console.error('Failed to fetch services:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'name', header: 'Name', sortable: true },
        { key: 'minKm', header: 'Min KM', render: (s: Service) => s.minKm || 0 },
        {
            key: 'commissions',
            header: 'Commission',
            render: (s: Service) => (
                <div className="flex flex-col text-xs text-slate-500">
                    <span>Vendor: {s.vendorCommission || 0}%</span>
                    <span>Driver: {s.driverCommission || 0}%</span>
                </div>
            )
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (s: Service) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                </span>
            )
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (s: Service) => (
                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/services/${s.serviceId}`; }}>
                    Edit
                </Button>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Services">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.25rem' }}>Services</h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Manage service types and pricing</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/services/create'; }}>
                    + Add Service
                </Button>
            </div>

            <DataTable
                data={services}
                columns={columns}
                keyExtractor={(s) => s.serviceId}
                loading={loading}
                emptyMessage="No services found"
                onRowClick={(s) => { if (typeof window !== 'undefined') window.location.href = `/services/${s.serviceId}`; }}
                pagination={{ page, pageSize, total, onPageChange: setPage }}
            />
        </ClientLayout>
    );
}
