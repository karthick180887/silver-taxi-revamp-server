import express, { Router } from "express";
import { driverLogin, driverSignup, driverStatus, driverSignupSteps, accessToken } from "../controller/appAuth.controller"

const router: Router = express.Router();

// Routes

router.get("/access-token", accessToken);

router.get("/status/:id", driverStatus);

router.post("/login/:type", driverLogin);

router.post("/signup-otp/:type", driverSignup);

router.post("/signup/:step", driverSignupSteps);

export default router