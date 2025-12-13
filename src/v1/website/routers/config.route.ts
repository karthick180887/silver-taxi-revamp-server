import express from "express";
import { redisConfigController } from "../controller/config.controller";

const router = express.Router();

router.get('/', redisConfigController);

export default router;
