import express from "express";
import { signIn, vendorSignIn, SignUp, adminSignIn } from "../controller/authController";

const router = express.Router()

router.post('/login', signIn)

router.post('/admin/login', adminSignIn)

router.post('/vendor/login', vendorSignIn)

router.post('/register', SignUp)

export default router;
