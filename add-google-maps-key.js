// Script to add Google Maps API Key to database
// Run with: node add-google-maps-key.js

const { ConfigKeys } = require('./src/v1/core/models');

async function addGoogleMapsKey() {
    try {
        const result = await ConfigKeys.upsert({
            adminId: 'admin-1',
            keyName: 'google_map_key',
            keyValue: 'AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo',
            description: 'Google Maps API key for Places Autocomplete',
            isPublic: true,
            status: true
        });

        console.log('✅ Google Maps API key added successfully!');
        console.log('Result:', result);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding Google Maps API key:', error);
        process.exit(1);
    }
}

addGoogleMapsKey();
