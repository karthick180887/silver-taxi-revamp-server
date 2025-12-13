'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DataTable, { Column } from '@/components/admin/DataTable';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Enquiry {
    id: string;
    enquiryId: string;
    phoneNumber: string;
    from: string;
    to: string;
    pickupDate: string;
    pickupTime: string;
    dropDate: string;
    serviceName: string;
    status: string;
    source: string;
    createdBy: string;
    createdAt: string;
}

export default function EnquiryPage() {
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
            const response = await axios.get(`${API_URL}/v1/enquiries`, {
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
        {
            id: 'enquiryId',
            label: 'Enquiry ID',
            sortable: true,
        },
        {
            id: 'phoneNumber',
            label: 'Phone Number',
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
            id: 'dropDate',
            label: 'Drop Date',
            sortable: true,
            format: (value) => value === 'Invalid Date' || !value ? <span className="text-red-500">N/A</span> : value,
        },
        {
            id: 'serviceName',
            label: 'Service Name',
            sortable: true,
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            format: (value) => (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                    value === 'Current' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                }`}>
                    {value}
                </span>
            ),
        },
        {
            id: 'source',
            label: 'Source',
            sortable: true,
        },
        {
            id: 'createdBy',
            label: 'Created By',
            sortable: true,
        },
        {
            id: 'createdAt',
            label: 'Created At',
            sortable: true,
        },
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
            onView={(row) => router.push(`/admin/enquiry/${row.id}`)}
            onEdit={(row) => router.push(`/admin/enquiry/${row.id}/edit`)}
            onDelete={(row) => {
                if (confirm(`Delete enquiry ${row.enquiryId}?`)) {
                    // Handle delete
                }
            }}
            onDelete={(row) => {
                if (confirm(`Delete enquiry ${row.enquiryId}?`)) {
                    // Handle delete
                }
            }}
        />
    );
}
