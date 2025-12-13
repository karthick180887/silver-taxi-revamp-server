import express from "express"
import { formConfigController } from "../controller/form.controller";

const router = express.Router();

router.get("/",formConfigController)

export default router;
