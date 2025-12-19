import React, { useState, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import MapComponent from '../common/MapComponent';
import { driversApi, bookingsApi, notificationsApi } from '@/lib/api';
import { useJsApiLoader } from '@react-google-maps/api';

interface AssignDriverModalProps {
    booking: any;
    onClose: () => void;
    onAssign: () => void;
}

const libraries: ("places")[] = ["places"];

export default function AssignDriverModal({ booking, onClose, onAssign }: AssignDriverModalProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo',
        libraries
    });

    const [view, setView] = useState<'map' | 'list'>('map');
    const [drivers, setDrivers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    // Placeholder for Geocoding - in a real app, you'd use the Geocoding API or store lat/lng in booking
    // For now, we'll try to use booking.geoLocation if available, otherwise use a default
    const [pickupLocation, setPickupLocation] = useState<any>(
        booking.geoLocation?.pickup ? {
            lat: booking.geoLocation.pickup.lat,
            lng: booking.geoLocation.pickup.lng
        } : null
    );

    // Geocode pickup address if coords are missing
    useEffect(() => {
        const address = booking.pickup || booking.pickupLocation;
        // Only run if map is loaded and we have window.google
        if (isLoaded && !pickupLocation && address && view === 'map' && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ address: address }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    const location = results[0].geometry.location;
                    setPickupLocation({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    console.error('Geocode failed due to: ' + status);
                    // Fallback to Chennai default if geocoding fails, just to show map
                    setPickupLocation({ lat: 13.0827, lng: 80.2707 });
                }
            });
        }
    }, [booking.pickup, pickupLocation, view, isLoaded]);


    useEffect(() => {
        if (view === 'map') {
            fetchDriverLocations();
        } else {
            fetchDriversList();
        }
    }, [view]);

    const fetchDriverLocations = async () => {
        setLoading(true);
        try {
            // Fetch only active drivers with locations
            const res = await driversApi.getLocations();
            if (res.data && res.data.success) {
                // Transform API response to match Map component needs
                // Assuming API returns array of drivers with current location
                // You might need to adjust this based on actual API response
                setDrivers(res.data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch driver locations", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDriversList = async () => {
        setLoading(true);
        try {
            // Updated to fetch only Active AND Online drivers
            // Cast to any to bypass strict typing in api.ts if needed, or rely on JS behavior
            const res = await driversApi.getAll({
                search,
                limit: 50,
                // status: 'active', // 'status' might not be handled by backend as explicit 'isActive', so we use our new params
                isActive: 'true',
                isOnline: 'true'
            } as any);

            if (res.data && (res.data.success || res.data.data)) {
                const driversList = res.data.data?.drivers || res.data.data || [];
                setDrivers(driversList);
            }
        } catch (error) {
            console.error("Failed to fetch drivers list", error);
        } finally {
            setLoading(false);
        }
    };

    // Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    const deg2rad = (deg: number) => {
        return deg * (Math.PI / 180);
    };

    // Calculate drivers details with distance and color
    const getProcessedDrivers = () => {
        if (!pickupLocation) return [];
        return drivers.map(d => {
            const lat = d.geoLocation?.lat || d.geoLocation?.latitude || 0;
            const lng = d.geoLocation?.lng || d.geoLocation?.longitude || 0;
            const distance = calculateDistance(pickupLocation.lat, pickupLocation.lng, lat, lng);

            let color = '#EF4444'; // default red? no, user said Green/Yellow/Orange
            if (distance < 30) color = '#10B981'; // Green
            else if (distance < 50) color = '#EAB308'; // Yellow
            else color = '#F97316'; // Orange

            // Filter out > 100km
            if (distance > 100) return null;

            return {
                ...d,
                distance,
                color,
                formattedLocation: { lat, lng } // Normalized location
            };
        }).filter(d => d !== null);
    };

    const processedDrivers = view === 'map' && pickupLocation ? getProcessedDrivers() : [];


    const handleAssignAll = async () => {
        setIsAssigning(true);
        try {
            // Broadcast to ALL drivers via backend (updates booking status too)
            await bookingsApi.assignAll(booking.id || booking.bookingId);

            alert(`Broadcast sent to all active drivers.`);
            onClose();
            onAssign(); // Refresh parent list to show updated status
        } catch (error) {
            console.error("Failed to assign all", error);
            alert('Failed to send notifications.');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleAssignSingle = async () => {
        if (!selectedDriver) return;
        setIsAssigning(true);
        try {
            await bookingsApi.assignDriver(booking.id || booking.bookingId, selectedDriver);
            onAssign(); // Refresh parent
            onClose();
        } catch (error) {
            console.error("Failed to assign driver", error);
            alert('Failed to assign driver.');
        } finally {
            setIsAssigning(false);
        }
    };

    // Filter drivers in list view
    const filteredDrivers = view === 'list'
        ? drivers.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.phone.includes(search)
        )
        : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white z-20">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Assign Driver</h2>
                        <p className="text-sm text-slate-500">
                            Booking #{booking.bookingId} • {booking.pickupAddress}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="rounded-full hover:bg-slate-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 flex relative overflow-hidden">

                    {/* Map View */}
                    <div className={`flex-1 relative transition-all duration-300 ${view === 'list' ? 'w-2/3 border-r' : 'w-full'}`}>
                        <MapComponent
                            pickupLocation={pickupLocation}
                            drivers={processedDrivers.map((d: any) => ({
                                id: d.id || d.driverId,
                                location: d.formattedLocation,
                                name: d.name,
                                phone: d.phone,
                                color: d.color
                            }))}
                            className="w-full h-full"
                        />

                        {/* Overlay Controls for Map View */}
                        {view === 'map' && (
                            <div className="absolute top-4 right-4 flex flex-col gap-2 w-72 bg-white/95 backdrop-blur shadow-xl rounded-xl border border-slate-100 p-4">
                                <Button
                                    onClick={handleAssignAll}
                                    disabled={isAssigning}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md py-6 text-lg"
                                >
                                    {isAssigning ? 'Sending...' : 'Assign All Live Drivers'}
                                </Button>
                                <p className="text-xs text-center text-slate-500 mb-2">
                                    Broadcasts to all online & approved drivers
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => setView('list')}
                                    className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                                >
                                    Select Single Driver manually
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* List View Overlay/Sidebar */}
                    {view === 'list' && (
                        <div className="w-[450px] bg-white flex flex-col border-l border-slate-200 h-full shadow-2xl z-10 animate-in slide-in-from-right duration-300">
                            <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                                <Input
                                    placeholder="Search by name or phone..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="bg-white"
                                    autoFocus
                                />
                                <div className="text-xs text-slate-500 px-1">
                                    Showing only Active & Online drivers
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                        Loading drivers...
                                    </div>
                                ) : filteredDrivers.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg m-2 border border-slate-100 border-dashed">
                                        No online drivers found matching your search.
                                    </div>
                                ) : (
                                    filteredDrivers.map(driver => (
                                        <div
                                            key={driver.id || driver.driverId}
                                            onClick={() => setSelectedDriver(driver.id || driver.driverId)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${selectedDriver === (driver.id || driver.driverId)
                                                ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 shadow-sm'
                                                : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold text-slate-800 text-lg">{driver.name}</div>
                                                    <div className="text-sm text-slate-500">{driver.phone}</div>
                                                </div>
                                                {driver.isOnline && (
                                                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Live
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50 safe-area-bottom">
                                <Button
                                    variant="outline"
                                    onClick={() => setView('map')}
                                    className="flex-1 h-12"
                                >
                                    Back to Map
                                </Button>
                                <Button
                                    onClick={handleAssignSingle}
                                    disabled={!selectedDriver || isAssigning}
                                    className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white h-12 text-lg shadow-lg shadow-indigo-200"
                                >
                                    {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
