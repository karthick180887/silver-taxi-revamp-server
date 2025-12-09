import express, { Router } from "express";
import {
    getWallet, getWalletTransactions, addWalletAmount,
    walletRequest, getWalletRequests
} from "../controller/wallet.controller";

const router: Router = express.Router();    

router.get("/", getWallet); 

router.get("/history",getWalletTransactions);

router.post("/amount/add", addWalletAmount);

router.post("/request/:type", walletRequest);

router.get("/requests", getWalletRequests);

export default router;