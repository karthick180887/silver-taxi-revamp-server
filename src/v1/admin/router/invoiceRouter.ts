import { Router } from "express";
import {
    createInvoice,
    deleteInvoice,
    getAllInvoices,
    getInvoiceById,
    updateInvoice,
    toggleChanges,
    multiDeleteInvoices,
    getVendorInvoices
} from "../controller/invoiceController";

const router = Router();

router.get("/", getAllInvoices);

router.get("/vendor", getVendorInvoices);

router.get("/:id", getInvoiceById);

router.post("/", createInvoice);

router.put("/:id", updateInvoice);

router.delete("/:id", deleteInvoice);

router.delete("/", multiDeleteInvoices);

router.put("/toggle-changes/:id", toggleChanges);

export default router;

// ============================== 
