import express, { Router } from "express";
import {  getAllOffers, getOfferById  } from "../controller/offer.controller";
const router: Router = express.Router();


router.get("/get", getAllOffers);

router.get("/:id", getOfferById);

export default router