'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    FileText,
    Car,
    User
} from 'lucide-react';
import {
    Paper,
    Button,
    Grid,
    CircularProgress,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Tabs,
    Tab,
    Box
} from '@mui/material';

export default function DriverDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [driver, setDriver] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fetchDriver = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:8081/admin/drivers/${id}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setDriver(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDriver();
    }, [id]);

    const handleApprove = async () => {
        if (!confirm('Are you sure you want to approve this driver?')) return;
        try {
            const res = await fetch(`http://localhost:8081/admin/drivers/${id}/approve`, {
                method: 'POST'
            });
            if (res.ok) {
                alert('Driver approved successfully');
                fetchDriver();
            } else {
                alert('Failed to approve driver');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleReject = async () => {
        try {
            const res = await fetch(`http://localhost:8081/admin/drivers/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason: rejectReason }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                alert('Driver rejected');
                setRejectDialogOpen(false);
                fetchDriver();
            } else {
                alert('Failed to reject driver');
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="flex justify-center p-10"><CircularProgress /></div>;
    if (!driver) return <div className="p-10">Driver not found</div>;

    const docs = driver.documents || {};
    // Assuming vehicle details are in 'vehicle' or embedded in main object if flattened, 
    // but based on API it might be separate. Backend GetDriverDetails includes map, 
    // let's assume vehicle info is NOT in driver map yet or is in 'vehicle' key if joined.
    // The current MongoDB schema stores vehicle separately. 
    // Admin backend GetDriverDetailsAsMap might assume just driver collection.
    // Ideally we should fetch vehicle too. But let's focus on personal docs first which are in driver.

    return (
        <div className="space-y-6 p-6">
            <Button startIcon={<ArrowLeft />} onClick={() => router.back()}>Back to List</Button>

            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden">
                        {docs.driverCurrentPhoto ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={docs.driverCurrentPhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-8 h-8 m-4 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{driver.name || 'Unknown Driver'}</h1>
                        <div className="flex gap-2 mt-1">
                            <Chip label={driver.verificationStatus || 'Unknown'} color={driver.verificationStatus === 'verified' ? 'success' : 'warning'} size="small" />
                            <Chip label={driver.status || 'Inactive'} variant="outlined" size="small" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="contained"
                        color="error"
                        startIcon={<XCircle />}
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={driver.verificationStatus === 'rejected'}
                    >
                        Reject
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={handleApprove}
                        disabled={driver.verificationStatus === 'verified'}
                    >
                        Approve
                    </Button>
                </div>
            </div>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab label="Profile" />
                    <Tab label="Documents" />
                    <Tab label="Vehicle" />
                </Tabs>
            </Box>

            {/* Profile Tab */}
            <div hidden={tabValue !== 0}>
                {tabValue === 0 && (
                    <Paper className="p-6 rounded-xl border border-gray-200" elevation={0}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <DetailItem label="Full Name" value={driver.name} />
                                <DetailItem label="Phone" value={driver.phone} />
                                <DetailItem label="Date of Birth" value={driver.dateOfBirth} />
                                <DetailItem label="Gender" value={driver.gender} />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <DetailItem label="Address" value={driver.address} />
                                <DetailItem label="City" value={driver.city} />
                                <DetailItem label="State" value={driver.state} />
                                <DetailItem label="Pincode" value={driver.pinCode} />
                            </Grid>
                        </Grid>
                    </Paper>
                )}
            </div>

            {/* Documents Tab */}
            <div hidden={tabValue !== 1}>
                {tabValue === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DocCard label="PAN Card" url={docs.panCard} onView={() => setPreviewImage(docs.panCard)} />
                        <DocCard label="DL Front" url={docs.dlFront} onView={() => setPreviewImage(docs.dlFront)} />
                        <DocCard label="DL Back" url={docs.dlBack} onView={() => setPreviewImage(docs.dlBack)} />
                        {/* Vehicle docs might effectively be here if embedded, or in vehicle tab */}
                    </div>
                )}
            </div>

            {/* Vehicle Tab - Placeholder for now as we might need separate fetch */}
            <div hidden={tabValue !== 2}>
                {tabValue === 2 && (
                    <Paper className="p-6 rounded-xl border border-gray-200" elevation={0}>
                        <div className="text-gray-500 text-center py-10">
                            Vehicle details fetching not yet implemented in admin view.
                        </div>
                    </Paper>
                )}
            </div>

            {/* Image Preview Dialog */}
            <Dialog open={!!previewImage} onClose={() => setPreviewImage(null)} maxWidth="lg">
                <DialogContent>
                    {previewImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewImage} alt="Preview" className="w-full h-auto" />
                    )}
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
                <DialogTitle>Reject Driver</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Reason for rejection"
                        fullWidth
                        multiline
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleReject} color="error" variant="contained">Reject</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}

function DetailItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="mb-4">
            <div className="text-sm text-gray-500 mb-1">{label}</div>
            <div className="font-medium">{value || '-'}</div>
        </div>
    );
}

function DocCard({ label, url, onView }: { label: string, url?: string, onView: () => void }) {
    return (
        <Paper className="p-4 rounded-xl border border-gray-200 flex flex-col items-center gap-3" elevation={0}>
            <div className="font-medium text-gray-700">{label}</div>
            <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={label} className="w-full h-full object-cover" />
                ) : (
                    <FileText className="text-gray-400 w-10 h-10" />
                )}
            </div>
            <Button variant="outlined" size="small" fullWidth onClick={onView} disabled={!url}>
                View Document
            </Button>
        </Paper>
    );
}
