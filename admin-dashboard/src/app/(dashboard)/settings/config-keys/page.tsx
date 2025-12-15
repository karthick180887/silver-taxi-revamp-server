'use client';

import React, { useEffect, useState } from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button, Card, Input, DataTable } from '@/components/ui';
import { configKeysApi } from '@/lib/api';

interface ConfigKey {
    id: number;
    keyName: string;
    description: string;
    isPublic: boolean;
    status: boolean;
    createdAt: string;
}

export default function ConfigKeysPage() {
    const [keys, setKeys] = useState<ConfigKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        keyName: '',
        keyValue: '',
        description: '',
        isPublic: false
    });

    useEffect(() => {
        fetchKeys();
    }, []);

    const fetchKeys = async () => {
        setLoading(true);
        try {
            const adminId = typeof window !== 'undefined' ? localStorage.getItem('adminId') || undefined : undefined;
            const res = await configKeysApi.getAll(adminId ? { adminId } : undefined);
            setKeys(res.data?.data || res.data || []);
        } catch (error) {
            console.error('Failed to fetch config keys:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            const adminId = typeof window !== 'undefined' ? localStorage.getItem('adminId') || undefined : undefined;

            await configKeysApi.create({ ...formData, adminId });

            setShowCreateModal(false);
            setFormData({ keyName: '', keyValue: '', description: '', isPublic: false });
            fetchKeys();
        } catch (error: any) {
            console.error('Create error:', error);
            alert(error.response?.data?.message || 'Failed to create config key');
        }
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await configKeysApi.update(id.toString(), { status: !currentStatus });
            fetchKeys();
        } catch (error) {
            console.error('Failed to toggle status:', error);
        }
    };

    const columns = [
        { key: 'keyName', header: 'Key Name', render: (k: ConfigKey) => <span className="font-mono text-sm">{k.keyName}</span> },
        { key: 'description', header: 'Description', render: (k: ConfigKey) => k.description || '-' },
        {
            key: 'isPublic',
            header: 'Visibility',
            render: (k: ConfigKey) => (
                <span className={`px-2 py-1 rounded text-xs ${k.isPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {k.isPublic ? 'Public' : 'Private'}
                </span>
            )
        },
        {
            key: 'status',
            header: 'Status',
            render: (k: ConfigKey) => (
                <button
                    onClick={() => handleToggleStatus(k.id, k.status)}
                    className={`px-2 py-1 rounded text-xs ${k.status ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                >
                    {k.status ? 'Active' : 'Inactive'}
                </button>
            )
        },
        { key: 'createdAt', header: 'Created', render: (k: ConfigKey) => new Date(k.createdAt).toLocaleDateString() },
        {
            key: 'actions',
            header: 'Actions',
            render: (k: ConfigKey) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => viewKey(k.id)}>
                        View
                    </Button>
                </div>
            )
        }
    ];

    const viewKey = async (id: number) => {
        try {
            const res = await configKeysApi.getById(id.toString());
            const val = res.data?.data?.keyValue || res.data?.keyValue;
            if (val) {
                alert(`Key Value (Decrypted):\n${val}`);
            } else {
                alert('Could not retrieve key value');
            }
        } catch (error) {
            console.error('Failed to view key:', error);
            alert('Failed to retrieve key');
        }
    };

    return (
        <ClientLayout pageTitle="Config Keys">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Configuration Keys</h1>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setShowCreateModal(true)}
                >
                    + Add Config Key
                </Button>
            </div>

            <Card>
                <DataTable
                    data={keys}
                    columns={columns}
                    keyExtractor={(k) => k.id.toString()}
                    loading={loading}
                    emptyMessage="No config keys found"
                />
            </Card>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <Card className="max-w-md w-full p-6">
                        <h2 className="text-xl font-bold mb-4">Add Config Key</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Key Name</label>
                                <Input
                                    value={formData.keyName}
                                    onChange={(e) => setFormData({ ...formData, keyName: e.target.value })}
                                    placeholder="e.g., google_map_key"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Key Value</label>
                                <Input
                                    type="password"
                                    value={formData.keyValue}
                                    onChange={(e) => setFormData({ ...formData, keyValue: e.target.value })}
                                    placeholder="Enter secret value"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Input
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublic}
                                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                                    className="mr-2"
                                />
                                <label className="text-sm">Public (safe to send to client apps)</label>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button onClick={handleCreate} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                                Create
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowCreateModal(false);
                                    setFormData({ keyName: '', keyValue: '', description: '', isPublic: false });
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </ClientLayout>
    );
}
