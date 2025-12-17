'use client';

import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card } from '@/components/ui';

export default function ProfilePage() {
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch (e) { console.error(e); }
            }
        }
    }, []);

    return (
        <ClientLayout pageTitle="Profile">
            <div className="max-w-4xl mx-auto py-8">
                <Card className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-4xl text-white shadow-xl shadow-indigo-200">
                                {user?.name?.charAt(0) || 'A'}
                            </div>
                            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide border border-indigo-100">
                                {user?.role || 'Administrator'}
                            </span>
                        </div>

                        {/* Details Section */}
                        <div className="flex-1 w-full space-y-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{user?.name || 'Administrator'}</h2>
                                <p className="text-slate-500">Manage your account settings and preferences.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                                    <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {user?.email || 'admin@silvertaxi.in'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                                    <p className="text-slate-700 font-medium bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        {user?.phone || '+91 98765 43210'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <button className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-medium shadow-lg shadow-slate-200">
                                    Edit Profile
                                </button>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </ClientLayout>
    );
}
