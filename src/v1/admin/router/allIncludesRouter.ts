import { Router } from 'express';
import {
    createAllIncludes,
    getAllIncludes,
    getAllIncludesById,
    updateAllIncludes,
    deleteAllIncludes
} from '../controller/allIncludesController';

const router = Router();

// Route to create a new AllIncludes entry
router.post('/', createAllIncludes);

// Route to get all AllIncludes entries
router.get('/', getAllIncludes);

// Route to get a single AllIncludes entry by ID
router.get('/:id', getAllIncludesById);

// Route to update an AllIncludes entry
router.put('/:id', updateAllIncludes);

// Route to delete an AllIncludes entry
router.delete('/:id', deleteAllIncludes);

export default router; 