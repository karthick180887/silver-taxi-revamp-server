'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/lib/api';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui';

export default function ViewBookingPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchBooking(params.id);
        }
    }, [params.id]);

    const fetchBooking = async (id: string) => {
        try {
            const res = await bookingsApi.getById(id);
            setBooking(res.data?.data || res.data);
        } catch (error) {
            console.error('Failed to fetch booking:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <ClientLayout pageTitle="Booking Details"><div>Loading...</div></ClientLayout>;
    if (!booking) return <ClientLayout pageTitle="Booking Details"><div>Booking not found</div></ClientLayout>;

    const DetailRow = ({ label, value }: { label: string, value: string | number | undefined }) => (
        <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-slate-500 text-sm">{label}</span>
            <span className="text-slate-800 font-medium text-sm text-right">{value || '-'}</span>
        </div>
    );

    return (
        <ClientLayout pageTitle={`Booking #${booking.bookingId}`}>
            <div className="max-w-4xl mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Booking Details</h1>
                        <p className="text-slate-500">View complete booking information</p>
                    </div>
                    <Button variant="ghost" onClick={() => router.push('/bookings')}>
                        ← Back to List
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Customer Info</h2>
                        <DetailRow label="Name" value={booking.name || booking.customerName} />
                        <DetailRow label="Phone" value={booking.phone || booking.customerPhone} />
                        <DetailRow label="Email" value={booking.email} />
                        <DetailRow label="Booked By" value={booking.bookedBy || booking.createdBy} />
                    </div>

                    {/* Trip Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Trip Details</h2>
                        <DetailRow label="Trip Type" value={booking.serviceType} />
                        <DetailRow label="Pickup" value={new Date(booking.pickupDateTime).toLocaleString()} />
                        <DetailRow label="From" value={booking.pickup} />
                        <DetailRow label="To" value={booking.drop} />
                        <DetailRow label="Distance" value={`${booking.distance} km`} />
                    </div>

                    {/* Pricing Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Pricing</h2>
                        <DetailRow label="Base Fare" value={`₹${booking.amountPerKm || 0}/km`} />
                        <DetailRow label="Driver Beta" value={`₹${booking.driverBeta}`} />
                        <DetailRow label="Tax" value={`₹${booking.taxAmount || 0}`} />
                        <div className="flex justify-between py-2 mt-2 border-t border-slate-200 font-bold">
                            <span>Total Amount</span>
                            <span>₹{booking.finalAmount}</span>
                        </div>
                        <DetailRow label="Advance Paid" value={`₹${booking.advanceAmount}`} />
                        <DetailRow label="Payment Status" value={booking.paymentStatus} />
                    </div>

                    {/* Driver Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Driver Info</h2>
                        {booking.driverId ? (
                            <>
                                <DetailRow label="Driver Name" value={booking.driver?.name} />
                                <DetailRow label="Phone" value={booking.driver?.phone} />
                                <DetailRow label="Vehicle" value={booking.vehicleType} />
                                <DetailRow label="Status" value="Assigned" />
                            </>
                        ) : (
                            <div className="text-slate-500 italic">No driver assigned yet.</div>
                        )}
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
