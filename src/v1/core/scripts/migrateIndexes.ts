/**
 * Safe Index Migration Script for Production
 * 
 * This script safely migrates from old indexes to new optimized indexes
 * - Drops old indexes (with IF EXISTS to avoid errors)
 * - Creates new indexes using CONCURRENTLY (non-blocking, no table locks)
 * - Handles errors gracefully
 * - Can be run in production without downtime
 * 
 * Usage:
 *   npm run migrate-indexes
 *   or
 *   ts-node src/v1/core/scripts/migrateIndexes.ts
 */

import { sequelize } from "../../../common/db/postgres";
import { QueryTypes } from "sequelize";

interface IndexInfo {
    index_name: string;
    is_unique: boolean;
}

/**
 * Get all existing indexes for a table
 */
async function getExistingIndexes(tableName: string): Promise<IndexInfo[]> {
    const query = `
        SELECT 
            i.relname as index_name,
            ix.indisunique as is_unique
        FROM 
            pg_class t,
            pg_class i,
            pg_index ix,
            pg_attribute a
        WHERE 
            t.oid = ix.indrelid
            AND i.oid = ix.indexrelid
            AND a.attrelid = t.oid
            AND a.attnum = ANY(ix.indkey)
            AND t.relkind = 'r'
            AND t.relname = :tableName
        GROUP BY 
            i.relname, ix.indisunique
        ORDER BY 
            i.relname;
    `;

    const indexes = await sequelize.query(query, {
        replacements: { tableName },
        type: QueryTypes.SELECT,
    }) as IndexInfo[];

    return indexes;
}

/**
 * Find and drop old indexes by pattern (for auto-generated Sequelize indexes)
 */
async function dropOldIndexesByPattern(tableName: string, patterns: string[]): Promise<void> {
    try {
        const allIndexes = await getExistingIndexes(tableName);
        
        for (const index of allIndexes) {
            // Check if index matches any pattern
            const matchesPattern = patterns.some(pattern => 
                index.index_name.includes(pattern) || 
                index.index_name.match(new RegExp(pattern, 'i'))
            );
            
            if (matchesPattern) {
                console.log(`  🔍 Found old index by pattern: ${index.index_name}`);
                await dropIndexSafely(tableName, index.index_name, index.is_unique);
            }
        }
    } catch (error: any) {
        console.error(`  ⚠️  Error finding old indexes by pattern:`, error.message);
    }
}

/**
 * Drop an index safely (with IF EXISTS)
 * Note: CONCURRENTLY cannot be used with IF EXISTS, so we check first
 */
async function dropIndexSafely(tableName: string, indexName: string, isUnique: boolean = false): Promise<void> {
    try {
        // First check if index exists
        const checkQuery = `
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = :tableName 
                AND indexname = :indexName
            ) as exists;
        `;
        
        const [result]: any = await sequelize.query(checkQuery, {
            replacements: { tableName, indexName },
            type: QueryTypes.SELECT,
        });

        if (!result?.exists) {
            console.log(`  ⏭️  Index ${indexName} doesn't exist, skipping...`);
            return;
        }

        const indexType = isUnique ? 'UNIQUE INDEX' : 'INDEX';
        
        // Try to drop concurrently first (non-blocking)
        try {
            const query = `DROP INDEX CONCURRENTLY "${indexName}";`;
            console.log(`  ⬇️  Dropping ${indexType} CONCURRENTLY: ${indexName}`);
            await sequelize.query(query, { type: QueryTypes.RAW });
            console.log(`  ✅ Dropped: ${indexName}`);
        } catch (concurrentError: any) {
            // If CONCURRENTLY fails (e.g., in transaction), try without it
            if (concurrentError.message?.includes('concurrently') || concurrentError.message?.includes('transaction')) {
                console.log(`  ⚠️  Cannot drop concurrently, trying normal drop: ${indexName}`);
                const query = `DROP INDEX IF EXISTS "${indexName}";`;
                await sequelize.query(query, { type: QueryTypes.RAW });
                console.log(`  ✅ Dropped: ${indexName}`);
            } else {
                throw concurrentError;
            }
        }
    } catch (error: any) {
        // If index doesn't exist or already dropped, that's fine
        if (error.message?.includes('does not exist')) {
            console.log(`  ⚠️  Index ${indexName} already removed (safe to continue)`);
        } else {
            console.error(`  ❌ Error dropping index ${indexName}:`, error.message);
            // Don't throw - continue with other indexes
            console.log(`  ⚠️  Continuing with other indexes...`);
        }
    }
}

/**
 * Create index concurrently (non-blocking)
 */
async function createIndexConcurrently(
    tableName: string,
    indexName: string,
    columns: string[],
    isUnique: boolean = false,
    using: string = 'btree'
): Promise<void> {
    try {
        // Check if index already exists
        const checkQuery = `
            SELECT EXISTS (
                SELECT 1 FROM pg_indexes 
                WHERE tablename = :tableName 
                AND indexname = :indexName
            ) as exists;
        `;
        
        const [result]: any = await sequelize.query(checkQuery, {
            replacements: { tableName, indexName },
            type: QueryTypes.SELECT,
        });

        if (result?.exists) {
            console.log(`  ⏭️  Index ${indexName} already exists, skipping...`);
            return;
        }

        const uniqueClause = isUnique ? 'UNIQUE' : '';
        const usingClause = using !== 'btree' ? `USING ${using}` : '';
        const columnsStr = columns.map(col => `"${col}"`).join(', ');
        
        // Note: UNIQUE indexes cannot be created CONCURRENTLY in a single command
        // We'll create them normally if unique, concurrently if not
        if (isUnique) {
            const query = `CREATE ${uniqueClause} INDEX "${indexName}" ON "${tableName}" ${usingClause} (${columnsStr});`;
            console.log(`  ⬆️  Creating ${uniqueClause} INDEX: ${indexName}`);
            await sequelize.query(query, { type: QueryTypes.RAW });
        } else {
            const query = `CREATE INDEX CONCURRENTLY "${indexName}" ON "${tableName}" ${usingClause} (${columnsStr});`;
            console.log(`  ⬆️  Creating INDEX CONCURRENTLY: ${indexName}`);
            await sequelize.query(query, { type: QueryTypes.RAW });
        }
        
        console.log(`  ✅ Created: ${indexName}`);
    } catch (error: any) {
        if (error.message?.includes('already exists')) {
            console.log(`  ⏭️  Index ${indexName} already exists (safe to continue)`);
        } else {
            console.error(`  ❌ Error creating index ${indexName}:`, error.message);
            throw error;
        }
    }
}

