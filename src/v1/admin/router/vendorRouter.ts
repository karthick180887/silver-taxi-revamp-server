import { Router } from "express";
import {
    getAllVendors,
    getVendorById,
    getVendorUPI,
    createVendor,
    updateVendor,
    deleteVendor,
    getVendorWallet,
    addVendorWallet,
    minusVendorWallet,
    multiDeleteVendors,
    toggleVendorStatus,
    getVendorWalletAmount,
    getVendorWalletTrans,
    getAllVendorWalletTrans,
    getVendorWalletTransByVendor,
    walletTransactionStatusUpdate
} from "../controller/vendorController";

const router = Router();

router.get("/", getAllVendors);

router.get("/wallet-amount", getVendorWalletAmount);
router.get("/wallet/transactions", getAllVendorWalletTrans);
router.get("/wallet/transactions/history", getVendorWalletTransByVendor);
router.get("/wallet/:id/transactions", getVendorWalletTrans);
router.get("/wallet/:id", getVendorWallet);
router.get("/bank-details/:id", getVendorUPI );

router.post("/wallet/add/:id", addVendorWallet);
router.post("/wallet/minus/:id", minusVendorWallet);
router.post("/wallet/:id/transactions", walletTransactionStatusUpdate);

router.put("/toggle-changes/:id", toggleVendorStatus);

router.post("/", createVendor);
router.put("/:id", updateVendor);
router.delete("/:id", deleteVendor);
router.delete("/", multiDeleteVendors);

router.get("/:id", getVendorById);


export default router;
