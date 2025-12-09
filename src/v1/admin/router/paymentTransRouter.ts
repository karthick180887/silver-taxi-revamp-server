import { Router } from "express";
import {
    createPaymentTransaction,
    getAllPaymentTransactions,
    getPaymentTransactionById,
    updatePaymentTransaction,
    deletePaymentTransaction
} from "../controller/paymentTransController";

const router = Router();

router.post("/", createPaymentTransaction);

router.get("/", getAllPaymentTransactions);

router.get("/:id", getPaymentTransactionById);

router.put("/:id", updatePaymentTransaction);

router.delete("/:id", deletePaymentTransaction);

export default router;