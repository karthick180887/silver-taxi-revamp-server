import express, { Router } from "express";
import { getWallet , getWalletTransactions } from "../controller/customer.wallet.controller";        

const router: Router = express.Router();    

router.get("/", getWallet); 

router.get("/history",getWalletTransactions);


export default router;

