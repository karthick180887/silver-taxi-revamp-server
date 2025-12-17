'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { enquiriesApi } from '@/lib/api';

interface Enquiry {
    id: string;
    enquiryId: string;
    customerName: string;
    phone: string;
    pickupLocation: string;
    dropLocation: string;
    pickupDate: string;
    pickupTime: string;
    dropDate: string;
    serviceName: string;
    status: string;
    source: string;
    createdBy: string;
    createdAt: string;
}

export default function EnquiriesPage() {
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({
        totalEnquiries: 0,
        todayEnquiries: 0,
        websiteEnquiries: 0
    });
    const pageSize = 20;

    useEffect(() => {
        fetchEnquiries();
    }, [page, search]);

    const fetchEnquiries = async () => {
        setLoading(true);
        try {
            const res = await enquiriesApi.getAll({ page, limit: pageSize, search });
            const data = res.data?.data || res.data || {};
            const enquiriesArray = Array.isArray(data.enquiries) ? data.enquiries : (Array.isArray(data) ? data : []);

            setEnquiries(enquiriesArray);
            setTotal(data.pagination?.totalCount || data.count || data.total || enquiriesArray.length || 0);

            if (data.stats) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConvertToBooking = async (id: string) => {
        try {
            await enquiriesApi.convertToBooking(id);
            fetchEnquiries();
        } catch (error) {
            console.error('Failed to convert enquiry:', error);
        }
    };

    const columns = [
        { key: 'enquiryId', header: 'Enquiry ID', sortable: true, render: (e: Enquiry) => <span className="text-blue-600 font-medium">{e.enquiryId}</span> },
        { key: 'phone', header: 'Phone Number' },
        {
            key: 'pickupLocation', header: 'From', render: (e: Enquiry) => (
                <span title={e.pickupLocation} className="truncate max-w-[150px] block">
                    {e.pickupLocation}
                </span>
            )
        },
        {
            key: 'dropLocation', header: 'To', render: (e: Enquiry) => (
                <span title={e.dropLocation} className="truncate max-w-[150px] block">
                    {e.dropLocation}
                </span>
            )
        },
        { key: 'pickupDate', header: 'Pickup Date', render: (e: Enquiry) => e.pickupDate ? new Date(e.pickupDate).toLocaleDateString() : '-' },
        { key: 'pickupTime', header: 'Pickup Time', render: (e: Enquiry) => e.pickupTime || '-' },
        { key: 'dropDate', header: 'Drop Date', render: (e: Enquiry) => e.dropDate ? new Date(e.dropDate).toLocaleDateString() : 'Invalid Date' },
        {
            key: 'actions',
            header: 'Actions',
            render: (e: Enquiry) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/enquiries/${e.id}`; }} title="View">
                        👁️
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); handleConvertToBooking(e.id); }} className="text-green-600 hover:text-green-700" title="Convert">
                        ✅
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" title="Delete">
                        🗑️
                    </Button>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Enquiry Page">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-[#e0fdf4] p-6 rounded-xl border-l-4 border-emerald-400 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">Total Enquiries</h3>
                    <div className="text-3xl font-bold text-black">{stats.totalEnquiries.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-emerald-500 opacity-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                </div>

                <div className="bg-[#eff6ff] p-6 rounded-xl border-b-4 border-blue-500 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">Today's Enquiries</h3>
                    <div className="text-3xl font-bold text-black">{stats.todayEnquiries.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-blue-500 opacity-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                </div>

                <div className="bg-[#ffedd5] p-6 rounded-xl border-r-4 border-orange-400 shadow-sm relative overflow-hidden">
                    <h3 className="text-black font-medium mb-1">Website Enquiries</h3>
                    <div className="text-3xl font-bold text-black">{stats.websiteEnquiries.toLocaleString()}</div>
                    <div className="absolute top-6 right-6 text-orange-500 opacity-50">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-slate-800">Enquiries List</h2>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Search ..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="max-w-xs"
                        />
                        <Button variant="outline" size="sm">↻</Button>
                        <Button variant="outline" size="sm">☰</Button>
                    </div>
                </div>

                <DataTable
                    data={enquiries}
                    columns={columns}
                    keyExtractor={(e) => e.id || e.enquiryId}
                    loading={loading}
                    emptyMessage="No enquiries found"
                    onRowClick={(e) => { if (typeof window !== 'undefined') window.location.href = `/enquiries/${e.id}`; }}
                    pagination={{ page, pageSize, total, onPageChange: setPage }}
                />
            </div>
        </ClientLayout>
    );
}
