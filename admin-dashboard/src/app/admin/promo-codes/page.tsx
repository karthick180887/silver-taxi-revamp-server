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
    CircularProgress,
    Tooltip
} from '@mui/material';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Copy,
    Tag
} from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// Types
interface PromoCode {
    id: string;
    code: string;
    description: string;
    type: 'flat' | 'percentage';
    value: number;
    minOrderAmount: number;
    maxDiscount?: number;
    usageLimit: number;
    usageCount: number;
    status: 'active' | 'inactive' | 'expired';
    startDate: string;
    endDate: string;
}

export default function PromoCodesPage() {
    const router = useRouter();
    const [promos, setPromos] = useState<PromoCode[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchPromos = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/admin/promo-codes`, {
                params: {
                    page,
                    limit: 10,
                    status: statusFilter === 'All' ? '' : statusFilter
                },
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            if (res.data?.data) {
                setPromos(res.data.data);
                const total = res.data.total || 0;
                setTotalPages(Math.ceil(total / 10));
            }
        } catch (error) {
            console.error('Failed to fetch promo codes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, [page, statusFilter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'inactive': return 'default';
            case 'expired': return 'error';
            default: return 'default';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show snackbar here
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <Typography variant="h4" className="font-bold text-gray-900 dark:text-white">
                        Promo Codes
                    </Typography>
                    <Typography className="text-gray-500 mt-1">
                        Manage discount coupons and promotional offers
                    </Typography>
                </div>
                <Button
                    variant="contained"
                    startIcon={<Plus className="w-5 h-5" />}
                    onClick={() => router.push('/admin/promo-codes/create')}
                    className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-2.5 shadow-lg shadow-blue-500/20 text-white font-semibold"
                >
                    Create Promo
                </Button>
            </div>

            {/* Filters & Search */}
            <Paper elevation={0} className="p-4 border border-gray-100 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm">
                <Tabs
                    value={statusFilter}
                    onChange={(_, val) => { setStatusFilter(val); setPage(1); }}
                    textColor="primary"
                    indicatorColor="primary"
                    className="border-b border-gray-100 dark:border-zinc-800 mb-4"
                >
                    {['All', 'active', 'inactive', 'expired'].map((status) => (
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
                        placeholder="Search codes..."
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
                </div>
            </Paper>

            {/* Promos Table */}
            <Paper elevation={0} className="border border-gray-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                <TableContainer>
                    <Table>
                        <TableHead className="bg-gray-50/50 dark:bg-zinc-800/50">
                            <TableRow>
                                <TableCell className="font-semibold text-gray-600 pl-6">Code</TableCell>
                                <TableCell className="font-semibold text-gray-600">Type</TableCell>
                                <TableCell className="font-semibold text-gray-600">Value</TableCell>
                                <TableCell className="font-semibold text-gray-600">Usage</TableCell>
                                <TableCell className="font-semibold text-gray-600">Validity</TableCell>
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
                            ) : promos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" className="py-12 text-gray-500">
                                        No promo codes found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                promos.map((promo) => (
                                    <TableRow key={promo.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => copyToClipboard(promo.code)}>
                                                <Tag className="w-4 h-4 text-blue-600" />
                                                <span className="font-mono font-medium text-gray-900 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                                                    {promo.code}
                                                </span>
                                                <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <Typography variant="caption" className="text-gray-500 mt-1 block max-w-xs truncate">
                                                {promo.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize text-sm text-gray-700">{promo.type}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-semibold text-gray-900">
                                                {promo.type === 'percentage' ? `${promo.value}%` : `₹${promo.value}`}
                                            </span>
                                            {promo.maxDiscount && promo.maxDiscount > 0 && (
                                                <div className="text-xs text-gray-500">Max ₹{promo.maxDiscount}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {promo.usageCount} / {promo.usageLimit > 0 ? promo.usageLimit : '∞'}
                                                </span>
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 rounded-full"
                                                        style={{ width: `${Math.min((promo.usageCount / (promo.usageLimit || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs text-gray-500">
                                                <div>{new Date(promo.startDate).toLocaleDateString()}</div>
                                                <div>to {new Date(promo.endDate).toLocaleDateString()}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={promo.status}
                                                size="small"
                                                color={getStatusColor(promo.status) as any}
                                                className="capitalize font-medium rounded-lg px-2"
                                                variant="filled"
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <div className="flex justify-center gap-1">
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" className="text-gray-500 hover:text-blue-600">
                                                        <Edit2 className="w-4 h-4" />
                                                    </IconButton>
                                                </Tooltip>
                                                {/* Mock Delete */}
                                                <Tooltip title="Delete">
                                                    <IconButton size="small" className="text-gray-500 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
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

                {/* Pagination */}
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
