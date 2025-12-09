import { Router } from "express";
import { findDistanceAndTime } from "../../../common/functions/distanceAndTime";

const router = Router();

router.get('/', async (req, res) => {
    const { origin, destination } = req.query;
    const data = await findDistanceAndTime(origin as string, destination as string);
    res.json({ data });
});


export default router;
