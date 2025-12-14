'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { bookingsApi, driversApi, customersApi, vendorsApi } from '@/lib/api';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

// --- Interface Definitions ---
interface DashboardStats {
    todaysBookings: number;
    activeTrips: number;
    pendingAssignments: number;
    completedTrips: number;
    cancelledTrips: number;
    totalRevenue: number;
    bookingsCount: number;
    revenueChart: { name: string; value: number }[];
    statusChart: { name: string; value: number }[];
}

interface RecentBooking {
    id: string;
    bookingId: string;
    name: string;
    pickup: string;
    drop: string;
    pickupDateTime: string;
    status: string;
    finalAmount: number;
    vehicleType?: string;
    driverId?: string;
}

const COLORS = ['#1DB954', '#3B82F6', '#F5A623', '#E5533D', '#64748B'];

export default function DashboardContent() {
    // Dashboard Data State
    const [stats, setStats] = useState<DashboardStats>({
        todaysBookings: 0,
        activeTrips: 0,
        pendingAssignments: 0,
        completedTrips: 0,
        cancelledTrips: 0,
        totalRevenue: 0,
        bookingsCount: 0,
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
            const dashboardRes = await bookingsApi.getDashboard();
            const dashboardData = dashboardRes.data?.data || {};
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
                todaysBookings: backendStats.todaysBookings || 0,
                activeTrips: backendStats.activeTrips || 0,
                pendingAssignments: backendStats.pendingAssignments || 0,
                completedTrips: backendStats.completedTrips || 0,
                cancelledTrips: backendStats.cancelledTrips || 0,
                totalRevenue: backendStats.totalRevenue || 0,
                bookingsCount: backendStats.bookingsCount || 0,
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

    // Helper to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Trip Started': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Booking Confirmed': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'Pending': return 'bg-slate-100 text-slate-600 border-slate-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="p-6 pt-24 min-h-screen bg-slate-50/50">
            {/* 1. KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {/* Total Bookings Today */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 text-sm font-medium">Bookings Today</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">📅</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.todaysBookings}</div>
                    <div className="text-xs text-slate-400 mt-1">New requests</div>
                </div>

                {/* Active Trips */}
                <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-8 -mt-8 opacity-50"></div>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <span className="text-slate-500 text-sm font-medium">Active Trips</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 animate-pulse-subtle">🚗</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800 relative z-10">{loading ? '...' : stats.activeTrips}</div>
                    <div className="text-xs text-emerald-600 font-medium mt-1 relative z-10">Live operations</div>
                </div>

                {/* Pending Driver Assignments (Warning) */}
                <div className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-shadow relative ${stats.pendingAssignments > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100'}`}>
                    {stats.pendingAssignments > 0 && <span className="absolute top-3 right-3 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>}
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 text-sm font-medium">Pending Drivers</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">⚠️</div>
                    </div>
                    <div className="text-2xl font-bold text-amber-700">{loading ? '...' : stats.pendingAssignments}</div>
                    <div className="text-xs text-amber-600 font-medium mt-1">Action required</div>
                </div>

                {/* Completed Trips */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 text-sm font-medium">Completed</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">✅</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.completedTrips}</div>
                    <div className="text-xs text-slate-400 mt-1">Total finished</div>
                </div>

                {/* Failed / Attention */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-slate-500 text-sm font-medium">Cancelled/Failed</span>
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600">❗</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-800">{loading ? '...' : stats.cancelledTrips}</div>
                    <div className="text-xs text-slate-400 mt-1">Needs review</div>
                </div>
            </div>

            {/* 2. Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Trend (2/3 width) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Revenue Trend</h3>
                            <p className="text-xs text-slate-400">Last 7 days performance</p>
                        </div>
                        <div className="text-2xl font-bold text-indigo-600">
                            ₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString() : '0'}
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.revenueChart}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1E2A38" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#1E2A38" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 11 }}
                                    tickFormatter={(value) => `₹${value}`}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Distribution (1/3 width) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">Trip Status</h3>
                    <div className="h-64 w-full relative">
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
                                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-700">{stats.bookingsCount}</div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Booking Control Panel (Recent Activity) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Control Table (3/4 width) */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Booking Control Tower</h3>
                            <p className="text-xs text-slate-400">Live feed of recent bookings</p>
                        </div>
                        <Link href="/bookings" className="text-indigo-600 text-sm font-semibold hover:text-indigo-800 transition-colors">
                            View All Bookings →
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking ID</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-40"></div></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-20"></div></td>
                                            <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-24"></div></td>
                                        </tr>
                                    ))
                                ) : recentBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No recent bookings found
                                        </td>
                                    </tr>
                                ) : (
                                    recentBookings.map((b) => (
                                        <tr key={b.bookingId} className="hover:bg-slate-50/80 transition-colors">
                                            {/* ID */}
                                            <td className="px-6 py-4">
                                                <div className="font-mono text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded w-fit">
                                                    #{b.bookingId.slice(-6)}
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-700">{b.name}</span>
                                                    <span className="text-xs text-slate-400">Via App</span>
                                                </div>
                                            </td>

                                            {/* Route (Map Icon) */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 max-w-[200px]">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                                                        <span className="text-emerald-500">●</span> {b.pickup}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
                                                        <span className="text-red-500">●</span> {b.drop || 'N/A'}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Time relative */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600">
                                                    {new Date(b.pickupDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {new Date(b.pickupDateTime).toLocaleDateString()}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(b.status)}`}>
                                                    {b.status}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4">
                                                {!b.driverId && (b.status === 'Booking Confirmed' || b.status === 'Reassign') ? (
                                                    <Link
                                                        href={`/bookings`}
                                                        className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                                    >
                                                        Assign Driver
                                                    </Link>
                                                ) : (
                                                    <Link
                                                        href={`/bookings/${b.id}`}
                                                        className="text-xs font-medium text-slate-500 hover:text-indigo-600"
                                                    >
                                                        View Details
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Shortcuts (1/4 width) */}
                <div className="flex flex-col gap-4">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-200">
                        <h4 className="font-bold text-lg mb-1">Create Booking</h4>
                        <p className="text-indigo-100 text-xs mb-4">Manual entry for phone orders</p>
                        <Link href="/bookings/create" className="flex items-center justify-center w-full py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors text-sm">
                            + New Booking
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                        <h4 className="font-bold text-slate-700 mb-3 text-sm">Quick Links</h4>
                        <div className="space-y-2">
                            <Link href="/drivers/create" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600">
                                <span className="text-lg">🚗</span> Add Driver
                            </Link>
                            <Link href="/vendors/create" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600">
                                <span className="text-lg">🏢</span> Add Vendor
                            </Link>
                            <Link href="/invoices/create" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600">
                                <span className="text-lg">📄</span> Create Invoice
                            </Link>
                            <Link href="/notifications" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors text-sm text-slate-600">
                                <span className="text-lg">🔔</span> Send Announcements
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
