'use client';

import { useState } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    IconButton,
    TextField,
    InputAdornment,
    Menu,
    MenuItem,
    Pagination,
    Select,
    FormControl,
    InputLabel,
    Typography,
    Button
} from '@mui/material';
import {
    Search,
    RefreshCw,
    Filter,
    MoreHorizontal,
    Eye,
    Edit,
    Trash2,
    Settings,
    Maximize2,
    Grid3x3,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Download
} from 'lucide-react';
import clsx from 'clsx';

export interface Column<T> {
    id: string;
    label: string;
    minWidth?: number;
    align?: 'right' | 'left' | 'center';
    format?: (value: any, row: T) => React.ReactNode;
    sortable?: boolean;
}

interface DataTableProps<T> {
    title?: string;
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    searchable?: boolean;
    searchPlaceholder?: string;
    onSearch?: (term: string) => void;
    onRefresh?: () => void;
    onRowClick?: (row: T) => void;
    onEdit?: (row: T) => void;
    onDelete?: (row: T) => void;
    onView?: (row: T) => void;
    page?: number;
    rowsPerPage?: number;
    totalRows?: number;
    onPageChange?: (page: number) => void;
    onRowsPerPageChange?: (rowsPerPage: number) => void;
    showFilters?: boolean;
    showColumnVisibility?: boolean;
    showDensity?: boolean;
    showFullScreen?: boolean;
    createButton?: React.ReactNode;
    statusFilters?: Array<{ label: string; count: number; onClick: () => void; active?: boolean }>;
}

