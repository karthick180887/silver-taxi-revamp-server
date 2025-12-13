'use client';

import { useState, useEffect } from 'react';
import { Paper, Typography, Switch, FormControlLabel, Tabs, Tab, Box } from '@mui/material';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function HourlyPackagePage() {
    const [serviceEnabled, setServiceEnabled] = useState(false);
    const [selectedTab, setSelectedTab] = useState(0);
    const [vehicles] = useState<string[]>([
        'Mini (3+1)',
        'Sedan (4+1)',
        'Etios (4+1)',
        'Sedan (4+1) (Non-CNG)',
        'SUV (7+1) (6+1)',
        'Innova (6+1) (7+1)',
        'Innova Crysta (6+1)',
    ]);

    useEffect(() => {
        fetchServiceConfig();
    }, []);

    const fetchServiceConfig = async () => {
        try {
            const response = await axios.get(`${API_URL}/v1/services/packages/hourly`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
            if (response.data) {
                setServiceEnabled(response.data.enabled || false);
            }
        } catch (error) {
            console.error('Error fetching service config:', error);
        }
    };

    const handleServiceToggle = async (enabled: boolean) => {
        setServiceEnabled(enabled);
        try {
            await axios.put(`${API_URL}/v1/services/packages/hourly`, { enabled }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
            });
        } catch (error) {
            console.error('Error updating service:', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Typography variant="h4" className="font-bold">Package - Hourly Package</Typography>
            </div>

            <Paper className="p-6 space-y-6">
                <div>
                    <Typography variant="h6" className="font-bold mb-4">Base Detail</Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={serviceEnabled}
                                onChange={(e) => handleServiceToggle(e.target.checked)}
                            />
                        }
                        label="Service Off | On"
                    />
                </div>

                <div>
                    <Typography variant="h6" className="font-bold mb-4">Hourly Package Vehicle</Typography>
                    <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
                        {vehicles.map((vehicle, index) => (
                            <Tab key={index} label={vehicle} />
                        ))}
                    </Tabs>
                    <Box className="mt-4 p-4 border border-gray-200 rounded-lg">
                        <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Vehicle in this Service Off | On"
                        />
                    </Box>
                </div>
            </Paper>
        </div>
    );
}
