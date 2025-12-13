'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Button, Chip } from '@mui/material';
import { Plus, Car, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Vehicle {
    id: string;
    vehicleId: string;
    make: string;
    model: string;
    type: string;
    registrationNumber: string;
    status: string;
    createdAt: string;
}

export default function VehiclesPage() {
    const router = useRouter();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchVehicles();
    }, [page, rowsPerPage, statusFilter]);

    const fetchVehicles = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/vehicles`, {
                params: {
                    page,
                    limit: rowsPerPage,
                    status: statusFilter !== 'All' ? statusFilter : undefined
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });

            if (response.data?.data) {
                setVehicles(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            // setVehicles([]); // Keep previous data on error or clear it?
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<Vehicle>[] = [
        {
            id: 'vehicleId',
            label: 'Vehicle ID',
            sortable: true,
            format: (value) => <span className="font-mono text-xs">{value}</span>
        },
        {
            id: 'make',
            label: 'Make & Model',
            sortable: true,
            format: (_value, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-zinc-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Car className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{row.make} {row.model}</p>
                        <p className="text-xs text-gray-500">{row.type}</p>
                    </div>
                </div>
            )
        },
        {
            id: 'registrationNumber',
            label: 'Registration',
            sortable: true,
            format: (value) => <span className="font-semibold bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded border border-gray-200 dark:border-zinc-700">{value}</span>
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            format: (value) => {
                let colorClass = 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400';
                let Icon = AlertCircle;

                if (value === 'Active' || value === 'Available') {
                    colorClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    Icon = CheckCircle;
                } else if (value === 'Inactive' || value === 'Maintenance') {
                    colorClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                    Icon = XCircle;
                } else if (value === 'OnTrip') {
                    colorClass = 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
                    Icon = Car;
                }

                return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
                        <Icon className="w-3 h-3" />
                        {value}
                    </span>
                );
            },
        },
        {
            id: 'createdAt',
            label: 'Added On',
            sortable: true,
            format: (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        },
    ];

    const statusFilters = [
        { label: 'All', count: totalRows, onClick: () => setStatusFilter('All'), active: statusFilter === 'All' },
        { label: 'Active', count: 0, onClick: () => setStatusFilter('Active'), active: statusFilter === 'Active' }, // Count specific to be implemented
        { label: 'On Trip', count: 0, onClick: () => setStatusFilter('OnTrip'), active: statusFilter === 'OnTrip' },
        { label: 'Maintenance', count: 0, onClick: () => setStatusFilter('Maintenance'), active: statusFilter === 'Maintenance' },
    ];

    return (
        <DataTable
            title="Vehicles Management"
            columns={columns}
            data={vehicles}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchVehicles}
            statusFilters={statusFilters}
            onView={(row) => router.push(`/admin/vehicles/${row.id}`)}
            onEdit={(row) => router.push(`/admin/vehicles/${row.id}/edit`)}
            createButton={
                <Link href="/admin/vehicles/create">
                    <Button
                        variant="contained"
                        startIcon={<Plus className="w-4 h-4" />}
                        className="bg-blue-600 hover:bg-blue-700 normal-case shadow-none text-white font-medium px-4 py-2.5 rounded-xl"
                    >
                        Add Vehicle
                    </Button>
                </Link>
            }
        />
    );
}
