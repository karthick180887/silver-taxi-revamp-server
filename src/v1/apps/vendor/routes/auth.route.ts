import express from "express";
import { vendorSignIn } from "../controller/auth.controller";

const router = express.Router()

router.post('/login', vendorSignIn)

export default router;
