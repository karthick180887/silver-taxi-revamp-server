'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Vendor {
    id: string;
    vendorId: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
}

export default function VendorsPage() {
    const router = useRouter();
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        fetchVendors();
    }, [page, rowsPerPage]);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/v1/vendors`, {
                params: { page, limit: rowsPerPage },
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            
            if (response.data?.data) {
                setVendors(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<Vendor>[] = [
        { id: 'vendorId', label: 'Vendor ID', sortable: true },
        { id: 'name', label: 'Name', sortable: true },
        { id: 'email', label: 'Email', sortable: true },
        { id: 'phone', label: 'Phone', sortable: true },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            format: (value) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    value === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                    {value}
                </span>
            ),
        },
        { id: 'createdAt', label: 'Created At', sortable: true },
    ];

    return (
        <DataTable
            title="Vendors"
            columns={columns}
            data={vendors}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchVendors}
            onView={(row) => router.push(`/admin/vendors/${row.id}`)}
            onEdit={(row) => router.push(`/admin/vendors/${row.id}/edit`)}
            createButton={
                <Link href="/admin/vendors/create">
                    <Button variant="contained" startIcon={<Plus className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700">
                        Create Vendor
                    </Button>
                </Link>
            }
        />
    );
}
