'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Customer {
    id: string;
    customerId: string;
    name: string;
    email: string;
    phone: string;
    status: string;
    createdAt: string;
}

export default function CustomersPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        fetchCustomers();
    }, [page, rowsPerPage]);

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/v1/customers`, {
                params: {
                    page,
                    limit: rowsPerPage,
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                },
            });
            
            if (response.data?.data) {
                setCustomers(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<Customer>[] = [
        {
            id: 'customerId',
            label: 'Customer ID',
            sortable: true,
        },
        {
            id: 'name',
            label: 'Name',
            sortable: true,
        },
        {
            id: 'email',
            label: 'Email',
            sortable: true,
        },
        {
            id: 'phone',
            label: 'Phone',
            sortable: true,
        },
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
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
        },
    ];

    return (
        <DataTable
            title="Customers"
            columns={columns}
            data={customers}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchCustomers}
            onView={(row) => router.push(`/admin/customers/${row.id}`)}
            onEdit={(row) => router.push(`/admin/customers/${row.id}/edit`)}
            onDelete={(row) => {
                if (confirm(`Delete customer ${row.name}?`)) {
                    // Handle delete
                }
            }}
        />
    );
}
