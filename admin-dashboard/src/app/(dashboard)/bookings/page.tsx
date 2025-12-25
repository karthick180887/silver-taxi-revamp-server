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
    customer?: {
        name: string;
        phone: string;
        customerId: string;
    };
    phone?: string;
    // New fields for redesign
    bookingType?: string; // 'webportal', 'manual', 'vendor'
    bookedBy?: string; // 'user', 'admin', 'vendor'
    bookedAt?: string;
    dropDate?: string;
    tax?: number;
    advanceAmount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    pricePerKm?: number;
    driverBeta?: number; // Commission/Platform fee
    vehicleModel?: string;
    vehicleType?: string;
    vehicles?: {
        name: string;
        type: string;
        vehicleNumber: string;
    };
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

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this booking?')) return;

        try {
            await bookingsApi.delete(id);
            fetchBookings();
        } catch (error) {
            console.error('Failed to delete booking:', error);
            alert('Failed to delete booking');
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' });
    }

    const columns = [
        {
            key: 'customerInfo',
            header: 'Customer Info',
            render: (b: Booking) => {
                const phone = b.customer?.phone || b.phone || b.customerPhone || 'N/A';
                const formattedPhone = phone.toString().replace(/^91\s?/, '');
                const bookingSource = b.bookingType || 'manual'; // Default
                const bookedBy = b.bookedBy || 'admin';

                let badgeClass = 'bg-slate-100 text-slate-800';
                if (bookingSource === 'webportal') badgeClass = 'bg-indigo-100 text-indigo-700';
                if (bookingSource === 'vendor') badgeClass = 'bg-purple-100 text-purple-700';
                if (bookingSource === 'manual') badgeClass = 'bg-emerald-100 text-emerald-700';

                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${badgeClass}`}>
                                {bookingSource}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                                {bookedBy}
                            </span>
                        </div>
                        <div className="font-bold text-slate-800 text-sm">ID: {b.bookingId}</div>
                        <div className="text-sm font-medium text-slate-700 capitalize">{b.customer?.name || b.name || b.customerName || 'Guest'}</div>
                        <div className="text-xs text-slate-500">{formattedPhone}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Booked: {b.bookedAt || new Date(b.createdAt).toLocaleDateString()}</div>
                    </div>
                );
            }
        },
        {
            key: 'tripDetails',
            header: 'Trip Details',
            render: (b: Booking) => {
                const dateObj = b.pickupDateTime ? new Date(b.pickupDateTime) : null;
                const formattedDate = dateObj
                    ? dateObj.toLocaleDateString('en-IN', { year: 'numeric', month: '2-digit', day: '2-digit' })
                    : b.pickupDate;
                const formattedTime = dateObj
                    ? dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : b.pickupTime;

                return (
                    <div className="flex flex-col gap-1 max-w-[200px]">
                        <div className="font-semibold text-slate-800 text-xs mb-1">
                            {formatDate(b.pickupDateTime || b.createdAt)} - {formattedTime}
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="text-xs text-slate-600 leading-tight">
                                <span className="text-slate-400 mr-1">From:</span>
                                {b.pickup || b.pickupLocation}
                            </div>
                            <div className="text-xs text-slate-600 leading-tight">
                                <span className="text-slate-400 mr-1">To:</span>
                                {b.drop || b.dropLocation || 'Local Use'}
                            </div>
                        </div>
                        {b.dropDate && (
                            <div className="text-[10px] text-slate-400 mt-1">Drop Date: {b.dropDate}</div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'bookingInfo',
            header: 'Booking Info',
            render: (b: Booking) => {
                const charges = b.amount || 0;
                const tax = b.tax || 0;
                const total = charges + tax;
                const advance = b.advanceAmount || 0;

                return (
                    <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Charges:</span>
                            <span className="font-medium">₹{charges.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Tax:</span>
                            <span className="font-medium">₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2 border-t border-dashed border-slate-200 pt-0.5 mt-0.5">
                            <span className="font-bold text-slate-700">Total:</span>
                            <span className="font-bold text-slate-800">₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Advance:</span>
                            <span className="font-medium">₹{advance.toFixed(2)}</span>
                        </div>

                        <div className="flex gap-1 mt-1.5">
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                                {b.paymentMethod || 'Cash'}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">
                                {b.paymentStatus || 'Pending'}
                            </span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'driverInfo',
            header: 'Driver Info',
            render: (b: Booking) => {
                const isAssigned = !!(b.driver || b.driverId);
                const assignedClass = isAssigned ? 'text-emerald-600' : 'text-red-500';
                const assignedIcon = isAssigned ? '✓' : '✗';
                const assignedText = isAssigned ? 'Assigned' : 'Not Assigned';

                return (
                    <div className="flex flex-col gap-1">
                        <div className={`text-xs font-bold ${assignedClass} flex items-center gap-1 mb-1`}>
                            <span>{assignedIcon}</span> {assignedText}
                        </div>
                        {isAssigned ? (
                            <>
                                <div className="text-xs font-semibold text-slate-700">{b.driverName || b.driver?.name}</div>
                                <div className="text-xs text-slate-500">{b.driver?.phone || 'N/A'}</div>
                                <div className="text-xs text-slate-600 mt-0.5">
                                    {b.vehicles?.name || b.vehicleModel || 'Toyota Etios'} <br />
                                    <span className="text-slate-400">{b.vehicles?.type || b.vehicleType || 'Sedan'}</span>
                                </div>
                            </>
                        ) : (
                            (b.status === 'Booking Confirmed' || b.status === 'Reassign' || b.status === 'Pending') && (
                                <button
                                    onClick={(e) => handleAssignClick(b, e)}
                                    className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded shadow-sm w-fit mt-1"
                                >
                                    Assign Driver
                                </button>
                            )
                        )}
                    </div>
                );
            }
        },
        {
            key: 'pricing',
            header: 'Pricing',
            render: (b: Booking) => {
                const total = (b.amount || 0) + (b.tax || 0);
                const advance = b.advanceAmount || 0;
                const due = total - advance;

                return (
                    <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Rate:</span>
                            <span className="font-medium">₹{b.pricePerKm || '12.00'}/km</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Driver Beta:</span>
                            <span className="font-medium">₹{b.driverBeta?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between gap-2 mt-1 font-semibold">
                            <span className="text-slate-700">Total:</span>
                            <span className="text-slate-800">₹{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                            <span className="text-slate-500">Advance:</span>
                            <span className="font-medium">₹{advance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between gap-2 font-bold text-red-600 mt-1">
                            <span>Due:</span>
                            <span>₹{due.toFixed(2)}</span>
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'actions',
            header: 'Actions',
            render: (b: Booking) => (
                <div className="flex flex-row items-start gap-1">
                    <Link href={`/bookings/${b.bookingId}`} className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all bg-white" title="View Details">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </Link>
                    {/* Placeholder for Edit - linking to create for now or a future edit page */}
                    <Link href={`/bookings/edit/${b.bookingId}`} className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all bg-white" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </Link>
                    <button
                        className="p-1.5 border border-slate-200 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-all bg-white"
                        title="Delete"
                        onClick={(e) => handleDelete(b.bookingId, e)}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
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
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-10 bg-slate-50 border-transparent hover:bg-slate-100 focus:bg-white focus:border-indigo-500 w-full md:w-80 rounded-xl"
                        />
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <Select
                            options={statusOptions}
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
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
                        keyExtractor={(b) => b.bookingId || b.id}
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
