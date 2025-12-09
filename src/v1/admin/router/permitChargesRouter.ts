import { Router } from 'express';
import {
    createPermitCharges,
    getPermitCharges,
    getPermitChargesById,
    updatePermitCharges,
    deletePermitCharges,
    multiDeletePermitCharges
} from '../controller/permitChargesController';

const router = Router();

// Route to create a new PermitCharges entry
router.post('/', createPermitCharges);

// Route to get all PermitCharges entries
router.get('/', getPermitCharges);

// Route to get a single PermitCharges entry by ID
router.get('/:id', getPermitChargesById);

// Route to update an PermitCharges entry
router.put('/:id', updatePermitCharges);

// Route to delete an PermitCharges entry
router.delete('/:id', deletePermitCharges);

router.delete('/', multiDeletePermitCharges);

export default router; 