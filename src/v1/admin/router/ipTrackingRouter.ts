import { Router } from "express";
import {
    createIPTracking,
    updateIPTracking,
    getIPTrackingById,
    deleteIPTracking,
    multiDeleteIPTrackings
} from "../controller/ipTrackingController";
import { getAllIPTrackings } from "../controller/ipTrackingController";



const router = Router();

router.get('/', getAllIPTrackings);

router.get('/:id', getIPTrackingById);

router.post('/', createIPTracking);

router.put('/:id', updateIPTracking);

router.delete('/:id', deleteIPTracking);

router.delete('/', multiDeleteIPTrackings);

export default router;
