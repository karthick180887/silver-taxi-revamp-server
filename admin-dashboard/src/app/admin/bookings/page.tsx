'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Booking {
    id: string;
    bookingId: string;
    mobileNumber: string;
    from: string;
    to: string;
    pickupDate: string;
    pickupTime: string;
    driverAssigned: string;
    createdType: string;
    tripStatus: string;
}

export default function BookingsPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [statusCounts, setStatusCounts] = useState({
        confirmedNotContacted: 0,
        confirmedContacted: 0,
        nonStarted: 0,
        started: 0,
        completed: 0,
        cancelled: 0,
        vendorBooking: 0,
    });
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchBookings();
        fetchStatusCounts();
    }, [page, rowsPerPage, selectedStatus]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const params: any = {
                page,
                limit: rowsPerPage,
            };
            if (selectedStatus) {
                params.status = selectedStatus;
            }
            const response = await axios.get(`${API_URL}/api/bookings`, {
                params,
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                },
            });

            if (response.data?.data) {
                setBookings(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatusCounts = async () => {
        try {
            // Using dashboard stats as proxy for status counts for now
            const response = await axios.get(`${API_URL}/api/bookings/dashboard`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            if (response.data) {
                setStatusCounts({
                    confirmedNotContacted: 0,
                    confirmedContacted: 0,
                    // Approximation logic as we map limited stats to detailed statuses
                    nonStarted: (response.data.totalTrips || 0) - (response.data.completedTrips || 0) - (response.data.cancelledTrips || 0) - (response.data.activeTrips || 0),
                    started: response.data.activeTrips || 0,
                    completed: response.data.completedTrips || 0,
                    cancelled: response.data.cancelledTrips || 0,
                    vendorBooking: 0,
                });
            }
        } catch (error) {
            console.error('Error fetching status counts:', error);
        }
    };

    const columns: Column<Booking>[] = [
        {
            id: 'bookingId',
            label: 'Booking ID',
            sortable: true,
        },
        {
            id: 'mobileNumber',
            label: 'Mobile Number',
            sortable: true,
        },
        {
            id: 'from',
            label: 'From',
            sortable: true,
            format: (value) => <span className="truncate max-w-[200px] block">{value}</span>,
        },
        {
            id: 'to',
            label: 'To',
            sortable: true,
            format: (value) => <span className="truncate max-w-[200px] block">{value}</span>,
        },
        {
            id: 'pickupDate',
            label: 'PickUp Date',
            sortable: true,
        },
        {
            id: 'pickupTime',
            label: 'PickUp Time',
            sortable: true,
        },
        {
            id: 'driverAssigned',
            label: 'Driver Assigned',
            sortable: true,
        },
        {
            id: 'createdType',
            label: 'Created Type',
        },
        {
            id: 'tripStatus',
            label: 'Trip Status',
            sortable: true,
            format: (value) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${value === 'Completed' ? 'bg-green-100 text-green-700' :
                    value === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        value === 'Started' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                    }`}>
                    {value}
                </span>
            ),
        },
    ];

    const getStatusFilters = () => [
        {
            label: 'Booking Confirmed Not Contacted',
            count: statusCounts.confirmedNotContacted,
            active: selectedStatus === 'confirmed_not_contacted',
            onClick: () => setSelectedStatus(selectedStatus === 'confirmed_not_contacted' ? null : 'confirmed_not_contacted')
        },
        {
            label: 'Booking Confirmed Contacted',
            count: statusCounts.confirmedContacted,
            active: selectedStatus === 'confirmed_contacted',
            onClick: () => setSelectedStatus(selectedStatus === 'confirmed_contacted' ? null : 'confirmed_contacted')
        },
        {
            label: 'Non Started',
            count: statusCounts.nonStarted,
            active: selectedStatus === 'non_started',
            onClick: () => setSelectedStatus(selectedStatus === 'non_started' ? null : 'non_started')
        },
        {
            label: 'Started',
            count: statusCounts.started,
            active: selectedStatus === 'started',
            onClick: () => setSelectedStatus(selectedStatus === 'started' ? null : 'started')
        },
        {
            label: 'Completed',
            count: statusCounts.completed,
            active: selectedStatus === 'completed',
            onClick: () => setSelectedStatus(selectedStatus === 'completed' ? null : 'completed')
        },
        {
            label: 'Cancelled',
            count: statusCounts.cancelled,
            active: selectedStatus === 'cancelled',
            onClick: () => setSelectedStatus(selectedStatus === 'cancelled' ? null : 'cancelled')
        },
        {
            label: 'Vendor-Booking',
            count: statusCounts.vendorBooking,
            active: selectedStatus === 'vendor_booking',
            onClick: () => setSelectedStatus(selectedStatus === 'vendor_booking' ? null : 'vendor_booking')
        },
    ];

    return (
        <DataTable
            title="Booking Page"
            columns={columns}
            data={bookings}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchBookings}
            onView={(row) => router.push(`/admin/bookings/${row.id}`)}
            onEdit={(row) => router.push(`/admin/bookings/${row.id}/edit`)}
            statusFilters={getStatusFilters()}
            createButton={
                <Link href="/admin/bookings/create">
                    <Button
                        variant="contained"
                        startIcon={<Plus className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Create Booking
                    </Button>
                </Link>
            }
        />
    );
}
