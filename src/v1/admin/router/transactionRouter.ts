import { Router } from "express";
import {
    getVendorWalletTransactions,
    getDriverWalletTransactions,
    getAllVendorWalletTransactions,
    getAllDriverWalletTransactions
} from "../controller/transactionController";

const router = Router();

router.get("/vendor/:id", getVendorWalletTransactions);

router.get("/driver/:id", getDriverWalletTransactions);

router.get("/vendor", getAllVendorWalletTransactions);

router.get("/driver", getAllDriverWalletTransactions);


export default router;
