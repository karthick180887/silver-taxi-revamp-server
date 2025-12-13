'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Activity,
    UserX,
    Search,
    Filter,
    RefreshCw,
    MoreHorizontal,
    Eye,
    Trash2,
    Download
} from 'lucide-react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    Button,
    Chip,
    Avatar,
    TextField,
    InputAdornment,
    Menu,
    MenuItem
} from '@mui/material';

// Mock Data matching the screenshot structure
const MOCK_DRIVERS = [
    { id: 'SLTD947317155', name: 'Prem Kumar A', phone: '8072394731', balance: 0, status: 'Inactive', online: false, reason: '-' },
    { id: 'SLTD000997154', name: 'Ramachandran. k', phone: '9789400099', balance: 0, status: 'Inactive', online: false, reason: '-' },
    { id: 'SLTD815757153', name: 'Gnana raja D', phone: '9445291575', balance: 0, status: 'Inactive', online: false, reason: '-' },
    { id: 'SLTD267757147', name: 'asif', phone: '9363426776', balance: 0, status: 'Active', online: false, reason: '-' },
    { id: 'SLTD268447144', name: 'vetri', phone: '9043928844', balance: 0, status: 'Active', online: false, reason: '-' },
    { id: 'SLTD905907142', name: 'Krishna moorthy', phone: '9600490590', balance: 0, status: 'Active', online: false, reason: '-' },
    { id: 'SLTD024557138', name: 'Prabhu', phone: '9629992455', balance: 0, status: 'Active', online: false, reason: '-' },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function DriversPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const router = useRouter();

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            // Adjust API URL as needed (assuming API Gateway is at localhost:8080)
            const url = statusFilter === 'All'
                ? `${API_URL}/admin/drivers`
                : `${API_URL}/admin/drivers?status=${statusFilter}`;

            const token = localStorage.getItem('admin_token');
            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setDrivers(data.data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, [statusFilter]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const filteredDrivers = drivers.filter(d =>
        d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone?.includes(searchTerm) ||
        d.id?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Drivers</h1>
                <div className="flex gap-2">
                    {/* Status Tabs */}
                    {['All', 'Pending', 'Active', 'Inactive'].map(status => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? 'contained' : 'outlined'}
                            onClick={() => setStatusFilter(status)}
                            size="small"
                        >
                            {status}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Stats Cards - TODO: Fetch real stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    label="Completed"
                    value={drivers.length.toString()}
                    color="bg-green-50 border-green-100"
                    textColor="text-green-600"
                    icon={<Activity className="w-5 h-5" />}
                />
                <StatCard
                    label="Active Drivers"
                    value={drivers.filter(d => d.status === 'Active').length.toString()}
                    color="bg-blue-50 border-blue-100"
                    textColor="text-blue-600"
                    icon={<Users className="w-5 h-5" />}
                />
                <StatCard
                    label="Pending Approval"
                    value={drivers.filter(d => d.verificationStatus === 'pending').length.toString()}
                    color="bg-orange-50 border-orange-100"
                    textColor="text-orange-600"
                    icon={<UserX className="w-5 h-5" />}
                />
            </div>

            {/* Table Section */}
            <Paper elevation={0} className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-zinc-800">
                    <TextField
                        placeholder="Search ..."
                        size="small"
                        variant="outlined"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search className="w-4 h-4 text-gray-400" />
                                </InputAdornment>
                            ),
                            className: "bg-gray-50 dark:bg-zinc-900 rounded-lg"
                        }}
                        className="w-full sm:w-72"
                    />

                    <div className="flex gap-2">
                        <IconButton onClick={fetchDrivers} size="small" className="border border-gray-200 rounded-lg p-2"><RefreshCw className="w-4 h-4" /></IconButton>
                    </div>
                </div>

                {/* Mui Table */}
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="drivers table">
                        <TableHead>
                            <TableRow className="bg-gray-50 dark:bg-zinc-900/50">
                                <TableCell className="font-semibold text-gray-600">S.No</TableCell>
                                <TableCell className="font-semibold text-gray-600">Driver ID</TableCell>
                                <TableCell className="font-semibold text-gray-600">Driver Name</TableCell>
                                <TableCell className="font-semibold text-gray-600">Phone Number</TableCell>
                                <TableCell className="font-semibold text-gray-600">Verification</TableCell>
                                <TableCell className="font-semibold text-gray-600">Status</TableCell>
                                <TableCell className="font-semibold text-gray-600" align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">Loading...</TableCell>
                                </TableRow>
                            ) : filteredDrivers.map((driver, index) => (
                                <TableRow
                                    key={driver.id || index}
                                    className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-gray-100 last:border-0"
                                >
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>
                                        <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">{driver.id}</span>
                                    </TableCell>
                                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{driver.name || 'N/A'}</TableCell>
                                    <TableCell>{driver.phone}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={driver.verificationStatus || 'Unknown'}
                                            size="small"
                                            className={`${driver.verificationStatus === 'verified' ? 'bg-green-100 text-green-700' : (driver.verificationStatus === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700')} font-semibold rounded-md uppercase`}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={driver.status || 'Inactive'}
                                            size="small"
                                            className={`${driver.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} font-semibold rounded-md`}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <div className="flex justify-end gap-1">
                                            <IconButton
                                                onClick={() => router.push(`/admin/drivers/${driver.id}`)}
                                                size="small"
                                                className="text-blue-500 hover:bg-blue-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </IconButton>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </div>
    );
}

function StatCard({ label, value, color, textColor, icon }: any) {
    return (
        <div className={`p-6 rounded-xl border-l-4 ${color} shadow-sm bg-white dark:bg-zinc-800 flex flex-col justify-between h-32`}>
            <div className="flex justify-between items-start">
                <span className="font-medium text-gray-600 dark:text-gray-400">{label}</span>
                <div className={`p-2 rounded-lg ${textColor} bg-opacity-10`}>{icon}</div>
            </div>
            <div className={`text-4xl font-bold ${textColor}`}>
                {value}
            </div>
        </div>
    )
}
