'use client';

import React, { useState } from 'react';

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T, index: number) => React.ReactNode;
    sortable?: boolean;
    width?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string | number;
    onRowClick?: (item: T) => void;
    loading?: boolean;
    emptyMessage?: string;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
    };
    selectable?: boolean;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
}

export function DataTable<T extends object>({
    data,
    columns,
    keyExtractor,
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    pagination,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
}: DataTableProps<T>) {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const handleSort = (key: string) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDir('asc');
        }
    };

    const sortedData = React.useMemo(() => {
        if (!sortKey) return data;
        return [...data].sort((a, b) => {
            const aVal = (a as Record<string, unknown>)[sortKey];
            const bVal = (b as Record<string, unknown>)[sortKey];
            if (aVal === bVal) return 0;
            if (aVal === null || aVal === undefined) return 1;
            if (bVal === null || bVal === undefined) return -1;
            const comparison = aVal < bVal ? -1 : 1;
            return sortDir === 'asc' ? comparison : -comparison;
        });
    }, [data, sortKey, sortDir]);

    const handleSelectAll = () => {
        if (!onSelectionChange) return;
        if (selectedIds.length === data.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map(keyExtractor));
        }
    };

    const handleSelectRow = (id: string | number) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((x) => x !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0;

    const tableStyles: React.CSSProperties = {
        width: '100%',
        borderCollapse: 'collapse',
    };

    const thStyles: React.CSSProperties = {
        padding: '0.875rem 1rem',
        textAlign: 'left',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        fontWeight: 600,
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid var(--border-primary)',
    };

    const tdStyles: React.CSSProperties = {
        padding: '0.875rem 1rem',
        color: 'var(--text-primary)',
        fontSize: '0.875rem',
        borderBottom: '1px solid var(--border-primary)',
    };

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={tableStyles}>
                    <thead>
                        <tr>
                            {selectable && (
                                <th style={{ ...thStyles, width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={data.length > 0 && selectedIds.length === data.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                            )}
                            {columns.map((col) => (
                                <th
                                    key={String(col.key)}
                                    style={{ ...thStyles, width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                                    onClick={() => col.sortable && handleSort(String(col.key))}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {col.header}
                                        {col.sortable && sortKey === col.key && (
                                            <span style={{ color: 'var(--brand-primary)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ ...tdStyles, textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        border: '2px solid var(--border-primary)',
                                        borderTopColor: 'var(--brand-primary)',
                                        borderRadius: '50%',
                                        margin: '0 auto',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                </td>
                            </tr>
                        ) : sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ ...tdStyles, textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-primary)' }}>
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((item, index) => {
                                const id = keyExtractor(item);
                                return (
                                    <tr
                                        key={id}
                                        onClick={() => onRowClick?.(item)}
                                        style={{ cursor: onRowClick ? 'pointer' : 'default', background: selectedIds.includes(id) ? 'var(--brand-primary-subtle)' : 'transparent' }}
                                    >
                                        {selectable && (
                                            <td style={tdStyles} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(id)}
                                                    onChange={() => handleSelectRow(id)}
                                                />
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td key={String(col.key)} style={tdStyles}>
                                                {col.render
                                                    ? col.render(item, index)
                                                    : String((item as Record<string, unknown>)[col.key as string] ?? '-')}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && totalPages > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border-primary)', background: 'var(--bg-tertiary)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Showing {(pagination.page - 1) * pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
                    </span>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => pagination.onPageChange(pagination.page - 1)}
                            style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: pagination.page === 1 ? 'not-allowed' : 'pointer', opacity: pagination.page === 1 ? 0.5 : 1 }}
                        >
                            Previous
                        </button>
                        <button
                            disabled={pagination.page === totalPages}
                            onClick={() => pagination.onPageChange(pagination.page + 1)}
                            style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.875rem', cursor: pagination.page === totalPages ? 'not-allowed' : 'pointer', opacity: pagination.page === totalPages ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
