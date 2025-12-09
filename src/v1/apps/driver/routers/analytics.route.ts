import express, { Router } from "express";
import {
    //  updateDriverAnalytics,
      getDriverAnalytics,
      getGraphEarnings
     } 
     from "../controller/analytics.controller";

const router: Router = express.Router();

// Routes
// router.post("/update", updateDriverAnalytics);
router.get("/get", getDriverAnalytics);

router.get("/get/graph", getGraphEarnings);


export default router