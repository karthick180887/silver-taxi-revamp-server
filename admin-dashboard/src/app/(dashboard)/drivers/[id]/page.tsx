'use client';

import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button, Card, StatusBadge, Input, DataTable } from '@/components/ui';
import { driversApi, bookingsApi, walletTransactionsApi } from '@/lib/api';
import { useParams } from 'next/navigation';

export default function DriverDetailsPage() {
    const params = useParams();
    const id = params?.id as string;

    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    useEffect(() => {
        if (id) {
            fetchDriverDetails();
        }
    }, [id]);

    const fetchDriverDetails = async () => {
        setLoading(true);
        try {
            const res = await driversApi.getById(id);
            setDriver(res.data?.data || res.data);
        } catch (error) {
            console.error('Failed to fetch driver details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <ClientLayout pageTitle="Driver Details">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </ClientLayout>
        );
    }

    if (!driver) {
        return (
            <ClientLayout pageTitle="Driver Details">
                <div className="flex items-center justify-center h-64 text-slate-500">
                    Driver not found
                </div>
            </ClientLayout>
        );
    }

    const tabs = [
        { id: 'profile', label: 'Profile & Documents' },
        { id: 'vehicle', label: 'Vehicle Details' },
        { id: 'wallet', label: 'Wallet' },
        { id: 'bookings', label: 'Booking History' },
    ];

    return (
        <ClientLayout pageTitle="Driver Details">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">Driver Details</h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-700">
                        {driver.name} - {driver.phone}
                        <span className="ml-2 cursor-pointer text-indigo-600">
                            <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </span>
                    </h2>
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {driver.name.charAt(0)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg w-full">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-6">
                {activeTab === 'profile' && <ProfileTab driver={driver} />}
                {activeTab === 'vehicle' && <VehicleTab driver={driver} />}
                {activeTab === 'wallet' && <WalletTab driver={driver} />}
                {activeTab === 'bookings' && <BookingHistoryTab driverId={driver.driverId} />}
            </div>
        </ClientLayout>
    );
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function ProfileTab({ driver }: { driver: any }) {
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Driver Information</h3>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">✓</Button>
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">✕</Button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-slate-500 font-medium">Full Name:</span>
                        <span className="col-span-2 text-slate-800">{driver.name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Empty for spacing if needed or another field */}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-slate-500 font-medium">Phone Number:</span>
                        <span className="col-span-2 text-slate-800">{driver.phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Empty */}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-slate-500 font-medium">Status:</span>
                        <span className="col-span-2"><StatusBadge status={driver.status || 'inactive'} /></span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        {/* Empty */}
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <span className="text-slate-500 font-medium">Verification Status:</span>
                        <span className="col-span-2 capitalize">{driver.verificationStatus || driver.profileVerified || 'Pending'}</span>
                    </div>
                </div>
            </Card>

            <h3 className="text-lg font-semibold text-slate-800 pt-4">Document Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DocumentCard
                    title="Aadhar Front"
                    imageUrl={driver.aadharImageFront}
                    status={driver.aadharImageFrontVerified}
                />
                <DocumentCard
                    title="Aadhar Back"
                    imageUrl={driver.aadharImageBack}
                    status={driver.aadharImageBackVerified}
                />
                <DocumentCard
                    title="License Front"
                    imageUrl={driver.licenseImageFront}
                    status={driver.licenseImageFrontVerified}
                />
                <DocumentCard
                    title="License Back"
                    imageUrl={driver.licenseImageBack}
                    status={driver.licenseImageBackVerified}
                />
            </div>
        </div>
    );
}

function VehicleTab({ driver }: { driver: any }) {
    const vehicle = driver.vehicle?.[0] || driver.vehicle || {};
    return (
        <div className="space-y-6">
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">{vehicle.name || 'Vehicle Checks'}</h3>
                    <StatusBadge status={vehicle.adminVerified || 'Pending'} />
                </div>
                <div className="mb-4">
                    <h4 className="text-md font-medium text-slate-700 mb-4">Vehicle Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-slate-500 font-medium">Vehicle Type:</span>
                            <span className="col-span-2 text-slate-800">{vehicle.vehicleType || '-'}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-green-600 border-green-200 bg-green-50">✓</Button>
                            <Button variant="outline" size="sm" className="text-red-600 border-red-200 bg-red-50">✕</Button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-slate-500 font-medium">Vehicle Number:</span>
                            <span className="col-span-2 text-slate-800">{vehicle.vehicleNumber || '-'}</span>
                        </div>
                        <div className="col-span-2"></div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-slate-500 font-medium">Fuel Type:</span>
                            <span className="col-span-2 text-slate-800">{vehicle.fuelType || 'Petrol'}</span> // Defaulted based on screenshot
                        </div>
                        <div className="col-span-2"></div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-slate-500 font-medium">Verification Status:</span>
                            <span className="col-span-2 capitalize">{vehicle.adminVerified || 'Pending'}</span>
                        </div>
                    </div>
                </div>

                <h4 className="text-md font-medium text-slate-700 mb-4 pt-4 border-t border-slate-100">Vehicle Documents</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DocumentCard
                        title="RC Book Front"
                        imageUrl={vehicle.rcFront}
                        status={vehicle.rcVerified}
                    />
                    <DocumentCard
                        title="RC Book Back"
                        imageUrl={vehicle.rcBack} // Assuming field name
                        status={vehicle.rcVerified}
                    />
                    <DocumentCard
                        title="Insurance"
                        imageUrl={vehicle.insuranceImage}
                        status={vehicle.insuranceVerified}
                    />
                </div>
            </Card>
        </div>
    );
}

function WalletTab({ driver }: { driver: any }) {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (driver?.driverId) {
            fetchTransactions();
        }
    }, [driver?.driverId]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const res = await walletTransactionsApi.getByDriver(driver.driverId);
            setTransactions(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Failed to fetch wallet transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800">Wallet Transactions</h3>
                {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full w-8 h-8 flex items-center justify-center p-0">
                    +
                </Button> */}
            </div>

            <Card className="bg-purple-50 border-purple-100 max-w-sm">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Wallet Balance</p>
                        <h2 className="text-3xl font-bold text-slate-900">₹{driver.wallet?.balance || driver.walletBalance || 0}</h2>
                    </div>
                    <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
            </Card>

            <Card>
                {/* <div className="flex gap-4 mb-4">
                    <Input placeholder="Search ..." className="max-w-xs" />
                </div> */}
                <DataTable
                    data={transactions}
                    loading={loading}
                    columns={[
                        { key: 'sno', header: 'S.No', render: (_, i) => i + 1 },
                        { key: 'transactionId', header: 'Transaction ID' },
                        { key: 'status', header: 'Status', render: (t: any) => <StatusBadge status={t.status || 'Success'} /> },
                        { key: 'name', header: 'Name/Phone', render: (t: any) => t.initiatedBy || '-' },
                        { key: 'description', header: 'Description', render: (t: any) => t.description || '-' },
                        { key: 'type', header: 'Type', render: (t: any) => <span className={t.type?.toLowerCase() === 'credit' ? 'text-green-600' : 'text-red-600'}>{t.type?.toUpperCase()}</span> },
                        { key: 'amount', header: 'Amount', render: (t: any) => `₹${t.amount}` },
                        { key: 'createdAt', header: 'Date', render: (t: any) => new Date(t.createdAt).toLocaleDateString() },
                    ]}
                    keyExtractor={(t: any) => t.id || Math.random().toString()}
                    emptyMessage="No transactions found"
                />
            </Card>
        </div>
    );
}

function BookingHistoryTab({ driverId }: { driverId: string }) {
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalTrips: 0, totalEarned: 0, walletBalance: 0 });

    useEffect(() => {
        if (driverId) {
            fetchBookings();
        }
    }, [driverId]);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await bookingsApi.getAll({ driverId: driverId });
            const data = res.data?.data?.bookings || res.data?.data || [];
            const bookingsArray = Array.isArray(data) ? data : [];
            setBookings(bookingsArray);

            // Calculate stats
            const totalTrips = bookingsArray.length;
            const totalEarned = bookingsArray.reduce((sum: number, b: any) => sum + (Number(b.driverBeta) || 0), 0);
            // walletBalance is part of driver object, fetching again or passing prop is better, 
            // but here we can't easily get it unless passed. 
            // Since this is a tab, we probably should prioritize passed driver object.
            // But let's leave it 0 or remove for now if tricky. 
            // Actually, we can just leave it as 0 or derive if we refactor.
            // Let's stick to what we have in props or context.
            // The previous component didn't receive driver wallet in props properly for this tab.

            setStats({ totalTrips, totalEarned, walletBalance: 0 });

        } catch (error) {
            console.error('Failed to fetch bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-green-50 border-green-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Trips</p>
                            <h2 className="text-3xl font-bold text-slate-900">{stats.totalTrips}</h2>
                        </div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">Total Earned</p>
                            <h2 className="text-3xl font-bold text-slate-900">₹{stats.totalEarned}</h2>
                        </div>
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </Card>
                {/* <Card className="bg-purple-50 border-purple-100">
                     <div className="flex justify-between items-start">
                        <div>
                             <p className="text-sm font-medium text-slate-500 mb-1">Wallet Balance</p>
                             <h2 className="text-3xl font-bold text-slate-900">{stats.walletBalance}</h2>
                        </div>
                         <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                </Card> */}
            </div>

            <Card>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Booking History</h3>
                {/* <div className="flex justify-between gap-4 mb-4">
                    <Input placeholder="Search ..." className="max-w-xs" />
                     <div className="flex gap-2">
                     </div>
                 </div> */}
                <DataTable
                    data={bookings}
                    loading={loading}
                    columns={[
                        { key: 'sno', header: 'S.No', render: (_, i) => i + 1 },
                        { key: 'bookingId', header: 'Booking ID' },
                        { key: 'customerName', header: 'Customer Name', render: (b: any) => b.name || b.customerName || '-' },
                        { key: 'phone', header: 'Mobile Number' },
                        { key: 'pickup', header: 'From', width: '200px' },
                        { key: 'drop', header: 'To', width: '200px', render: (b: any) => b.drop || '-' },
                        { key: 'driverBeta', header: 'Driver Beta', render: (b: any) => `₹${b.driverBeta || 0}` },
                        { key: 'amount', header: 'Estimated Amount', render: (b: any) => `₹${b.finalAmount || b.estimatedAmount || 0}` },
                        { key: 'date', header: 'Pick Date', render: (b: any) => new Date(b.pickupDateTime || b.createdAt).toLocaleDateString() },
                    ]}
                    keyExtractor={(b: any) => b.id}
                    emptyMessage="No bookings found"
                />
            </Card>
        </div>
    );
}

function DocumentCard({ title, imageUrl, status }: { title: string, imageUrl?: string, status?: string }) {
    return (
        <Card className="p-4 border border-slate-200">
            <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-slate-700">{title}</span>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0 flex items-center justify-center text-green-600 border-green-200 bg-green-50 hover:bg-green-100">✓</Button>
                    <Button variant="outline" size="sm" className="w-8 h-8 p-0 flex items-center justify-center text-red-600 border-red-200 bg-red-50 hover:bg-red-100">✕</Button>
                </div>
            </div>
            <div className="bg-slate-100 rounded-lg h-48 flex items-center justify-center overflow-hidden border border-slate-200">
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-slate-400 text-sm">No Document</span>
                )}
            </div>
        </Card>
    );
}

