'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable, { Column } from '@/components/admin/DataTable';
import { Button } from '@mui/material';
import { Plus } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Offer {
    id: string;
    name: string;
    description: string;
    discount: number;
    status: string;
    validFrom: string;
    validTo: string;
    createdAt: string;
}

export default function OffersPage() {
    const router = useRouter();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalRows, setTotalRows] = useState(0);

    useEffect(() => {
        fetchOffers();
    }, [page, rowsPerPage]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/v1/offers`, {
                params: { page, limit: rowsPerPage },
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            
            if (response.data?.data) {
                setOffers(response.data.data);
                setTotalRows(response.data.total || response.data.data.length);
            }
        } catch (error) {
            console.error('Error fetching offers:', error);
        } finally {
            setLoading(false);
        }
    };

    const columns: Column<Offer>[] = [
        { id: 'name', label: 'Name', sortable: true },
        { id: 'description', label: 'Description', sortable: true },
        {
            id: 'discount',
            label: 'Discount',
            sortable: true,
            format: (value) => `${value}%`,
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
        { id: 'validFrom', label: 'Valid From', sortable: true },
        { id: 'validTo', label: 'Valid To', sortable: true },
        { id: 'createdAt', label: 'Created At', sortable: true },
    ];

    return (
        <DataTable
            title="Offers"
            columns={columns}
            data={offers}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
            totalRows={totalRows}
            onPageChange={setPage}
            onRowsPerPageChange={setRowsPerPage}
            onRefresh={fetchOffers}
            onView={(row) => router.push(`/admin/offers/${row.id}`)}
            onEdit={(row) => router.push(`/admin/offers/${row.id}/edit`)}
            createButton={
                <Link href="/admin/offers/create">
                    <Button variant="contained" startIcon={<Plus className="w-4 h-4" />} className="bg-blue-600 hover:bg-blue-700">
                        Create Offer
                    </Button>
                </Link>
            }
        />
    );
}
