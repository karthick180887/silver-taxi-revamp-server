import express, { Router } from "express";
import { customerLogin, customerSignup } from "../controller/auth.controller"

const router: Router = express.Router();


router.post("/login/:type", customerLogin);

router.post("/signup-otp/:type", customerSignup);


export default router