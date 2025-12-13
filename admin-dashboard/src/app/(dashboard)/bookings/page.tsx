'use client';

import React, { useEffect, useState } from 'react';
import { Button, DataTable, StatusBadge, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { bookingsApi } from '@/lib/api';

interface Booking {
    id: string;
    bookingId: string;
    customerName: string;
    customerPhone: string;
    driverName: string;
    pickupLocation: string;
    dropLocation: string;
    pickupDate: string;
    pickupTime: string;
    status: string;
    tripType: string;
    amount: number;
    createdAt: string;
    pickupDateTime?: string;
}

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Booking Confirmed', label: 'Confirmed' },
    { value: 'Trip Started', label: 'Trip Started' },
    { value: 'Trip Ended', label: 'Completed' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function BookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [stats, setStats] = useState({
        bookingConfirmed: 0,
        notStarted: 0,
        started: 0,
        completed: 0,
        cancelled: 0,
        vendor: 0,
        contacted: 0,
        notContacted: 0
    });
    const pageSize = 20;

    useEffect(() => {
        fetchBookings();
    }, [page, search, status]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await bookingsApi.getAll({ page, limit: pageSize, status: status || undefined });
            const data = res.data?.data || res.data || {};
            const bookingsArray = Array.isArray(data.bookings) ? data.bookings : [];

            setBookings(bookingsArray);
            setTotal(data.pagination?.totalCount || bookingsArray.length || 0);

            if (data.bookingsCount) {
                setStats(data.bookingsCount);
            }
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { key: 'bookingId', header: 'Booking ID', sortable: true, render: (b: any) => <span className="text-blue-600 font-medium">{b.bookingId}</span> },
        { key: 'phone', header: 'Mobile Number', render: (b: any) => b.phone || b.customerPhone || '-' },
        {
            key: 'pickup', header: 'From', render: (b: any) => (
                <span title={b.pickup || b.pickupLocation} className="truncate max-w-[150px] block">
                    {b.pickup || b.pickupLocation}
                </span>
            )
        },
        {
            key: 'drop', header: 'To', render: (b: any) => (
                <span title={b.drop || b.dropLocation} className="truncate max-w-[150px] block">
                    {b.drop || b.dropLocation}
                </span>
            )
        },
        {
            key: 'pickupDate',
            header: 'PickUp Date',
            render: (b: any) => {
                const date = b.pickupDate || (b.pickupDateTime ? new Date(b.pickupDateTime).toLocaleDateString() : '-');
                return date;
            }
        },
        {
            key: 'pickupTime',
            header: 'PickUp Time',
            render: (b: any) => {
                const time = b.pickupTime || (b.pickupDateTime ? new Date(b.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');
                return time;
            }
        },
        {
            key: 'driverDetails',
            header: 'Driver Assigned',
            render: (b: any) => b.driver ? (
                <div className="flex flex-col">
                    <span className="font-medium text-slate-800">{b.driver.name}</span>
                    <span className="text-xs text-slate-500">{b.driver.phone}</span>
                </div>
            ) : <span className="text-slate-400 italic">Unassigned</span>
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (b: any) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={(e: any) => { e.stopPropagation(); if (typeof window !== 'undefined') window.location.href = `/bookings/${b.id}`; }} title="View">
                        👁️
                    </Button>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" title="Edit">
                        ✏️
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" title="Delete">
                        🗑️
                    </Button>
                </div>
            )
        },
    ];

    const StatCard = ({ title, count, colorClass, borderClass }: any) => (
        <div className={`p-4 rounded-md shadow-sm relative overflow-hidden bg-[#f0f0f0]`} style={{ borderLeft: `4px solid ${borderClass}` }}>
            <div className={`absolute inset-0 opacity-10 ${colorClass}`}></div>
            <div className="relative z-10">
                <h3 className="text-black text-xs font-bold uppercase tracking-wide mb-1 truncate" style={{ fontFamily: '"Roboto", sans-serif' }} title={title}>{title}</h3>
                <div className="text-2xl font-bold text-black" style={{ fontFamily: '"Roboto", sans-serif' }}>{count}</div>
            </div>
        </div>
    );

    return (
        <ClientLayout pageTitle="Bookings">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Bookings</h1>
                    <p className="text-slate-500 text-sm">Manage all taxi bookings</p>
                </div>
                <Button onClick={() => { if (typeof window !== 'undefined') window.location.href = '/bookings/create'; }} className="bg-slate-800 hover:bg-slate-700 text-white">
                    + Create Booking
                </Button>
            </div>

            {/* Stats Row - 7 Cards High Density */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                <StatCard
                    title="Booking Confirmed - Not Contacted"
                    count={stats.notContacted}
                    colorClass="bg-red-500"
                    borderClass="#ef4444"
                />
                <StatCard
                    title="Booking Confirmed - Contacted"
                    count={stats.contacted}
                    colorClass="bg-green-500"
                    borderClass="#22c55e"
                />
                <StatCard
                    title="Non Started"
                    count={stats.notStarted}
                    colorClass="bg-yellow-500"
                    borderClass="#eab308"
                />
                <StatCard
                    title="Started"
                    count={stats.started}
                    colorClass="bg-blue-500"
                    borderClass="#3b82f6"
                />
                <StatCard
                    title="Completed"
                    count={stats.completed}
                    colorClass="bg-emerald-500"
                    borderClass="#10b981"
                />
                <StatCard
                    title="Cancelled"
                    count={stats.cancelled}
                    colorClass="bg-gray-500"
                    borderClass="#6b7280"
                />
                <StatCard
                    title="Vendor - Bookings"
                    count={stats.vendor}
                    colorClass="bg-purple-500"
                    borderClass="#a855f7"
                />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-[#f8f9fa]">
                    <div className="flex items-center gap-4 w-full">
                        <Input
                            placeholder="Search..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-xs bg-white border-slate-300"
                        />
                        <Select
                            options={statusOptions}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-[180px] bg-white border-slate-300"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <DataTable
                        data={bookings}
                        columns={columns}
                        keyExtractor={(b) => b.id || b.bookingId}
                        loading={loading}
                        selectable={true}
                        emptyMessage="No bookings found"
                        onRowClick={(b) => { if (typeof window !== 'undefined') window.location.href = `/bookings/${b.id}`; }}
                        pagination={{ page, pageSize, total, onPageChange: setPage }}
                    />
                </div>
            </div>

            <style jsx global>{`
                th {
                    background-color: #f8f9fa !important;
                    font-size: 0.75rem !important;
                    text-transform: uppercase !important;
                    color: #495057 !important;
                    font-weight: 700 !important;
                }
                td {
                    padding: 1rem !important;
                    font-size: 0.875rem !important;
                }
            `}</style>
        </ClientLayout>
    );
}
