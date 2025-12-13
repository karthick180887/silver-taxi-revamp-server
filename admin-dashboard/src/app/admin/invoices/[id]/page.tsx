'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Paper,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Box,
    Grid,
    Divider,
    IconButton
} from '@mui/material';
import {
    ArrowLeft,
    Download,
    Send,
    Printer,
    Mail
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function InvoiceDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const invoiceId = Array.isArray(params.id) ? params.id[0] : params.id;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!invoiceId) return;
        const fetchInvoice = async () => {
            try {
                const res = await axios.get(`${API_URL}/admin/invoices/${invoiceId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
                });
                if (res.data?.data) {
                    setInvoice(res.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch invoice details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId]);

    if (loading) {
        return <div className="flex justify-center p-12"><CircularProgress /></div>;
    }

    if (!invoice) {
        return <div className="text-center p-12 text-gray-500">Invoice not found</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button
                        onClick={() => router.back()}
                        className="min-w-0 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <Typography variant="h5" className="font-bold text-gray-900 dark:text-white">
                                {invoice.invoiceNo}
                            </Typography>
                            <Chip
                                label={invoice.status}
                                size="small"
                                color={invoice.status === 'paid' ? 'success' : 'primary'}
                                className="capitalize"
                            />
                        </div>
                        <Typography className="text-sm text-gray-500 mt-1">
                            Generated on {new Date(invoice.generatedAt).toLocaleDateString()}
                        </Typography>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outlined" startIcon={<Printer className="w-4 h-4" />}>
                        Print
                    </Button>
                    <Button variant="outlined" startIcon={<Download className="w-4 h-4" />}>
                        Download
                    </Button>
                    <Button variant="contained" className="bg-blue-600" startIcon={<Mail className="w-4 h-4" />}>
                        Send Email
                    </Button>
                </div>
            </div>

            {/* Invoice Content */}
            <Paper elevation={0} className="border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm p-8">
                {/* Header Section */}
                <div className="flex justify-between mb-8">
                    <div>
                        <Typography variant="h6" className="font-bold mb-2">Billed To:</Typography>
                        <Typography className="text-gray-600 dark:text-gray-400">{invoice.customerName}</Typography>
                        <Typography className="text-sm text-gray-500">Customer ID: {invoice.customerId}</Typography>
                    </div>
                    <div className="text-right">
                        <Typography variant="h6" className="font-bold mb-2">Driver:</Typography>
                        <Typography className="text-gray-600 dark:text-gray-400">{invoice.driverName}</Typography>
                        <Typography className="text-sm text-gray-500">Driver ID: {invoice.driverId}</Typography>
                    </div>
                </div>

                <Divider className="my-6" />

                {/* Booking Info */}
                <div className="mb-8">
                    <Typography className="text-sm text-gray-500 mb-1">Booking Reference</Typography>
                    <Typography className="font-semibold">{invoice.bookingId}</Typography>
                </div>

                {/* Line Items (Mocked based on Amount) */}
                <TableContainer>
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-zinc-800">
                                <th className="py-3 font-semibold text-gray-600">Description</th>
                                <th className="py-3 font-semibold text-gray-600 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="py-4 text-gray-900 dark:text-gray-100">Trip Fare</td>
                                <td className="py-4 text-right font-medium">₹{invoice.amount.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-4 text-gray-900 dark:text-gray-100">Tax</td>
                                <td className="py-4 text-right font-medium">₹{invoice.taxAmount.toLocaleString()}</td>
                            </tr>
                            <tr className="border-t border-gray-100 dark:border-zinc-800">
                                <td className="py-4 font-bold text-lg">Total</td>
                                <td className="py-4 text-right font-bold text-lg text-blue-600">₹{invoice.totalAmount.toLocaleString()}</td>
                            </tr>
                        </tbody>
                    </table>
                </TableContainer>
            </Paper>
        </div>
    );
}

function TableContainer({ children }: { children: React.ReactNode }) {
    return <div className="overflow-x-auto">{children}</div>;
}
