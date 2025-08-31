import express from 'express';
import { 
    fetchTotalAvailableHeadsets, 
    fetchTotalMarkHeadsetUnavailable, 
    fetchTotalHeadsets,
    fetchAllHeadsets
} from '../controllers/headsetController.js';

const router = express.Router();

router.get('/available', fetchTotalAvailableHeadsets);
router.get('/unavailable', fetchTotalMarkHeadsetUnavailable);
router.get('/total', fetchTotalHeadsets);
router.get('/all', fetchAllHeadsets);

export default router;