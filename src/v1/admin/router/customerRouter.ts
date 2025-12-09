import { Router } from "express";
import {
    getCustomerById,
    getAllCustomers, deleteCustomer,
    multiDeleteCustomers,
    getAdminAndVendorCustomers,
    getBookingsByCustomers,
    getVendorCustomers,
    createCustomer
} from "../controller/customerController";

const customerRouter = Router();

customerRouter.post("/", createCustomer);

customerRouter.get("/", getAllCustomers);

customerRouter.get("/vendor", getVendorCustomers);

customerRouter.get("/:id", getCustomerById);

customerRouter.post("/", getAdminAndVendorCustomers);

customerRouter.delete("/:id", deleteCustomer);

customerRouter.delete("/", multiDeleteCustomers);

customerRouter.get("/bookings/:id", getBookingsByCustomers);

export default customerRouter;