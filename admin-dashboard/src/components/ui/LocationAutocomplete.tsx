'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

interface LocationAutocompleteProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

const libraries: ("places")[] = ["places"];

export function LocationAutocomplete({
    label,
    placeholder,
    value,
    onChange,
    className
}: LocationAutocompleteProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo',
        libraries
    });

    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

    useEffect(() => {
        if (isLoaded && inputRef.current && !autocompleteRef.current) {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                componentRestrictions: { country: 'in' }, // Restrict to India as per context (Salem/Chennai)
                fields: ['formatted_address', 'geometry', 'name'],
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current?.getPlace();
                if (place && place.formatted_address) {
                    onChange(place.formatted_address);
                } else if (place && place.name) {
                    onChange(place.name);
                }
            });
        }
    }, [isLoaded, onChange]);

    // Update input value if parent updates it
    useEffect(() => {
        if (inputRef.current && inputRef.current.value !== value) {
            inputRef.current.value = value;
        }
    }, [value]);

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <label className="block text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                defaultValue={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
        </div>
    );
}
