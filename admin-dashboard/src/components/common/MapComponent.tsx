import React, { useCallback, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 13.0827, // Chennai coordinates as default
    lng: 80.2707
};

interface Location {
    lat: number;
    lng: number;
}

interface DriverMarker {
    id: string;
    location: Location;
    name: string;
    phone: string;
    color?: string;
}

interface MapComponentProps {
    pickupLocation?: Location;
    drivers?: DriverMarker[];
    className?: string;
}

const libraries: ("places")[] = ["places"];

const MapComponent: React.FC<MapComponentProps> = ({ pickupLocation, drivers = [], className }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo', // Fallback to provided key
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        // const bounds = new window.google.maps.LatLngBounds();
        // if (pickupLocation) {
        //     bounds.extend(pickupLocation);
        // }
        // drivers.forEach(driver => {
        //     bounds.extend(driver.location);
        // });
        // map.fitBounds(bounds);
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    if (!isLoaded) {
        return <div className={`bg-gray-100 flex items-center justify-center animate-pulse ${className}`} style={{ minHeight: '400px' }}>Loading Map...</div>;
    }

    return (
        <div className={className} style={{ height: '100%', minHeight: '400px' }}>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={pickupLocation || defaultCenter}
                zoom={12}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                }}
            >
                {/* Pickup Marker */}
                {pickupLocation && (
                    <Marker
                        position={pickupLocation}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 10,
                            fillColor: "#EF4444",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        }}
                        title="Pickup Location"
                    />
                )}

                {/* Driver Markers */}
                {drivers.map(driver => (
                    <Marker
                        key={driver.id}
                        position={driver.location}
                        title={`${driver.name} - ${driver.phone}`}
                        icon={{
                            path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z", // Material UI Car Icon
                            scale: 1.5, // Adjusted scale for the path
                            anchor: new google.maps.Point(12, 12), // Center the icon
                            fillColor: driver.color || "#10B981", // Use passed color or default Green
                            fillOpacity: 1,
                            strokeWeight: 1,
                            strokeColor: "#FFFFFF",
                            rotation: 0
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
};

export default React.memo(MapComponent);
