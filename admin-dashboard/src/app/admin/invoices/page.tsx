'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Button,
    Chip,
    IconButton,
    TextField,
    InputAdornment,
    Tabs,
    Tab,
    Box,
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Plus,
    Search,
    Filter,
    FileText,
    Download,
    Eye,
    MoreVertical,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Types
interface Invoice {
    id: string;
    invoiceNo: string;
    customerName: string;
    driverName: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    status: 'draft' | 'generated' | 'sent' | 'paid' | 'void';
    generatedAt: string;
}

export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/invoices`, {
                params: {
                    page,
                    limit: 10,
                    status: statusFilter === 'All' ? '' : statusFilter
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            if (res.data?.data) {
                setInvoices(res.data.data);
                const total = res.data.total || 0;
                setTotalPages(Math.ceil(total / 10));
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'success';
            case 'sent': return 'primary';
            case 'generated': return 'info';
            case 'draft': return 'default';
            case 'void': return 'error';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        Invoices
                    </Typography>
                    <Typography className="text-gray-500 mt-1">
                        Manage and track all trip invoices
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Plus className="w-5 h-5" />}
                    onClick={() => router.push('/admin/invoices/create')} // Optional manual create
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-2.5 shadow-lg shadow-blue-500/20 text-white font-semibold"
                >
                    Create Invoice
                </Button>
            </div>

            {/* Filters & Search */}
            <Paper elevation={0} className="p-4 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                <Tabs
                    value={statusFilter}
                    onChange={(_, val) => { setStatusFilter(val); setPage(1); }}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="primary"
                    indicatorColor="primary"
                    className="border-b border-gray-100 dark:border-zinc-800 mb-4"
                >
                    {['All', 'paid', 'sent', 'generated', 'draft', 'void'].map((status) => (
                        <Tab
                            key={status}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            value={status}
                            className="text-sm font-medium capitalize"
                        />
                    ))}
                </Tabs>

                <div className="flex gap-4 items-center">
                    <TextField
                        placeholder="Search invoices..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </InputAdornment>
                            ),
                        }}
                        className="bg-gray-50 dark:bg-zinc-800/50 rounded-xl"
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' } }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<Filter className="w-4 h-4" />}
                        className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl px-4 min-w-fit"
                    >
                        Filter
                    </Button>
                </div>
            </Paper>

            {/* Invoices Table */}
            <Paper elevation={0} className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                <TableContainer>
                    <Table>
                        <TableHead className="bg-gray-50/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableCell className="font-semibold text-gray-600 pl-6">Invoice No</TableCell>
                                <TableCell className="font-semibold text-gray-600">Customer</TableCell>
                                <TableCell className="font-semibold text-gray-600">Driver</TableCell>
                                <TableCell className="font-semibold text-gray-600">Date</TableCell>
                                <TableCell className="font-semibold text-gray-600 text-right">Amount</TableCell>
                                <TableCell className="font-semibold text-gray-600 text-center">Status</TableCell>
                                <TableCell className="font-semibold text-gray-600 text-center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" className="py-12">
                                        <CircularProgress size={32} className="text-blue-600" />
                                    </TableCell>
                                </TableRow>
                            ) : invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" className="py-12 text-gray-500">
                                        No invoices found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <TableCell className="pl-6 font-medium text-blue-600">
                                            {invoice.invoiceNo}
                                        </TableCell>
                                        <TableCell>
                                            <Typography className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {invoice.customerName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography className="text-sm text-gray-600 dark:text-gray-400">
                                                {invoice.driverName}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-sm">
                                                    {new Date(invoice.generatedAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell align="right" className="font-semibold text-gray-900">
                                            ₹{invoice.totalAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={invoice.status}
                                                size="small"
                                                color={getStatusColor(invoice.status) as any}
                                                className="capitalize font-medium rounded-lg px-2"
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <div className="flex justify-center gap-2">
                                                <Tooltip title="View Details">
                                                    <IconButton
                                                        size="small"
                                                        className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                                        onClick={() => router.push(`/admin/invoices/${invoice.id}`)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Download PDF">
                                                    <IconButton size="small" className="text-gray-500 hover:text-green-600 hover:bg-green-50">
                                                        <Download className="w-4 h-4" />
                                                    </IconButton>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination (Simple for now) */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-2">
                    <Button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="text-gray-600"
                    >
                        Previous
                    </Button>
                    <Button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="text-gray-600"
                    >
                        Next
                    </Button>
                </div>
            </Paper>
        </div>
    );
}