export default function DataTable<T extends { id: string | number }>({
    title,
    columns,
    data,
    loading = false,
    searchable = true,
    searchPlaceholder = 'Search ...',
    onSearch,
    onRefresh,
    onRowClick,
    onEdit,
    onDelete,
    onView,
    page = 1,
    rowsPerPage = 10,
    totalRows,
    onPageChange,
    onRowsPerPageChange,
    showFilters = true,
    showColumnVisibility = true,
    showDensity = true,
    showFullScreen = true,
    createButton,
    statusFilters
}: DataTableProps<T>) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable');
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        onSearch?.(value);
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedRows(new Set(data.map(row => row.id)));
        } else {
            setSelectedRows(new Set());
        }
    };

    const handleSelectRow = (id: string | number) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedRows(newSelected);
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
        onPageChange?.(newPage);
    };

    const totalPages = totalRows ? Math.ceil(totalRows / rowsPerPage) : Math.ceil(data.length / rowsPerPage);

    return (
        <div className={clsx("space-y-6 transition-all duration-300", isFullScreen && "fixed inset-0 z-50 bg-gray-50 dark:bg-zinc-950 p-6 overflow-auto")}>
            {/* Header Section */}
            {(title || createButton || statusFilters) && !isFullScreen && (
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            {title && <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>}
                            {totalRows !== undefined && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Total {totalRows} records found
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {createButton}
                        </div>
                    </div>

                    {/* Status Filters - Tabs Style */}
                    {statusFilters && statusFilters.length > 0 && (
                        <div className="flex items-center gap-1 border-b border-gray-200 dark:border-zinc-800">
                            {statusFilters.map((filter, index) => (
                                <button
                                    key={index}
                                    onClick={filter.onClick}
                                    className={clsx(
                                        "px-4 py-2 text-sm font-medium border-b-2 transition-all duration-200 flex items-center gap-2",
                                        filter.active
                                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300"
                                    )}
                                >
                                    {filter.label}
                                    <span className={clsx(
                                        "px-2 py-0.5 rounded-full text-xs",
                                        filter.active
                                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                            : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"
                                    )}>
                                        {filter.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Table Container */}
            <Paper elevation={0} className="border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-zinc-900">
                    <div className="flex flex-wrap gap-3 flex-1">
                        {searchable && (
                            <div className="relative group w-full sm:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
                                />
                            </div>
                        )}

                        {/* Column Filter Dropdown can go here if needed */}
                    </div>

                    <div className="flex items-center gap-2">
                        {onRefresh && (
                            <button
                                onClick={onRefresh}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
                            </button>
                        )}

                        {showDensity && (
                            <button
                                onClick={() => {
                                    const densities: Array<'comfortable' | 'compact' | 'spacious'> = ['comfortable', 'compact', 'spacious'];
                                    const currentIndex = densities.indexOf(density);
                                    setDensity(densities[(currentIndex + 1) % densities.length]);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                title="Toggle Density"
                            >
                                <Grid3x3 className="w-4 h-4" />
                            </button>
                        )}

                        {showFullScreen && (
                            <button
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className={clsx(
                                    "p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-lg transition-colors",
                                    isFullScreen && "text-blue-600 bg-blue-50 dark:bg-blue-900/20"
                                )}
                                title="Full Screen"
                            >
                                <Maximize2 className="w-4 h-4" />
                            </button>
                        )}

                        <button
                            onClick={handleMenuOpen}
                            className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Table */}
                <TableContainer className="scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
                    <Table
                        sx={{ minWidth: 650 }}
                        size={density === 'compact' ? 'small' : density === 'spacious' ? 'medium' : 'medium'}
                    >
                        <TableHead>
                            <TableRow className="bg-gray-50 dark:bg-zinc-900/50">
                                <TableCell padding="checkbox" className="border-b border-gray-200 dark:border-zinc-800">
                                    <Checkbox
                                        size="small"
                                        checked={selectedRows.size === data.length && data.length > 0}
                                        indeterminate={selectedRows.size > 0 && selectedRows.size < data.length}
                                        onChange={handleSelectAll}
                                        className="text-gray-400 data-[state=checked]:text-indigo-600"
                                    />
                                </TableCell>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        align={column.align}
                                        style={{ minWidth: column.minWidth }}
                                        className="font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800 py-3"
                                    >
                                        <div className={clsx("flex items-center gap-2", column.align === 'right' && "justify-end", column.align === 'center' && "justify-center")}>
                                            {column.label}
                                            {column.sortable && (
                                                <ArrowUpDown className="w-3 h-3 text-gray-300 hover:text-gray-500 cursor-pointer" />
                                            )}
                                        </div>
                                    </TableCell>
                                ))}
                                {(onView || onEdit || onDelete) && (
                                    <TableCell align="right" className="font-medium text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-zinc-800 py-3">
                                        Actions
                                    </TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} align="center" className="py-24">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <Typography className="text-gray-500 text-sm font-medium">Loading data...</Typography>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length + 2} align="center" className="py-24">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                                <Search className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <div className="text-center">
                                                <Typography className="text-gray-900 dark:text-white font-medium">No results found</Typography>
                                                <Typography className="text-gray-500 text-sm mt-1">Try adjusting your search or filters</Typography>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={clsx(
                                            "group transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0",
                                            "hover:bg-gray-50 dark:hover:bg-zinc-800/50 cursor-pointer",
                                            selectedRows.has(row.id) && "bg-indigo-50/50 dark:bg-indigo-900/10"
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                                            <Checkbox
                                                size="small"
                                                checked={selectedRows.has(row.id)}
                                                onChange={() => handleSelectRow(row.id)}
                                                className="text-gray-400 data-[state=checked]:text-indigo-600"
                                            />
                                        </TableCell>
                                        {columns.map((column) => (
                                            <TableCell
                                                key={column.id}
                                                align={column.align}
                                                className="text-sm text-gray-700 dark:text-gray-300 py-4"
                                            >
                                                {column.format ? column.format((row as any)[column.id], row) : (row as any)[column.id]}
                                            </TableCell>
                                        ))}
                                        {(onView || onEdit || onDelete) && (
                                            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {onView && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onView(row)}
                                                            className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                            title="View Details"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </IconButton>
                                                    )}
                                                    {onEdit && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onEdit(row)}
                                                            className="text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                            title="Edit"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </IconButton>
                                                    )}
                                                    {onDelete && (
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => onDelete(row)}
                                                            className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </IconButton>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Pagination */}
                {(onPageChange || onRowsPerPageChange) && (
                    <div className="p-4 border-t border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-sm font-medium">Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => onRowsPerPageChange?.(Number(e.target.value))}
                                className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 hover:border-indigo-500 transition-colors"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            shape="rounded"
                            color="primary"
                            showFirstButton
                            showLastButton
                            size="medium"
                            className="[&_.Mui-selected]:bg-indigo-600 [&_.Mui-selected]:text-white [&_.MuiPaginationItem-root:hover]:bg-gray-100"
                        />
                    </div>
                )}
            </Paper>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    className: "mt-2 rounded-xl border border-gray-100 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900"
                }}
            >
                <MenuItem onClick={handleMenuClose} className="text-sm gap-3 py-2 px-4 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <Download className="w-4 h-4" /> Export CSV
                </MenuItem>
                <MenuItem onClick={handleMenuClose} className="text-sm gap-3 py-2 px-4 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800">
                    <Download className="w-4 h-4" /> Export Excel
                </MenuItem>
                <div className="my-1 border-t border-gray-100 dark:border-zinc-800"></div>
                <MenuItem onClick={handleMenuClose} className="text-sm gap-3 py-2 px-4 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10">
                    <Trash2 className="w-4 h-4" /> Delete Selected
                </MenuItem>
            </Menu>
        </div>
    );
}
