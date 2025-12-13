import { Router } from 'express';
import { getService, setService } from '../controller/service.controller';

const router = Router();

router.get('/', getService);
router.put('/', setService);

export default router;