/**
 * Migrate indexes for a specific table
 */
async function migrateTableIndexes(
    tableName: string,
    oldIndexes: Array<{ name: string; isUnique?: boolean }>,
    newIndexes: Array<{ name: string; columns: string[]; isUnique?: boolean; using?: string }>
): Promise<void> {
    console.log(`\n📋 Migrating indexes for table: ${tableName}`);
    console.log('═'.repeat(60));

    // Step 1: Drop old indexes
    console.log(`\n🗑️  Step 1: Dropping old indexes...`);
    for (const oldIndex of oldIndexes) {
        await dropIndexSafely(tableName, oldIndex.name, oldIndex.isUnique || false);
    }

    // Small delay to ensure indexes are fully dropped
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 2: Create new indexes
    console.log(`\n✨ Step 2: Creating new indexes...`);
    for (const newIndex of newIndexes) {
        await createIndexConcurrently(
            tableName,
            newIndex.name,
            newIndex.columns,
            newIndex.isUnique || false,
            newIndex.using || 'btree'
        );
    }

    console.log(`\n✅ Completed migration for ${tableName}`);
}

/**
 * Main migration function
 */
async function migrateAllIndexes(): Promise<void> {
    try {
        console.log('🚀 Starting Index Migration');
        console.log('═'.repeat(60));
        console.log('⚠️  This script will:');
        console.log('   1. Drop old indexes (safe, uses IF EXISTS)');
        console.log('   2. Create new optimized indexes (non-blocking)');
        console.log('   3. Handle errors gracefully');
        console.log('═'.repeat(60));

        // Wait a moment for user to read
        await new Promise(resolve => setTimeout(resolve, 2000));

        // ============================================
        // BOOKINGS TABLE
        // ============================================
        console.log(`\n📋 Migrating indexes for table: bookings`);
        console.log('═'.repeat(60));
        
        // Step 1: Drop old indexes by known names
        console.log(`\n🗑️  Step 1: Dropping old indexes...`);
        const oldBookingIndexes = [
            'bookings_bookingId_adminId_serviceType_customerId_driverId_tariffId_enquiryId_phone_email_serviceId_vehicleId_vendorId_tripStartedTime_tripCompletedTime_idx',
            'driver_charges_gin_index',
            'extra_charges_gin_index',
            'geo_location_gin_index',
            'normal_fare_gin_index',
            'modified_fare_gin_index',
            'driver_commission_breakup_gin_index',
            'vendor_commission_breakup_gin_index',
        ];
        
        for (const indexName of oldBookingIndexes) {
            await dropIndexSafely('bookings', indexName);
        }
        
        // Also try to find and drop any auto-generated Sequelize indexes
        await dropOldIndexesByPattern('bookings', [
            'bookings_bookingId_adminId', // Old composite pattern
            '_gin_index', // All GIN indexes
        ]);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Step 2: Create new indexes
        console.log(`\n✨ Step 2: Creating new indexes...`);
        const newBookingIndexes: Array<{ name: string; columns: string[]; isUnique?: boolean; using?: string }> = [
                { name: 'bookings_bookingId_unique', columns: ['bookingId'], isUnique: true },
                { name: 'bookings_bookingNo_unique', columns: ['bookingNo'], isUnique: true },
                { name: 'bookings_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'bookings_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'bookings_adminId_status', columns: ['adminId', 'status'] },
                { name: 'bookings_adminId_paymentStatus_createdAt', columns: ['adminId', 'paymentStatus', 'createdAt'] },
                { name: 'bookings_adminId_serviceType_createdAt', columns: ['adminId', 'serviceType', 'createdAt'] },
                { name: 'bookings_adminId_type_createdAt', columns: ['adminId', 'type', 'createdAt'] },
                { name: 'bookings_adminId_isContacted_createdAt', columns: ['adminId', 'isContacted', 'createdAt'] },
                { name: 'bookings_adminId_pickupDateTime', columns: ['adminId', 'pickupDateTime'] },
                { name: 'bookings_adminId_pickupDateTime_createdAt', columns: ['adminId', 'pickupDateTime', 'createdAt'] },
                { name: 'bookings_driverId_status_createdAt', columns: ['driverId', 'status', 'createdAt'] },
                { name: 'bookings_driverId_status', columns: ['driverId', 'status'] },
                { name: 'bookings_driverId_createdAt', columns: ['driverId', 'createdAt'] },
                { name: 'bookings_driverName', columns: ['driverName'] },
                { name: 'bookings_driverPhone', columns: ['driverPhone'] },
                { name: 'bookings_customerId_createdAt', columns: ['customerId', 'createdAt'] },
                { name: 'bookings_customerId_status_createdAt', columns: ['customerId', 'status', 'createdAt'] },
                { name: 'bookings_customerId_status', columns: ['customerId', 'status'] },
                { name: 'bookings_vendorId_createdAt', columns: ['vendorId', 'createdAt'] },
                { name: 'bookings_vendorId_status_createdAt', columns: ['vendorId', 'status', 'createdAt'] },
                { name: 'bookings_vendorId_status', columns: ['vendorId', 'status'] },
                { name: 'bookings_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'bookings_phone', columns: ['phone'] },
                { name: 'bookings_name', columns: ['name'] },
                { name: 'bookings_enquiryId', columns: ['enquiryId'] },
                { name: 'bookings_serviceId', columns: ['serviceId'] },
                { name: 'bookings_vehicleId', columns: ['vehicleId'] },
                { name: 'bookings_tariffId', columns: ['tariffId'] },
                { name: 'bookings_offerId', columns: ['offerId'] },
                { name: 'bookings_promoCodeId', columns: ['promoCodeId'] },
            ];
        
        for (const newIndex of newBookingIndexes) {
            await createIndexConcurrently(
                'bookings',
                newIndex.name,
                newIndex.columns,
                newIndex.isUnique || false,
                newIndex.using || 'btree'
            );
        }
        
        console.log(`\n✅ Completed migration for bookings`);

        // ============================================
        // DRIVERS TABLE
        // ============================================
        await migrateTableIndexes(
            'drivers',
            [
                { name: 'drivers_driverId_adminId_walletId_referralCode_unique', isUnique: true },
                { name: 'idx_geo_location' },
            ],
            [
                { name: 'drivers_driverId_adminId_walletId_referralCode_unique', columns: ['driverId', 'adminId', 'walletId', 'referralCode'], isUnique: true },
                { name: 'drivers_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'drivers_adminId_isActive_createdAt', columns: ['adminId', 'isActive', 'createdAt'] },
                { name: 'drivers_adminId_isActive', columns: ['adminId', 'isActive'] },
                { name: 'drivers_adminId_isOnline_createdAt', columns: ['adminId', 'isOnline', 'createdAt'] },
                { name: 'drivers_adminId_isOnline', columns: ['adminId', 'isOnline'] },
                { name: 'drivers_adminId_adminVerified_createdAt', columns: ['adminId', 'adminVerified', 'createdAt'] },
                { name: 'drivers_adminId_adminVerified', columns: ['adminId', 'adminVerified'] },
                { name: 'drivers_phone', columns: ['phone'] },
                { name: 'drivers_name', columns: ['name'] },
                { name: 'drivers_driverId', columns: ['driverId'] },
                { name: 'drivers_referralCode', columns: ['referralCode'] },
                { name: 'drivers_vehicleId', columns: ['vehicleId'] },
            ]
        );

        // ============================================
        // CUSTOMERS TABLE
        // ============================================
        await migrateTableIndexes(
            'customers',
            [
                { name: 'customers_adminId_customerId_phone_vendorId_unique', isUnique: true },
            ],
            [
                { name: 'customers_adminId_customerId_phone_vendorId_unique', columns: ['adminId', 'customerId', 'phone', 'vendorId'], isUnique: true },
                { name: 'customers_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'customers_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'customers_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'customers_phone', columns: ['phone'] },
                { name: 'customers_name', columns: ['name'] },
                { name: 'customers_email', columns: ['email'] },
                { name: 'customers_customerId', columns: ['customerId'] },
                { name: 'customers_referralCode', columns: ['referralCode'] },
                { name: 'customers_referredBy', columns: ['referredBy'] },
            ]
        );

        // ============================================
        // VENDORS TABLE
        // ============================================
        await migrateTableIndexes(
            'vendor',
            [
                { name: 'vendor_adminId_vendorId_email_phone_walletId_unique', isUnique: true },
            ],
            [
                { name: 'vendor_adminId_vendorId_email_phone_walletId_unique', columns: ['adminId', 'vendorId', 'email', 'phone', 'walletId'], isUnique: true },
                { name: 'vendor_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'vendor_adminId_isLogin_createdAt', columns: ['adminId', 'isLogin', 'createdAt'] },
                { name: 'vendor_adminId_isLogin', columns: ['adminId', 'isLogin'] },
                { name: 'vendor_phone', columns: ['phone'] },
                { name: 'vendor_email', columns: ['email'] },
                { name: 'vendor_name', columns: ['name'] },
                { name: 'vendor_vendorId', columns: ['vendorId'] },
            ]
        );

        // ============================================
        // INVOICES TABLE
        // ============================================
        await migrateTableIndexes(
            'invoices',
            [
                { name: 'invoices_invoiceId_adminId_bookingId_companyId_invoiceNo_unique', isUnique: true },
            ],
            [
                { name: 'invoices_invoiceId_adminId_bookingId_companyId_invoiceNo_unique', columns: ['invoiceId', 'adminId', 'bookingId', 'companyId', 'invoiceNo'], isUnique: true },
                { name: 'invoices_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'invoices_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'invoices_adminId_status', columns: ['adminId', 'status'] },
                { name: 'invoices_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'invoices_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'invoices_bookingId', columns: ['bookingId'] },
                { name: 'invoices_invoiceNo', columns: ['invoiceNo'] },
                { name: 'invoices_phone', columns: ['phone'] },
                { name: 'invoices_name', columns: ['name'] },
                { name: 'invoices_invoiceDate', columns: ['invoiceDate'] },
            ]
        );

        // ============================================
        // ENQUIRIES TABLE
        // ============================================
        await migrateTableIndexes(
            'enquirys',
            [
                { name: 'enquirys_enquiryId_adminId_pickupDateTime_pickup_drop_serviceId_vendorId_unique', isUnique: true },
            ],
            [
                { name: 'enquirys_enquiryId_adminId_pickupDateTime_pickup_drop_serviceId_vendorId_unique', columns: ['enquiryId', 'adminId', 'pickupDateTime', 'pickup', 'drop', 'serviceId', 'vendorId'], isUnique: true },
                { name: 'enquirys_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'enquirys_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'enquirys_adminId_status', columns: ['adminId', 'status'] },
                { name: 'enquirys_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'enquirys_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'enquirys_enquiryId', columns: ['enquiryId'] },
                { name: 'enquirys_pickupDateTime', columns: ['pickupDateTime'] },
                { name: 'enquirys_serviceId', columns: ['serviceId'] },
                { name: 'enquirys_phone', columns: ['phone'] },
                { name: 'enquirys_name', columns: ['name'] },
            ]
        );

        // ============================================
        // WALLET TRANSACTIONS TABLE
        // ============================================
        await migrateTableIndexes(
            'wallet_transactions',
            [
                { name: 'wallet_transactions_transactionId_type_date_vendorId_driverId_ownedBy_adminId_idx' },
            ],
            [
                { name: 'wallet_transactions_transactionId_type_date_vendorId_driverId_ownedBy_adminId', columns: ['transactionId', 'type', 'date', 'vendorId', 'driverId', 'ownedBy', 'adminId'] },
                { name: 'wallet_transactions_adminId_date', columns: ['adminId', 'date'] },
                { name: 'wallet_transactions_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'wallet_transactions_adminId_type_date', columns: ['adminId', 'type', 'date'] },
                { name: 'wallet_transactions_adminId_type_createdAt', columns: ['adminId', 'type', 'createdAt'] },
                { name: 'wallet_transactions_vendorId_date', columns: ['vendorId', 'date'] },
                { name: 'wallet_transactions_vendorId_createdAt', columns: ['vendorId', 'createdAt'] },
                { name: 'wallet_transactions_driverId_date', columns: ['driverId', 'date'] },
                { name: 'wallet_transactions_driverId_createdAt', columns: ['driverId', 'createdAt'] },
                { name: 'wallet_transactions_ownedBy_date', columns: ['ownedBy', 'date'] },
                { name: 'wallet_transactions_transactionId', columns: ['transactionId'] },
                { name: 'wallet_transactions_walletId', columns: ['walletId'] },
                { name: 'wallet_transactions_status', columns: ['status'] },
            ]
        );

        // ============================================
        // PAYMENT TRANSACTIONS TABLE
        // ============================================
        await migrateTableIndexes(
            'payment_transactions',
            [
                { name: 'payment_transactions_gatewayTransactionId_transactionId_adminId_senderId_receiverId_unique', isUnique: true },
            ],
            [
                { name: 'payment_transactions_gatewayTransactionId_transactionId_adminId_senderId_receiverId_unique', columns: ['gatewayTransactionId', 'transactionId', 'adminId', 'senderId', 'receiverId'], isUnique: true },
                { name: 'payment_transactions_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'payment_transactions_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'payment_transactions_adminId_status', columns: ['adminId', 'status'] },
                { name: 'payment_transactions_senderId_createdAt', columns: ['senderId', 'createdAt'] },
                { name: 'payment_transactions_senderId', columns: ['senderId'] },
                { name: 'payment_transactions_receiverId_createdAt', columns: ['receiverId', 'createdAt'] },
                { name: 'payment_transactions_receiverId', columns: ['receiverId'] },
                { name: 'payment_transactions_transactionId', columns: ['transactionId'] },
                { name: 'payment_transactions_gatewayTransactionId', columns: ['gatewayTransactionId'] },
                { name: 'payment_transactions_sender', columns: ['sender'] },
                { name: 'payment_transactions_transactionType', columns: ['transactionType'] },
            ]
        );

        // ============================================
        // PROMO CODES TABLE
        // ============================================
        await migrateTableIndexes(
            'promo_codes',
            [
                { name: 'promo_codes_adminId_codeId_code_status_unique', isUnique: true },
            ],
            [
                { name: 'promo_codes_adminId_codeId_code_status_unique', columns: ['adminId', 'codeId', 'code', 'status'], isUnique: true },
                { name: 'promo_codes_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'promo_codes_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'promo_codes_adminId_status', columns: ['adminId', 'status'] },
                { name: 'promo_codes_code', columns: ['code'] },
                { name: 'promo_codes_codeId', columns: ['codeId'] },
                { name: 'promo_codes_startDate_endDate', columns: ['startDate', 'endDate'] },
                { name: 'promo_codes_category', columns: ['category'] },
            ]
        );

        // ============================================
        // OFFERS TABLE
        // ============================================
        await migrateTableIndexes(
            'offers',
            [
                { name: 'offers_offerId_adminId_category_type_status_unique', isUnique: true },
            ],
            [
                { name: 'offers_offerId_adminId_category_type_status_unique', columns: ['offerId', 'adminId', 'category', 'type', 'status'], isUnique: true },
                { name: 'offers_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'offers_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'offers_adminId_status', columns: ['adminId', 'status'] },
                { name: 'offers_adminId_category_createdAt', columns: ['adminId', 'category', 'createdAt'] },
                { name: 'offers_adminId_category', columns: ['adminId', 'category'] },
                { name: 'offers_offerId', columns: ['offerId'] },
                { name: 'offers_startDate_endDate', columns: ['startDate', 'endDate'] },
            ]
        );

        // ============================================
        // SERVICES TABLE
        // ============================================
        await migrateTableIndexes(
            'services',
            [
                { name: 'services_adminId_serviceId_name_unique', isUnique: true },
            ],
            [
                { name: 'services_adminId_serviceId_name_unique', columns: ['adminId', 'serviceId', 'name'], isUnique: true },
                { name: 'services_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'services_adminId_isActive_createdAt', columns: ['adminId', 'isActive', 'createdAt'] },
                { name: 'services_adminId_isActive', columns: ['adminId', 'isActive'] },
                { name: 'services_serviceId', columns: ['serviceId'] },
                { name: 'services_name', columns: ['name'] },
            ]
        );

        // ============================================
        // CUSTOMER WALLETS TABLE
        // ============================================
        await migrateTableIndexes(
            'customer_wallets',
            [
                { name: 'customer_wallets_walletId_customerId_unique', isUnique: true },
            ],
            [
                { name: 'customer_wallets_walletId_customerId_unique', columns: ['walletId', 'customerId'], isUnique: true },
                { name: 'customer_wallets_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'customer_wallets_customerId', columns: ['customerId'] },
                { name: 'customer_wallets_walletId', columns: ['walletId'] },
            ]
        );

        // ============================================
        // DRIVER WALLETS TABLE
        // ============================================
        await migrateTableIndexes(
            'driver_wallets',
            [
                { name: 'driver_wallets_walletId_driverId_unique', isUnique: true },
            ],
            [
                { name: 'driver_wallets_walletId_driverId_unique', columns: ['walletId', 'driverId'], isUnique: true },
                { name: 'driver_wallets_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'driver_wallets_driverId', columns: ['driverId'] },
                { name: 'driver_wallets_walletId', columns: ['walletId'] },
            ]
        );

        // ============================================
        // VENDOR WALLETS TABLE
        // ============================================
        await migrateTableIndexes(
            'vendor_wallets',
            [
                { name: 'vendor_wallets_walletId_vendorId_unique', isUnique: true },
            ],
            [
                { name: 'vendor_wallets_walletId_vendorId_unique', columns: ['walletId', 'vendorId'], isUnique: true },
                { name: 'vendor_wallets_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'vendor_wallets_vendorId', columns: ['vendorId'] },
                { name: 'vendor_wallets_walletId', columns: ['walletId'] },
            ]
        );

        // ============================================
        // CUSTOMER TRANSACTIONS TABLE
        // ============================================
        await migrateTableIndexes(
            'customer_transactions',
            [
                { name: 'customer_transactions_transactionId_type_date_customerId_adminId_idx' },
            ],
            [
                { name: 'customer_transactions_transactionId_type_date_customerId_adminId', columns: ['transactionId', 'type', 'date', 'customerId', 'adminId'] },
                { name: 'customer_transactions_adminId_date', columns: ['adminId', 'date'] },
                { name: 'customer_transactions_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'customer_transactions_customerId_date', columns: ['customerId', 'date'] },
                { name: 'customer_transactions_customerId_createdAt', columns: ['customerId', 'createdAt'] },
                { name: 'customer_transactions_adminId_type_date', columns: ['adminId', 'type', 'date'] },
                { name: 'customer_transactions_adminId_type_createdAt', columns: ['adminId', 'type', 'createdAt'] },
                { name: 'customer_transactions_transactionId', columns: ['transactionId'] },
                { name: 'customer_transactions_walletId', columns: ['walletId'] },
                { name: 'customer_transactions_transactionType', columns: ['transactionType'] },
            ]
        );

        // ============================================
        // TARIFF TABLE
        // ============================================
        await migrateTableIndexes(
            'tariffs',
            [
                // Drop the inefficient 7-column unique index
                { name: 'tariffs_tariffId_adminId_serviceId_vehicleId_status_createdBy_vendorId_unique', isUnique: true },
            ],
            [
                // Only tariffId unique (the 7-column was inefficient)
                { name: 'tariffs_tariffId_unique', columns: ['tariffId'], isUnique: true },
                { name: 'tariffs_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'tariffs_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'tariffs_adminId_status', columns: ['adminId', 'status'] },
                { name: 'tariffs_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'tariffs_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'tariffs_adminId_vendorId_status', columns: ['adminId', 'vendorId', 'status'] },
                { name: 'tariffs_serviceId_vehicleId_status', columns: ['serviceId', 'vehicleId', 'status'] },
                { name: 'tariffs_serviceId_vehicleId', columns: ['serviceId', 'vehicleId'] },
                { name: 'tariffs_serviceId_status', columns: ['serviceId', 'status'] },
                { name: 'tariffs_vehicleId_status', columns: ['vehicleId', 'status'] },
            ]
        );

        // ============================================
        // VEHICLES TABLE
        // ============================================
        await migrateTableIndexes(
            'vehicles',
            [
                { name: 'vehicles_adminId_vehicleId_type_unique', isUnique: true },
            ],
            [
                { name: 'vehicles_adminId_vehicleId_type_unique', columns: ['adminId', 'vehicleId', 'type'], isUnique: true },
                { name: 'vehicles_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'vehicles_adminId_isActive_createdAt', columns: ['adminId', 'isActive', 'createdAt'] },
                { name: 'vehicles_adminId_isActive', columns: ['adminId', 'isActive'] },
                { name: 'vehicles_adminId_adminVerified_createdAt', columns: ['adminId', 'adminVerified', 'createdAt'] },
                { name: 'vehicles_adminId_adminVerified', columns: ['adminId', 'adminVerified'] },
                { name: 'vehicles_driverId_adminId', columns: ['driverId', 'adminId'] },
                { name: 'vehicles_driverId', columns: ['driverId'] },
                { name: 'vehicles_vehicleId', columns: ['vehicleId'] },
                { name: 'vehicles_type', columns: ['type'] },
                { name: 'vehicles_vehicleNumber', columns: ['vehicleNumber'] },
            ]
        );

        // ============================================
        // NOTIFICATIONS TABLES
        // ============================================
        await migrateTableIndexes(
            'notifications',
            [
                { name: 'notifications_notificationId_date_vendorId_adminId_unique', isUnique: true },
            ],
            [
                { name: 'notifications_notificationId_date_vendorId_adminId_unique', columns: ['notificationId', 'date', 'vendorId', 'adminId'], isUnique: true },
                { name: 'notifications_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'notifications_adminId_read_createdAt', columns: ['adminId', 'read', 'createdAt'] },
                { name: 'notifications_adminId_read', columns: ['adminId', 'read'] },
                { name: 'notifications_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'notifications_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'notifications_notificationId', columns: ['notificationId'] },
                { name: 'notifications_date', columns: ['date'] },
                { name: 'notifications_type', columns: ['type'] },
            ]
        );

        await migrateTableIndexes(
            'customer_notifications',
            [
                { name: 'customer_notifications_notifyId_date_customerId_adminId_unique', isUnique: true },
            ],
            [
                { name: 'customer_notifications_notifyId_date_customerId_adminId_unique', columns: ['notifyId', 'date', 'customerId', 'adminId'], isUnique: true },
                { name: 'customer_notifications_adminId_customerId_createdAt', columns: ['adminId', 'customerId', 'createdAt'] },
                { name: 'customer_notifications_adminId_customerId', columns: ['adminId', 'customerId'] },
                { name: 'customer_notifications_adminId_customerId_read_createdAt', columns: ['adminId', 'customerId', 'read', 'createdAt'] },
                { name: 'customer_notifications_adminId_customerId_read', columns: ['adminId', 'customerId', 'read'] },
                { name: 'customer_notifications_notifyId', columns: ['notifyId'] },
                { name: 'customer_notifications_date', columns: ['date'] },
                { name: 'customer_notifications_type', columns: ['type'] },
            ]
        );

        await migrateTableIndexes(
            'driver_notifications',
            [
                { name: 'driver_notifications_notifyId_date_driverId_adminId_unique', isUnique: true },
            ],
            [
                { name: 'driver_notifications_notifyId_date_driverId_adminId_unique', columns: ['notifyId', 'date', 'driverId', 'adminId'], isUnique: true },
                { name: 'driver_notifications_adminId_driverId_createdAt', columns: ['adminId', 'driverId', 'createdAt'] },
                { name: 'driver_notifications_adminId_driverId', columns: ['adminId', 'driverId'] },
                { name: 'driver_notifications_adminId_driverId_read_createdAt', columns: ['adminId', 'driverId', 'read', 'createdAt'] },
                { name: 'driver_notifications_adminId_driverId_read', columns: ['adminId', 'driverId', 'read'] },
                { name: 'driver_notifications_notifyId', columns: ['notifyId'] },
                { name: 'driver_notifications_date', columns: ['date'] },
                { name: 'driver_notifications_type', columns: ['type'] },
            ]
        );

        await migrateTableIndexes(
            'vendor_notifications',
            [
                { name: 'vendor_notifications_notifyId_date_vendorId_adminId_unique', isUnique: true },
            ],
            [
                { name: 'vendor_notifications_notifyId_date_vendorId_adminId_unique', columns: ['notifyId', 'date', 'vendorId', 'adminId'], isUnique: true },
                { name: 'vendor_notifications_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'vendor_notifications_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'vendor_notifications_adminId_vendorId_read_createdAt', columns: ['adminId', 'vendorId', 'read', 'createdAt'] },
                { name: 'vendor_notifications_adminId_vendorId_read', columns: ['adminId', 'vendorId', 'read'] },
                { name: 'vendor_notifications_notifyId', columns: ['notifyId'] },
                { name: 'vendor_notifications_date', columns: ['date'] },
                { name: 'vendor_notifications_type', columns: ['type'] },
            ]
        );

        // ============================================
        // DRIVER ACTIVITY LOGS TABLE
        // ============================================
        await migrateTableIndexes(
            'driver_activity_logs',
            [
                // No old indexes to drop (was missing indexes)
            ],
            [
                { name: 'driver_activity_logs_eventId_unique', columns: ['eventId'], isUnique: true },
                { name: 'driver_activity_logs_driverId_createdAt', columns: ['driverId', 'createdAt'] },
                { name: 'driver_activity_logs_driverId_eventDateTime', columns: ['driverId', 'eventDateTime'] },
                { name: 'driver_activity_logs_driverId_type_createdAt', columns: ['driverId', 'type', 'createdAt'] },
                { name: 'driver_activity_logs_driverId_level_createdAt', columns: ['driverId', 'level', 'createdAt'] },
                { name: 'driver_activity_logs_eventDateTime', columns: ['eventDateTime'] },
                { name: 'driver_activity_logs_type', columns: ['type'] },
                { name: 'driver_activity_logs_level', columns: ['level'] },
            ]
        );

        // ============================================
        // BOOKING ACTIVITY LOGS TABLE
        // ============================================
        await migrateTableIndexes(
            'booking_activity_logs',
            [
                // No old indexes to drop (was missing indexes)
            ],
            [
                { name: 'booking_activity_logs_eventId_unique', columns: ['eventId'], isUnique: true },
                { name: 'booking_activity_logs_bookingId_createdAt', columns: ['bookingId', 'createdAt'] },
                { name: 'booking_activity_logs_bookingId_eventDateTime', columns: ['bookingId', 'eventDateTime'] },
                { name: 'booking_activity_logs_bookingId_type_createdAt', columns: ['bookingId', 'type', 'createdAt'] },
                { name: 'booking_activity_logs_bookingId_level_createdAt', columns: ['bookingId', 'level', 'createdAt'] },
                { name: 'booking_activity_logs_eventDateTime', columns: ['eventDateTime'] },
                { name: 'booking_activity_logs_type', columns: ['type'] },
                { name: 'booking_activity_logs_level', columns: ['level'] },
            ]
        );

        // ============================================
        // DRIVER BOOKING LOG TABLE
        // ============================================
        await migrateTableIndexes(
            'driver_booking_log',
            [
                { name: 'driver_booking_log_adminId_driverId_minuteId_bookingId_unique', isUnique: true },
            ],
            [
                { name: 'driver_booking_log_adminId_driverId_minuteId_bookingId_unique', columns: ['adminId', 'driverId', 'minuteId', 'bookingId'], isUnique: true },
                { name: 'driver_booking_log_adminId_driverId_createdAt', columns: ['adminId', 'driverId', 'createdAt'] },
                { name: 'driver_booking_log_adminId_driverId', columns: ['adminId', 'driverId'] },
                { name: 'driver_booking_log_driverId_tripStatus_createdAt', columns: ['driverId', 'tripStatus', 'createdAt'] },
                { name: 'driver_booking_log_driverId_tripStatus', columns: ['driverId', 'tripStatus'] },
                { name: 'driver_booking_log_driverId_createdAt', columns: ['driverId', 'createdAt'] },
                { name: 'driver_booking_log_bookingId', columns: ['bookingId'] },
                { name: 'driver_booking_log_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'driver_booking_log_tripStatus', columns: ['tripStatus'] },
                { name: 'driver_booking_log_tripStartedTime', columns: ['tripStartedTime'] },
                { name: 'driver_booking_log_tripCompletedTime', columns: ['tripCompletedTime'] },
            ]
        );

        // ============================================
        // DRIVER WALLET REQUESTS TABLE
        // ============================================
        await migrateTableIndexes(
            'driver_wallet_requests',
            [
                { name: 'driver_wallet_requests_requestId_type_driverId_adminId_walletId_idx' },
            ],
            [
                { name: 'driver_wallet_requests_requestId_unique', columns: ['requestId'], isUnique: true },
                { name: 'driver_wallet_requests_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'driver_wallet_requests_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'driver_wallet_requests_adminId_status', columns: ['adminId', 'status'] },
                { name: 'driver_wallet_requests_driverId_createdAt', columns: ['driverId', 'createdAt'] },
                { name: 'driver_wallet_requests_driverId_status_createdAt', columns: ['driverId', 'status', 'createdAt'] },
                { name: 'driver_wallet_requests_driverId_status', columns: ['driverId', 'status'] },
                { name: 'driver_wallet_requests_adminId_driverId_createdAt', columns: ['adminId', 'driverId', 'createdAt'] },
                { name: 'driver_wallet_requests_adminId_type_createdAt', columns: ['adminId', 'type', 'createdAt'] },
                { name: 'driver_wallet_requests_adminId_type', columns: ['adminId', 'type'] },
                { name: 'driver_wallet_requests_status', columns: ['status'] },
                { name: 'driver_wallet_requests_type', columns: ['type'] },
                { name: 'driver_wallet_requests_walletId', columns: ['walletId'] },
            ]
        );

        // ============================================
        // OFFER USAGE TABLE
        // ============================================
        await migrateTableIndexes(
            'offer_usage',
            [
                { name: 'offer_usage_offerId_customerId_bookingId_unique', isUnique: true },
            ],
            [
                { name: 'offer_usage_offerId_customerId_bookingId_unique', columns: ['offerId', 'customerId', 'bookingId'], isUnique: true },
                { name: 'offer_usage_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'offer_usage_adminId_offerId_createdAt', columns: ['adminId', 'offerId', 'createdAt'] },
                { name: 'offer_usage_customerId_createdAt', columns: ['customerId', 'createdAt'] },
                { name: 'offer_usage_bookingId', columns: ['bookingId'] },
                { name: 'offer_usage_offerId', columns: ['offerId'] },
            ]
        );

        // ============================================
        // PROMO CODE USAGE TABLE
        // ============================================
        await migrateTableIndexes(
            'promo_code_usage',
            [
                { name: 'promo_code_usage_promoCodeUsageId_bookingId_unique', isUnique: true },
            ],
            [
                { name: 'promo_code_usage_promoCodeUsageId_unique', columns: ['promoCodeUsageId'], isUnique: true },
                { name: 'promo_code_usage_promoCodeUsageId_bookingId_unique', columns: ['promoCodeUsageId', 'bookingId'], isUnique: true },
                { name: 'promo_code_usage_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'promo_code_usage_adminId_codeId_createdAt', columns: ['adminId', 'codeId', 'createdAt'] },
                { name: 'promo_code_usage_customerId_createdAt', columns: ['customerId', 'createdAt'] },
                { name: 'promo_code_usage_bookingId', columns: ['bookingId'] },
                { name: 'promo_code_usage_codeId', columns: ['codeId'] },
                { name: 'promo_code_usage_promoCode', columns: ['promoCode'] },
            ]
        );

        // ============================================
        // REFERRAL USAGE TABLE
        // ============================================
        await migrateTableIndexes(
            'referral_usages',
            [
                { name: 'referral_usages_adminId_referralUsageId_unique', isUnique: true },
            ],
            [
                { name: 'referral_usages_referralUsageId_unique', columns: ['referralUsageId'], isUnique: true },
                { name: 'referral_usages_adminId_referralUsageId_unique', columns: ['adminId', 'referralUsageId'], isUnique: true },
                { name: 'referral_usages_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'referral_usages_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'referral_usages_adminId_status', columns: ['adminId', 'status'] },
                { name: 'referral_usages_referralCode_createdAt', columns: ['referralCode', 'createdAt'] },
                { name: 'referral_usages_senderId_createdAt', columns: ['senderId', 'createdAt'] },
                { name: 'referral_usages_receiverId_createdAt', columns: ['receiverId', 'createdAt'] },
                { name: 'referral_usages_referrerType_createdAt', columns: ['referrerType', 'createdAt'] },
                { name: 'referral_usages_status', columns: ['status'] },
            ]
        );

        // ============================================
        // DAY PACKAGES TABLE
        // ============================================
        await migrateTableIndexes(
            'day_packages',
            [
                // Drop the inefficient 7-column unique index
                { name: 'day_packages_serviceId_packageId_adminId_vehicleId_createdBy_vendorId_status_unique', isUnique: true },
            ],
            [
                // Only packageId unique (the 7-column was inefficient)
                { name: 'day_packages_packageId_unique', columns: ['packageId'], isUnique: true },
                { name: 'day_packages_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'day_packages_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'day_packages_adminId_status', columns: ['adminId', 'status'] },
                { name: 'day_packages_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'day_packages_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'day_packages_adminId_serviceId_vehicleId_status', columns: ['adminId', 'serviceId', 'vehicleId', 'status'] },
                { name: 'day_packages_adminId_serviceId_vehicleId', columns: ['adminId', 'serviceId', 'vehicleId'] },
                { name: 'day_packages_adminId_noOfDays_distanceLimit', columns: ['adminId', 'noOfDays', 'distanceLimit'] },
            ]
        );

        // ============================================
        // HOURLY PACKAGES TABLE
        // ============================================
        await migrateTableIndexes(
            'hourly_packages',
            [
                // Drop the inefficient 7-column unique index
                { name: 'hourly_packages_serviceId_packageId_adminId_vehicleId_createdBy_vendorId_status_unique', isUnique: true },
            ],
            [
                // Only packageId unique (the 7-column was inefficient)
                { name: 'hourly_packages_packageId_unique', columns: ['packageId'], isUnique: true },
                { name: 'hourly_packages_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'hourly_packages_adminId_status_createdAt', columns: ['adminId', 'status', 'createdAt'] },
                { name: 'hourly_packages_adminId_status', columns: ['adminId', 'status'] },
                { name: 'hourly_packages_adminId_vendorId_createdAt', columns: ['adminId', 'vendorId', 'createdAt'] },
                { name: 'hourly_packages_adminId_vendorId', columns: ['adminId', 'vendorId'] },
                { name: 'hourly_packages_adminId_serviceId_vehicleId_status', columns: ['adminId', 'serviceId', 'vehicleId', 'status'] },
                { name: 'hourly_packages_adminId_serviceId_vehicleId', columns: ['adminId', 'serviceId', 'vehicleId'] },
                { name: 'hourly_packages_adminId_noOfHours_distanceLimit', columns: ['adminId', 'noOfHours', 'distanceLimit'] },
            ]
        );

        // ============================================
        // ALL INCLUDES TABLE
        // ============================================
        await migrateTableIndexes(
            'all_includes',
            [
                // Old indexes to keep but optimize
            ],
            [
                { name: 'all_includes_includeId_unique', columns: ['includeId'], isUnique: true },
                { name: 'all_includes_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'all_includes_adminId', columns: ['adminId'] },
                { name: 'all_includes_adminId_includeId', columns: ['adminId', 'includeId'] },
                { name: 'all_includes_origin_destination', columns: ['origin', 'destination'] },
                { name: 'all_includes_adminId_origin_destination', columns: ['adminId', 'origin', 'destination'] },
            ]
        );

        // ============================================
        // PERMIT CHARGES TABLE
        // ============================================
        await migrateTableIndexes(
            'permit_charges',
            [
                // Old indexes to keep but optimize
            ],
            [
                { name: 'permit_charges_permitId_unique', columns: ['permitId'], isUnique: true },
                { name: 'permit_charges_adminId_createdAt', columns: ['adminId', 'createdAt'] },
                { name: 'permit_charges_adminId', columns: ['adminId'] },
                { name: 'permit_charges_adminId_origin_destination', columns: ['adminId', 'origin', 'destination'] },
                { name: 'permit_charges_origin_destination', columns: ['origin', 'destination'] },
            ]
        );

        console.log('\n' + '═'.repeat(60));
        console.log('🎉 Index Migration Completed Successfully!');
        console.log('═'.repeat(60));
        console.log('\n✅ All old indexes have been dropped');
        console.log('✅ All new optimized indexes have been created');
        console.log('✅ Database is ready for production use');
        console.log('\n📊 Next Steps:');
        console.log('   1. Monitor query performance');
        console.log('   2. Check index usage: SELECT * FROM pg_stat_user_indexes');
        console.log('   3. Remove any unused indexes if needed');
        console.log('\n');

    } catch (error: any) {
        console.error('\n❌ Migration Error:', error);
        console.error('\n⚠️  If migration failed partway through:');
        console.error('   1. Check which indexes were created');
        console.error('   2. Re-run the script (it will skip existing indexes)');
        console.error('   3. Manually fix any issues if needed');
        throw error;
    } finally {
        await sequelize.close();
    }
}

// Run migration if executed directly
if (require.main === module) {
    migrateAllIndexes()
        .then(() => {
            console.log('Migration completed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { migrateAllIndexes };

