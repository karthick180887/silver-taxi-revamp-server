'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, DataTable, StatusBadge, Input, Select } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { bookingsApi } from '@/lib/api';
import AssignDriverModal from '@/components/bookings/AssignDriverModal';

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
    driver?: any;
    driverId?: string;
    name?: string;
    pickup?: string;
    drop?: string;
}

const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Booking Confirmed', label: 'Confirmed' },
    { value: 'Driver Assigned', label: 'Assigned' },
    { value: 'Trip Started', label: 'On Trip' },
    { value: 'Completed', label: 'Completed' },
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

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedBookingForAssignment, setSelectedBookingForAssignment] = useState<Booking | null>(null);

    const pageSize = 20;

    useEffect(() => {
        fetchBookings();
    }, [page, search, status]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await bookingsApi.getAll({ page, limit: pageSize, status: status || undefined, search: search || undefined });
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

    const handleAssignClick = (booking: Booking, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedBookingForAssignment(booking);
        setAssignModalOpen(true);
    };

    const handleAssignmentComplete = () => {
        fetchBookings();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Trip Started': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Booking Confirmed': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'Pending': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const columns = [
        {
            key: 'bookingId',
            header: 'ID',
            render: (b: Booking) => (
                <span className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit block">
                    #{b.bookingId ? b.bookingId.slice(-6) : '---'}
                </span>
            )
        },
        {
            key: 'customer',
            header: 'Customer',
            render: (b: Booking) => (
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-700">{b.name || b.customerName || 'Guest'}</span>
                    <span className="text-xs text-slate-400">{b.customerPhone || b.customerPhone || b.driver?.phone || 'N/A'}</span>
                </div>
            )
        },
        {
            key: 'route',
            header: 'Route Details',
            render: (b: Booking) => (
                <div className="flex flex-col gap-1.5 max-w-[220px]">
                    <div className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="text-emerald-500 mt-0.5">●</span>
                        <span className="truncate" title={b.pickup || b.pickupLocation}>{b.pickup || b.pickupLocation}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-700">
                        <span className="text-red-500 mt-0.5">●</span>
                        <span className="truncate" title={b.drop || b.dropLocation}>{b.drop || b.dropLocation || 'N/A'}</span>
                    </div>
                </div>
            )
        },
        {
            key: 'time',
            header: 'Schedule',
            render: (b: Booking) => {
                const dateObj = b.pickupDateTime ? new Date(b.pickupDateTime) : null;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">
                            {dateObj ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : b.pickupTime}
                        </span>
                        <span className="text-xs text-slate-400">
                            {dateObj ? dateObj.toLocaleDateString() : b.pickupDate}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'status',
            header: 'Status',
            render: (b: Booking) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(b.status)} whitespace-nowrap`}>
                    {b.status}
                </span>
            )
        },
        {
            key: 'driver',
            header: 'Driver',
            render: (b: Booking) => {
                if (b.driver || b.driverId) {
                    return (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                {(b.driverName || b.driver?.name || 'D').charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-slate-700">{b.driverName || b.driver?.name}</span>
                                <span className="text-[10px] text-slate-400">Active</span>
                            </div>
                        </div>
                    );
                }
                return (b.status === 'Booking Confirmed' || b.status === 'Reassign') ? (
                    <button
                        onClick={(e) => handleAssignClick(b, e)}
                        className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg shadow-sm shadow-indigo-200 transition-colors"
                    >
                        + Assign Driver
                    </button>
                ) : <span className="text-xs text-slate-400 italic">Unassigned</span>;
            }
        },
        {
            key: 'actions',
            header: 'Action',
            render: (b: Booking) => (
                <div className="flex items-center gap-2">
                    <Link href={`/bookings/${b.id}`} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="View Details">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Link>
                </div>
            )
        },
    ];

    return (
        <ClientLayout pageTitle="Bookings">
            <div className="p-6 pt-24 min-h-screen bg-slate-50/50">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Bookings Control</h1>
                        <p className="text-slate-500 text-sm">Manage dispatch and trip status</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/bookings/create" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            <span className="text-lg">+</span> Create Booking
                        </Link>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Unassigned</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.bookingConfirmed || 0}</div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-amber-400 h-full w-3/4"></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">On Trip</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.started || 0}</div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-1/2"></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Completed</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.completed || 0}</div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-full"></div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-28">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Cancelled</div>
                        <div className="text-3xl font-bold text-slate-800">{stats.cancelled || 0}</div>
                        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                            <div className="bg-red-400 h-full w-1/4"></div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 w-full md:w-auto relative">
                        <svg className="w-5 h-5 text-slate-400 absolute left-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <Input
                            placeholder="Search by ID, Phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 w-full md:w-80 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select
                            options={statusOptions}
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 rounded-xl"
                        />
                        <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                            Download CSV
                        </Button>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <DataTable
                        data={bookings}
                        columns={columns}
                        keyExtractor={(b) => b.id || b.bookingId}
                        loading={loading}
                        selectable={false}
                        emptyMessage="No bookings found match your criteria."
                        onRowClick={(b) => { window.location.href = `/bookings/${b.id}`; }}
                        pagination={{ page, pageSize, total, onPageChange: setPage }}
                    />
                </div>
            </div>

            {assignModalOpen && selectedBookingForAssignment && (
                <AssignDriverModal
                    booking={selectedBookingForAssignment}
                    onClose={() => {
                        setAssignModalOpen(false);
                        setSelectedBookingForAssignment(null);
                    }}
                    onAssign={handleAssignmentComplete}
                />
            )}
        </ClientLayout>
    );
}
