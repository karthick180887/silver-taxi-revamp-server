import express from 'express';
import {
    createDriver, getAllDrivers, getDriverById,
    updateDriver, deleteDriver, getActiveDrivers,
    addDriverWallet, minusDriverWallet,
    getDriverWallet,
    multiDeleteDrivers, verificationStatus,
    getDriverWalletTrans,
    getAllDriverWalletTrans,
    approveOrRejectDriverWalletRequest,
    getAllDriverWalletRequests,
    getDriverWalletRequestById,
    walletBulkRequest,
    getDriverLocations
} from '../controller/driverController';
import upload from '../../../utils/multer.fileUpload';

const router = express.Router();

// Get specific filtered/static data
router.get('/location', getDriverLocations);
router.get('/active', getActiveDrivers);
router.get('/wallet/transactions', getAllDriverWalletTrans);
router.get('/wallet/requests', getAllDriverWalletRequests);
router.get('/wallet/request/:id', getDriverWalletRequestById);
router.get('/wallet/:id/transactions', getDriverWalletTrans);
router.get('/wallet/:id', getDriverWallet);

// Mutations
router.post('/wallet/add/:id', addDriverWallet);
router.post('/wallet/minus/:id', minusDriverWallet);
router.post('/wallet/bulk-request', walletBulkRequest);
router.put('/verification/:id', verificationStatus);

// Wallet Requests
router.put('/wallet/request/:id', approveOrRejectDriverWalletRequest);

// Core CRUD
router.get('/', getAllDrivers);
router.post('/', upload.single("licenseImage"), createDriver);
router.put('/:id', updateDriver);
router.delete('/:id', deleteDriver);
router.delete('/', multiDeleteDrivers);

// Final dynamic route
router.get('/:id', getDriverById);


export default router;