import { Router } from "express";
import {
    getAllPopularRoutes,
    getPopularRouteById,
    createPopularRoute,
    updatePopularRoute,
    deletePopularRoute,
    multiDeletePopularRoutes
} from "../controller/popularRoutesController";

const router = Router();

router.get('/', getAllPopularRoutes);
router.get('/:id', getPopularRouteById);
router.post('/', createPopularRoute);
router.put('/:id', updatePopularRoute);
router.delete('/:id', deletePopularRoute);
router.delete('/', multiDeletePopularRoutes);

export default router;