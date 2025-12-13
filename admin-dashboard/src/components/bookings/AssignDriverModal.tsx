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
            const res = await driversApi.getAll({ search, limit: 50, status: 'active' });
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
            // Get IDs from filtered list
            const nearbyDriverIds = processedDrivers.map((d: any) => d.id || d.driverId);

            if (nearbyDriverIds.length === 0) {
                alert('No drivers nearby (within 100km).');
                setIsAssigning(false);
                return;
            }

            // Broadcast notification to filtered drivers
            await notificationsApi.sendToDrivers({
                title: 'New Booking Available',
                message: `New booking from ${booking.pickup} to ${booking.drop}`,
                driverIds: nearbyDriverIds
            });

            alert(`Notification sent to ${nearbyDriverIds.length} nearby drivers.`);
            onClose();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            {/* ... */}
            {/* Content */}
            <div className="flex-1 flex relative">

                {/* Map View */}
                <div className={`flex-1 relative transition-all duration-300 ${view === 'list' ? 'w-1/3 border-r' : 'w-full'}`}>
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
                        <div className="absolute top-4 right-4 flex flex-col gap-2 w-64 bg-white/90 backdrop-blur p-4 rounded-lg shadow-lg border border-slate-100">
                            <Button
                                onClick={handleAssignAll}
                                disabled={isAssigning}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all hover:scale-[1.02]"
                            >
                                {isAssigning ? 'Sending...' : 'Assign All Drivers'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setView('list')}
                                className="w-full border-slate-200 hover:bg-slate-50 text-slate-700"
                            >
                                Select Single Driver
                            </Button>
                        </div>
                    )}
                </div>

                {/* List View Overlay/Sidebar */}
                {view === 'list' && (
                    <div className="w-[400px] bg-white flex flex-col border-l border-slate-200 absolute right-0 top-0 bottom-0 shadow-2xl z-10 animate-in slide-in-from-right duration-300">
                        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                            <Input
                                placeholder="Search by name or phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="bg-white"
                                autoFocus
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="p-4 text-center text-slate-400">Loading drivers...</div>
                            ) : filteredDrivers.length === 0 ? (
                                <div className="p-4 text-center text-slate-400">No drivers found</div>
                            ) : (
                                filteredDrivers.map(driver => (
                                    <div
                                        key={driver.id || driver.driverId}
                                        onClick={() => setSelectedDriver(driver.id || driver.driverId)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedDriver === (driver.id || driver.driverId)
                                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                                            : 'border-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="font-medium text-slate-800">{driver.name}</div>
                                        <div className="text-sm text-slate-500">{driver.phone}</div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            Available
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 flex gap-3 bg-slate-50/50">
                            <Button
                                variant="outline"
                                onClick={() => setView('map')}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleAssignSingle}
                                disabled={!selectedDriver || isAssigning}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isAssigning ? 'Assigning...' : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </div>

    );
}
