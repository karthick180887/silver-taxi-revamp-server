'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Enquiry {
    id: string;
    name: string;
    email: string;
    phone: string;
    message: string;
    createdAt: string;
    status: string;
}

export default function EnquiriesPage() {
    const router = useRouter();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        fetchEnquiries();
    }, [page, rowsPerPage]);

    const fetchEnquiries = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/admin/enquiries`, {
                params: {
                    page,
                    limit: rowsPerPage,
                },
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('admin_token')}`,
                },
            });

            if (response.data?.data) {
                setEnquiries(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching enquiries:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<Enquiry>[] = [
        { id: 'name', label: 'Name', sortable: true },
        { id: 'phone', label: 'Phone', sortable: true },
        { id: 'email', label: 'Email', sortable: true },
        {
            id: 'message',
            label: 'Message',
            sortable: true,
            format: (value) => <span className="truncate max-w-[300px] block" title={value}>{value}</span>
        },
        { id: 'createdAt', label: 'Date', sortable: true },
    ];

    return (
        <DataTable
            title="Enquiries"
            columns={columns}
            data={enquiries}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchEnquiries}
            searchable={false}
        />
    );
}
