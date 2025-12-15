import { ConfigKeys } from '../src/v1/core/models';
import { encryptKey } from '../src/utils/cryptoJs';
import { setConfigKey } from '../src/common/services/node-cache';
import { connect } from '../src/common/db/postgres';

const GOOGLE_MAPS_KEY = 'AIzaSyAYjrbg1hQJYC4vOMvQS7C9lJ3TDWQSuFo';

async function addGoogleMapsKey() {
    try {
        console.log('Connecting to database...');
        await connect();
        console.log('Database connected');

        // Encrypt the key
        const encryptedValue = encryptKey(GOOGLE_MAPS_KEY);
        console.log('Key encrypted');

        // Insert or update the key in the database
        const [record, created] = await ConfigKeys.upsert({
            keyName: 'google_map_key',
            keyValue: encryptedValue,
            isPublic: true,
            description: 'Google Maps API Key for Places Autocomplete',
            adminId: 'admin-1',
            status: true,
        });

        console.log(created ? 'Created new config key' : 'Updated existing config key');

        // Update the cache
        setConfigKey('google_map_key', GOOGLE_MAPS_KEY);
        console.log('Cache updated');

        console.log('✅ Google Maps API key added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding Google Maps key:', error);
        process.exit(1);
    }
}

addGoogleMapsKey();
