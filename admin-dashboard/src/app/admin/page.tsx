'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Paper } from '@mui/material';
import {
    FileText,
    Calendar,
    Users,
    Bell,
    Plus,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Activity,
    Tag
} from 'lucide-react';
import DataTable, { Column } from '@/components/admin/DataTable';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

interface Invoice {
    id: string;
    invoiceId: string;
    amount: number;
    status: string;
    createdAt: string;
}

interface Booking {
    id: string;
    bookingId: string;
    customerName: string;
    mobileNumber: string;
    from: string;
    to: string;
    pickupDate: string;
    pickupTime: string;
    tripStatus: string;
    totalAmount: number;
    createdAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState({
        totalDrivers: 0,
        activeTrips: 0,
        totalRevenue: 0,
        pendingApprovals: 0,
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const headers = { Authorization: `Bearer ${localStorage.getItem('admin_token')}` };

            setRecentInvoices([]);

            const bookingsRes = await axios.get(`${API_URL}/api/bookings`, {
                params: { page: 1, limit: 5 },
                headers,
            });

            const dashboardRes = await axios.get(`${API_URL}/api/bookings/dashboard`, {
                headers,
            });

            if (bookingsRes.data?.data) {
                setRecentBookings(bookingsRes.data.data);
            }
            if (dashboardRes.data) {
                setDashboardStats({
                    activeTrips: dashboardRes.data.activeTrips || 0,
                    totalRevenue: dashboardRes.data.totalRevenue || 0,
                    pendingApprovals: dashboardRes.data.pendingApprovals || 0,
                    totalDrivers: dashboardRes.data.activeDrivers || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const invoiceColumns: Column<Invoice>[] = [
        { id: 'invoiceId', label: 'Invoice ID', sortable: true },
        {
            id: 'amount',
            label: 'Amount',
            sortable: true,
            format: (value) => `₹${value.toLocaleString('en-IN')}`,
        },
        {
            id: 'status',
            label: 'Status',
            sortable: true,
            format: (value) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${value === 'Paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400'
                    }`}>
                    {value}
                </span>
            ),
        },
        { id: 'createdAt', label: 'Created At', sortable: true },
    ];

    const bookingColumns: Column<Booking>[] = [
        { id: 'bookingId', label: 'Booking ID', sortable: true },
        { id: 'customerName', label: 'Customer', sortable: true },
        { id: 'mobileNumber', label: 'Mobile', sortable: true },
        {
            id: 'from',
            label: 'From',
            sortable: true,
            format: (value) => <span className="truncate max-w-[150px] block" title={value}>{value}</span>,
        },
        {
            id: 'to',
            label: 'To',
            sortable: true,
            format: (value) => <span className="truncate max-w-[150px] block" title={value}>{value}</span>,
        },
        { id: 'pickupDate', label: 'Date', sortable: true },
        {
            id: 'tripStatus',
            label: 'Status',
            sortable: true,
            format: (value) => (
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${value === 'Completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                    value === 'Cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400' :
                        value === 'Started' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                            'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400'
                    }`}>
                    {value}
                </span>
            ),
        },
        {
            id: 'totalAmount',
            label: 'Amount',
            sortable: true,
            format: (value) => <span className="font-medium">₹{value?.toLocaleString('en-IN') || '0'}</span>,
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Dashboard Heading & Stats */}
            <div className="flex flex-col gap-8">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Overview</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your daily operations at a glance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Drivers"
                        value={dashboardStats.totalDrivers.toLocaleString()}
                        icon={Users}
                        trend="+12%"
                        trendUp={true}
                        color="blue"
                    />
                    <StatCard
                        title="Active Trips"
                        value={dashboardStats.activeTrips.toLocaleString()}
                        icon={Activity}
                        trend="+5%"
                        trendUp={true}
                        color="emerald"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`₹${dashboardStats.totalRevenue.toLocaleString('en-IN')}`}
                        icon={FileText}
                        trend="+18%"
                        trendUp={true}
                        color="indigo"
                    />
                    <StatCard
                        title="Pending Approvals"
                        value={dashboardStats.pendingApprovals.toLocaleString()}
                        icon={Bell}
                        trend="Action required"
                        trendUp={false}
                        urgent={dashboardStats.pendingApprovals > 0}
                        color="amber"
                    />
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Recent Bookings (2/3 width) */}
                <div className="xl:col-span-2 space-y-6">
                    <Paper elevation={0} className="border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-900/50">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Bookings</h3>
                                <p className="text-xs text-gray-500 mt-1">Latest trip requests and updates</p>
                            </div>
                            <Link href="/admin/bookings">
                                <Button
                                    endIcon={<ArrowRight className="w-4 h-4" />}
                                    className="text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10 normal-case font-medium rounded-lg px-3"
                                >
                                    View All
                                </Button>
                            </Link>
                        </div>
                        <DataTable
                            columns={bookingColumns}
                            data={recentBookings}
                            loading={loading}
                            searchable={false}
                            rowsPerPage={5}
                            showFilters={false}
                            showDensity={false}
                            showFullScreen={false}
                            onView={(row) => router.push(`/admin/bookings/${row.id}`)}
                        />
                    </Paper>
                </div>

                {/* Quick Actions & Side Widgets (1/3 width) */}
                <div className="space-y-6">
                    <Paper elevation={0} className="p-6 border border-gray-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 h-full">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
                        <div className="grid gap-3">
                            <ActionButton href="/admin/bookings/create" icon={Plus} label="Create New Booking" primary />
                            <ActionButton href="/admin/drivers" icon={Users} label="Manage Drivers" />
                            <ActionButton href="/admin/invoices/create" icon={FileText} label="Generate Invoice" />
                            <ActionButton href="/admin/notifications/create" icon={Bell} label="Send Notification" />
                            <ActionButton href="/admin/offers/create" icon={Tag} label="Create New Offer" />
                        </div>
                    </Paper>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, trendUp, urgent, color = "blue" }: { title: string, value: string, icon: any, trend?: string, trendUp?: boolean, urgent?: boolean, color?: "blue" | "emerald" | "indigo" | "amber" | "rose" }) {

    const colorStyles = {
        blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400",
        emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400",
        indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400",
        amber: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400",
        rose: "text-rose-600 bg-rose-50 dark:bg-rose-500/10 dark:text-rose-400",
    };

    return (
        <div className={`relative p-6 rounded-2xl border transition-all duration-200 hover:-translate-y-1 bg-white dark:bg-zinc-950 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none ${urgent ? 'border-amber-200 bg-amber-50/30 dark:border-amber-900/50' : 'border-gray-200 dark:border-zinc-800'
            }`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${trendUp ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        urgent ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                            'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                        }`}>
                        {trendUp ? <TrendingUp className="w-3 h-3" /> : !urgent && <TrendingDown className="w-3 h-3" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
            </div>
        </div>
    );
}

function ActionButton({ href, icon: Icon, label, primary }: { href: string, icon: any, label: string, primary?: boolean }) {
    return (
        <Link href={href} className="group block">
            <div className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 ${primary
                ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25'
                : 'bg-white dark:bg-zinc-900/50 border-gray-100 dark:border-zinc-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-600 hover:bg-gray-50'
                }`}>
                <div className={`p-2 rounded-lg ${primary ? 'bg-white/20' : 'bg-gray-100 dark:bg-zinc-800 group-hover:bg-white dark:group-hover:bg-zinc-700'}`}>
                    <Icon className={`w-4 h-4 ${primary ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`} />
                </div>
                <span className="font-medium text-sm">{label}</span>
                {!primary && <ArrowRight className="w-4 h-4 ml-auto text-gray-400 group-hover:translate-x-1 transition-transform" />}
            </div>
        </Link>
    );
}
