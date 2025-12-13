'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatCard, DataTable, StatusBadge } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { bookingsApi, driversApi, customersApi, vendorsApi } from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Interface Definitions ---
interface DashboardData {
    stats: {
        totalBookings: number;
        totalRevenue: number;
        bookingsCount: number;
    };
    charts: {
        revenue: { date: string; revenue: string | number }[];
        status: { status: string; count: string | number }[]; // Renamed in backend?
    };
}

interface DashboardStats {
    totalBookings: number;
    totalDrivers: number;
    totalCustomers: number;
    totalVendors: number;
    totalRevenue: number;
    revenueChart: { name: string; value: number }[];
    statusChart: { name: string; value: number }[];
}

interface RecentBooking {
    id: string;
    bookingId: string;
    customerName: string; // May need mapping from customer object
    pickupLocation: string;
    dropLocation: string;
    status: string;
    amount: number;
    createdAt: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function DashboardContent() {
    // Dashboard Data State
    const [stats, setStats] = useState<DashboardStats>({
        totalBookings: 0,
        totalDrivers: 0,
        totalCustomers: 0,
        totalVendors: 0,
        totalRevenue: 0,
        revenueChart: [],
        statusChart: [],
    });
    const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, driversRes, customersRes, vendorsRes] = await Promise.all([
                bookingsApi.getDashboard(),
                driversApi.getAll({ limit: 1 }), // Just for count
                customersApi.getAll({ limit: 1 }),
                vendorsApi.getAll({ limit: 1 }),
            ]);

            const dashboardData = dashboardRes.data?.data || {};

            // Backend returns: data: { stats: { totalRevenue, bookingsCount }, charts: { revenue: [], status: [] } }
            // OR checks for old structure fallback if backend update pending? 
            // We assume backend update is live.

            const backendStats = dashboardData.stats || {};
            const backendCharts = dashboardData.charts || {};

            // Parse Revenue Chart
            const revenueChartData = (backendCharts.revenue || []).map((item: any) => ({
                name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
                value: Number(item.revenue || 0)
            }));

            // Parse Status Chart
            const statusChartData = (backendCharts.status || []).map((item: any) => ({
                name: item.status,
                value: Number(item.count)
            }));

            setStats({
                totalBookings: backendStats.bookingsCount || dashboardData.bookingsCount || 0,
                totalRevenue: backendStats.totalRevenue || dashboardData.totalRevenue || 0,
                totalDrivers: driversRes.data?.data?.count || driversRes.data?.data?.driversCount?.total || 0,
                totalCustomers: customersRes.data?.data?.count || 0,
                totalVendors: vendorsRes.data?.data?.count || 0,
                revenueChart: revenueChartData,
                statusChart: statusChartData,
            });

            // Fetch Recent Bookings
            const recentRes = await bookingsApi.getRecent({ limit: 5 });
            const recentData = recentRes.data?.data || [];
            const bookingsArray = Array.isArray(recentData) ? recentData : (recentData.rows || []);
            setRecentBookings(bookingsArray);

        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const bookingColumns = [
        { key: 'bookingId', header: 'ID', render: (b: RecentBooking) => <span className="text-xs font-mono">{b.bookingId}</span> },
        { key: 'pickupDateTime', header: 'Date', render: (b: any) => new Date(b.pickupDateTime).toLocaleDateString() },
        { key: 'status', header: 'Status', render: (b: RecentBooking) => <StatusBadge status={b.status} /> },
        { key: 'finalAmount', header: 'Amount', render: (b: any) => `₹${b.finalAmount?.toLocaleString() || 0}` },
    ];

    return (
        <ClientLayout pageTitle="Dashboard Overview">
            {/* 1. Key Statistics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <StatCard
                    title="Total Revenue"
                    value={loading ? '...' : `₹${stats.totalRevenue.toLocaleString()}`}
                    icon={<span>💰</span>}
                    trend="up"
                    change={0} // To be implemented
                    className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100"
                />
                <StatCard
                    title="Total Bookings"
                    value={loading ? '...' : stats.totalBookings.toLocaleString()}
                    icon={<span>📅</span>}
                    trend="up"
                    change={0}
                />
                <StatCard
                    title="Active Drivers"
                    value={loading ? '...' : stats.totalDrivers.toLocaleString()}
                    icon={<span>🚗</span>}
                    trend="neutral"
                    change={0}
                />
                <StatCard
                    title="Customers"
                    value={loading ? '...' : stats.totalCustomers.toLocaleString()}
                    icon={<span>👥</span>}
                    trend="up"
                    change={0}
                />
                <StatCard
                    title="Vendors"
                    value={loading ? '...' : stats.totalVendors.toLocaleString()}
                    icon={<span>🏢</span>}
                    trend="neutral"
                    change={0}
                />
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Revenue Trend (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Revenue Trend (Last 7 Days)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueChart}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution (1/3 width) */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Booking Status</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.statusChart}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.statusChart.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* 3. Recent Activity & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Bookings Table (2/3 width) */}
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800">Recent Bookings</h3>
                        <Link href="/bookings" className="text-indigo-600 text-sm font-medium hover:text-indigo-700">View All →</Link>
                    </div>
                    <DataTable
                        data={recentBookings}
                        columns={bookingColumns}
                        keyExtractor={(b) => b.bookingId}
                        loading={loading}
                        emptyMessage="No recent bookings"
                    />
                </div>

                {/* Quick Actions (1/3 width) */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 gap-3">
                        <Link href="/bookings/create" className="flex items-center gap-3 p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <span className="text-xl">📅</span>
                            <div className="font-medium">Create New Booking</div>
                        </Link>
                        <Link href="/drivers/create" className="flex items-center gap-3 p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xl">🚗</span>
                            <div className="font-medium">Add New Driver</div>
                        </Link>
                        <Link href="/invoices/create" className="flex items-center gap-3 p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xl">📄</span>
                            <div className="font-medium">Generate Invoice</div>
                        </Link>
                        <Link href="/vendors/create" className="flex items-center gap-3 p-3 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                            <span className="text-xl">🏢</span>
                            <div className="font-medium">Onboard Vendor</div>
                        </Link>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
