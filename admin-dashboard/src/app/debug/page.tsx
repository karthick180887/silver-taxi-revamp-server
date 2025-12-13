'use client';

import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { authApi, driversApi, vendorsApi, bookingsApi } from '../../lib/api';
import api from '../../lib/api'; // Added import

export default function DebugPage() {
    const [logs, setLogs] = useState<string[]>([]);
    const [envInfo, setEnvInfo] = useState<any>({});
    const [responses, setResponses] = useState<any>({});

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1]} - ${msg}`]);

    useEffect(() => {
        runDiagnostics();
    }, []);

    const runDiagnostics = async () => {
        addLog('Starting diagnostics...');

        // Check Environment
        const env = {
            NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
            NodeEnv: process.env.NODE_ENV,
            WindowLocation: window.location.href,
        };
        setEnvInfo(env);
        addLog(`Environment: ${JSON.stringify(env)}`);

        // Check Token
        const token = localStorage.getItem('token');
        addLog(`Auth Token: ${token ? `Present (${token.substring(0, 10)}...)` : 'MISSING'}`);

        // Test APIs
        try {
            addLog('Fetching Drivers (/admin/drivers)...');
            const res = await api.get('/admin/drivers', { params: { limit: 1 } });
            setResponses((r: any) => ({ ...r, drivers: res.data }));
            addLog(`Drivers (/admin/drivers) Status: ${res.status}`);
        } catch (e: any) {
            addLog(`Drivers (/admin/drivers) Error: ${e.response?.status || e.message}`);
        }

        addLog('Fetching Drivers (/v1/drivers)...');
        const res = await api.get('/v1/drivers', { params: { limit: 1 } });
        setResponses((r: any) => ({ ...r, driversV1: res.data }));
        addLog(`Drivers (/v1/drivers) Status: ${res.status}`);
        addLog(`Drivers Data Structure: ${JSON.stringify(res.data).slice(0, 200)}...`); // Log structure

        try {
            addLog('Fetching Drivers (/drivers)...');
            const res = await api.get('/drivers', { params: { limit: 1 } });
            setResponses((r: any) => ({ ...r, driversRoot: res.data }));
            addLog(`Drivers (/drivers) Status: ${res.status}`);
        } catch (e: any) {
            addLog(`Drivers (/drivers) Error: ${e.response?.status || e.message}`);
        }

        try {
            addLog('Fetching Drivers (/v1/admin/drivers)...');
            const res = await api.get('/v1/admin/drivers', { params: { limit: 1 } });
            setResponses((r: any) => ({ ...r, driversV1Admin: res.data }));
            addLog(`Drivers (/v1/admin/drivers) Status: ${res.status}`);
        } catch (e: any) {
            addLog(`Drivers (/v1/admin/drivers) Error: ${e.response?.status || e.message}`);
        }

        addLog('Diagnostics complete.');
    };

    return (
        <ClientLayout pageTitle="System Diagnostics">
            <div style={{ padding: '1rem', fontFamily: 'monospace' }}>
                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#e0f2fe', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Environment Logic</h2>
                    <pre>{JSON.stringify(envInfo, null, 2)}</pre>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Execution Logs</h2>
                    {logs.map((log, i) => (
                        <div key={i} style={{ borderBottom: '1px solid #e5e7eb', padding: '2px 0' }}>{log}</div>
                    ))}
                </div>

                <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Raw API Responses</h2>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {JSON.stringify(responses, null, 2)}
                    </pre>
                </div>
            </div>
        </ClientLayout>
    );
}
