import express, { Router } from "express";
import { estimateFare, getHourlyPackages } from "../controller/enquiry.controller";
const router: Router = express.Router();


router.get("/hourly-packages", getHourlyPackages);

router.post("/get-estimation", estimateFare);


export default router