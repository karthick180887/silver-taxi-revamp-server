'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui';

export default function EditBookingPage({ params }: { params: { id: string } }) {
    const router = useRouter();

    return (
        <ClientLayout pageTitle="Edit Booking">
            <div className="max-w-2xl mx-auto p-6 pt-24">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Edit Booking #{params.id}</h1>
                    <p className="text-slate-500 mb-6">
                        Edit functionality is currently being implemented. You can delete and re-create the booking if changes are urgent.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="ghost" onClick={() => router.push('/bookings')}>
                            Back to List
                        </Button>
                        <Button onClick={() => router.push(`/bookings/${params.id}`)}>
                            View Details
                        </Button>
                    </div>
                </div>
            </div>
        </ClientLayout>
    );
}
